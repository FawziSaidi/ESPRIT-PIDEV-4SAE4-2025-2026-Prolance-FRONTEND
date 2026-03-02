import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { Publication } from '../../models/publication.model';
import { Commentaire } from '../../models/commentaire.model';
import { CommentaireService } from '../../services/commentaire.service';
import { AuthService } from '../../../../services/auth.services';
import { UserSearchService, UserSuggestion } from '../../services/user-search.service';

@Component({
  selector: 'app-commentaire-modal',
  templateUrl: './commentaire-modal.component.html',
  styleUrls: ['./commentaire-modal.component.css']
})
export class CommentaireModalComponent implements OnInit {
  @Input() publication!: Publication;
  @Input() currentUserId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() commentCountChanged = new EventEmitter<number>();

  commentaires: Commentaire[] = [];
  newCommentaire: string = '';

  editingCommentaireId: number | null = null;
  editingContent: string = '';

  replyingToId: number | null = null;
  replyContent: string = '';
  replyingToName: string = '';

  loading: boolean = false;
  errorMessage: string = '';

  // AI Moderation
  private readonly GROQ_API_KEY = '';
  moderating: boolean = false;
  moderatingReply: boolean = false;
  moderatingEdit: boolean = false;
  moderationError: string = '';
  moderationReplyError: string = '';
  moderationEditError: string = '';

  showDeleteModal: boolean = false;
  commentaireToDelete: Commentaire | null = null;

  // @Mention
  mentionSuggestions: UserSuggestion[] = [];
  showMentionDropdown: boolean = false;
  mentionQuery: string = '';
  activeMentionField: 'new' | 'reply' | 'edit' | null = null;
  mentionStartIndex: number = -1;
  private mentionDebounce: any = null;
  dropdownPosition: { top: string; left: string; width: string; maxHeight?: string; bottom?: string } = { top: '0px', left: '0px', width: '220px' };

  constructor(
    private commentaireService: CommentaireService,
    private authService: AuthService,
    private userSearchService: UserSearchService,
    private cdr: ChangeDetectorRef   // ✅ AJOUTÉ
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) this.currentUserId = userId;

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

  countTotal(comments: any[]): number {
    return comments.reduce((acc, c) => acc + 1 + this.countTotal(c.replies || []), 0);
  }

  loadAndEmit(): void {
    if (!this.publication?.id) return;
    this.loading = true;
    this.commentaireService.getCommentairesByPublicationId(this.publication.id).subscribe({
      next: (data) => {
        this.commentaires = data;
        this.loading = false;
        this.commentCountChanged.emit(this.countTotal(data));
      },
      error: () => { this.loading = false; }
    });
  }

  loadCommentaires(): void {
    if (!this.publication?.id) { this.errorMessage = 'Missing publication ID'; return; }
    this.loading = true;
    this.errorMessage = '';

    this.commentaireService.getCommentairesByPublicationId(this.publication.id).subscribe({
      next: (data) => { this.commentaires = data; this.loading = false; },
      error: (error) => {
        if (error.status === 0) this.errorMessage = 'Unable to reach the server.';
        else if (error.status === 404) this.errorMessage = 'Publication not found.';
        else this.errorMessage = 'Error loading comments.';
        this.loading = false;
      }
    });
  }

  // ✅ Detect @ and show mention dropdown
  onTextInput(event: Event, field: 'new' | 'reply' | 'edit'): void {
    const textarea = event.target as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) { this.closeMentionDropdown(); return; }

    const queryRaw = textBeforeCursor.substring(atIndex + 1);
    const spaceCount = (queryRaw.match(/ /g) || []).length;

    if (spaceCount > 1) { this.closeMentionDropdown(); return; }

    const query = queryRaw.trim();
    if (spaceCount > 1) { this.closeMentionDropdown(); return; }

    this.activeMentionField = field;
    this.mentionStartIndex = atIndex;
    this.mentionQuery = queryRaw;

    // ✅ Calculer position fixe par rapport au viewport
    const rect = textarea.getBoundingClientRect();
    const dropdownMaxHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    let top: number;
    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      // Ouvrir vers le bas
      top = rect.bottom + 4;
      this.dropdownPosition = {
        top: top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        maxHeight: Math.min(dropdownMaxHeight, spaceBelow) + 'px',
        bottom: 'auto'
      };
    } else {
      // Ouvrir vers le haut
      this.dropdownPosition = {
        top: 'auto',
        bottom: (window.innerHeight - rect.top + 4) + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        maxHeight: Math.min(dropdownMaxHeight, spaceAbove) + 'px'
      };
    }

    clearTimeout(this.mentionDebounce);
    this.mentionDebounce = setTimeout(() => {
      this.userSearchService.searchUsers(query).subscribe({
        next: (users) => {
          this.mentionSuggestions = users.slice(0, 6);
          this.showMentionDropdown = this.mentionSuggestions.length > 0;
          this.cdr.detectChanges(); // ✅ Force Angular à mettre à jour la vue
        },
        error: () => {
          this.showMentionDropdown = false;
          this.cdr.detectChanges();
        }
      });
    }, 200);
  }

  // ✅ Insert selected mention
  selectMention(user: UserSuggestion): void {
    const mention = `@${user.name} ${user.lastName} `;

    const replaceIn = (text: string): string => {
      const before = text.substring(0, this.mentionStartIndex);
      const after = text.substring(this.mentionStartIndex + 1 + this.mentionQuery.length);
      return before + mention + after;
    };

    if (this.activeMentionField === 'new') this.newCommentaire = replaceIn(this.newCommentaire);
    else if (this.activeMentionField === 'reply') this.replyContent = replaceIn(this.replyContent);
    else if (this.activeMentionField === 'edit') this.editingContent = replaceIn(this.editingContent);

    this.closeMentionDropdown();
  }

  closeMentionDropdown(): void {
    this.showMentionDropdown = false;
    this.mentionSuggestions = [];
    this.activeMentionField = null;
    this.mentionStartIndex = -1;
    this.mentionQuery = '';
    clearTimeout(this.mentionDebounce);
  }

  // ✅ Highlight @mentions in displayed text
  parseContent(content: string): string {
    return content.replace(/@([A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)?)/g,
      '<span class="mention-tag">@$1</span>');
  }

  private checkContent(text: string): Promise<boolean> {
    const body = {
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a forum moderator. Analyze this comment and reply ONLY with "SAFE" or "UNSAFE".\nA comment is UNSAFE if it contains: insults, profanity, harassment, hate speech, sexual content, threats, spam, or offensive language.\nComment: "${text}"\nResponse (SAFE or UNSAFE only):`
      }],
      max_tokens: 10,
      temperature: 0
    };

    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.GROQ_API_KEY}` },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        const result = data?.choices?.[0]?.message?.content?.trim().toUpperCase() || '';
        return result.includes('SAFE') && !result.includes('UNSAFE');
      })
      .catch(() => true);
  }

  addCommentaire(): void {
    if (!this.newCommentaire || this.newCommentaire.trim().length < 2) {
      this.moderationError = 'The comment must contain at least 2 characters.'; return;
    }
    if (!this.publication?.id) { this.errorMessage = 'Error: Missing publication ID'; return; }

    this.moderating = true; this.moderationError = '';
    this.checkContent(this.newCommentaire.trim()).then(isSafe => {
      if (!isSafe) { this.moderating = false; this.moderationError = '🚫 Inappropriate content detected. Please rephrase your comment.'; return; }
      this.loading = true; this.moderating = false;
      this.commentaireService.createCommentaire(this.newCommentaire.trim(), this.publication.id, this.currentUserId).subscribe({
        next: () => { this.newCommentaire = ''; this.loadAndEmit(); },
        error: (e) => { this.errorMessage = e.error || 'Error adding the comment'; this.loading = false; }
      });
    });
  }

  startReply(commentaire: Commentaire): void {
    this.cancelEdit();
    this.replyingToId = commentaire.id!;
    this.replyingToName = `${commentaire.user?.name} ${commentaire.user?.lastName}`;
    this.replyContent = `@${this.replyingToName} `;
    this.moderationReplyError = '';
  }

  cancelReply(): void {
    this.replyingToId = null; this.replyContent = ''; this.replyingToName = '';
    this.moderationReplyError = ''; this.closeMentionDropdown();
  }

  submitReply(parentCommentaire: Commentaire): void {
    if (!this.replyContent || this.replyContent.trim().length < 2) { this.moderationReplyError = 'The reply must contain at least 2 characters.'; return; }
    if (!this.publication?.id) return;

    this.moderatingReply = true; this.moderationReplyError = '';
    this.checkContent(this.replyContent.trim()).then(isSafe => {
      if (!isSafe) { this.moderatingReply = false; this.moderationReplyError = '🚫 Inappropriate content detected. Please rephrase your reply.'; return; }
      this.loading = true; this.moderatingReply = false;
      this.commentaireService.replyToCommentaire(this.replyContent.trim(), parentCommentaire.id!, this.publication.id, this.currentUserId).subscribe({
        next: () => { this.cancelReply(); this.loadAndEmit(); },
        error: (e) => { this.errorMessage = e.error || 'Error sending the reply'; this.loading = false; }
      });
    });
  }

  startEdit(commentaire: Commentaire): void {
    if (commentaire.user?.id === this.currentUserId) {
      this.cancelReply();
      this.editingCommentaireId = commentaire.id!;
      this.editingContent = commentaire.contenue;
      this.moderationEditError = '';
    }
  }

  cancelEdit(): void {
    this.editingCommentaireId = null; this.editingContent = '';
    this.moderationEditError = ''; this.closeMentionDropdown();
  }

  saveEdit(commentaire: Commentaire): void {
    if (!this.editingContent || this.editingContent.trim().length < 2) { this.moderationEditError = 'The comment must contain at least 2 characters.'; return; }
    this.moderatingEdit = true; this.moderationEditError = '';
    this.checkContent(this.editingContent.trim()).then(isSafe => {
      if (!isSafe) { this.moderatingEdit = false; this.moderationEditError = '🚫 Inappropriate content detected. Please rephrase your comment.'; return; }
      this.loading = true; this.moderatingEdit = false;
      this.commentaireService.updateCommentaire(commentaire.id!, this.editingContent.trim(), this.currentUserId).subscribe({
        next: () => { this.cancelEdit(); this.loadCommentaires(); },
        error: (e) => { this.errorMessage = e.error || 'Error updating the comment'; this.loading = false; }
      });
    });
  }

  deleteCommentaire(commentaire: Commentaire): void {
    if (commentaire.user?.id !== this.currentUserId) return;
    this.commentaireToDelete = commentaire; this.showDeleteModal = true;
  }

  confirmDeleteCommentaire(): void {
    if (!this.commentaireToDelete) return;
    this.commentaireService.deleteCommentaire(this.commentaireToDelete.id!, this.currentUserId).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.commentaireToDelete = null;
        this.loadAndEmit();
      },
      error: () => { this.showDeleteModal = false; this.commentaireToDelete = null; }
    });
  }

  cancelDeleteCommentaire(): void { this.showDeleteModal = false; this.commentaireToDelete = null; }

  canModifyCommentaire(commentaire: Commentaire): boolean { return commentaire.user?.id === this.currentUserId; }

  // ✅ Vérifie si l'utilisateur actuel est le créateur de la publication
  isPublicationOwner(): boolean {
    return Number(this.publication?.user?.id) === Number(this.currentUserId);
  }

  // ✅ Épingler / désépingler un commentaire
  togglePin(commentaire: Commentaire): void {
    if (!this.isPublicationOwner() || !commentaire.id) return;
    this.commentaireService.togglePin(commentaire.id, this.currentUserId).subscribe({
      next: () => this.loadCommentaires(),
      error: (err) => { console.error('Pin error:', err); }
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date(), d = new Date(date);
    const ms = now.getTime() - d.getTime();
    const mins = Math.floor(ms / 60000), hours = Math.floor(ms / 3600000), days = Math.floor(ms / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  onClose(): void { if (!this.loading) this.close.emit(); }
}