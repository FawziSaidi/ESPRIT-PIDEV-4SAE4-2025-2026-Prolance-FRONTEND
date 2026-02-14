import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent
  ]
})
export class AuthModule {}
export interface RegisterRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: string;       // e.g., "ADMIN" or "USER"
  birthDate?: string; // optional, format "YYYY-MM-DD"
}


export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: 'ADMIN' | 'USER' | 'CLIENT' | 'FREELANCER';
}


