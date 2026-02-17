import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';

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

  get currentRole(): string {
    const role = this.authService.getRole();
    return role ? role.toLowerCase() : 'user';
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.email?.split('@')[0] || 'User';
  }

  constructor(private router: Router, private authService: AuthService) {}

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
  }

  ngOnDestroy(): void {
    document.body.classList.remove('user-portal');
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
