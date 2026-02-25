import { Component, OnInit } from '@angular/core';
import { AdminUser, UserRole } from './models/user.model';
import { AdminUsersService } from '../../../services/admin-users.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-user.component.html',
  styleUrls: ['./admin-user.component.css']
})
export class AdminUsersComponent implements OnInit {

  users: AdminUser[] = [];
  isLoading = false;
  
  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  adminCount = 0;
  clientCount = 0;
  freelancerCount = 0;

  showUserModal = false;
  showDeleteConfirm = false;

  deletingUserId: number | null = null;
  editingUser: AdminUser | null = null;
  
  // Track fading out users for delete animation
  fadingOutUsers: Set<number> = new Set();

  formUser: Partial<AdminUser> = {
    name: '',
    lastName: '',
    email: '',
    role: 'USER',
    enabled: true
  };

  constructor(private usersService: AdminUsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService.getAll().subscribe({
      next: (data) => {
        console.log('📊 Users loaded:', data.length);
        this.users = data;
        this.updateCounts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        this.showNotification('Failed to load users', 'error');
        this.users = [];
        this.isLoading = false;
      }
    });
  }

  updateCounts(): void {
    this.adminCount = this.users.filter(u => u.role === 'ADMIN').length;
    this.clientCount = this.users.filter(u => u.role === 'CLIENT').length;
    this.freelancerCount = this.users.filter(u => u.role === 'FREELANCER').length;
  }

  // Safe method to get avatar initials
  getAvatar(user: AdminUser): string {
    if (!user) return 'U';
    
    const firstName = user.name || '';
    const lastName = user.lastName || '';
    
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';
    
    return (firstInitial + lastInitial || 'U').toUpperCase();
  }

  getRoleLabel(role: UserRole): string {
    if (!role) return 'User';
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  getRoleClass(role: UserRole): string {
    if (!role) return '';
    return `role-${role.toLowerCase()}`;
  }

  openCreate(): void {
    this.editingUser = null;
    this.formUser = { 
      name: '', 
      lastName: '', 
      email: '', 
      role: 'USER', 
      enabled: true 
    };
    this.showUserModal = true;
  }

  openEdit(user: AdminUser): void {
    this.editingUser = user;
    this.formUser = { 
      ...user 
    };
    this.showUserModal = true;
  }

  cancelUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
    this.formUser = { 
      name: '', 
      lastName: '', 
      email: '', 
      role: 'USER', 
      enabled: true 
    };
  }

  saveUser(): void {
    // Validate form
    if (!this.formUser.name || !this.formUser.lastName || !this.formUser.email) {
      this.showNotification('Please fill all required fields', 'error');
      return;
    }

    if (this.editingUser) {
      // Update existing user
      this.usersService.update(this.editingUser.id!, this.formUser).subscribe({
        next: () => {
          this.showUserModal = false;
          this.editingUser = null;
          this.loadUsers();
          this.showNotification('User updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showNotification(error.error?.message || 'Failed to update user', 'error');
        }
      });
    } else {
      // Create new user
      this.usersService.create(this.formUser).subscribe({
        next: () => {
          this.showUserModal = false;
          this.loadUsers();
          this.showNotification('User created successfully', 'success');
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.showNotification(error.error?.message || 'Failed to create user', 'error');
        }
      });
    }
  }

  openDeleteConfirm(id: number): void {
    this.deletingUserId = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingUserId = null;
  }

  confirmDelete(): void {
    if (!this.deletingUserId) return;
    
    // Add to fading out set for animation
    this.fadingOutUsers.add(this.deletingUserId);
    
    this.usersService.delete(this.deletingUserId).subscribe({
      next: () => {
        // Remove from fading out set after animation
        setTimeout(() => {
          this.fadingOutUsers.delete(this.deletingUserId!);
          this.showDeleteConfirm = false;
          this.deletingUserId = null;
          this.loadUsers();
          this.showNotification('User deleted successfully', 'success');
        }, 300);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.fadingOutUsers.delete(this.deletingUserId!);
        this.showDeleteConfirm = false;
        this.deletingUserId = null;
        this.showNotification(error.error?.message || 'Failed to delete user', 'error');
      }
    });
  }

  isFadingOut(id: number): boolean {
    return this.fadingOutUsers.has(id);
  }

  // Helper method to show notifications
  showNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // Toggle user status (enable/disable)
  toggleStatus(user: AdminUser): void {
    const updatedUser = { ...user, enabled: !user.enabled };
    this.usersService.update(user.id!, updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        this.showNotification(
          `User ${updatedUser.enabled ? 'enabled' : 'disabled'} successfully`, 
          'success'
        );
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        this.showNotification('Failed to update user status', 'error');
      }
    });
  }
}