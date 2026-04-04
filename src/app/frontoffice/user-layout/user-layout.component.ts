import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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

  // Infos utilisateur connecté
  userName = '';
  userEmail = '';

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

  // Initiales pour l'avatar
  get userInitials(): string {
    if (!this.userName) return '?';
    const parts = this.userName.trim().split(' ');
    return parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
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
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('user-portal');
  }

  loadCurrentUser(): void {
    const session = this.authService.getCurrentUser();
    if (!session) return;

    // L'email est déjà dans la session
    this.userEmail = session.email;

    // Charger le nom depuis l'API users
    this.http.get<any>(`http://localhost:8222/users/${session.userId}`).subscribe({
      next: (user) => {
        const full = [user.name, user.lastName].filter(Boolean).join(' ').trim();
        this.userName = full || session.email;
      },
      error: () => {
        // Fallback sur l'email si l'API échoue
        this.userName = session.email;
      }
    });
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