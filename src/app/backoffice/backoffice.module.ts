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

// ✅ Composants manquants — ajoutés ici
import { AdminEventsComponent } from './components/admin-evenement/admin-event.component';
import { EventFormComponent } from './components/event-form/event-form.component';
import { ActivityFormComponent } from './components/activity-form/activity-form-component';

@NgModule({
  declarations: [
    BackofficeLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    DashboardComponent,
    AdminAdsComponent,
    // ✅ Ajoutés ici
    AdminEventsComponent,
    EventFormComponent,
    ActivityFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackofficeRoutingModule
  ]
})
export class BackofficeModule { }