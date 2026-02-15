import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { UserDashboardComponent } from '../../authentification/user-dashboard/user-dashboard.component';


const userRoutes: Routes = [
  { path: '',            redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',   component: UserDashboardComponent },
  { 
    path: 'forum', 
    loadChildren: () => import('../GestionForum/gestion-forum.module').then(m => m.GestionForumModule)
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(userRoutes),
    MatTooltipModule,
    MatRippleModule,
  ],
  declarations: [
    UserDashboardComponent,
  ]
})
export class UserLayoutModule {}