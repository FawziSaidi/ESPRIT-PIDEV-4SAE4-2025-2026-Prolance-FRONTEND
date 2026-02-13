import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '📊', label: 'DASHBOARD', link: '#' },
    { id: 'profile', icon: '👤', label: 'PROFILE', link: '#' },
    { id: 'users', icon: '👥', label: 'TABLE DES UTILISATEURS', link: '#' },
    { id: 'projet', icon: '📋', label: 'PROJET', link: '#' },
    { id: 'forum', icon: '💬', label: 'FORUM', link: '#' },
    { id: 'publicite', icon: '📷', label: 'PUBLICITÉ', link: '#' },
    { id: 'evenement', icon: '📅', label: 'ÉVÉNEMENT', link: '#' },
    { id: 'logout', icon: '🔌', label: 'LOGOUT', link: '#' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  setActiveMenu(menuId: string): void {
    this.activeMenu = menuId;
    console.log('Menu actif:', menuId);
  }
}
