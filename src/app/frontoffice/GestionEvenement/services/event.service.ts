import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../models/event.model';

// ── Interfaces filtrage/pagination ───────────────────────────────────────────

export interface EventFilterParams {
  titleContains?:       string;
  locationContains?:    string;
  descriptionContains?: string;
  status?:              string;
  category?:            string;
  startDateFrom?:       string;   // ISO: 2025-01-01T00:00:00
  startDateTo?:         string;
  endDateFrom?:         string;
  endDateTo?:           string;
  capacityMin?:         number;
  capacityMax?:         number;
  participantsMin?:     number;
  participantsMax?:     number;
  userId?:              number;
  sortBy?:              string;
  sortDir?:             'asc' | 'desc';
  page?:                number;
  size?:                number;
}

export interface PageResponse<T> {
  content:       T[];
  currentPage:   number;
  totalPages:    number;
  totalElements: number;
  pageSize:      number;
  first:         boolean;
  last:          boolean;
  hasNext:       boolean;
  hasPrevious:   boolean;
  sortBy:        string;
  sortDir:       string;
  filteredCount: number;
  totalCount:    number;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EventService {

  private apiUrl = 'http://localhost:8089/pidev/api/events';

  constructor(private http: HttpClient) {}

  // ── CRUD existant (inchangé) ──────────────────────────────────────────────

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: any): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  updateEvent(id: number, event: any): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── NOUVEAU : GET /api/events/filter ─────────────────────────────────────
  // N'envoie que les paramètres non-vides, le backend fait le reste.

  filterEvents(params: EventFilterParams): Observable<PageResponse<Event>> {
    let httpParams = new HttpParams();

    const set = (key: string, val: string | number | undefined) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    };

    set('titleContains',       params.titleContains);
    set('locationContains',    params.locationContains);
    set('descriptionContains', params.descriptionContains);
    set('status',              params.status);
    set('category',            params.category);
    set('startDateFrom',       params.startDateFrom);
    set('startDateTo',         params.startDateTo);
    set('endDateFrom',         params.endDateFrom);
    set('endDateTo',           params.endDateTo);
    set('capacityMin',         params.capacityMin);
    set('capacityMax',         params.capacityMax);
    set('participantsMin',     params.participantsMin);
    set('participantsMax',     params.participantsMax);
    set('userId',              params.userId);
    set('sortBy',              params.sortBy  ?? 'idEvent');
    set('sortDir',             params.sortDir ?? 'desc');
    set('page',                params.page    ?? 0);
    set('size',                params.size    ?? 10);

    return this.http.get<PageResponse<Event>>(
      `${this.apiUrl}/filter`,
      { params: httpParams }
    );
  }
}