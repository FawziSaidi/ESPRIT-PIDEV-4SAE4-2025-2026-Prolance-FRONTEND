import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.services';

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: string;
  birthDate: string;
  avatar?: string;      // ← ADD THIS
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8089/pidev/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getCurrentUser()?.token;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // ── Avatar ─────────────────────────────────────────────────
  updateAvatar(userId: number, avatarBase64: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${userId}/avatar`,   // ← was this.API (wrong), now this.apiUrl
      { avatar: avatarBase64 },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ── CRUD ────────────────────────────────────────────────────
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(id: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/change-password`,
      { currentPassword, newPassword },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ── Error handler ───────────────────────────────────────────
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.status === 401) {
      errorMessage = 'Session expired. Please login again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission.';
    } else if (error.status === 404) {
      errorMessage = 'User not found.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}