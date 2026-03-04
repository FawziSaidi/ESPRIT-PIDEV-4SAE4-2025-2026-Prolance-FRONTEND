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
  commentCount?: number; // ✅ NOUVEAU : count chargé séparément
}

export interface Commentaire {
  id: number;
  contenue: string;
  createAt: string;
  userId?: number;           // ✅ microservice retourne userId directement
  publicationId?: number;    // ✅ microservice retourne publicationId directement
  user: { id: number; name: string; lastName: string; email: string; };
  publication?: { id: number; titre: string; }; // optionnel (ancien format)
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

  // ✅ NOUVEAU : commentaires par publication (direct, sans filtre côté front)
  getCommentairesByPublication(publicationId: number): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiBase}/commentaires/publication/${publicationId}`);
  }

  // Compte récursif : roots + toutes leurs replies imbriquées
  private countTotal(comments: Commentaire[]): number {
    return comments.reduce((acc, c) => acc + 1 + this.countTotal(c.replies || []), 0);
  }

  getCommentCountByPublication(publicationId: number): Observable<number> {
    return new Observable(observer => {
      this.http.get<Commentaire[]>(`${this.apiBase}/commentaires/publication/${publicationId}`)
        .subscribe({
          next: (comments) => { observer.next(this.countTotal(comments)); observer.complete(); },
          error: () => { observer.next(0); observer.complete(); }
        });
    });
  }

  getReactionSummary(publicationId: number): Observable<ReactionSummary> {
    const params = new HttpParams().set('userId', '0');
    return this.http.get<ReactionSummary>(
      `${this.apiBase}/reactions/publication/${publicationId}/summary`,
      { params }
    );
  }

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