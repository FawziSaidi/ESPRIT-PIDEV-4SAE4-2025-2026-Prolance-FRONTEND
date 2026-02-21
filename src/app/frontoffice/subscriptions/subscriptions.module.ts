import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SubscriptionsRoutingModule } from './subscriptions-routing.module';
import { PlansCatalogComponent } from './plans-catalog/plans-catalog.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from './success-modal/success-modal.component';
import { SubscriptionStatsComponent } from './subscription-stats/subscription-stats.component';
import { AiRecommendationComponent } from './ai-recommendation/ai-recommendation.component';

@NgModule({
  declarations: [
    PlansCatalogComponent,
    MySubscriptionComponent,
    ConfirmModalComponent,
    SuccessModalComponent,
    SubscriptionStatsComponent,
    AiRecommendationComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SubscriptionsRoutingModule,
  ]
})
export class SubscriptionsModule { }