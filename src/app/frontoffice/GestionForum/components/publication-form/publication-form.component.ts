import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Publication, TypePublication } from '../../models/publication.model';
import { PublicationService } from '../../services/publication.service';
import { AuthService } from '../../../../services/auth.services';

@Component({
  selector: 'app-publication-form',
  templateUrl: './publication-form.component.html',
  styleUrls: ['./publication-form.component.css']
})
export class PublicationFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() publication: Publication | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData = {
    titre: '',
    contenue: '',
    type: TypePublication.ARTICLE
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentUserId: number = 0; // ✅ Sera rempli depuis AuthService

  typeOptions = [
    { value: TypePublication.QUESTION, label: 'Question', icon: '❓' },
    { value: TypePublication.ARTICLE, label: 'Article', icon: '📝' },
    { value: TypePublication.REVIEW, label: 'Review', icon: '⭐' }
  ];

  errors = {
    titre: '',
    contenue: '',
    type: ''
  };

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private publicationService: PublicationService,
    private authService: AuthService  // ✅ Injection de AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Récupérer l'ID de l'utilisateur connecté
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

    if (this.mode === 'edit' && this.publication) {
      this.formData = {
        titre: this.publication.titre,
        contenue: this.publication.contenue,
        type: this.publication.type
      };

      if (this.publication.image) {
        this.imagePreview = `http://localhost:8089/pidev/uploads/publications/${this.publication.image}`;
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image valide';
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.errorMessage = 'L\'image ne doit pas dépasser 5MB';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';

      // Aperçu de l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = { titre: '', contenue: '', type: '' };

    if (!this.formData.titre || this.formData.titre.trim().length === 0) {
      this.errors.titre = 'Title is required';
      isValid = false;
    } else if (this.formData.titre.trim().length < 5) {
      this.errors.titre = 'Title must be at least 5 characters';
      isValid = false;
    } else if (this.formData.titre.trim().length > 200) {
      this.errors.titre = 'Title must not exceed 200 characters';
      isValid = false;
    }

    if (!this.formData.contenue || this.formData.contenue.trim().length === 0) {
      this.errors.contenue = 'Content is required';
      isValid = false;
    } else if (this.formData.contenue.trim().length < 10) {
      this.errors.contenue = 'Content must be at least 10 characters';
      isValid = false;
    }

    if (!this.formData.type) {
      this.errors.type = 'Type is required';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('titre', this.formData.titre.trim());
    formData.append('contenue', this.formData.contenue.trim());
    formData.append('type', this.formData.type);
    formData.append('userId', this.currentUserId.toString());

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.mode === 'create') {
      this.createPublication(formData);
    } else {
      this.updatePublication(formData);
    }
  }

  createPublication(formData: FormData): void {
    this.publicationService.createPublication(formData).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (error) => {
        console.error('Creation error:', error);
        this.errorMessage = error.error || 'Error creating post';
        this.loading = false;
      }
    });
  }

  updatePublication(formData: FormData): void {
    this.publicationService.updatePublication(this.publication!.id!, formData).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (error) => {
        console.error('Update error:', error);
        this.errorMessage = error.error || 'Error updating post';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }

  getTitle(): string {
    return this.mode === 'create' ? 'New Post' : 'Edit Post';
  }
}
