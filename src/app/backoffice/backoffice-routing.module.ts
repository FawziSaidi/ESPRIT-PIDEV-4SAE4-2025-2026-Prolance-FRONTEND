import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackofficeLayoutComponent } from './backoffice-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminUsersComponent } from '../pages/admin/user/admin-user.component';
import { GestionForumComponent } from './GestionForum/gestion-forum.component';

const routes: Routes = [
  {
    path: '',
    component: BackofficeLayoutComponent,
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users',     component: AdminUsersComponent },
      { path: 'forum',     component: GestionForumComponent },
      // ✅ AJOUTÉ : module subscription lazy-loaded
      {
        path: 'subscription',
        loadChildren: () =>
          import('./subscriptions/subscriptions.module').then(
            (m) => m.SubscriptionsModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule], // ✅ IMPORTANT : nécessaire pour <router-outlet> dans BackofficeLayoutComponent
})
export class BackofficeRoutingModule {}