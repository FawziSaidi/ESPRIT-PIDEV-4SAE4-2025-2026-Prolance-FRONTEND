import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Publication, TypePublication, getImageUrl } from '../../models/publication.model';
import { PublicationService } from '../../services/publication.service';
import { AuthService } from '../../../../services/auth.services';

interface ImagePreview {
  file?: File;           // new file to upload
  existingName?: string; // existing file name (edit mode)
  previewUrl: string;    // URL for preview
}

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

  // ✅ MULTI-IMAGES: preview list
  imagePreviews: ImagePreview[] = [];
  readonly MAX_IMAGES = 5;

  currentUserId: number = 0;

  typeOptions = [
    { value: TypePublication.QUESTION, label: 'Question', icon: '❓' },
    { value: TypePublication.ARTICLE, label: 'Article', icon: '📝' },
    { value: TypePublication.REVIEW, label: 'Review', icon: '⭐' }
  ];

  errors = {
    titre: '',
    contenue: '',
    type: '',
    images: ''
  };

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private publicationService: PublicationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.currentUserId = userId;
    } else {
      console.warn('No user logged in. Redirect recommended.');
    }

    if (this.mode === 'edit' && this.publication) {
      this.formData = {
        titre: this.publication.titre,
        contenue: this.publication.contenue,
        type: this.publication.type
      };

      // ✅ Load existing images in edit mode
      if (this.publication.images && this.publication.images.length > 0) {
        this.imagePreviews = this.publication.images.map(name => ({
          existingName: name,
          previewUrl: getImageUrl(name)
        }));
      }
    }
  }

  // ✅ Handle multiple file selection
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const remaining = this.MAX_IMAGES - this.imagePreviews.length;
    if (remaining <= 0) {
      this.errors.images = `Maximum ${this.MAX_IMAGES} images allowed`;
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    this.errors.images = '';

    for (const file of filesToProcess) {
      // Type validation
      if (!file.type.startsWith('image/')) {
        this.errors.images = `"${file.name}" is not a valid image`;
        continue;
      }
      // Size validation (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errors.images = `"${file.name}" exceeds 5 MB`;
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({
          file: file,
          previewUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset the input to allow re-selection of the same file
    event.target.value = '';
  }

  // ✅ Remove an image from the list
  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
    this.errors.images = '';
  }

  get canAddMore(): boolean {
    return this.imagePreviews.length < this.MAX_IMAGES;
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = { titre: '', contenue: '', type: '', images: '' };

    if (!this.formData.titre || this.formData.titre.trim().length === 0) {
      this.errors.titre = 'Title is required';
      isValid = false;
    } else if (this.formData.titre.trim().length < 5) {
      this.errors.titre = 'Title must contain at least 5 characters';
      isValid = false;
    } else if (this.formData.titre.trim().length > 200) {
      this.errors.titre = 'Title must not exceed 200 characters';
      isValid = false;
    }

    if (!this.formData.contenue || this.formData.contenue.trim().length === 0) {
      this.errors.contenue = 'Content is required';
      isValid = false;
    } else if (this.formData.contenue.trim().length < 10) {
      this.errors.contenue = 'Content must contain at least 10 characters';
      isValid = false;
    }

    if (!this.formData.type) {
      this.errors.type = 'Type is required';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('titre', this.formData.titre.trim());
    formData.append('contenue', this.formData.contenue.trim());
    formData.append('type', this.formData.type);
    formData.append('userId', this.currentUserId.toString());

    // ✅ Append each new image file under the same "images" field
    const newFiles = this.imagePreviews.filter(p => p.file);
    for (const preview of newFiles) {
      formData.append('images', preview.file!);
    }

    if (this.mode === 'create') {
      this.createPublication(formData);
    } else {
      // ✅ In edit mode, also send the names of images to keep
      const imagesToKeep = this.imagePreviews
        .filter(p => p.existingName)
        .map(p => p.existingName!);
      imagesToKeep.forEach(name => formData.append('imagesToKeep', name));

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
        console.error('Create error:', error);
        this.errorMessage = error.error || 'Error creating the post';
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
        this.errorMessage = error.error || 'Error updating the post';
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