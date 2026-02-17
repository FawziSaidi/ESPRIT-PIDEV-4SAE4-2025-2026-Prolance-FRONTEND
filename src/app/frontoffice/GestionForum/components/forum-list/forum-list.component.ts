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
  currentUserId: number = 0; // ✅ Initialisé à 0, sera rempli depuis AuthService
  loading: boolean = false;
  errorMessage: string = '';
  activeMenuId: number | null = null;

  typeOptions = [
    { value: 'TOUS', label: 'All' },
    { value: 'QUESTION', label: 'Questions' },
    { value: 'ARTICLE', label: 'Articles' },
    { value: 'REVIEW', label: 'Reviews' }
  ];

  constructor(
    private publicationService: PublicationService,
    private authService: AuthService  // ✅ Injection de AuthService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-right')) {
      this.activeMenuId = null;
    }
  }

  ngOnInit(): void {
    // ✅ Récupérer l'ID de l'utilisateur connecté depuis le service d'authentification
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.currentUserId = userId;
    } else {
      // Fallback : lire depuis localStorage (compatibilité)
      const stored = localStorage.getItem('userId');
      if (stored) {
        this.currentUserId = parseInt(stored, 10);
      }
    }
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
      error: (error) => {
        console.error('Error loading posts:', error);
        this.errorMessage = 'Error loading posts';
        this.loading = false;
      }
    });
  }

  filterPublications(): void {
    if (this.selectedType === 'TOUS') {
      this.filteredPublications = this.publications;
    } else if (this.selectedType === 'MYPOSTS') {
      // ✅ Filtrer uniquement les publications de l'utilisateur connecté
      this.filteredPublications = this.publications.filter(
        pub => pub.user?.id === this.currentUserId
      );
    } else {
      this.filteredPublications = this.publications.filter(
        pub => pub.type === this.selectedType
      );
    }
  }

  onTypeChange(type: string): void {
    this.selectedType = type;
    this.filterPublications();
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

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

  onPublicationCreated(): void {
    this.closeAddModal();
    this.loadPublications();
  }

  onPublicationUpdated(): void {
    this.closeEditModal();
    this.loadPublications();
  }
  

  deletePublication(publication: Publication): void {
    if (publication.user?.id !== this.currentUserId) {
      alert('You are not authorized to delete this post');
      return;
    }

    if (confirm('Are you sure you want to delete this post?')) {
      this.publicationService.deletePublication(publication.id!, this.currentUserId).subscribe({
        next: () => {
          this.loadPublications();
        },
        error: (error) => {
          console.error('Delete error:', error);
          alert('Error deleting post');
        }
      });
    }
  }

  canModifyPublication(publication: Publication): boolean {
    return publication.user?.id === this.currentUserId;
  }

  toggleActionMenu(publicationId: number): void {
    if (this.activeMenuId === publicationId) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = publicationId;
    }
  }

  closeActionMenu(): void {
    this.activeMenuId = null;
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const publicationDate = new Date(date);
    const diffMs = now.getTime() - publicationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return publicationDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'QUESTION': return 'Question';
      case 'ARTICLE': return 'Article';
      case 'REVIEW': return 'Review';
      default: return type;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'QUESTION': return '❓';
      case 'ARTICLE': return '📝';
      case 'REVIEW': return '⭐';
      default: return '📄';
    }
  }

  getImageUrl(imageName: string): string {
    // Le nom de l'image peut avoir des underscores ou des tirets
    // On essaie d'abord avec le nom tel quel
    return `http://localhost:8089/pidev/uploads/publications/${imageName}`;
  }

  onImageError(event: any): void {
    // Si l'image ne charge pas, on peut essayer un fallback ou cacher l'élément
    console.error('Erreur de chargement de l\'image:', event.target.src);
    // Option 1: Cacher l'image
    event.target.style.display = 'none';
    
    // Option 2: Afficher une image de placeholder
    // event.target.src = 'assets/img/placeholder.png';
  }
}