import { Component, OnInit } from '@angular/core';
import { ForumService, Publication, Commentaire } from './forum.service';

@Component({
  selector: 'app-gestion-forum',
  templateUrl: './gestion-forum.component.html',
  styleUrls: ['./gestion-forum.component.css']
})
export class GestionForumComponent implements OnInit {

  // Publications
  publications: Publication[] = [];
  filteredPublications: Publication[] = [];
  selectedPublication: Publication | null = null;

  // Commentaires for selected pub
  selectedCommentaires: Commentaire[] = [];
  loadingComments: boolean = false;

  // All commentaires (for table 2 view)
  allCommentaires: Commentaire[] = [];

  // Filters
  searchQuery: string = '';
  typeFilter: string = 'ALL';
  typeOptions: string[] = ['ALL', 'QUESTION', 'ARTICLE', 'REVIEW'];

  // Active tab in right panel
  activeTab: 'comments' | 'details' = 'details';

  loading: boolean = true;
  error: string = '';

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.forumService.getAllPublications().subscribe({
      next: (pubs) => {
        this.publications = pubs;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading publications.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = this.publications;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.titre.toLowerCase().includes(q) ||
        this.getUserLabel(p.user).toLowerCase().includes(q)
      );
    }
    if (this.typeFilter !== 'ALL') {
      result = result.filter(p => p.type === this.typeFilter);
    }
    this.filteredPublications = result;
  }

  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.applyFilters();
  }

  onTypeChange(type: string): void {
    this.typeFilter = type;
    this.applyFilters();
  }

  selectPublication(pub: Publication): void {
    this.selectedPublication = pub;
    this.activeTab = 'details';
    this.loadComments(pub);
  }

  loadComments(pub: Publication): void {
    this.loadingComments = true;
    this.selectedCommentaires = [];
    this.forumService.getAllCommentaires().subscribe({
      next: (coms) => {
        this.selectedCommentaires = coms.filter(c => c.publication?.id === pub.id);
        this.loadingComments = false;
      },
      error: () => { this.loadingComments = false; }
    });
  }

  closePublication(): void {
    this.selectedPublication = null;
    this.selectedCommentaires = [];
  }

  deletePublication(pub: Publication): void {
    if (confirm(`Delete publication "${pub.titre}"?`)) {
      // Admin delete — pass userId 0 or handle server-side
      this.forumService.adminDeletePublication(pub.id).subscribe({
        next: () => {
          this.closePublication();
          this.loadData();
        },
        error: () => alert('Error deleting publication.')
      });
    }
  }

  getCountByType(type: string): number {
    return this.publications.filter(p => p.type === type).length;
  }

  getTypeIcon(type: string): string {
    return { 'QUESTION': '❓', 'ARTICLE': '📰', 'REVIEW': '⭐' }[type] || '📝';
  }

  getTypeColor(type: string): string {
    return { 'QUESTION': '#f59e0b', 'ARTICLE': '#3b82f6', 'REVIEW': '#10b981' }[type] || '#6b7280';
  }

  getUserLabel(user: { name?: string; lastName?: string; email?: string } | null | undefined): string {
    if (!user) return 'N/A';
    const full = [user.name, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.email || 'N/A';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(user: { name?: string; lastName?: string } | null | undefined): string {
    if (!user) return '?';
    return [(user.name || '').charAt(0), (user.lastName || '').charAt(0)].join('').toUpperCase() || '?';
  }
}