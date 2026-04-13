import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackofficeRoutingModule } from './backoffice-routing.module';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BackofficeLayoutComponent } from './backoffice-layout.component';
import { AdminAdsComponent } from '../pages/admin/ads/admin-ads.component';
import { AdminUsersComponent } from '../pages/admin/user/admin-user.component';
import { AdminCoursComponent } from '../pages/admin/cours/admin-cours.component';

@NgModule({
  declarations: [
    BackofficeLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    DashboardComponent,
    AdminAdsComponent,
    AdminUsersComponent,
    AdminCoursComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackofficeRoutingModule
  ]
})
export class BackofficeModule { }