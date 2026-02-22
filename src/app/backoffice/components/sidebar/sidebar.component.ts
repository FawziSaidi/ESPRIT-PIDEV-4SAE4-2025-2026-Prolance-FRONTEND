import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string = 'dashboard';

  menuItems = [
    { id: 'dashboard',    icon: '📊', label: 'DASHBOARD',              link: '/admin/dashboard' },
    { id: 'profile',      icon: '👤', label: 'PROFILE',                link: '/admin/profile' },
    { id: 'users',        icon: '👥', label: 'TABLE DES UTILISATEURS', link: '/admin/users' },
    { id: 'projet',       icon: '📋', label: 'PROJET',                 link: '/admin/projet' },
    { id: 'forum',        icon: '💬', label: 'FORUM',                  link: '/admin/forum' },
    { id: 'publicite',    icon: '📷', label: 'PUBLICITÉ',              link: '/admin/publicite' },
    { id: 'evenement',    icon: '📅', label: 'ÉVÉNEMENT',              link: '/admin/evenement' },
    { id: 'subscription', icon: '💳', label: 'ABONNEMENTS',            link: '/admin/subscription/list' },
    { id: 'stats',        icon: '📈', label: 'STATISTIQUES',           link: '/admin/subscription/stats' },
    { id: 'churn',        icon: '🤖', label: 'AI CHURN',               link: '/admin/subscription/churn' }, // ✅ ADD THIS
    { id: 'logout',       icon: '🔌', label: 'LOGOUT',                 link: '/login' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        const match = this.menuItems.find(item => url.startsWith(item.link));
        if (match) this.activeMenu = match.id;
      });

    const url = this.router.url;
    const match = this.menuItems.find(item => url.startsWith(item.link));
    if (match) this.activeMenu = match.id;
  }

  setActiveMenu(menuId: string): void {
    this.activeMenu = menuId;
  }
}