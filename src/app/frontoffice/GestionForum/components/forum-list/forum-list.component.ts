import { Component, OnInit, HostListener } from '@angular/core';
import { Publication, TypePublication } from '../../models/publication.model';
import { PublicationService } from '../../services/publication.service';
import { AuthService } from '../../../../services/auth.services';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  styleUrls: ['./forum-list.component.css']
})
export class ForumListComponent implements OnInit {
  publications: Publication[] = [];
  filteredPublications: Publication[] = [];
  selectedType: string = 'TOUS';
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showCommentModal: boolean = false;
  selectedPublication: Publication | null = null;
  currentUserId: number = 0;
  loading: boolean = false;
  errorMessage: string = '';
  activeMenuId: number | null = null;

  // ✅ Recherche en temps réel par nom d'auteur
  searchQuery: string = '';

  typeOptions = [
    { value: 'TOUS', label: 'All' },
    { value: 'QUESTION', label: 'Questions' },
    { value: 'ARTICLE', label: 'Articles' },
    { value: 'REVIEW', label: 'Reviews' }
  ];

  constructor(
    private publicationService: PublicationService,
    private authService: AuthService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-right')) {
      this.activeMenuId = null;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.userId ?? 0;
    });
    const userId = this.authService.getCurrentUserId();
    if (userId) this.currentUserId = userId;
    this.loadPublications();
  }

  loadPublications(): void {
    this.loading = true;
    this.errorMessage = '';
    this.publicationService.getAllPublications().subscribe({
      next: (data) => {
        this.publications = data;
        this.filterPublications();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading posts';
        this.loading = false;
      }
    });
  }

  filterPublications(): void {
    let result = this.publications;

    // Filtre par onglet
    if (this.selectedType === 'MYPOSTS') {
      result = result.filter(pub => pub.user?.id === this.currentUserId);
    } else if (this.selectedType !== 'TOUS') {
      result = result.filter(pub => pub.type === this.selectedType);
    }

    // ✅ Filtre en temps réel par nom d'auteur
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(pub => {
        const fullName = `${pub.user?.name ?? ''} ${pub.user?.lastName ?? ''}`.toLowerCase();
        return fullName.includes(q);
      });
    }

    this.filteredPublications = result;
  }

  onTypeChange(type: string): void {
    this.selectedType = type;
    this.filterPublications();
  }

  // ✅ Appelé à chaque frappe dans la barre de recherche
  onSearchChange(): void {
    this.filterPublications();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterPublications();
  }

  openAddModal(): void { this.showAddModal = true; }
  closeAddModal(): void { this.showAddModal = false; }

  openEditModal(publication: Publication): void {
    if (publication.user?.id === this.currentUserId) {
      this.selectedPublication = publication;
      this.showEditModal = true;
    }
  }
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPublication = null;
  }

  openCommentModal(publication: Publication): void {
    this.selectedPublication = publication;
    this.showCommentModal = true;
  }
  closeCommentModal(): void {
    this.showCommentModal = false;
    this.selectedPublication = null;
  }

  onPublicationCreated(): void { this.closeAddModal(); this.loadPublications(); }
  onPublicationUpdated(): void { this.closeEditModal(); this.loadPublications(); }

  deletePublication(publication: Publication): void {
    if (publication.user?.id !== this.currentUserId) {
      alert('You are not authorized to delete this post');
      return;
    }
    if (confirm('Are you sure you want to delete this post?')) {
      this.publicationService.deletePublication(publication.id!, this.currentUserId).subscribe({
        next: () => this.loadPublications(),
        error: () => alert('Error deleting post')
      });
    }
  }

  canModifyPublication(publication: Publication): boolean {
    return publication.user?.id === this.currentUserId;
  }

  toggleActionMenu(publicationId: number): void {
    this.activeMenuId = this.activeMenuId === publicationId ? null : publicationId;
  }
  closeActionMenu(): void { this.activeMenuId = null; }

  getTimeAgo(date: string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = { QUESTION: 'Question', ARTICLE: 'Article', REVIEW: 'Review' };
    return map[type] ?? type;
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = { QUESTION: '❓', ARTICLE: '📝', REVIEW: '⭐' };
    return map[type] ?? '📄';
  }

  getImageUrl(imageName: string): string {
    return `http://localhost:8089/pidev/uploads/publications/${imageName}`;
  }

  getPdfUrl(pdfName: string): string {
    return `http://localhost:8089/pidev/uploads/publications/${pdfName}`;
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // ✅ Surligne la partie du nom qui correspond à la recherche
  highlightName(fullName: string): string {
    const q = this.searchQuery.trim();
    if (!q) return fullName;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return fullName.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
}