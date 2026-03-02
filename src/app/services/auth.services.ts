import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest } from '../authentification/auth/auth.module';

export interface SessionUser {
  email: string;
  role: 'ADMIN' | 'USER' | 'CLIENT' | 'FREELANCER';
  token: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8222/api/auth';

  // 🔐 session state (single source of truth)
  private currentUserSubject = new BehaviorSubject<SessionUser | null>(
    this.getUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ---------- API ----------
  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' });
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  // ---------- SESSION ----------
  setSession(res: AuthResponse, email: string): void {
    const user: SessionUser = {
      email,
      role: res.role,
      token: res.token,
      userId: res.userId
    };

    localStorage.setItem('sessionUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.userId ?? null;
  }

  logout(): void {
    localStorage.removeItem('sessionUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): SessionUser | null {
    const stored = localStorage.getItem('sessionUser');
    if (!stored) return null;

    const parsed: SessionUser = JSON.parse(stored);

    // Si la session ne contient pas userId (ancienne session), on la supprime
    if (!parsed.userId) {
      localStorage.removeItem('sessionUser');
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('role');
      return null;
    }

    return parsed;
  }
}