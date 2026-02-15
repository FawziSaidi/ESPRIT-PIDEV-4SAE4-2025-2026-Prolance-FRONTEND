import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { UserLayoutComponent } from './frontoffice/user-layout/user-layout.component';
import { LandingComponent } from './authentification/landing/landing.component';
import { LoginComponent } from './authentification/auth/login/login.component';
import { RegisterComponent } from './authentification/auth/register/register.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'app',
    component: UserLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./frontoffice/user-layout/user-layout.module').then(
            (m) => m.UserLayoutModule
          ),
      },
      {
        path: 'subscription',
        loadChildren: () =>
          import('./frontoffice/subscriptions/subscriptions.module').then(
            (m) => m.SubscriptionsModule
          ),
      },
    ],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./backoffice/backoffice.module').then(
        (m) => m.BackofficeModule
      ),
  },
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [],
})
export class AppRoutingModule {}