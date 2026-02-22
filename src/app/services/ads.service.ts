import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AdPlan,
  AdCampaign,
  CreateCampaignRequest,
  RejectCampaignRequest
} from '../pages/ads/models/ad.models';

@Injectable({
  providedIn: 'root'
})
export class AdsService {

  private readonly baseUrl = environment.adsServiceUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // ═══════════════════════════════════════════════
  // AUTH HELPERS
  // ═══════════════════════════════════════════════

  private getToken(): string | null {
    const stored = localStorage.getItem('sessionUser');
    if (!stored) return null;
    try {
      const sessionUser = JSON.parse(stored);
      console.log('[Identity Check] sessionUser:', sessionUser);
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

  private publicHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // ═══════════════════════════════════════════════
  // ERROR HANDLER
  // ═══════════════════════════════════════════════

  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      if (error.status === 403) {
        console.warn(`[AdsService] ${operation}: Forbidden (403). Token does not have the required role.`);
        this.router.navigate(['/login']);
      } else if (error.status === 401) {
        console.warn(`[AdsService] ${operation}: Unauthorized (401). JWT invalid or missing required ID claim. Logging out.`);
        localStorage.removeItem('sessionUser');
        this.router.navigate(['/login']);
      } else if (error.status === 400) {
        console.warn(`[AdsService] ${operation}: Bad Request (400). ${error.error?.message || 'Missing required header or invalid payload.'}`);
      } else if (error.status === 0) {
        console.warn(`[AdsService] ${operation}: Backend unreachable. Is the ads-service running on ${this.baseUrl}?`);
      } else {
        console.error(`[AdsService] ${operation}: HTTP ${error.status}`, error.error);
      }
      return throwError(() => error);
    };
  }

  // ═══════════════════════════════════════════════
  // PLANS
  // ═══════════════════════════════════════════════

  getPlans(): Observable<AdPlan[]> {
    return this.http.get<AdPlan[]>(`${this.baseUrl}/plans`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('getPlans'))
    );
  }

  // ═══════════════════════════════════════════════
  // CAMPAIGNS — USER
  // ═══════════════════════════════════════════════

  getMyCampaigns(): Observable<AdCampaign[]> {
    return this.http.get<AdCampaign[]>(`${this.baseUrl}/campaigns/my`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('getMyCampaigns'))
    );
  }

  createCampaign(data: CreateCampaignRequest): Observable<AdCampaign> {
    return this.http.post<AdCampaign>(`${this.baseUrl}/campaigns`, data, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('createCampaign'))
    );
  }

  updateCampaign(id: number, data: CreateCampaignRequest): Observable<AdCampaign> {
    return this.http.put<AdCampaign>(`${this.baseUrl}/campaigns/${id}`, data, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('updateCampaign'))
    );
  }

  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/campaigns/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('deleteCampaign'))
    );
  }

  // ═══════════════════════════════════════════════
  // CAMPAIGNS — PUBLIC
  // ═══════════════════════════════════════════════

  getActiveAds(): Observable<AdCampaign[]> {
    return this.http.get<AdCampaign[]>(`${this.baseUrl}/campaigns/active`, {
      headers: this.publicHeaders()
    }).pipe(
      catchError(this.handleError('getActiveAds'))
    );
  }

  recordClick(campaignId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/campaigns/${campaignId}/click`, {}, {
      headers: this.publicHeaders()
    }).pipe(
      catchError(this.handleError('recordClick'))
    );
  }

  // ═══════════════════════════════════════════════
  // CAMPAIGNS — ADMIN
  // ═══════════════════════════════════════════════

  getAllAdminCampaigns(): Observable<AdCampaign[]> {
    return this.http.get<AdCampaign[]>(`${this.baseUrl}/campaigns/admin/all`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('getAllAdminCampaigns'))
    );
  }

  adminApprove(id: number): Observable<AdCampaign> {
    return this.http.patch<AdCampaign>(`${this.baseUrl}/campaigns/admin/${id}/approve`, {}, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('adminApprove'))
    );
  }

  adminReject(id: number, reason: string): Observable<AdCampaign> {
    const body: RejectCampaignRequest = { rejectionReason: reason };
    return this.http.patch<AdCampaign>(`${this.baseUrl}/campaigns/admin/${id}/reject`, body, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('adminReject'))
    );
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/campaigns/admin/${id}`, {
      headers: this.authHeaders()
    }).pipe(
      catchError(this.handleError('adminDelete'))
    );
  }

  // ═══════════════════════════════════════════════
  // NEW BACKEND CAPABILITIES
  // ═══════════════════════════════════════════════

  /**
   * Get a single ad campaign by ID (public endpoint)
   */
  getAdById(id: number): Observable<AdCampaign> {
    return this.http.get<AdCampaign>(`${this.baseUrl}/campaigns/${id}`, {
      headers: this.publicHeaders()
    }).pipe(
      catchError(this.handleError('getAdById'))
    );
  }

  /**
   * Validate ad content using Llama-Guard moderation
   */
  validateAdContent(title: string, description: string): Observable<{isSafe: boolean; categoryCode?: string}> {
    return this.http.post<{isSafe: boolean; categoryCode?: string}>(
      `${this.baseUrl}/campaigns/validate`,
      { title, description },
      { headers: this.authHeaders() }
    ).pipe(
      catchError(this.handleError('validateAdContent'))
    );
  }

  /**
   * Generate AI-powered ad suggestion
   */
  generateAiSuggestion(prompt: string): Observable<{title: string; description: string}> {
    console.log('[AdsService] Sending AI suggestion request with prompt:', prompt);
    return this.http.post(
      `${this.baseUrl}/campaigns/generate-suggestion`,
      { prompt },
      { 
        headers: this.authHeaders(),
        observe: 'response',
        responseType: 'text'
      }
    ).pipe(
      tap(response => {
        console.log('[AdsService] Full HTTP response:', response);
        console.log('[AdsService] Response body (raw text):', response.body);
        console.log('[AdsService] Response headers:', response.headers.keys());
      }),
      map(response => {
        try {
          const parsed = JSON.parse(response.body || '{}');
          console.log('[AdsService] Parsed JSON:', parsed);
          return parsed;
        } catch (e) {
          console.error('[AdsService] JSON parse error:', e);
          return { title: '', description: '' };
        }
      }),
      catchError((error) => {
        console.error('[AdsService] AI suggestion HTTP error:', error);
        return this.handleError('generateAiSuggestion')(error);
      })
    );
  }
}
