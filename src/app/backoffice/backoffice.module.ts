import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BackofficeRoutingModule } from './backoffice-routing.module';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BackofficeLayoutComponent } from './backoffice-layout.component';
import { AdminAdsComponent } from '../pages/admin/ads/admin-ads.component';

import { AdminEventsComponent } from './components/admin-evenement/admin-event.component';
import { EventFormComponent } from './components/event-form/event-form.component';
import { ActivityFormComponent } from './components/activity-form/activity-form-component';

// ✅ Import avec le bon chemin (tout en minuscules)
import { ParticipantBadgeComponent} from './components/participant-badge/participant-badge.component';

@NgModule({
  declarations: [
    BackofficeLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    DashboardComponent,
    AdminAdsComponent,
    AdminEventsComponent,
    EventFormComponent,
    ActivityFormComponent,
    ParticipantBadgeComponent
    
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BackofficeRoutingModule
    
  ]
})
export class BackofficeModule { }