import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Project } from '../../models/project.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FreelancerService } from '../../services/freelancer.service';
import { AuthService } from '../../../../services/auth.services';

const SKILL_ICONS: Record<string, string> = {
  angular:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angular/angular-original.svg',
  react:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  vue:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  python:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  java:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  nodejs:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  spring:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  docker:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  mysql:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  mongodb:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  figma:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  git:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  css:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  html:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  php:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  flutter:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
  kotlin:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  swift:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  csharp:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  'c#':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  aws:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
};

@Component({
  selector: 'app-freelancer-apply',
  templateUrl: './freelancer-apply.component.html',
  styleUrls: ['./freelancer-apply.component.scss']
})
export class FreelancerApplyComponent implements OnInit {
  @Input() project?: Project;
  @Output() close = new EventEmitter<void>();
  @Output() applied = new EventEmitter<void>();

  currentStep: 'skills' | 'application' = 'skills';

  // My skills (from backend)
  mySkills: any[] = [];
  selectedSkills: any[] = [];
  loadingSkills = true;

  // Application form
  form: FormGroup;

  // Cover letter options
  coverLetterMode: 'text' | 'upload' | 'generate' | null = null;
  coverLetterFile: File | null = null;
  coverLetterFileName = '';
  isGeneratingLetter = false;
  generatedLetterBlob: Blob | null = null;

  isSubmitting = false;
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private freelancerService: FreelancerService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      coverLetter: ['', Validators.minLength(20)],
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.userId ?? null;
    this.loadMySkills();
  }

  loadMySkills(): void {
    if (!this.currentUserId) return;
    this.loadingSkills = true;
    this.freelancerService.getFreelancerSkills(this.currentUserId).subscribe({
      next: (skills) => {
        this.mySkills = skills;
        this.loadingSkills = false;
      },
      error: () => { this.loadingSkills = false; }
    });
  }

  getSkillIcon(name: string): string | null {
    return SKILL_ICONS[name.toLowerCase().trim()] || null;
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  toggleSkill(skill: any): void {
    const idx = this.selectedSkills.findIndex(s => s.id === skill.id);
    if (idx >= 0) this.selectedSkills.splice(idx, 1);
    else this.selectedSkills.push(skill);
  }

  isSkillSelected(skill: any): boolean {
    return this.selectedSkills.some(s => s.id === skill.id);
  }

  nextStep(): void {
    if (this.selectedSkills.length === 0) {
      alert('Please select at least one skill.');
      return;
    }
    this.currentStep = 'application';
  }

  // ─── Cover Letter ─────────────────────────────────────────
  onCoverLetterFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.coverLetterFile = input.files[0];
      this.coverLetterFileName = input.files[0].name;
    }
  }

  generateCoverLetter(): void {
    if (!this.currentUserId || !this.project?.id) return;
    this.isGeneratingLetter = true;
    this.freelancerService.generateCoverLetter(this.currentUserId, this.project.id).subscribe({
      next: (blob) => {
        this.generatedLetterBlob = blob;
        this.isGeneratingLetter = false;
        // Preview download
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        this.isGeneratingLetter = false;
        alert('Error generating cover letter. Make sure your CV is uploaded.');
      }
    });
  }

  // ─── Submit ───────────────────────────────────────────────
  submitApplication(): void {
    if (!this.currentUserId || !this.project?.id) return;

    // Validate cover letter
    const hasCoverLetterText = this.coverLetterMode === 'text' && this.form.value.coverLetter?.length >= 20;
    const hasCoverLetterFile = this.coverLetterMode === 'upload' && this.coverLetterFile;
    const hasCoverLetterGenerated = this.coverLetterMode === 'generate' && this.generatedLetterBlob;

    if (!hasCoverLetterText && !hasCoverLetterFile && !hasCoverLetterGenerated) {
      alert('Please provide a cover letter (text, upload, or generate).');
      return;
    }

    this.isSubmitting = true;

    // If upload or generate → use FormData
    if (hasCoverLetterFile || hasCoverLetterGenerated) {
      const fd = new FormData();
      fd.append('freelancerId', String(this.currentUserId));
      fd.append('projectId', String(this.project.id));
      fd.append('skillIds', JSON.stringify(this.selectedSkills.map(s => s.id)));
      if (hasCoverLetterFile) fd.append('coverLetterFile', this.coverLetterFile!);
      if (hasCoverLetterGenerated) fd.append('coverLetterFile', this.generatedLetterBlob!, 'cover-letter.pdf');

      this.freelancerService.submitApplication(fd).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    } else {
      // Plain JSON
      const payload = {
        freelancerId: this.currentUserId,
        projectId: this.project.id,
        coverLetter: this.form.value.coverLetter,
        skillIds: this.selectedSkills.map(s => s.id)
      };
      this.freelancerService.submitApplication(payload).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err)
      });
    }
  }

  private onSuccess(): void {
    this.isSubmitting = false;
    this.applied.emit();
    this.close.emit();
  }

  private onError(err: any): void {
    console.error(err);
    this.isSubmitting = false;
    alert(`Error: ${err.status} — ${err.error?.message || 'Something went wrong.'}`);
  }

  closeModal(): void {
    this.close.emit();
  }
}