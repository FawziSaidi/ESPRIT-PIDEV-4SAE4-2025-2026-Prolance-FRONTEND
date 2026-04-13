import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';  // ← needed by ResetPasswordComponent

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule   // ← ResetPasswordComponent injects HttpClient
  ],
  declarations: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent  // ← export it too, in case it's used outside
  ]
})
export class AuthModule {}