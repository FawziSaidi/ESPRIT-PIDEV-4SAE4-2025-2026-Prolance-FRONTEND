import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publication, TypePublication } from '../models/publication.model';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  private baseUrl = 'http://localhost:8089/pidev/api/publications';

  constructor(private http: HttpClient) {}

  getAllPublications(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.baseUrl);
  }

  getPublicationsByType(type: TypePublication): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.baseUrl}/type/${type}`);
  }

  getPublicationsByUserId(userId: number): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.baseUrl}/user/${userId}`);
  }

  getPublicationById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.baseUrl}/${id}`);
  }

  createPublication(formData: FormData): Observable<Publication> {
    return this.http.post<Publication>(this.baseUrl, formData);
  }

  updatePublication(id: number, formData: FormData): Observable<Publication> {
    return this.http.put<Publication>(`${this.baseUrl}/${id}`, formData);
  }

  deletePublication(id: number, userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.delete(`${this.baseUrl}/${id}`, { params, responseType: 'text' });
  }
}
