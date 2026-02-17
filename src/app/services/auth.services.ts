import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRequest, AuthResponse, RegisterRequest } from '../authentification/auth/auth.module';

export interface SessionUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER' | 'CLIENT' | 'FREELANCER';
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8089/pidev/api/auth';

  private currentUserSubject = new BehaviorSubject<SessionUser | null>(
    this.getUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' });
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.setSession(res, request.email))
    );
  }

  setSession(res: AuthResponse, email: string): void {
    const user: SessionUser = {
      id: res.userId,                        // ✅ vient directement du JSON backend
      email,
      role: res.role as SessionUser['role'], // ✅ vient directement du JSON backend
      token: res.token
    };
    localStorage.setItem('sessionUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
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

  getCurrentUserId(): number | null {          // ✅ méthode manquante dans ton fichier actuel
    return this.currentUserSubject.value?.id ?? null;
  }

  private getUserFromStorage(): SessionUser | null {
    try {
      const stored = localStorage.getItem('sessionUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}