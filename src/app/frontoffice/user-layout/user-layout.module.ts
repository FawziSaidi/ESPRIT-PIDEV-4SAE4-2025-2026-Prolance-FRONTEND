import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { UserDashboardComponent } from '../../authentification/user-dashboard/user-dashboard.component';
import { AdCenterComponent } from '../../pages/ads/ad-center.component';

const userRoutes: Routes = [
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'ads',       component: AdCenterComponent },
  {
    path: 'events',
    loadChildren: () => import('../GestionEvenement/gestion-evenement').then(m => m.GestionEvenementModule)
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
  ]
})
export class UserLayoutModule {}