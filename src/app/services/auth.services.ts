import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest } from '../authentification/auth/auth.models';

export interface SessionUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER' | 'CLIENT' | 'FREELANCER';
  token: string;
  name: string;
  lastName: string;
  imageUrl?: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8222/api/auth';

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
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        console.log('Login response:', response);
        this.setSession(response, request.email);
      })
    );
  }

  // ---------- SESSION ----------
  setSession(res: AuthResponse | SessionUser, email: string): void {
    const user: SessionUser = {
      id: (res as any).id,
      email,
      role: (res as any).role,
      token: (res as any).token,
      name: (res as any).name,
      lastName: (res as any).lastName,
      imageUrl: (res as any).imageUrl ?? undefined
    };

    console.log('Setting session user:', user);
    localStorage.setItem('sessionUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Call this after avatar update to keep navbar in sync
  updateSessionAvatar(imageUrl: string): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated: SessionUser = { ...current, imageUrl };
    localStorage.setItem('sessionUser', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
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
    return stored ? JSON.parse(stored) : null;
  }
}