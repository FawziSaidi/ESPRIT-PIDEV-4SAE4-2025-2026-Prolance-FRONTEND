import { Component, OnInit } from '@angular/core';
import { ForumService, Publication, Commentaire } from './forum.service';

interface PubRow {
  username: string;
  titre: string;
  createAt: string;
  nbCommentaires: number;
}

interface ComRow {
  username: string;
  contenue: string;
  createAt: string;
  publicationTitre: string;
}

@Component({
  selector: 'app-gestion-forum',
  templateUrl: './gestion-forum.component.html',
  styleUrls: ['./gestion-forum.component.css']
})
export class GestionForumComponent implements OnInit {

  searchUsername: string = '';

  totalPublications: number = 0;
  countQuestion: number = 0;
  countArticle: number = 0;
  countReview: number = 0;

  allPubRows: PubRow[] = [];
  allComRows: ComRow[] = [];

  filteredPubRows: PubRow[] = [];
  filteredComRows: ComRow[] = [];

  loading: boolean = true;
  error: string = '';

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadData();
  }

  getUserLabel(user: { name?: string; lastName?: string; email?: string } | null | undefined): string {
    if (!user) return 'N/A';
    const fullName = [user.name, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || 'N/A';
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.forumService.getAllPublications().subscribe({
      next: (pubs) => {
        this.totalPublications = pubs.length;
        this.countQuestion = pubs.filter(p => p.type === 'QUESTION').length;
        this.countArticle  = pubs.filter(p => p.type === 'ARTICLE').length;
        this.countReview   = pubs.filter(p => p.type === 'REVIEW').length;

        this.allPubRows = pubs.map(p => ({
          username:       this.getUserLabel(p.user),
          titre:          p.titre,
          createAt:       p.createAt,
          nbCommentaires: p.commentaires?.length ?? 0
        }));
        this.filteredPubRows = [...this.allPubRows];

        this.forumService.getAllCommentaires().subscribe({
          next: (coms) => {
            this.allComRows = coms.map(c => ({
              username:         this.getUserLabel(c.user),
              contenue:         c.contenue,
              createAt:         c.createAt,
              publicationTitre: c.publication?.titre || 'N/A'
            }));
            this.filteredComRows = [...this.allComRows];
            this.loading = false;
          },
          error: () => {
            this.error = 'Error loading comments.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Error loading publications.';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    const q = this.searchUsername.toLowerCase().trim();
    if (!q) {
      this.filteredPubRows = [...this.allPubRows];
      this.filteredComRows = [...this.allComRows];
    } else {
      this.filteredPubRows = this.allPubRows.filter(r =>
        r.username.toLowerCase().includes(q)
      );
      this.filteredComRows = this.allComRows.filter(r =>
        r.username.toLowerCase().includes(q)
      );
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}