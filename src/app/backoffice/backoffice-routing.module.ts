import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackofficeLayoutComponent } from './backoffice-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminAdsComponent } from '../pages/admin/ads/admin-ads.component';
import { AdminUsersComponent } from '../pages/admin/user/admin-user.component';


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
        path: 'users',
        component: AdminUsersComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }
