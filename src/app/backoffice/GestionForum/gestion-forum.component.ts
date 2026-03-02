import { Component, OnInit } from '@angular/core';
import { ForumService, Publication, Commentaire, ReactionSummary } from './forum.service';

export type DetailPanel = 'pdfs' | 'images' | 'reactions' | 'comments' | null;

@Component({
  selector: 'app-gestion-forum',
  templateUrl: './gestion-forum.component.html',
  styleUrls: ['./gestion-forum.component.css']
})
export class GestionForumComponent implements OnInit {

  // Data
  publications: Publication[] = [];
  filteredPublications: Publication[] = [];
  selectedPublication: Publication | null = null;
  selectedCommentaires: Commentaire[] = [];
  loadingComments = false;
  reactionSummary: ReactionSummary | null = null;
  loadingReactions = false;

  // Which panel is open in the right sidebar
  activePanel: DetailPanel = null;

  // Expanded "see more" per card
  expandedCards = new Set<number>();

  // Filters
  searchQuery = '';
  typeFilter = 'ALL';
  typeOptions = ['ALL', 'QUESTION', 'ARTICLE', 'REVIEW'];

  // State
  loading = true;
  error = '';

  // Pagination
  readonly PAGE_SIZE = 3;
  currentPage = 1;

  // Modal
  showDeleteModal = false;
  pubToDelete: Publication | null = null;

  // Toast
  toast = { visible: false, success: true, message: '' };
  private toastTimer: any;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void { this.loadData(); }

  // ── DATA ──────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.forumService.getAllPublications().subscribe({
      next: (pubs) => {
        this.publications = pubs;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.error = 'Error loading publications.'; this.loading = false; }
    });
  }

  applyFilters(): void {
    let result = this.publications;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        this.getUserLabel(p.user).toLowerCase().includes(q)
      );
    }
    if (this.typeFilter !== 'ALL') {
      result = result.filter(p => p.type === this.typeFilter);
    }
    this.filteredPublications = result;
    this.currentPage = 1;
  }

  onSearchChange(q: string): void { this.searchQuery = q; this.applyFilters(); }
  onTypeChange(type: string): void { this.typeFilter = type; this.applyFilters(); }

  clearFilters(): void {
    this.searchQuery = '';
    this.typeFilter = 'ALL';
    this.applyFilters();
  }

  // ── PAGINATION ────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.filteredPublications.length / this.PAGE_SIZE);
  }

  get pagedPublications(): Publication[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredPublications.slice(start, start + this.PAGE_SIZE);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ── EXPAND (see more/less) ────────────────────────────

  isExpanded(id: number): boolean { return this.expandedCards.has(id); }
  toggleExpand(id: number, event: Event): void {
    event.stopPropagation();
    this.expandedCards.has(id) ? this.expandedCards.delete(id) : this.expandedCards.add(id);
  }

  // ── PANEL OPENING ─────────────────────────────────────

  openPanel(pub: Publication, panel: DetailPanel, event: Event): void {
    event.stopPropagation();
    if (this.selectedPublication?.id === pub.id && this.activePanel === panel) {
      // Toggle off same panel
      this.activePanel = null;
      return;
    }
    this.selectedPublication = pub;
    this.activePanel = panel;

    if (panel === 'comments') this.loadComments(pub);
    if (panel === 'reactions') this.loadReactions(pub);
  }

  closePanel(): void {
    this.selectedPublication = null;
    this.activePanel = null;
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

  loadReactions(pub: Publication): void {
    this.loadingReactions = true;
    this.forumService.getReactionSummary(pub.id).subscribe({
      next: (s) => { this.reactionSummary = s; this.loadingReactions = false; },
      error: () => {
        this.reactionSummary = { LIKE: 0, DISLIKE: 0, HEART: 0, userReaction: null, reactors: [] };
        this.loadingReactions = false;
      }
    });
  }

  // ── DELETE ────────────────────────────────────────────

  askDelete(pub: Publication, event: Event): void {
    event.stopPropagation();
    this.pubToDelete = pub;
    this.showDeleteModal = true;
  }

  cancelDelete(): void { this.showDeleteModal = false; this.pubToDelete = null; }

  confirmDelete(): void {
    if (!this.pubToDelete) return;
    const pub = this.pubToDelete;
    this.showDeleteModal = false;
    this.pubToDelete = null;
    this.forumService.adminDeletePublication(pub.id).subscribe({
      next: () => {
        if (this.selectedPublication?.id === pub.id) this.closePanel();
        this.loadData();
        this.showToast(true, `"${pub.titre}" deleted successfully.`);
      },
      error: () => { this.showToast(false, `Failed to delete "${pub.titre}". Please try again.`); }
    });
  }

  // ── TOAST ─────────────────────────────────────────────

  showToast(success: boolean, message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, success, message };
    this.toastTimer = setTimeout(() => this.toast = { ...this.toast, visible: false }, 4000);
  }

  closeToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { ...this.toast, visible: false };
  }

  // ── HELPERS ───────────────────────────────────────────

  get totalReactions(): number {
    if (!this.reactionSummary) return 0;
    return (this.reactionSummary.LIKE || 0) + (this.reactionSummary.DISLIKE || 0) + (this.reactionSummary.HEART || 0);
  }

  getCountByType(type: string): number { return this.publications.filter(p => p.type === type).length; }

  getTypeIcon(type: string): string {
    return ({ QUESTION: '❓', ARTICLE: '📰', REVIEW: '⭐' } as any)[type] || '📝';
  }

  getTypeColor(type: string): string {
    return ({ QUESTION: '#3b82f6', ARTICLE: '#a855f7', REVIEW: '#f59e0b' } as any)[type] || '#6b7280';
  }

  getTypeBg(type: string): string {
    return ({ QUESTION: 'rgba(59,130,246,0.14)', ARTICLE: 'rgba(168,85,247,0.14)', REVIEW: 'rgba(245,158,11,0.14)' } as any)[type] || 'rgba(107,114,128,0.14)';
  }

  getPdfUrl(pdf: string): string { return `http://localhost:8222/uploads/publications/${pdf}`; }
  getImageUrl(img: string): string { return `http://localhost:8222/uploads/publications/${img}`; }

  getPdfName(pdf: string): string {
    const idx = pdf.indexOf('_');
    return idx >= 0 ? pdf.substring(idx + 1) : pdf;
  }

  getUserLabel(user: any): string {
    if (!user) return 'N/A';
    const full = [user.name, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.email || 'N/A';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(user: any): string {
    if (!user) return '?';
    return [(user.name || '').charAt(0), (user.lastName || '').charAt(0)].join('').toUpperCase() || '?';
  }
}