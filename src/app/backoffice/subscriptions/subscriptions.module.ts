import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsRoutingModule } from './subscriptions-routing.module';
import { SubscriptionListComponent } from './subscription-list/subscription-list.component';
import { SubscriptionFormComponent } from './subscription-form/subscription-form.component';
import { SubscriptionStatsComponent } from './subscription-stats/subscription-stats.component';

@NgModule({
  declarations: [
    SubscriptionListComponent,
    SubscriptionFormComponent,
    SubscriptionStatsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,       // ✅ nécessaire pour [(ngModel)] dans subscription-list.component.html
    SubscriptionsRoutingModule,
  ],
})
export class SubscriptionsModule {}