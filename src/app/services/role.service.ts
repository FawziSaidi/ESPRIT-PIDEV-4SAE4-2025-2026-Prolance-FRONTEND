import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleService {

  private roleSubject = new BehaviorSubject<'FREELANCER' | 'CLIENT'>('FREELANCER');

  role$        = this.roleSubject.asObservable(); // utilisé par plans-catalog
  currentRole$ = this.roleSubject.asObservable(); // alias pour compatibilité

  get currentRole(): 'FREELANCER' | 'CLIENT' {
    return this.roleSubject.value;
  }

  setRole(role: 'FREELANCER' | 'CLIENT'): void {
    this.roleSubject.next(role);
  }
}