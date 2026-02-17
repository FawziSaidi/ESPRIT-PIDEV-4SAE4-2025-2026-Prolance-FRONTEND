import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-details',
  templateUrl: './projectDetails.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent {
  @Input() project?: Project;
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }
}