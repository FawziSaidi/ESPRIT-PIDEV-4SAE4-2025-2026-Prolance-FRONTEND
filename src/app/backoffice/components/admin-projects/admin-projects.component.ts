import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../../../frontoffice/ProjectModule/services/projects.service';
import { Project } from '../../../frontoffice/ProjectModule/models/project.model';
@Component({
  selector: 'app-admin-projects',
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.scss']
})
export class AdminProjectsComponent implements OnInit {

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  selectedProject?: Project;
  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';

  statusOptions = ['ALL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  categoryOptions = ['ALL', 'DEV', 'DESIGN'];

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectsService.getAllProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = this.projects;

    // Search filter
    if (this.searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    // Category filter
    if (this.categoryFilter !== 'ALL') {
      filtered = filtered.filter(p => p.category === this.categoryFilter);
    }

    this.filteredProjects = filtered;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.categoryFilter = category;
    this.applyFilters();
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
  }

  closeProject(): void {
    this.selectedProject = undefined;
  }

  deleteProject(project: Project): void {
    if (confirm(`Delete project "${project.title}"?`)) {
      if (project.id) {
        this.projectsService.deleteProject(project.id).subscribe({
          next: () => this.loadProjects(),
          error: (err) => console.error('Error deleting:', err)
        });
      }
    }
  }

  getCategoryIcon(category: string): string {
    return { 'DEV': '💻', 'DESIGN': '🎨' }[category] || '📌';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'IN_PROGRESS': '#f59e0b',
      'COMPLETED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }
  getProjectCountByStatus(status: string): number {
  return this.projects.filter(p => p.status === status).length;
}

}