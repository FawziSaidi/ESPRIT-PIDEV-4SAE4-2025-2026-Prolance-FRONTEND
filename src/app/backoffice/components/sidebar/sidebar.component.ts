import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string = 'dashboard';

  menuItems = [
    { id: 'dashboard', icon: '📊', label: 'DASHBOARD', link: '#/admin/dashboard' },
    { id: 'profile', icon: '👤', label: 'PROFILE', link: '#' },
    { id: 'users', icon: '👥', label: 'USERS TABLE', link: '#' },
    { id: 'projet', icon: '📋', label: 'PROJECT', link: '#' },
    { id: 'forum', icon: '💬', label: 'FORUM ', link: '#/admin/forum' },
    { id: 'publicite', icon: '📷', label: 'ADVERTISING', link: '#' },
    { id: 'evenement', icon: '📅', label: 'EVENTS', link: '#' },
    { id: 'deconnexion', icon: '🔌', label: 'LOGOUT', link: '#' }
  ];

  constructor() { }

  ngOnInit(): void { }

  setActiveMenu(menuId: string): void {
    this.activeMenu = menuId;
  }
}