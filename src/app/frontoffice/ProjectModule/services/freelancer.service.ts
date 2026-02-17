import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FreelancerService {
  private apiUrl = 'http://localhost:8089/pidev/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all available skills
   */
  getAllSkills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/skills`);
  }

  /**
   * Get freelancer skills by freelancer ID
   */
  getFreelancerSkills(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/freelancer-skills/freelancer/${freelancerId}`);
  }

  /**
   * Add skills to freelancer
   */
  addSkillsToFreelancer(freelancerId: number, skillIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/freelancer-skills`, {
      freelancerId,
      skillIds
    });
  }

  /**
   * Submit application for a project
   */
  submitApplication(applicationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications`, applicationData);
  }

  /**
   * Get freelancer applications
   */
  getFreelancerApplications(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/applications/freelancer/${freelancerId}`);
  }
}