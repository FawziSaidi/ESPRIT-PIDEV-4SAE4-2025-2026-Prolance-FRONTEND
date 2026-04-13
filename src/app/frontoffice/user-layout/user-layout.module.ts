import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { UserDashboardComponent } from '../../authentification/user-dashboard/user-dashboard.component';
import { ProfileComponent } from '../../pages/user/profile.component';
import { SupportChatComponent } from '../../components/support-chat/support-chat.component';

const userRoutes: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'profile',   component: ProfileComponent },
  {
    path: 'forum', // ← AJOUTÉ
    loadChildren: () => import('../GestionForum/gestion-forum.module').then(m => m.GestionForumModule)
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(userRoutes),
    MatTooltipModule,
    MatRippleModule,
  ],
  declarations: [
    UserDashboardComponent,
    ProfileComponent,
    SupportChatComponent,
  ]
})
export class UserLayoutModule {}