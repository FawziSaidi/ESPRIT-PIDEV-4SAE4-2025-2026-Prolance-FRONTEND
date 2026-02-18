import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Project } from '../../models/project.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FreelancerService } from '../../services/freelancer.service';

@Component({
  selector: 'app-freelancer-apply',
  templateUrl: './freelancer-apply.component.html',
  styleUrls: ['./freelancer-apply.component.scss']
})
export class FreelancerApplyComponent implements OnInit {
  @Input() project?: Project;
  @Output() close = new EventEmitter<void>();
  @Output() skillsSubmitted = new EventEmitter<any>();

  form: FormGroup;
  skillsList: any[] = [];
  selectedSkills: any[] = [];
  isSubmitting = false;
  currentStep: 'skills' | 'application' = 'skills';

  constructor(private fb: FormBuilder, private freelancerService: FreelancerService) {
    this.form = this.fb.group({
      proposedBudget: [0, [Validators.required, Validators.min(1)]],
      coverLetter: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit(): void {
    this.loadAvailableSkills();
  }

  loadAvailableSkills(): void {
    this.freelancerService.getAllSkills().subscribe({
      next: (skills) => {
        this.skillsList = skills;
      },
      error: (err) => console.error('Error loading skills:', err)
    });
  }

  toggleSkill(skill: any): void {
    const index = this.selectedSkills.findIndex(s => s.id === skill.id);
    if (index >= 0) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  isSkillSelected(skill: any): boolean {
    return this.selectedSkills.some(s => s.id === skill.id);
  }

  nextStep(): void {
    if (this.selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return;
    }
    this.currentStep = 'application';
  }

  submitApplication(): void {
  if (this.form.invalid) {
    alert('Please fill all fields');
    return;
  }

  this.isSubmitting = true;

  const applicationData = {
    projectId: this.project?.id,
    proposedBudget: this.form.value.proposedBudget,
    coverLetter: this.form.value.coverLetter,
    skillIds: this.selectedSkills.map(s => s.id)
  };

  console.log('Sending:', JSON.stringify(applicationData)); // ← ajoutez ceci

  this.freelancerService.submitApplication(applicationData).subscribe({
    next: () => {
      this.skillsSubmitted.emit(this.selectedSkills);
      this.closeModal();
      this.isSubmitting = false;
    },
    error: (err) => {
      console.error('Full error:', err); // ← et ceci
      alert(`Error: ${err.status} - ${err.error?.message || err.message}`);
      this.isSubmitting = false;
    }
  });
}
  closeModal(): void {
    this.close.emit();
  }
}