import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlansCatalogComponent } from './plans-catalog/plans-catalog.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { SubscriptionStatsComponent } from './subscription-stats/subscription-stats.component';

const routes: Routes = [
  { path: 'plans', component: PlansCatalogComponent },
  { path: 'my', component: MySubscriptionComponent },
  { path: 'stats', component: SubscriptionStatsComponent },
  { path: '', redirectTo: 'plans', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscriptionsRoutingModule {}