import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publication {
  id: number;
  titre: string;
  contenue: string;
  type: 'QUESTION' | 'ARTICLE' | 'REVIEW';
  createAt: string;
  images: string[];
  pdfs: string[];
  user: { id: number; name: string; lastName: string; email: string; };
  commentaires: Commentaire[];
}

export interface Commentaire {
  id: number;
  contenue: string;
  createAt: string;
  user: { id: number; name: string; lastName: string; email: string; };
  publication: { id: number; titre: string; };
  parent?: { id: number; };
  replies: Commentaire[];
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly apiBase = 'http://localhost:8089/pidev/api';

  constructor(private http: HttpClient) {}

  getAllPublications(): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiBase}/publications`);
  }

  getAllCommentaires(): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiBase}/commentaires`);
  }

  // Admin delete — no userId required
  adminDeletePublication(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/publications/admin/${id}`, { responseType: 'text' });
  }

  deletePublication(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/publications/${id}?userId=${userId}`, { responseType: 'text' });
  }

  deleteCommentaire(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/commentaires/${id}?userId=${userId}`, { responseType: 'text' });
  }
}