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

  /**
   * Retourne le rôle de l'utilisateur connecté (FREELANCER ou CLIENT)
   * normalisé en minuscules pour les comparaisons dans le template.
   */
  get currentRole(): string {
    const role = this.authService.getRole();
    return role ? role.toLowerCase() : '';
  }

  get isFreelancer(): boolean {
    return this.currentRole === 'freelancer';
  }

  get isClient(): boolean {
    return this.currentRole === 'client';
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