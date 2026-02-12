import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { UserDashboardComponent } from '../../pages/user/user-dashboard/user-dashboard.component';
import { JobFeedComponent } from '../../pages/user/job-feed/job-feed.component';
import { MyProjectsComponent } from '../../pages/user/my-projects/my-projects.component';
import { WalletComponent } from '../../pages/user/wallet/wallet.component';

const userRoutes: Routes = [
  { path: '',            redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',   component: UserDashboardComponent },
  { path: 'marketplace', component: JobFeedComponent },
  { path: 'projects',    component: MyProjectsComponent },
  { path: 'wallet',      component: WalletComponent },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(userRoutes),
    MatTooltipModule,
    MatRippleModule,
  ],
  declarations: [
    UserDashboardComponent,
    JobFeedComponent,
    MyProjectsComponent,
    WalletComponent,
  ]
})
export class UserLayoutModule {}
