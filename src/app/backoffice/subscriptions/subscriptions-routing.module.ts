import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionListComponent } from './subscription-list/subscription-list.component';
import { SubscriptionFormComponent } from './subscription-form/subscription-form.component';
import { SubscriptionStatsComponent } from './subscription-stats/subscription-stats.component';

const routes: Routes = [
  { path: 'list',      component: SubscriptionListComponent },
  { path: 'create',    component: SubscriptionFormComponent },
  { path: 'edit/:id',  component: SubscriptionFormComponent },
  { path: 'stats',     component: SubscriptionStatsComponent },
  { path: '',          redirectTo: 'list', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscriptionsRoutingModule {}