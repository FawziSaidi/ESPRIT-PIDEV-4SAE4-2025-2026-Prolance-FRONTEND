import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../models/subscription.model';
import { UserSubscription } from '../models/user-subscription.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  private apiUrl = 'http://localhost:8089/pidev/api/subscriptions';
  private userSubUrl = 'http://localhost:8089/pidev/api/user-subscriptions';

  constructor(private http: HttpClient) {}

  // ========================
  // PLANS (Subscription) — ADMIN + FRONT
  // ========================

  // GET all plans
  getAllSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.apiUrl);
  }

  // GET active plans only
  getActiveSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/active`);
  }

  // GET plans by type (FREELANCER or CLIENT)
  getSubscriptionsByType(type: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/type/${type}`);
  }

  // GET one plan by ID
  getSubscriptionById(id: number): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/${id}`);
  }

  // POST create new plan (Admin)
  createSubscription(subscription: Subscription): Observable<Subscription> {
    return this.http.post<Subscription>(this.apiUrl, subscription);
  }

  // PUT update plan (Admin)
  updateSubscription(id: number, subscription: Partial<Subscription>): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.apiUrl}/${id}`, subscription);
  }

  // DELETE plan (Admin)
  deleteSubscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // PATCH activate plan
  activateSubscription(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activate`, {});
  }

  // PATCH deactivate plan
  deactivateSubscription(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  // ========================
  // USER SUBSCRIPTIONS — FRONT (Freelancer/Client)
  // ========================

  // POST — S'abonner à un plan
  subscribe(subscriptionId: number, paymentMethod: string): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(`${this.userSubUrl}/subscribe`, {
      subscriptionId,
      paymentMethod,
    });
  }

  // GET — Mon abonnement actuel
  getMySubscription(): Observable<UserSubscription> {
    return this.http.get<UserSubscription>(`${this.userSubUrl}/my-subscription`);
  }

  // PUT — Annuler mon abonnement
  cancelSubscription(id: number): Observable<UserSubscription> {
    return this.http.put<UserSubscription>(`${this.userSubUrl}/${id}/cancel`, {});
  }

  // PUT — Activer/Désactiver le renouvellement auto
  toggleAutoRenew(id: number): Observable<UserSubscription> {
    return this.http.put<UserSubscription>(`${this.userSubUrl}/${id}/toggle-auto-renew`, {});
  }
}