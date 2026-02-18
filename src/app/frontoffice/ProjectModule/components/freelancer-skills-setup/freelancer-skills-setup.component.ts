import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FreelancerService } from '../../services/freelancer.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-freelancer-skills-setup',
  templateUrl: './freelancer-skills-setup.component.html',
  styleUrls: ['./freelancer-skills-setup.component.scss']
})
export class FreelancerSkillsSetupComponent implements OnInit {
  @Input() freelancerId!: number | null;
  @Output() close = new EventEmitter<void>();
  @Output() skillsSaved = new EventEmitter<void>();

  skillForm: FormGroup;
  addedSkills: any[] = [];
  isSubmitting = false;
  errorMessage = '';

  skillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  availabilities = ['AVAILABLE', 'BUSY'];

  constructor(private fb: FormBuilder, private freelancerService: FreelancerService) {
    this.skillForm = this.fb.group({
      skillName: ['', Validators.required],
      description: ['', Validators.required],
      level: ['', Validators.required],
      yearsExperience: [1, [Validators.required, Validators.min(0)]],
      availability: ['', Validators.required],
      resumeUrl: ['']
    });
  }

  ngOnInit(): void {}

  addSkill(): void {
    if (this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      return;
    }
    this.addedSkills.push({ ...this.skillForm.value });
    this.skillForm.reset({ yearsExperience: 1 });
    this.errorMessage = '';
  }

  removeSkill(index: number): void {
    this.addedSkills.splice(index, 1);
  }

  save(): void {
    if (this.addedSkills.length === 0) {
      this.errorMessage = 'Please add at least one skill.';
      return;
    }

    this.isSubmitting = true;
    let saved = 0;

    this.addedSkills.forEach(skill => {
      const payload = { ...skill, freelancer: { id: this.freelancerId } };
      this.freelancerService.createSkill(payload).subscribe({
        next: () => {
          saved++;
          if (saved === this.addedSkills.length) {
            this.isSubmitting = false;
            this.skillsSaved.emit();
          }
        },
        error: () => {
          this.errorMessage = 'Error saving skills.';
          this.isSubmitting = false;
        }
      });
    });
  }
}