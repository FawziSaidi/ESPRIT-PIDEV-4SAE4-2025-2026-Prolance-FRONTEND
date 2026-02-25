import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService, SessionUser } from '../../services/auth.services';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: SessionUser | null = null;
  userProfile: any = null;
  isEditMode = false;
  isLoading = false;
  loadError: string | null = null;

  profileForm: FormGroup;
  passwordForm: FormGroup;

  showPasswordChange = false;

  // ── Avatar ──────────────────────────────────────
  avatarPreview: string | null = null;
  isUploadingAvatar = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name:      ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      email:     ['', [Validators.required, Validators.email]],
      birthDate: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.isLoading = true;

    const storedUser = localStorage.getItem('sessionUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.loadUserProfile();
      } catch (e) {
        console.error('Error parsing user:', e);
        this.router.navigate(['/login']);
      }
    } else {
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            if (user) {
              this.currentUser = user;
              this.loadUserProfile();
            } else {
              this.router.navigate(['/login']);
            }
          },
          error: () => this.router.navigate(['/login'])
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  loadUserProfile(): void {
    if (!this.currentUser?.id) {
      this.isLoading = false;
      return;
    }

    this.userService.getUserById(this.currentUser.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;

          // Set avatar preview from saved profile
          this.avatarPreview = profile.avatar || null;

          let formattedDate = '';
          if (profile.birthDate) {
            try {
              const date = new Date(profile.birthDate);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Date error:', e);
            }
          }

          this.profileForm.patchValue({
            name:      profile.name || '',
            lastName:  profile.lastName || '',
            email:     profile.email || '',
            birthDate: formattedDate
          });
        },
        error: (error) => {
          this.loadError = error.message || 'Failed to load profile';
          this.notificationService.error(this.loadError!);
        }
      });
  }

  // ── Avatar Upload ────────────────────────────────
  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notificationService.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notificationService.error('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.avatarPreview = base64;

      if (!this.currentUser?.id) return;
      this.isUploadingAvatar = true;

      this.userService.updateAvatar(this.currentUser.id, base64)
        .pipe(finalize(() => this.isUploadingAvatar = false))
        .subscribe({
          next: (updated) => {
            this.userProfile.avatar = updated.avatar;
            this.notificationService.success('Profile picture updated!');
          },
          error: () => {
            this.notificationService.error('Failed to upload picture');
            // Revert preview on error
            this.avatarPreview = this.userProfile?.avatar || null;
          }
        });
    };
    reader.readAsDataURL(file);
  }

  // ── Profile Edit ─────────────────────────────────
  toggleEditMode(): void {
    if (!this.isEditMode && this.userProfile) {
      let formattedDate = '';
      if (this.userProfile.birthDate) {
        try {
          const date = new Date(this.userProfile.birthDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      this.profileForm.patchValue({
        name:      this.userProfile.name || '',
        lastName:  this.userProfile.lastName || '',
        email:     this.userProfile.email || '',
        birthDate: formattedDate
      });
    }

    this.isEditMode = !this.isEditMode;
    this.showPasswordChange = false;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    if (!this.currentUser?.id) return;

    this.isLoading = true;

    this.userService.updateUser(this.currentUser.id, this.profileForm.value)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.isEditMode = false;
          this.notificationService.success('Profile updated successfully');
        },
        error: (error) => {
          this.notificationService.error(error.message || 'Update failed');
        }
      });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.showPasswordChange = false;
  }

  // ── Password Change ──────────────────────────────
  changePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.hasError('mismatch')) {
        this.notificationService.error('Passwords do not match');
      } else {
        this.notificationService.error('Please fill all fields');
      }
      return;
    }

    if (!this.currentUser?.id) return;

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.isLoading = true;

    this.userService.changePassword(this.currentUser.id, currentPassword, newPassword)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.showPasswordChange = false;
        this.passwordForm.reset();
      }))
      .subscribe({
        next: () => this.notificationService.success('Password changed successfully'),
        error: (error) => this.notificationService.error(error.message || 'Password change failed')
      });
  }

  // ── Delete Account ───────────────────────────────
  deleteAccount(): void {
    if (!this.currentUser?.id) return;

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;

    this.userService.deleteAccount(this.currentUser.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Account deleted');
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => this.notificationService.error(error.message || 'Delete failed')
      });
  }

  // ── Helpers ──────────────────────────────────────
  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  getInitials(): string {
    if (!this.userProfile?.name || !this.userProfile?.lastName) return '?';
    return `${this.userProfile.name.charAt(0)}${this.userProfile.lastName.charAt(0)}`.toUpperCase();
  }
}