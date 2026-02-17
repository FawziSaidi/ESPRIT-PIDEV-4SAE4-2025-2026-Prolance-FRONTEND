import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../models/project.model';
import { AuthService } from '../../../services/auth.services';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost:8089/pidev/api/projects';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Récupérer tous les projets
   */
  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  /**
   * Récupérer les projets du client connecté
   */
  getMyProjects(clientId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/my-projects/${clientId}`);
  }

  /**
   * Récupérer un projet par ID
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer un nouveau projet
   */
  createProject(projectData: any): Observable<Project> {
    const clientId = this.authService.getCurrentUserId();
    
    if (!clientId) {
      alert('Error: You must be logged in to create a project');
      return throwError(() => new Error('User ID is not available'));
    }

    const dto = {
      title: projectData.title,
      description: projectData.description,
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: projectData.status,
      category: projectData.category,
      clientId: clientId,
      skillIds: projectData.skillIds || [],
      tasks: projectData.tasks || []
    };

    return this.http.post<Project>(this.apiUrl, dto).pipe(
      catchError((error) => {
        console.error('Error creating project:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour un projet
   */
  updateProject(projectData: any): Observable<Project> {
    const clientId = this.authService.getCurrentUserId();
    
    if (!clientId) {
      alert('Error: You must be logged in');
      return throwError(() => new Error('User ID is not available'));
    }

    const dto = {
      title: projectData.title,
      description: projectData.description,
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: projectData.status,
      category: projectData.category,
      clientId: clientId,
      skillIds: projectData.skillIds || [],
      tasks: projectData.tasks || []
    };

    return this.http.put<Project>(`${this.apiUrl}/${projectData.id}`, dto).pipe(
      catchError((error) => {
        console.error('Error updating project:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer un projet
   */
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}