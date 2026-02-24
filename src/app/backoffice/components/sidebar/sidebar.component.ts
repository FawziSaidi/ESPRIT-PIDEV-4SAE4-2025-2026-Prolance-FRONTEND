import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'app/services/auth.services';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '📊', label: 'DASHBOARD',             route: '/admin/dashboard' },
    { id: 'profile',   icon: '👤', label: 'PROFILE',               route: null },
    { id: 'users',     icon: '👥', label: 'TABLE DES UTILISATEURS', route: null },
    { id: 'projet',    icon: '📋', label: 'PROJET',                 route: null },
    { id: 'forum',     icon: '💬', label: 'FORUM',                  route: null },
    { id: 'ads',       icon: '📷', label: 'ADS',                    route: '/admin/ads' },
    { id: 'evenement', icon: '📅', label: 'ÉVÉNEMENT',              route: '/admin/events' },
    { id: 'logout',    icon: '🔌', label: 'LOGOUT',                 route: null },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.syncActiveFromUrl(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.syncActiveFromUrl(e.urlAfterRedirects));
  }

  private syncActiveFromUrl(url: string): void {
    const found = this.menuItems.find(item => item.route && url.startsWith(item.route));
    if (found) this.activeMenu = found.id;
  }

  setActiveMenu(menuId: string): void {
    if (menuId === 'logout') {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.activeMenu = menuId;
  }
}