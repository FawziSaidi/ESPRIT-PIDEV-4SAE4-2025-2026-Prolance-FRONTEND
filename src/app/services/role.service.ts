import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService, SessionUser } from './auth.services';

@Injectable({ providedIn: 'root' })
export class RoleService {

  private roleSubject = new BehaviorSubject<'FREELANCER' | 'CLIENT'>(
    this.getInitialRole()
  );

  role$        = this.roleSubject.asObservable();
  currentRole$ = this.roleSubject.asObservable();

  constructor(private authService: AuthService) {
    // Auto-sync quand l'utilisateur se connecte/déconnecte
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.roleSubject.next(this.mapRole(user.role));
      }
    });
  }

  get currentRole(): 'FREELANCER' | 'CLIENT' {
    return this.roleSubject.value;
  }

  /** BLOQUÉ : on ne permet plus le changement manuel */
  setRole(role: 'FREELANCER' | 'CLIENT'): void {
    // Seulement si l'utilisateur a le droit (ADMIN ou rôle correspondant)
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Un ADMIN peut basculer, les autres non
    if (user.role === 'ADMIN') {
      this.roleSubject.next(role);
    }
    // Sinon on ignore — le rôle reste celui de l'utilisateur
  }

  refreshFromAuth(): void {
    this.roleSubject.next(this.getInitialRole());
  }

  private getInitialRole(): 'FREELANCER' | 'CLIENT' {
    try {
      const stored = localStorage.getItem('sessionUser');
      if (stored) {
        const user = JSON.parse(stored) as SessionUser;
        return this.mapRole(user.role);
      }
    } catch {}
    return 'FREELANCER';
  }

  private mapRole(role: string): 'FREELANCER' | 'CLIENT' {
    if (role === 'CLIENT') return 'CLIENT';
    return 'FREELANCER'; // FREELANCER, ADMIN, USER → FREELANCER par défaut
  }
}