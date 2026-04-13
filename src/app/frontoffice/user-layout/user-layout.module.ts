import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { UserDashboardComponent } from '../../authentification/user-dashboard/user-dashboard.component';
import { AdCenterComponent } from '../../pages/ads/ad-center.component';
import { ProfileComponent } from '../../pages/user/profile.component';
import { SupportChatComponent } from '../../components/support-chat/support-chat.component';  // ← ADD THIS


const userRoutes: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'ads',       component: AdCenterComponent },
  { path: 'profile',   component: ProfileComponent },
  {
    path: 'cours',
    loadChildren: () => import('../../pages/cours/cours.module').then(m => m.CoursModule)
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
    AdCenterComponent,
    ProfileComponent,
    SupportChatComponent,
  ]
})
export class UserLayoutModule {}