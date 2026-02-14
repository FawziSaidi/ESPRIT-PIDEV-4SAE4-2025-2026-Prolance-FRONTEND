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

  // Session-aware user property
  user: { email: string; role: string } | null = null;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    document.body.classList.add('auth-page');

    // Load existing session if present
    const email = localStorage.getItem('userName');
    const role = localStorage.getItem('role');
    if (email && role) {
      this.user = { email, role };
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-page');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  logout(): void {
    // Clear session
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    this.user = null;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const authRequest: AuthRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(authRequest).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;

        // Save session data
        localStorage.setItem('token', res.token);
        localStorage.setItem('userName', authRequest.email);
        localStorage.setItem('role', res.role);

        this.user = { email: authRequest.email, role: res.role };

        // Conditional navigation based on role
        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']); // Admin landing page
        } else {
          this.router.navigate(['/app']); // Normal user dashboard
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
