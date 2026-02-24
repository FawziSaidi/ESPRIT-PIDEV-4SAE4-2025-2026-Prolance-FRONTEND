import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackofficeLayoutComponent } from './backoffice-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminAdsComponent } from '../pages/admin/ads/admin-ads.component';
import { AdminEventsComponent } from './components/admin-evenement/admin-event.component';
import { EventFormComponent } from './components/event-form/event-form.component';

const routes: Routes = [
  {
    path: '',
    component: BackofficeLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'ads',
        component: AdminAdsComponent
      },
      {
        path: 'events',
        component: AdminEventsComponent
      },
      {
        path: 'events/create',
        component: EventFormComponent
      },
      {
        path: 'events/edit/:id',
        component: EventFormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }