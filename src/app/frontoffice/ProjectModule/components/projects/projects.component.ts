import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
import { AuthService } from '../../../../services/auth.services';
import { Project } from '../../models/project.model';
import { FreelancerService } from '../../services/freelancer.service';

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
  
  viewOptions = [ { label: 'My Projects', value: 'MY_PROJECTS' }];
  selectedView = 'ALL';
  searchQuery = '';

  showSkillsSetupModal = false;
  showDeleteModal = false;
  projectToDelete?: Project;
  alreadyAppliedProjects: Set<number> = new Set();

  constructor(private projectsService: ProjectsService, private authService: AuthService,private freelancerService: FreelancerService) {}

  ngOnInit(): void {
   this.determineUserRole();
  this.loadProjects();
  if (this.isFreelancer) {
    this.checkIfSkillsFilled();
  }
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
  if (this.currentUserId) {
    this.freelancerService.getFreelancerSkills(this.currentUserId).subscribe({
      next: (skills) => {
        this.hasFilledSkills = skills && skills.length > 0;
      },
      error: () => this.hasFilledSkills = false
    });
  }
}
formatStatus(status: string): string {
  return status.replace('_', ' ').toLowerCase();
}
formatBudget(budget: number): string {
  return `${budget.toFixed(0)} TND`;
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

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.client?.name || '').toLowerCase().includes(q)
      );
    }

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

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onViewChange(view: string): void {
  this.selectedView = view;
  
  // Reset category filter when switching to My Projects
  if (view === 'MY_PROJECTS') {
    this.selectedCategory = 'ALL';
  }
  
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
  if (!this.hasFilledSkills) {
    this.showSkillsSetupModal = true;
  } else {
    // Vérifier si déjà appliqué
    if (project.id && this.currentUserId) {
      this.freelancerService.checkAlreadyApplied(this.currentUserId, project.id).subscribe({
        next: (alreadyApplied) => {
          if (alreadyApplied) {
            alert('You have already applied to this project.');
          } else {
            this.showApplyModal = true;
          }
        },
        error: () => this.showApplyModal = true // en cas d'erreur, ouvrir quand même
      });
    } else {
      this.showApplyModal = true;
    }
  }
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
closeSkillsSetupModal(): void {
  this.showSkillsSetupModal = false;
  this.selectedProject = undefined;
}

onSkillsSetupDone(): void {
  this.hasFilledSkills = true;
  this.showSkillsSetupModal = false;
  // Ouvre directement la modal apply après avoir ajouté les skills
  this.showApplyModal = true;
}
onApplicationSubmitted(): void {
  this.showApplyModal = false;
  this.selectedProject = undefined;
  // Optionnel : rafraîchir ou afficher un toast
}
  openDeleteModal(project: Project): void {
    if (!this.isMyProject(project)) {
      this.errorMessage = 'Vous ne pouvez supprimer que vos propres projets.';
      return;
    }
    this.projectToDelete = project;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.projectToDelete = undefined;
  }

  confirmDelete(): void {
    if (!this.projectToDelete?.id) return;
    this.projectsService.deleteProject(this.projectToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error:', err);
        this.errorMessage = 'Erreur lors de la suppression.';
        this.closeDeleteModal();
      }
    });
  }

  deleteProject(project: Project): void {
    this.openDeleteModal(project);
  }

  getCategoryBadgeClass(category: string): string {
    return { 'DEV': 'category-dev', 'DESIGN': 'category-design' }[category] || 'category-default';
  }

  getCategoryIcon(category: string): string {
    return { 'DEV': '💻', 'DESIGN': '🎨' }[category] || '📌';
  }
}