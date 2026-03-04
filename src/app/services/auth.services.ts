import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRequest, AuthResponse, RegisterRequest } from '../authentification/auth/auth.module';

export interface SessionUser {
  email:    string;
  role:     'ADMIN' | 'USER' | 'CLIENT' | 'FREELANCER';
  token:    string;
  userId:   number;
  // ✅ Stockés en session — récupérés depuis le formulaire d'inscription
  name:     string;
  lastName: string;
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

  /**
   * Register — on intercepte la requête pour sauvegarder name/lastName
   * dans localStorage juste avant l'envoi, afin de les récupérer au login.
   */
  register(request: RegisterRequest): Observable<any> {
    // ✅ On sauvegarde temporairement name/lastName associés à l'email
    // pour pouvoir les injecter dans la session au moment du login
    localStorage.setItem('pending_name',      request.name);
    localStorage.setItem('pending_lastName',  request.lastName);
    localStorage.setItem('pending_email',     request.email);

    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' });
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  // ---------- SESSION ----------

  /**
   * Appelé après un login réussi.
   * Récupère name/lastName soit depuis les données pending (après register immédiat),
   * soit depuis le localStorage s'il avait déjà été sauvegardé.
   */
  setSession(res: AuthResponse, email: string): void {
    // Récupérer name/lastName — stockés lors du register
    const pendingEmail    = localStorage.getItem('pending_email');
    const pendingName     = localStorage.getItem('pending_name');
    const pendingLastName = localStorage.getItem('pending_lastName');

    // Utiliser les données pending si elles correspondent au même email
    // Sinon, réutiliser ce qui était déjà en session (reconnexion)
    const existingSession = this.getUserFromStorage();
    let name     = '';
    let lastName = '';

    if (pendingEmail === email && pendingName) {
      name     = pendingName;
      lastName = pendingLastName || '';
      // Nettoyer les données temporaires
      localStorage.removeItem('pending_name');
      localStorage.removeItem('pending_lastName');
      localStorage.removeItem('pending_email');
    } else if (existingSession?.email === email) {
      // Reconnexion du même utilisateur — garder les données existantes
      name     = existingSession.name     || '';
      lastName = existingSession.lastName || '';
    }

    const user: SessionUser = {
      email,
      role:     res.role,
      token:    res.token,
      userId:   res.userId,
      name,
      lastName
    };

    localStorage.setItem('sessionUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Permet de mettre à jour le nom en session si besoin
   * (ex: après que l'utilisateur modifie son profil)
   */
  updateSessionName(name: string, lastName: string): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated = { ...current, name, lastName };
    localStorage.setItem('sessionUser', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
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