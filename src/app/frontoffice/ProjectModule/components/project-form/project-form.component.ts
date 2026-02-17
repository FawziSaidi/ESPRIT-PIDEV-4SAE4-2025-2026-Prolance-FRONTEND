import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { Priority } from '../../models/enums.model';
import { ProjectsService } from '../../services/projects.service';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {
  @Input() project?: Project;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  tasks: Task[] = [];
  newTaskName = '';
  newTaskDescription = '';
  newTaskPriority = 'MEDIUM';  // ✅ String for select dropdown
  newTaskStartDate = '';
  newTaskEndDate = '';
  newTaskMilestone = '';
  showTaskInput = false;
  isSubmitting = false;

  categoryOptions = ['DEV', 'DESIGN'];
  priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];  // ✅ Priority options for tasks

  constructor(private fb: FormBuilder, private projectsService: ProjectsService) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      budget: [0, [Validators.required, Validators.min(100)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      // ✅ SUPPRIMÉ: status field - on utilisera un défaut
      category: ['DEV', Validators.required]
    });
  }

  ngOnInit() {
    if (this.project) {
      this.form.patchValue(this.project);
      this.tasks = this.project.tasks || [];
    }
  }

  /**
   * Ajouter une nouvelle task
   */
  addTask(): void {
    if (!this.newTaskName.trim()) {
      alert('Task name is required');
      return;
    }

    const newTask: Task = {
      taskName: this.newTaskName,
      description: this.newTaskDescription,
      priority: this.newTaskPriority as any,  // ✅ Priority string (MEDIUM, HIGH, LOW)
      milestone: this.newTaskMilestone,
      startDate: this.newTaskStartDate,
      endDate: this.newTaskEndDate
    };

    this.tasks.push(newTask);
    this.newTaskName = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'MEDIUM';  // ✅ Reset à MEDIUM
    this.newTaskMilestone = '';
    this.newTaskStartDate = '';
    this.newTaskEndDate = '';
    this.showTaskInput = false;

    console.log('Task added:', newTask);
  }

  /**
   * Supprimer une task
   */
  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  /**
   * Mettre à jour une task
   */
  updateTask(index: number, task: Task): void {
    this.tasks[index] = task;
  }

  /**
   * Soumettre le formulaire
   */
  submit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields');
      return;
    }

    if (this.tasks.length === 0) {
      alert('Please add at least one task');
      return;
    }

    this.isSubmitting = true;

    const projectData = {
      ...this.form.value,
      status: 'IN_PROGRESS',  // ✅ Status par défaut (IN_PROGRESS)
      tasks: this.tasks,
      requiredSkills: []
    } as Project;

    if (this.project?.id) {
      projectData.id = this.project.id;
      this.projectsService.updateProject(projectData).subscribe({
        next: () => {
          this.saved.emit();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Error updating project:', err);
          alert('Error updating project');
          this.isSubmitting = false;
        }
      });
    } else {
      this.projectsService.createProject(projectData).subscribe({
        next: () => {
          this.saved.emit();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Error creating project:', err);
          alert('Error creating project');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Fermer la modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Vérifier si le formulaire est valide
   */
  isFormValid(): boolean {
    return this.form.valid && this.tasks.length > 0;
  }
}