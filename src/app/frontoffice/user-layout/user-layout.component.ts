import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { AuthService, SessionUser } from '../../services/auth.services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss']
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  navbarScrolled = false;
  profileDropdownOpen = false;
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();
  currentUser: SessionUser | null = null;
  private destroy$ = new Subject<void>();

  private _overrideRole: string | null = null;

  get currentRole(): string {
    if (this._overrideRole) return this._overrideRole;
    const role = this.authService.getRole();
    return role ? role.toLowerCase() : 'user';
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.email?.split('@')[0] || 'User';
  }

  toggleRole(role: string): void {
    this._overrideRole = role;
  }

  constructor(
    private router: Router,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.navbarScrolled = window.scrollY > 10;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-wrapper')) {
      this.profileDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    document.body.classList.add('user-portal');
  
    // Read immediately first
    this.currentUser = this.authService.getCurrentUser();
  
    // Then subscribe for changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('user-portal');
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  goToAdmin(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout(); // ← also clear the session properly
    this.router.navigate(['/login']);
  }
}