import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';

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
    return this.roleService.currentRole;
  }

  constructor(private router: Router, private roleService: RoleService) {}

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

  toggleRole(role: string): void {
    this.roleService.setRole(role as any);
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // ✅ Navigation vers les pages abonnements
  goToPlans(): void {
    this.router.navigate(['/app/subscription/plans']);
    this.mobileMenuOpen = false;
    this.profileDropdownOpen = false;
  }

  goToMySubscription(): void {
    this.router.navigate(['/app/subscription/my']);
    this.mobileMenuOpen = false;
    this.profileDropdownOpen = false;
  }

  // ✅ NOUVEAU : Navigation vers Statistiques
  goToStats(): void {
    this.router.navigate(['/app/subscription/stats']);
    this.mobileMenuOpen = false;
    this.profileDropdownOpen = false;
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}