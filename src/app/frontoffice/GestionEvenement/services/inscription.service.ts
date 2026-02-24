// src/app/core/services/inscription.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventInscriptionRequestDTO, EventInscriptionResponseDTO } from '../models/inscription.model';

@Injectable({ providedIn: 'root' })
export class InscriptionService {

  private apiUrl = 'http://localhost:8089/pidev/api/inscriptions';

  constructor(private http: HttpClient) {}

  // USER
  submitInscription(request: EventInscriptionRequestDTO): Observable<EventInscriptionResponseDTO> {
    return this.http.post<EventInscriptionResponseDTO>(this.apiUrl, request);
  }

  getMesInscriptions(userId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/user/${userId}`);
  }

  // ADMIN
  getInscriptionsByEvent(eventId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/event/${eventId}`);
  }

  getPendingInscriptions(eventId: number): Observable<EventInscriptionResponseDTO[]> {
    return this.http.get<EventInscriptionResponseDTO[]>(`${this.apiUrl}/event/${eventId}/pending`);
  }

  acceptInscription(id: number): Observable<EventInscriptionResponseDTO> {
    return this.http.put<EventInscriptionResponseDTO>(`${this.apiUrl}/${id}/accept`, {});
  }

  rejectInscription(id: number): Observable<EventInscriptionResponseDTO> {
    return this.http.put<EventInscriptionResponseDTO>(`${this.apiUrl}/${id}/reject`, {});
  }

  deleteInscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadBadge(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/badge`, { responseType: 'blob' });
  }
}