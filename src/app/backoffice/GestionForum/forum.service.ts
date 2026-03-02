import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface ReactionSummary {
  LIKE: number;
  DISLIKE: number;
  HEART: number;
  userReaction: string | null;
  reactors: { userId: number; userName: string; type: string; }[];
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly apiBase = 'http://localhost:8222/api';

  constructor(private http: HttpClient) {}

  getAllPublications(): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiBase}/publications`);
  }

  getAllCommentaires(): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiBase}/commentaires`);
  }

  getReactionSummary(publicationId: number): Observable<ReactionSummary> {
    const params = new HttpParams().set('userId', '0');
    return this.http.get<ReactionSummary>(
      `${this.apiBase}/reactions/publication/${publicationId}/summary`,
      { params }
    );
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