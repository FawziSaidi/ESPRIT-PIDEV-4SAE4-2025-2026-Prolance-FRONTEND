import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FreelancerService {
  private apiUrl = 'http://localhost:8089/pidev/api';

  constructor(private http: HttpClient) {}

  // ─── SKILLS ───────────────────────────────────────────────
  /** Tous les skills du freelancer connecté */
  getFreelancerSkills(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/skills/freelancer/${freelancerId}`);
  }

  /** Créer un skill pour un freelancer */
  createSkillForFreelancer(freelancerId: number, skill: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/skills/freelancer/${freelancerId}`, skill);
  }

  // ─── CV / RESUME ──────────────────────────────────────────
  /** Upload CV PDF → retourne l'URL */
  uploadResume(freelancerId: number, file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/skills/resume/upload/${freelancerId}`, form);
  }

  /** Générer le PDF du CV depuis les skills */
  generateResumePdf(freelancerId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/skills/resume/generate/${freelancerId}`, { responseType: 'blob' });
  }

  // ─── APPLICATIONS ─────────────────────────────────────────
  /** Vérifier si le freelancer a déjà appliqué */
  checkAlreadyApplied(freelancerId: number, projectId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/applications/check?freelancerId=${freelancerId}&projectId=${projectId}`);
  }

  /** Soumettre une candidature (JSON ou FormData avec PDF) */
  submitApplication(data: FormData | any): Observable<any> {
    if (data instanceof FormData) {
      return this.http.post(`${this.apiUrl}/applications`, data);
    }
    return this.http.post(`${this.apiUrl}/applications`, data);
  }

  /** Générer la lettre de motivation depuis le CV */
  generateCoverLetter(freelancerId: number, projectId: number): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/applications/generate-cover-letter`,
      { freelancerId, projectId },
      { responseType: 'blob' }
    );
  }

  /** Upload PDF lettre de motivation */
  uploadCoverLetter(freelancerId: number, file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/applications/cover-letter/upload/${freelancerId}`, form);
  }

  /** Mes candidatures */
  getFreelancerApplications(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/applications/freelancer/${freelancerId}`);
  }
}