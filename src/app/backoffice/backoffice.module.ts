import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackofficeRoutingModule } from './backoffice-routing.module';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BackofficeLayoutComponent } from './backoffice-layout.component';

@NgModule({
  declarations: [
    BackofficeLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BackofficeRoutingModule
  ]
})
export class BackofficeModule { }
