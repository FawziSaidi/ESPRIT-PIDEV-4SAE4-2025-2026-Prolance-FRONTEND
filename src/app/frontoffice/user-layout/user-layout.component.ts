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

  get currentRole(): string {
    return this.roleService.currentRole;
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

    // Use AuthService observable instead of reading localStorage directly
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

  toggleRole(role: 'freelancer' | 'client'): void {
    this.roleService.setRole(role);
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