import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventInscriptionRequestDTO, EventInscriptionResponseDTO } from '../models/inscription.model';

@Injectable({ providedIn: 'root' })
export class InscriptionService {

  private apiUrl = 'http://localhost:8089/pidev/api/inscriptions';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const sessionUser = localStorage.getItem('sessionUser');
    const token = sessionUser ? JSON.parse(sessionUser).token : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // USER
  submitInscription(request: EventInscriptionRequestDTO): Observable<EventInscriptionResponseDTO> {
    return this.http.post<EventInscriptionResponseDTO>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  getMesInscriptions(userId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/user/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ADMIN
  getInscriptionsByEvent(eventId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/event/${eventId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getPendingInscriptions(eventId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/event/${eventId}/pending`, {
      headers: this.getAuthHeaders()
    });
  }

  acceptInscription(id: number): Observable<EventInscriptionResponseDTO> {
    return this.http.put<EventInscriptionResponseDTO>(`${this.apiUrl}/${id}/accept`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  rejectInscription(id: number): Observable<EventInscriptionResponseDTO> {
    return this.http.put<EventInscriptionResponseDTO>(`${this.apiUrl}/${id}/reject`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  deleteInscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  downloadBadge(id: number): Observable<Blob> {
    const sessionUser = localStorage.getItem('sessionUser');
    const token = sessionUser ? JSON.parse(sessionUser).token : null;
    return this.http.get(`${this.apiUrl}/${id}/badge`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    });
  }
}