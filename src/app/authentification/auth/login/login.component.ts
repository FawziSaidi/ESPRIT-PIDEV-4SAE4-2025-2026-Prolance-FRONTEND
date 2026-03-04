import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.services';
import { AuthRequest, AuthResponse } from '../auth.module';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    document.body.classList.add('auth-page');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-page');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  logout(): void {
    this.authService.logout();  // ← utilise AuthService, pas localStorage directement
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const authRequest: AuthRequest = {
      email:    this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(authRequest).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        this.authService.setSession(res, authRequest.email);

        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error', err);
        alert('Login failed! Please check your credentials.');
      }
    });
  }

  socialLogin(provider: string): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/app/dashboard']);
    }, 1200);
  }
}