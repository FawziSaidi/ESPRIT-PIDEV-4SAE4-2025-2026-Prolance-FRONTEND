import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { Commentaire } from '../../models/commentaire.model';
import { CommentaireService } from '../../services/commentaire.service';

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
  editingCommentaireId: number | null = null;
  editingContent: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private commentaireService: CommentaireService) {}

  ngOnInit(): void {
    // Validation de l'ID de publication avant de charger
    if (!this.publication || !this.publication.id) {
      this.errorMessage = 'Erreur: ID de publication invalide';
      this.loading = false;
      console.error('Publication ou publication.id est manquant:', this.publication);
      return;
    }
    
    // Validation de l'utilisateur connecté
    if (!this.currentUserId) {
      this.errorMessage = 'Erreur: Utilisateur non connecté';
      this.loading = false;
      console.error('currentUserId est manquant:', this.currentUserId);
      return;
    }
    
    this.loadCommentaires();
  }

  loadCommentaires(): void {
    // Double vérification de l'ID
    if (!this.publication?.id) {
      this.errorMessage = 'ID de publication manquant';
      this.loading = false;
      console.error('Impossible de charger les commentaires: publication.id est manquant');
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
        console.error('Error loading comments:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        // More specific error messages based on error type
        if (error.status === 0) {
          this.errorMessage = 'Unable to contact backend server. Check if backend is running.';
        } else if (error.status === 404) {
          this.errorMessage = 'Post not found';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Check database and backend logs.';
        } else {
          this.errorMessage = 'Error loading comments';
        }
        
        this.loading = false;
      }
    });
  }

  addCommentaire(): void {
    if (!this.newCommentaire || this.newCommentaire.trim().length === 0) {
      this.errorMessage = 'Comment cannot be empty';
      return;
    }

    if (this.newCommentaire.trim().length < 2) {
      this.errorMessage = 'Comment must be at least 2 characters';
      return;
    }

    // Check ID before adding
    if (!this.publication?.id) {
      this.errorMessage = 'Error: Missing post ID';
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
        console.error('Error adding comment:', error);
        this.errorMessage = error.error || 'Error adding comment';
        this.loading = false;
      }
    });
  }

  startEdit(commentaire: Commentaire): void {
    if (commentaire.user?.id === this.currentUserId) {
      this.editingCommentaireId = commentaire.id!;
      this.editingContent = commentaire.contenue;
    }
  }

  cancelEdit(): void {
    this.editingCommentaireId = null;
    this.editingContent = '';
  }

  saveEdit(commentaire: Commentaire): void {
    if (!this.editingContent || this.editingContent.trim().length === 0) {
      this.errorMessage = 'Comment cannot be empty';
      return;
    }

    if (this.editingContent.trim().length < 2) {
      this.errorMessage = 'Comment must be at least 2 characters';
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
        this.editingCommentaireId = null;
        this.editingContent = '';
        this.loadCommentaires();
      },
      error: (error) => {
        console.error('Update error:', error);
        this.errorMessage = error.error || 'Error updating comment';
        this.loading = false;
      }
    });
  }

  deleteCommentaire(commentaire: Commentaire): void {
    if (commentaire.user?.id !== this.currentUserId) {
      alert('You are not authorized to delete this comment');
      return;
    }

    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentaireService.deleteCommentaire(commentaire.id!, this.currentUserId).subscribe({
        next: () => {
          this.loadCommentaires();
        },
        error: (error) => {
          console.error('Delete error:', error);
          alert('Error deleting comment');
        }
      });
    }
  }

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
    
    return commentDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }
}