import { Component, OnInit } from '@angular/core';
import { ForumService, Publication, Commentaire, ReactionSummary, UserBlockDTO } from './forum.service';

export type DetailPanel = 'pdfs' | 'images' | 'reactions' | 'comments' | null;

@Component({
  selector: 'app-gestion-forum',
  templateUrl: './gestion-forum.component.html',
  styleUrls: ['./gestion-forum.component.css']
})
export class GestionForumComponent implements OnInit {

  // ── Tabs admin ────────────────────────────────────────────────
  activeTab: 'all' | 'pending' | 'blocked' | 'warned' = 'all';

  // ── Toutes les publications ───────────────────────────────────
  publications: Publication[] = [];
  filteredPublications: Publication[] = [];

  // ── Publications en attente de réactivation ───────────────────
  pendingPublications: Publication[] = [];
  loadingPending = false;

  // ── Utilisateurs bloqués ──────────────────────────────────────
  blockedUsers: UserBlockDTO[] = [];
  loadingBlocked = false;

  // ── Panel détail ──────────────────────────────────────────────
  selectedPublication: Publication | null = null;
  selectedCommentaires: Commentaire[] = [];
  loadingComments = false;
  reactionSummary: ReactionSummary | null = null;
  loadingReactions = false;
  activePanel: DetailPanel = null;

  expandedCards  = new Set<number>();
  expandedReplies = new Set<number>();

  // ── Filtres ───────────────────────────────────────────────────
  searchQuery   = '';
  typeFilter    = 'ALL';
  statutFilter  = 'ALL';
  typeOptions   = ['ALL', 'QUESTION', 'ARTICLE', 'REVIEW'];

  loading = true;
  error   = '';

  readonly PAGE_SIZE = 3;
  currentPage = 1;

  // ── Delete modal ──────────────────────────────────────────────
  showDeleteModal = false;
  pubToDelete: Publication | null = null;

  // ── Toast ─────────────────────────────────────────────────────
  toast = { visible: false, success: true, message: '' };
  private toastTimer: any;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadPendingPublications();
    this.loadBlockedUsers();
  }

  // ── Chargement ────────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.error   = '';
    this.forumService.getAllPublications().subscribe({
      next: (pubs) => {
        this.publications = pubs;
        this.applyFilters();
        this.loading = false;
        this.loadAllCommentCounts();
      },
      error: () => { this.error = 'Error loading publications.'; this.loading = false; }
    });
  }

  loadPendingPublications(): void {
    this.loadingPending = true;
    this.forumService.getPendingPublications().subscribe({
      next:  (pubs) => { this.pendingPublications = pubs; this.loadingPending = false; },
      error: ()     => { this.pendingPublications = [];   this.loadingPending = false; }
    });
  }

  loadBlockedUsers(): void {
    this.loadingBlocked = true;
    this.forumService.getBlockedUsers().subscribe({
      next:  (users) => { this.blockedUsers = users; this.loadingBlocked = false; },
      error: ()      => { this.blockedUsers = [];    this.loadingBlocked = false; }
    });
  }

  loadAllCommentCounts(): void {
    this.publications.forEach(pub => {
      this.forumService.getCommentCountByPublication(pub.id).subscribe({
        next: (count) => {
          pub.commentCount = count;
          const fpub = this.filteredPublications.find(p => p.id === pub.id);
          if (fpub) fpub.commentCount = count;
        },
        error: () => {}
      });
    });
  }

  // ── Navigation tabs ───────────────────────────────────────────

  switchTab(tab: 'all' | 'pending' | 'blocked' | 'warned'): void {
    this.activeTab = tab;
    if (tab === 'pending') this.loadPendingPublications();
    if (tab === 'blocked' || tab === 'warned') this.loadBlockedUsers();
  }

  // ── Filtres ───────────────────────────────────────────────────

  applyFilters(): void {
    let result = this.publications;

    if (this.statutFilter === 'ARCHIVED') {
      result = result.filter(p => p.statut === 'ARCHIVED' || p.statut === 'PENDING');
    } else {
      result = result.filter(p => p.statut === 'ACTIVE');
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => this.getUserLabel(p.user).toLowerCase().includes(q));
    }
    if (this.typeFilter !== 'ALL') {
      result = result.filter(p => p.type === this.typeFilter);
    }

    this.filteredPublications = result;
    this.currentPage = 1;
  }

  onSearchChange(q: string): void { this.searchQuery = q; this.applyFilters(); }
  onTypeChange(type: string): void {
    this.typeFilter = type;
    if (type === 'ALL') this.statutFilter = 'ALL';
    this.applyFilters();
  }
  onStatutChange(statut: string): void {
    this.statutFilter = this.statutFilter === statut ? 'ALL' : statut;
    this.applyFilters();
  }
  clearFilters(): void { this.searchQuery = ''; this.typeFilter = 'ALL'; this.statutFilter = 'ALL'; this.applyFilters(); }

  // ── Pagination ────────────────────────────────────────────────

  get totalPages(): number { return Math.ceil(this.filteredPublications.length / this.PAGE_SIZE); }
  get pagedPublications(): Publication[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredPublications.slice(start, start + this.PAGE_SIZE);
  }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  goToPage(p: number): void { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }

  // ── Expand cards / replies ────────────────────────────────────

  isExpanded(id: number): boolean { return this.expandedCards.has(id); }
  toggleExpand(id: number, event: Event): void {
    event.stopPropagation();
    this.expandedCards.has(id) ? this.expandedCards.delete(id) : this.expandedCards.add(id);
  }
  toggleReplies(commentId: number): void {
    this.expandedReplies.has(commentId) ? this.expandedReplies.delete(commentId) : this.expandedReplies.add(commentId);
  }
  isRepliesExpanded(commentId: number): boolean { return this.expandedReplies.has(commentId); }

  // ── Panel ─────────────────────────────────────────────────────

  openPanel(pub: Publication, panel: DetailPanel, event: Event): void {
    event.stopPropagation();
    if (this.selectedPublication?.id === pub.id && this.activePanel === panel) {
      this.activePanel = null;
      return;
    }
    this.selectedPublication = pub;
    this.activePanel = panel;
    if (panel === 'comments')  this.loadComments(pub);
    if (panel === 'reactions') this.loadReactions(pub);
  }

  closePanel(): void {
    this.selectedPublication = null;
    this.activePanel = null;
    this.expandedReplies.clear();
  }

  loadComments(pub: Publication): void {
    this.loadingComments = true;
    this.selectedCommentaires = [];
    this.expandedReplies.clear();
    this.forumService.getCommentairesByPublication(pub.id).subscribe({
      next: (comments) => {
        this.selectedCommentaires = comments.filter(c => !c.parent || !c.parent.id);
        pub.commentCount = this.countTotal(comments);
        const fpub = this.filteredPublications.find(p => p.id === pub.id);
        if (fpub) fpub.commentCount = pub.commentCount;
        this.loadingComments = false;
      },
      error: () => { this.loadingComments = false; }
    });
  }

  countTotal(comments: Commentaire[]): number {
    return comments.reduce((acc, c) => acc + 1 + this.countTotal(c.replies || []), 0);
  }
  get totalCommentsDisplayed(): number { return this.countTotal(this.selectedCommentaires); }

  loadReactions(pub: Publication): void {
    this.loadingReactions = true;
    this.forumService.getReactionSummary(pub.id).subscribe({
      next:  (s) => { this.reactionSummary = s; this.loadingReactions = false; },
      error: ()  => {
        this.reactionSummary = { LIKE: 0, DISLIKE: 0, HEART: 0, userReaction: null, reactors: [] };
        this.loadingReactions = false;
      }
    });
  }

  // ── Décisions admin : réactivation publication ────────────────

  accepterReactivation(pub: Publication): void {
    this.forumService.accepterReactivation(pub.id).subscribe({
      next: () => {
        this.pendingPublications = this.pendingPublications.filter(p => p.id !== pub.id);
        const idx = this.publications.findIndex(p => p.id === pub.id);
        if (idx >= 0) this.publications[idx].statut = 'ACTIVE';
        this.applyFilters();
        this.showToast(true, `"${pub.titre}" has been reactivated.`);
      },
      error: () => this.showToast(false, 'Error accepting reactivation.')
    });
  }

  refuserReactivation(pub: Publication): void {
    this.forumService.refuserReactivation(pub.id).subscribe({
      next: () => {
        this.pendingPublications = this.pendingPublications.filter(p => p.id !== pub.id);
        const idx = this.publications.findIndex(p => p.id === pub.id);
        if (idx >= 0) this.publications[idx].statut = 'ARCHIVED';
        this.applyFilters();
        this.showToast(true, `Reactivation refused for "${pub.titre}".`);
      },
      error: () => this.showToast(false, 'Error refusing reactivation.')
    });
  }

  // ── Réactivation compte utilisateur (admin) ───────────────────

  reactiverCompteUser(user: UserBlockDTO): void {
    this.forumService.reactiverCompteUser(user.userId).subscribe({
      next: () => {
        // ✅ Reset warning counter & unblock — posts stay ARCHIVED/PENDING untouched
        const idx = this.blockedUsers.findIndex(u => u.userId === user.userId);
        if (idx >= 0) {
          this.blockedUsers[idx].warningCount = 0;
          this.blockedUsers[idx].blocked = false;
        }
        // Reload publications — archived posts must remain archived
        this.loadData();
        this.showToast(true, `Account of ${user.name} ${user.lastName} reactivated. Warning counter reset to 0. Archived posts remain archived.`);
      },
      error: () => this.showToast(false, `Error reactivating account of ${user.name} ${user.lastName}.`)
    });
  }

  // ── Suppression ───────────────────────────────────────────────

  askDelete(pub: Publication, event: Event): void {
    event.stopPropagation();
    this.pubToDelete    = pub;
    this.showDeleteModal = true;
  }
  cancelDelete(): void { this.showDeleteModal = false; this.pubToDelete = null; }
  confirmDelete(): void {
    if (!this.pubToDelete) return;
    const pub = this.pubToDelete;
    this.showDeleteModal = false;
    this.pubToDelete    = null;
    this.forumService.adminDeletePublication(pub.id).subscribe({
      next: () => {
        if (this.selectedPublication?.id === pub.id) this.closePanel();
        this.pendingPublications = this.pendingPublications.filter(p => p.id !== pub.id);
        this.loadData();
        this.showToast(true, `"${pub.titre}" deleted successfully.`);
      },
      error: () => this.showToast(false, `Failed to delete "${pub.titre}".`)
    });
  }

  // ── Toast ─────────────────────────────────────────────────────

  showToast(success: boolean, message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, success, message };
    this.toastTimer = setTimeout(() => this.toast = { ...this.toast, visible: false }, 4000);
  }
  closeToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { ...this.toast, visible: false };
  }

  // ── Helpers ───────────────────────────────────────────────────

  get totalReactions(): number {
    if (!this.reactionSummary) return 0;
    return (this.reactionSummary.LIKE || 0) + (this.reactionSummary.DISLIKE || 0) + (this.reactionSummary.HEART || 0);
  }

  getCountByType(type: string): number {
    return this.publications.filter(p => p.type === type && p.statut === 'ACTIVE').length;
  }
  getCountByStatut(statut: string): number {
    if (statut === 'ARCHIVED') {
      return this.publications.filter(p => p.statut === 'ARCHIVED' || p.statut === 'PENDING').length;
    }
    return this.publications.filter(p => p.statut === statut).length;
  }
  get activePublicationsCount(): number {
    return this.publications.filter(p => p.statut === 'ACTIVE').length;
  }
  pct(type: string): string {
    const activeCount = this.activePublicationsCount;
    return activeCount > 0 ? ((this.getCountByType(type) / activeCount) * 100).toFixed(0) : '0';
  }

  /** Nombre d'utilisateurs actuellement bloqués */
  get blockedUsersCount(): number {
    return this.blockedUsers.filter(u => u.blocked).length;
  }

  /** Utilisateurs avertis : somme des warningCount de leurs publications (total 1 ou 2), non bloqués */
  get warnedUsersFromPublications(): { userId: number; name: string; lastName: string; warningCount: number; posts: Publication[] }[] {
    const map = new Map<number, { userId: number; name: string; lastName: string; warningCount: number; posts: Publication[] }>();

    for (const pub of this.publications) {
      const u = pub.user;
      if (!u) continue;
      const pubWarning = pub.warningCount ?? 0;
      if (pubWarning === 0) continue;

      // Exclure les utilisateurs bloqués (ils ont leur propre tab)
      const isBlocked = this.blockedUsers.some(b => b.userId === u.id && b.blocked);
      if (isBlocked) continue;

      if (!map.has(u.id)) {
        map.set(u.id, { userId: u.id, name: u.name, lastName: u.lastName, warningCount: 0, posts: [] });
      }
      const entry = map.get(u.id)!;
      entry.warningCount += pubWarning;
      entry.posts.push(pub);
    }

    // Ne garder que les users dont le total warningCount est 1 ou 2
    return Array.from(map.values()).filter(u => u.warningCount === 1 || u.warningCount === 2);
  }

  /** Nombre d'utilisateurs avec warningCount total 1 ou 2 (non bloqués) */
  get warnedUsersCount(): number {
    return this.warnedUsersFromPublications.length;
  }

  getWarningLevel(count: number): string {
    if (count >= 3) return 'blocked';
    if (count === 2) return 'warning';
    return 'ok';
  }

  getWarningLabel(user: UserBlockDTO): string {
    if (user.blocked) return '🔴 Blocked';
    if (user.warningCount === 2) return '🟠 2/3 warnings';
    if (user.warningCount === 1) return '🟡 1/3 warnings';
    return '🟢 Active';
  }

  getTypeIcon(type: string): string  { return ({ QUESTION: '❓', ARTICLE: '📰', REVIEW: '⭐' } as any)[type] || '📝'; }
  getTypeColor(type: string): string { return ({ QUESTION: '#3b82f6', ARTICLE: '#a855f7', REVIEW: '#f59e0b' } as any)[type] || '#6b7280'; }
  getTypeBg(type: string): string    { return ({ QUESTION: 'rgba(59,130,246,0.14)', ARTICLE: 'rgba(168,85,247,0.14)', REVIEW: 'rgba(245,158,11,0.14)' } as any)[type] || 'rgba(107,114,128,0.14)'; }
  getPdfUrl(pdf: string): string     { return `http://localhost:8222/uploads/publications/${pdf}`; }
  getImageUrl(img: string): string   { return `http://localhost:8222/uploads/publications/${img}`; }
  getPdfName(pdf: string): string    { const idx = pdf.indexOf('_'); return idx >= 0 ? pdf.substring(idx + 1) : pdf; }
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