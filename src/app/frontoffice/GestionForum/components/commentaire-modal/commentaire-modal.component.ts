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

  // Edition d'un commentaire existant
  editingCommentaireId: number | null = null;
  editingContent: string = '';

  // ✅ NOUVEAU : état pour les réponses
  replyingToId: number | null = null;   // ID du commentaire auquel on répond
  replyContent: string = '';            // contenu de la réponse en cours de saisie
  replyingToName: string = '';          // nom de l'auteur pour l'affichage

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private commentaireService: CommentaireService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Toujours lire l'ID depuis AuthService (user connecté réel)
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.currentUserId = userId;
    }

    if (!this.publication || !this.publication.id) {
      this.errorMessage = 'Erreur: ID de publication invalide';
      return;
    }
    if (!this.currentUserId) {
      this.errorMessage = 'Erreur: Utilisateur non connecté';
      return;
    }
    this.loadCommentaires();
  }

  loadCommentaires(): void {
    if (!this.publication?.id) {
      this.errorMessage = 'ID de publication manquant';
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
          this.errorMessage = 'Impossible de contacter le serveur.';
        } else if (error.status === 404) {
          this.errorMessage = 'Publication introuvable.';
        } else {
          this.errorMessage = 'Erreur lors du chargement des commentaires.';
        }
        this.loading = false;
      }
    });
  }

  // ─── Commentaire racine ────────────────────────────────────────
  addCommentaire(): void {
    if (!this.newCommentaire || this.newCommentaire.trim().length < 2) {
      this.errorMessage = 'Le commentaire doit contenir au moins 2 caractères';
      return;
    }
    if (!this.publication?.id) {
      this.errorMessage = 'Erreur: ID de publication manquant';
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
        this.errorMessage = error.error || 'Erreur lors de l\'ajout du commentaire';
        this.loading = false;
      }
    });
  }

  // ─── Réponses ─────────────────────────────────────────────────
  startReply(commentaire: Commentaire): void {
    // Annuler l'édition en cours si nécessaire
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
      this.errorMessage = 'La réponse doit contenir au moins 2 caractères';
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
        this.errorMessage = error.error || 'Erreur lors de l\'envoi de la réponse';
        this.loading = false;
      }
    });
  }

  // ─── Edition ──────────────────────────────────────────────────
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
      this.errorMessage = 'Le commentaire doit contenir au moins 2 caractères';
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
        this.errorMessage = error.error || 'Erreur lors de la modification';
        this.loading = false;
      }
    });
  }

  // ─── Suppression ──────────────────────────────────────────────
  deleteCommentaire(commentaire: Commentaire): void {
    if (commentaire.user?.id !== this.currentUserId) {
      alert('Vous n\'êtes pas autorisé à supprimer ce commentaire');
      return;
    }
    if (confirm('Supprimer ce commentaire ?')) {
      this.commentaireService.deleteCommentaire(commentaire.id!, this.currentUserId).subscribe({
        next: () => this.loadCommentaires(),
        error: () => alert('Erreur lors de la suppression')
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────
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

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return commentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  onClose(): void {
    if (!this.loading) this.close.emit();
  }
}