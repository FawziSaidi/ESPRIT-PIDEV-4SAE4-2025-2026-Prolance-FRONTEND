import { Component, OnInit } from '@angular/core';
import { ProjectsService } from '../../../frontoffice/ProjectModule/services/projects.service';
import { Project } from '../../../frontoffice/ProjectModule/models/project.model';
import { EmailNotificationService } from 'app/frontoffice/ProjectModule/services/email-notification.service';
import { ProjectStatus } from 'app/frontoffice/ProjectModule/models/enums.model';
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

  approvingProjectId?: number;

  // ✅ AJOUTÉ — propriétés pour les modals
  showSuccessModal = false;
  successModalTitle = '';
  successModalMessage = '';
  successModalEmail = '';

  showConfirmModal = false;
  confirmModalType: 'approve' | 'delete' = 'approve';
  pendingProject?: Project;

  constructor(
    private projectsService: ProjectsService,
    private emailService: EmailNotificationService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  private showSuccess(title: string, message: string, email: string): void {
    this.successModalTitle   = title;
    this.successModalMessage = message;
    this.successModalEmail   = email;
    this.showSuccessModal    = true;
  }

  closeSuccessModal(): void { this.showSuccessModal = false; }

  // ✅ AJOUTÉ — méthodes confirm modal
  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingProject = undefined;
  }

  confirmAction(): void {
    this.showConfirmModal = false;
    if (this.confirmModalType === 'approve' && this.pendingProject) {
      this.doApprove(this.pendingProject);
    } else if (this.confirmModalType === 'delete' && this.pendingProject) {
      this.doDelete(this.pendingProject);
    }
    this.pendingProject = undefined;
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

  private getCurrentUser(): any {
    try {
      const userJson = localStorage.getItem('sessionUser')
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error('Error parsing user:', e);
      return null;
    }
  }

  // ✅ MODIFIÉ — ouvre le modal au lieu du confirm()
  approveProject(project: Project): void {
    if (!project.id) return;
    this.pendingProject = project;
    this.confirmModalType = 'approve';
    this.showConfirmModal = true;
  }

  // ✅ AJOUTÉ — logique déplacée ici
  private doApprove(project: Project): void {
    if (!project.id) return;
    this.approvingProjectId = project.id;

    this.projectsService.approveProject(project.id).subscribe({
      next: () => {
        const updateStatus = () => {
          if (this.selectedProject?.id === project.id) {
            this.selectedProject!.status = ProjectStatus.COMPLETED;
          }
          const p = this.projects.find(p => p.id === project.id);
          if (p) p.status = ProjectStatus.COMPLETED;
          this.applyFilters();
          this.approvingProjectId = undefined;
        };

        const clientEmail = project.client?.email;

        if (clientEmail) {
          this.emailService.sendProjectApprovedEmail(
            project.id!,
            clientEmail,
            project.title
          ).subscribe({
            next: () => {
              updateStatus();
              this.showSuccess('✅ Projet approuvé !', project.title, clientEmail);
            },
            error: () => {
              updateStatus();
              this.showSuccess('✅ Projet approuvé !', project.title, '');
            }
          });
        } else {
          updateStatus();
          this.showSuccess('✅ Projet approuvé !', project.title, '');
        }
      },
      error: (err) => {
        console.error('Error approving:', err);
        this.approvingProjectId = undefined;
      }
    });
  }

  applyFilters(): void {
    let filtered = this.projects;

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

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

  // ✅ MODIFIÉ — ouvre le modal au lieu du confirm()
  deleteProject(project: Project): void {
    this.pendingProject = project;
    this.confirmModalType = 'delete';
    this.showConfirmModal = true;
  }

  // ✅ AJOUTÉ — logique déplacée ici
  private doDelete(project: Project): void {
    if (!project.id) return;
    this.projectsService.deleteProject(project.id).subscribe({
      next: () => {
        if (this.selectedProject?.id === project.id) this.selectedProject = undefined;
        this.loadProjects();
      },
      error: (err) => console.error('Error deleting:', err)
    });
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