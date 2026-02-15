import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlansCatalogComponent } from './plans-catalog/plans-catalog.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';

const routes: Routes = [
  // /app/subscription/plans → Page catalogue des plans
  { path: 'plans', component: PlansCatalogComponent },

  // /app/subscription/my-subscription → Page "Mon abonnement"
  { path: 'my-subscription', component: MySubscriptionComponent },

  // /app/subscription → Redirige vers /app/subscription/plans
  { path: '', redirectTo: 'plans', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscriptionsRoutingModule {}