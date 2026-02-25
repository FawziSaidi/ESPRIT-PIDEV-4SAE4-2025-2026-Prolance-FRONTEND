import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FreelancerService {
  private apiUrl = 'http://localhost:8089/pidev/api';

  constructor(private http: HttpClient) {}

  // ─── SKILLS ───────────────────────────────────────────────

  getFreelancerSkills(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/skills/freelancer/${freelancerId}`);
  }

  createSkillForFreelancer(freelancerId: number, skill: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/skills/freelancer/${freelancerId}`, skill);
  }

  // ─── CV / RESUME ──────────────────────────────────────────

  uploadResume(freelancerId: number, file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    // Backend retourne une string (path), pas du JSON
    return this.http.post(
      `${this.apiUrl}/skills/resume/upload/${freelancerId}`,
      form,
      { responseType: 'text' }
    );
  }

  generateResumePdf(freelancerId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/skills/resume/generate/${freelancerId}`,
      { responseType: 'blob' }
    );
  }

  // ─── APPLICATIONS ─────────────────────────────────────────

  checkAlreadyApplied(freelancerId: number, projectId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/applications/check?freelancerId=${freelancerId}&projectId=${projectId}`
    );
  }

  /** Toujours du JSON — le backend attend { freelancerId, projectId, coverLetterUrl } */
  submitApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications`, data);
  }

  /**
   * Backend retourne une STRING : "/uploads/cover-letters/cover_generated_1_xxx.pdf"
   * On utilise responseType: 'text' pour éviter l'erreur JSON parse.
   */
  generateCoverLetterAsString(freelancerId: number, projectId: number): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/applications/generate-cover-letter`,
      { freelancerId, projectId },
      { responseType: 'text' }
    );
  }

  /**
   * Upload PDF lettre de motivation.
   * Backend retourne une STRING : "/uploads/cover-letters/cover_1_xxx.pdf"
   * responseType: 'text' obligatoire sinon Angular essaie de parser du JSON et échoue.
   */
  uploadCoverLetter(freelancerId: number, file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(
      `${this.apiUrl}/applications/cover-letter/upload/${freelancerId}`,
      form,
      { responseType: 'text' }  // ← FIX : backend retourne plain text, pas JSON
    );
  }

  getFreelancerApplications(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/applications/freelancer/${freelancerId}`);
  }
}