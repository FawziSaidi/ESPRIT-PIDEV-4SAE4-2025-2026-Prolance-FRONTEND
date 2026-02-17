import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { AuthService } from '../../../../services/auth.services';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  errorMessage = '';
  
  showAddModal = false;
  showEditModal = false;
  showDetailsModal = false;
  showApplyModal = false;
  selectedProject?: Project;
  
  currentUserRole: string = '';
  currentUserId: number | null = null;
  isClient: boolean = false;
  isFreelancer: boolean = false;
  hasFilledSkills: boolean = false;

  categoryOptions = [{ label: 'All', value: 'ALL' }, { label: 'Dev', value: 'DEV' }, { label: 'Design', value: 'DESIGN' }];
  selectedCategory = 'ALL';
  
  viewOptions = [{ label: 'All Projects', value: 'ALL' }, { label: 'My Projects', value: 'MY_PROJECTS' }];
  selectedView = 'ALL';

  constructor(private projectsService: ProjectsService, private authService: AuthService) {}

  ngOnInit(): void {
    this.determineUserRole();
    this.loadProjects();
    this.checkIfSkillsFilled();
  }

  determineUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserRole = currentUser.role;
      this.currentUserId = currentUser.userId;
      this.isClient = this.currentUserRole === 'CLIENT' || this.currentUserRole === 'ADMIN';
      this.isFreelancer = this.currentUserRole === 'FREELANCER';
    }
  }

  checkIfSkillsFilled(): void {
    if (this.isFreelancer && this.currentUserId) {
      // TODO: Check if freelancer has already filled skills
      // This would require a backend endpoint to check
    }
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
        this.errorMessage = 'Impossible de charger les projets.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = this.projects;

    if (this.selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.selectedView === 'MY_PROJECTS' && this.isClient && this.currentUserId) {
      filtered = filtered.filter(p => p.client?.id === this.currentUserId);
    }

    this.filteredProjects = filtered;
  }

  isMyProject(project: Project): boolean {
    return this.isClient && project.client?.id === this.currentUserId;
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onViewChange(view: string): void {
    this.selectedView = view;
    this.applyFilters();
  }

  openAddModal(): void {
    if (!this.isClient) {
      this.errorMessage = 'Seuls les clients peuvent créer des projets.';
      return;
    }
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.loadProjects();
  }

  openEditModal(project: Project): void {
    if (!this.isMyProject(project)) {
      this.errorMessage = 'Vous ne pouvez modifier que vos propres projets.';
      return;
    }
    this.selectedProject = project;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProject = undefined;
    this.loadProjects();
  }

  openProjectDetails(project: Project): void {
    this.selectedProject = project;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProject = undefined;
  }

  openApplyModal(project: Project): void {
    this.selectedProject = project;
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedProject = undefined;
  }

  onSkillsSubmitted(skills: any): void {
    console.log('Skills submitted:', skills);
    this.hasFilledSkills = true;
    this.closeApplyModal();
  }

  deleteProject(project: Project): void {
    if (!this.isMyProject(project)) {
      this.errorMessage = 'Vous ne pouvez supprimer que vos propres projets.';
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${project.title}" ?`)) {
      if (project.id) {
        this.projectsService.deleteProject(project.id).subscribe({
          next: () => this.loadProjects(),
          error: (err) => {
            console.error('Error:', err);
            this.errorMessage = 'Erreur lors de la suppression.';
          }
        });
      }
    }
  }

  getCategoryBadgeClass(category: string): string {
    return { 'DEV': 'category-dev', 'DESIGN': 'category-design' }[category] || 'category-default';
  }

  getCategoryIcon(category: string): string {
    return { 'DEV': '💻', 'DESIGN': '🎨' }[category] || '📌';
  }
}