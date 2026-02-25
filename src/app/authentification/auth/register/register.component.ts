import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.services';
import { RegisterRequest } from '../auth.models';

// ── Custom Validators ─────────────────────────────────────────
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value || '';
  const errors: ValidationErrors = {};

  if (!/[A-Z]/.test(val))        errors['noUppercase']  = true;
  if (!/[a-z]/.test(val))        errors['noLowercase']  = true;
  if (!/[0-9]/.test(val))        errors['noNumber']     = true;
  if (!/[^A-Za-z0-9]/.test(val)) errors['noSpecial']    = true;

  return Object.keys(errors).length ? errors : null;
}

function ageValidator(minAge: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const birth = new Date(control.value);
    const today = new Date();
    const age   = today.getFullYear() - birth.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    const realAge = hasBirthdayPassed ? age : age - 1;
    return realAge < minAge ? { tooYoung: { required: minAge, actual: realAge } } : null;
  };
}

// ── Password Strength Score ───────────────────────────────────
export interface StrengthResult {
  score: number;      // 0-4
  label: string;
  color: string;
  width: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  isLoading       = false;
  showPassword    = false;
  googleLoading   = false;
  currentYear     = new Date().getFullYear();
  userType: 'freelancer' | 'recruiter' = 'freelancer';

  // password strength reactive
  passwordStrength: StrengthResult = { score: 0, label: '', color: '', width: '0%' };

  // for username availability mock (extend with real HTTP call)
  emailTaken = false;

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      fullName:   ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      lastName:   ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      email:      ['', [Validators.required, Validators.email]],
      birthDate:  ['', [Validators.required, ageValidator(16)]],
      password:   ['', [Validators.required, Validators.minLength(8), strongPasswordValidator]],
      agreeTerms: [false, [Validators.requiredTrue]]
    });

    // live password strength
    this.registerForm.get('password')!.valueChanges.subscribe(val => {
      this.passwordStrength = this.computeStrength(val || '');
    });
  }

  ngOnInit(): void {
    document.body.classList.add('auth-page');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-page');
  }

  // ── Helpers ──────────────────────────────────────────────────
  setUserType(type: 'freelancer' | 'recruiter'): void {
    this.userType = type;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Password criteria checklist helpers (used in template)
  get pwVal(): string { return this.registerForm.get('password')?.value || ''; }
  get pwTouched(): boolean { return !!this.registerForm.get('password')?.touched; }
  get hasUpper():   boolean { return /[A-Z]/.test(this.pwVal); }
  get hasLower():   boolean { return /[a-z]/.test(this.pwVal); }
  get hasNumber():  boolean { return /[0-9]/.test(this.pwVal); }
  get hasSpecial(): boolean { return /[^A-Za-z0-9]/.test(this.pwVal); }
  get hasLength():  boolean { return this.pwVal.length >= 8; }

  computeStrength(pw: string): StrengthResult {
    let score = 0;
    if (pw.length >= 8)               score++;
    if (/[A-Z]/.test(pw))            score++;
    if (/[0-9]/.test(pw))            score++;
    if (/[^A-Za-z0-9]/.test(pw))     score++;

    const map: Record<number, Omit<StrengthResult, 'score'>> = {
      0: { label: '',         color: '',          width: '0%'   },
      1: { label: 'Weak',     color: '#ef5350',   width: '25%'  },
      2: { label: 'Fair',     color: '#ffa726',   width: '50%'  },
      3: { label: 'Good',     color: '#66bb6a',   width: '75%'  },
      4: { label: 'Strong',   color: '#43a047',   width: '100%' },
    };

    return { score, ...map[score] };
  }

  // Max date for birthdate (today)
  get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Submit ───────────────────────────────────────────────────
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const request: RegisterRequest = {
      name:      this.registerForm.value.fullName,
      lastName:  this.registerForm.value.lastName,
      email:     this.registerForm.value.email,
      password:  this.registerForm.value.password,
      role:      this.userType === 'freelancer' ? 'FREELANCER' : 'CLIENT',
      birthDate: this.registerForm.value.birthDate
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.isLoading = false;
        // Check if email already taken (adjust based on your API error structure)
        if (err.status === 409 || err.error?.message?.toLowerCase().includes('email')) {
          this.emailTaken = true;
          this.registerForm.get('email')?.setErrors({ taken: true });
        }
        console.error('Registration failed', err);
      }
    });
  }

  // ── Google OAuth ─────────────────────────────────────────────
  registerWithGoogle(): void {
    this.googleLoading = true;

    // ── Option A: redirect flow (recommended for production) ──
    // window.location.href = 'http://localhost:8089/pidev/oauth2/authorization/google';

    // ── Option B: popup flow ──────────────────────────────────
    const width  = 500;
    const height = 600;
    const left   = window.screenX + (window.outerWidth  - width)  / 2;
    const top    = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'http://localhost:8089/pidev/oauth2/authorization/google',
      'GoogleOAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Listen for the backend to post back a token after OAuth success
    const handler = (event: MessageEvent) => {
      // Only trust messages from your backend origin
      if (event.origin !== 'http://localhost:8089') return;

      const { token, id, role, name, lastName, email } = event.data;
      if (token) {
        // Store session same way AuthService.setSession does
        const user = { id, email, role, token, name, lastName };
        localStorage.setItem('sessionUser', JSON.stringify(user));
        popup?.close();
        window.removeEventListener('message', handler);
        this.googleLoading = false;
        this.router.navigate(['/app/dashboard']);
      }
    };

    window.addEventListener('message', handler);

    // Fallback: stop spinner if popup closed manually
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        this.googleLoading = false;
        window.removeEventListener('message', handler);
      }
    }, 500);
  }
}