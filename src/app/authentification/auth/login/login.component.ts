import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.services';
import { AuthRequest, AuthResponse } from '../auth.models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm:     FormGroup;
  forgotForm:    FormGroup;
  twoFactorForm: FormGroup;

  isLoading     = false;
  googleLoading = false;
  showPassword  = false;
  currentYear   = new Date().getFullYear();

  // View state machine
  view: 'login' | 'forgot' | '2fa' | 'forgot-sent' = 'login';

  // Banners
  loginError        = '';
  registeredSuccess = false;

  // Rate limiting
  failedAttempts = 0;
  lockoutUntil: Date | null = null;

  get isLockedOut(): boolean {
    return !!this.lockoutUntil && new Date() < this.lockoutUntil;
  }
  get lockoutSeconds(): number {
    if (!this.lockoutUntil) return 0;
    return Math.ceil((this.lockoutUntil.getTime() - Date.now()) / 1000);
  }

  // Captcha
  captchaA = 0;
  captchaB = 0;
  get captchaQuestion(): string { return `${this.captchaA} + ${this.captchaB} = ?`; }

  private readonly API = 'http://localhost:8089/pidev/api/auth';

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private route:       ActivatedRoute,
    private http:        HttpClient,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
      captcha:    ['', Validators.required]
    });

    this.forgotForm = this.fb.group({
      forgotEmail: ['', [Validators.required, Validators.email]]
    });

    this.twoFactorForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.refreshCaptcha();
  }

  ngOnInit(): void {
    document.body.classList.add('auth-page');

    // Show success banner if coming from register
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.registeredSuccess = true;
        setTimeout(() => this.registeredSuccess = false, 5000);
      }
    });

    // ── Remember Me: pre-fill email if previously saved ──
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-page');
  }

  // ── Helpers ─────────────────────────────────────────────────
  togglePassword(): void { this.showPassword = !this.showPassword; }

  refreshCaptcha(): void {
    this.captchaA = Math.floor(Math.random() * 9) + 1;
    this.captchaB = Math.floor(Math.random() * 9) + 1;
    this.loginForm.get('captcha')?.setValue('');
  }

  isCaptchaCorrect(): boolean {
    const answer = parseInt(this.loginForm.get('captcha')?.value, 10);
    return answer === this.captchaA + this.captchaB;
  }

  switchView(v: 'login' | 'forgot' | '2fa' | 'forgot-sent'): void {
    this.view       = v;
    this.loginError = '';
  }

  // ── Login ────────────────────────────────────────────────────
  onSubmit(): void {
    this.loginError = '';

    if (this.isLockedOut) {
      this.loginError = `Too many attempts. Try again in ${this.lockoutSeconds}s.`;
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.isCaptchaCorrect()) {
      this.loginError = 'Incorrect captcha answer. Please try again.';
      this.refreshCaptcha();
      return;
    }

    this.isLoading = true;

    const authRequest: AuthRequest = {
      email:    this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(authRequest).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading      = false;
        this.failedAttempts = 0;

        // ── Remember Me ──────────────────────────────────────
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('rememberedEmail', authRequest.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // ── Save session ─────────────────────────────────────
        this.authService.setSession(res, authRequest.email);

        // ── Navigate by role ─────────────────────────────────
        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/app']);
        }
      },
      error: () => {
        this.isLoading = false;
        this.failedAttempts++;
        this.refreshCaptcha();

        if (this.failedAttempts >= 5) {
          this.lockoutUntil = new Date(Date.now() + 60_000);
          this.loginError   = 'Too many failed attempts. Locked for 60 seconds.';
          setTimeout(() => {
            this.lockoutUntil   = null;
            this.failedAttempts = 0;
          }, 60_000);
        } else {
          const remaining   = 5 - this.failedAttempts;
          this.loginError   = `Invalid email or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`;
        }
      }
    });
  }

  // ── Forgot Password (real API call) ─────────────────────────
  onForgotSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email    = this.forgotForm.value.forgotEmail;

    this.http.post(`${this.API}/forgot-password`, { email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.switchView('forgot-sent');
      },
      error: () => {
        this.isLoading = false;
        // Still show sent screen — don't reveal if email exists
        this.switchView('forgot-sent');
      }
    });
  }

  // ── 2FA Verify ───────────────────────────────────────────────
  onTwoFactorSubmit(): void {
    if (this.twoFactorForm.invalid) {
      this.twoFactorForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    const code        = this.twoFactorForm.value.code;

    // Replace with real API call when backend supports it:
    // this.http.post(`${this.API}/verify-2fa`, { code }).subscribe(...)
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/app']);
    }, 1000);
  }

  // ── Google OAuth ─────────────────────────────────────────────
  loginWithGoogle(): void {
    this.googleLoading = true;

    const width  = 500;
    const height = 600;
    const left   = window.screenX + (window.outerWidth  - width)  / 2;
    const top    = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'http://localhost:8089/pidev/oauth2/authorization/google',
      'GoogleOAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    const handler = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8089') return;
      const { token, id, role, name, lastName, email } = event.data;
      if (token) {
        localStorage.setItem('sessionUser', JSON.stringify({ id, email, role, token, name, lastName }));
        popup?.close();
        window.removeEventListener('message', handler);
        this.googleLoading = false;
        role === 'ADMIN'
          ? this.router.navigate(['/admin/dashboard'])
          : this.router.navigate(['/app']);
      }
    };

    window.addEventListener('message', handler);

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        this.googleLoading = false;
        window.removeEventListener('message', handler);
      }
    }, 500);
  }
}