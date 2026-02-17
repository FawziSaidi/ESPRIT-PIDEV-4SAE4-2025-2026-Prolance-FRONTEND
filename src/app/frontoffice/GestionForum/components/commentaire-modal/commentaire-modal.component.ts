import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { Commentaire } from '../../models/commentaire.model';
import { CommentaireService } from '../../services/commentaire.service';
import { AuthService } from '../../../../services/auth.services';

@Component({
  selector: 'app-commentaire-modal',
  templateUrl: './commentaire-modal.component.html',
  styleUrls: ['./commentaire-modal.component.css']
})
export class CommentaireModalComponent implements OnInit {
  @Input() publication!: Publication;
  @Input() currentUserId!: number;
  @Output() close = new EventEmitter<void>();

  commentaires: Commentaire[] = [];
  newCommentaire: string = '';

  // Editing an existing comment
  editingCommentaireId: number | null = null;
  editingContent: string = '';

  // ✅ State for replies
  replyingToId: number | null = null;   // ID of the comment being replied to
  replyContent: string = '';            // content of the reply being typed
  replyingToName: string = '';          // author name for display

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private commentaireService: CommentaireService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Always read the ID from AuthService (actual logged-in user)
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.currentUserId = userId;
    }

    if (!this.publication || !this.publication.id) {
      this.errorMessage = 'Error: Invalid publication ID';
      return;
    }
    if (!this.currentUserId) {
      this.errorMessage = 'Error: User not logged in';
      return;
    }
    this.loadCommentaires();
  }

  loadCommentaires(): void {
    if (!this.publication?.id) {
      this.errorMessage = 'Missing publication ID';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.commentaireService.getCommentairesByPublicationId(this.publication.id).subscribe({
      next: (data) => {
        this.commentaires = data;
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.errorMessage = 'Unable to reach the server.';
        } else if (error.status === 404) {
          this.errorMessage = 'Publication not found.';
        } else {
          this.errorMessage = 'Error loading comments.';
        }
        this.loading = false;
      }
    });
  }

  // ─── Root comment ────────────────────────────────────────────
  addCommentaire(): void {
    if (!this.newCommentaire || this.newCommentaire.trim().length < 2) {
      this.errorMessage = 'The comment must contain at least 2 characters';
      return;
    }
    if (!this.publication?.id) {
      this.errorMessage = 'Error: Missing publication ID';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.commentaireService.createCommentaire(
      this.newCommentaire.trim(),
      this.publication.id,
      this.currentUserId
    ).subscribe({
      next: () => {
        this.newCommentaire = '';
        this.loadCommentaires();
      },
      error: (error) => {
        this.errorMessage = error.error || 'Error adding the comment';
        this.loading = false;
      }
    });
  }

  // ─── Replies ─────────────────────────────────────────────────
  startReply(commentaire: Commentaire): void {
    // Cancel any ongoing edit if necessary
    this.cancelEdit();
    this.replyingToId = commentaire.id!;
    this.replyingToName = `${commentaire.user?.name} ${commentaire.user?.lastName}`;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyContent = '';
    this.replyingToName = '';
  }

  submitReply(parentCommentaire: Commentaire): void {
    if (!this.replyContent || this.replyContent.trim().length < 2) {
      this.errorMessage = 'The reply must contain at least 2 characters';
      return;
    }
    if (!this.publication?.id) return;

    this.loading = true;
    this.errorMessage = '';

    this.commentaireService.replyToCommentaire(
      this.replyContent.trim(),
      parentCommentaire.id!,
      this.publication.id,
      this.currentUserId
    ).subscribe({
      next: () => {
        this.cancelReply();
        this.loadCommentaires();
      },
      error: (error) => {
        this.errorMessage = error.error || 'Error sending the reply';
        this.loading = false;
      }
    });
  }

  // ─── Edit ────────────────────────────────────────────────────
  startEdit(commentaire: Commentaire): void {
    if (commentaire.user?.id === this.currentUserId) {
      this.cancelReply();
      this.editingCommentaireId = commentaire.id!;
      this.editingContent = commentaire.contenue;
    }
  }

  cancelEdit(): void {
    this.editingCommentaireId = null;
    this.editingContent = '';
  }

  saveEdit(commentaire: Commentaire): void {
    if (!this.editingContent || this.editingContent.trim().length < 2) {
      this.errorMessage = 'The comment must contain at least 2 characters';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.commentaireService.updateCommentaire(
      commentaire.id!,
      this.editingContent.trim(),
      this.currentUserId
    ).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadCommentaires();
      },
      error: (error) => {
        this.errorMessage = error.error || 'Error updating the comment';
        this.loading = false;
      }
    });
  }

  // ─── Delete ──────────────────────────────────────────────────
  deleteCommentaire(commentaire: Commentaire): void {
    if (commentaire.user?.id !== this.currentUserId) {
      alert('You are not authorized to delete this comment');
      return;
    }
    if (confirm('Delete this comment?')) {
      this.commentaireService.deleteCommentaire(commentaire.id!, this.currentUserId).subscribe({
        next: () => this.loadCommentaires(),
        error: () => alert('Error deleting the comment')
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────
  canModifyCommentaire(commentaire: Commentaire): boolean {
    return commentaire.user?.id === this.currentUserId;
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return commentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  onClose(): void {
    if (!this.loading) this.close.emit();
  }
}