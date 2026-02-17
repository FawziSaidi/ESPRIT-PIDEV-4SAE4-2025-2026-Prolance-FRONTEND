import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '📊', label: 'DASHBOARD', link: '#', route: '/admin/dashboard' },
    { id: 'profile', icon: '👤', label: 'PROFILE', link: '#', route: null },
    { id: 'users', icon: '👥', label: 'TABLE DES UTILISATEURS', link: '#', route: null },
    { id: 'projects', icon: '📋', label: 'PROJET', route: '/admin/projects' },
    { id: 'forum', icon: '💬', label: 'FORUM', link: '#', route: null },
    { id: 'ads', icon: '📷', label: 'ADS', link: '#', route: '/admin/ads' },
    { id: 'evenement', icon: '📅', label: 'ÉVÉNEMENT', link: '#', route: null },
    { id: 'logout', icon: '🔌', label: 'LOGOUT', link: '#', route: null }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  setActiveMenu(menuId: string): void {
    this.activeMenu = menuId;
    console.log('Menu actif:', menuId);
  }
}
