import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdEventPayload {
  adId: number;
  type: 'VIEW' | 'CLICK' | 'HOVER';
}

@Injectable({
  providedIn: 'root'
})
export class AdTrackingService {
  private baseUrl = 'http://localhost:8090/ads-service/api/ads/events';

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    const stored = localStorage.getItem('sessionUser');
    if (!stored) return null;
    try {
      const sessionUser = JSON.parse(stored);
      return sessionUser.token || null;
    } catch {
      return null;
    }
  }

  private authHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Fire-and-forget event tracking
   * Sends event to Kafka without blocking UI
   * Only sends adId and type - userId/createdBy handled by backend
   */
  sendEvent(adId: number, type: 'VIEW' | 'CLICK' | 'HOVER'): void {
    const payload: AdEventPayload = { adId, type };
    
    // Dev mode logging
    if (!environment.production) {
      console.log(`[Kafka] Sending ${type} event for Ad #${adId}`);
    }

    // Fire-and-forget: subscribe but don't wait for response
    this.http.post(this.baseUrl, payload, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          if (!environment.production) {
            console.log(`[Kafka] ${type} event sent successfully for Ad #${adId}`);
          }
        },
        error: (err) => {
          // Silent fail - don't disrupt user experience
          console.warn(`[Kafka] Failed to send ${type} event for Ad #${adId}:`, err.message);
        }
      });
  }
}
