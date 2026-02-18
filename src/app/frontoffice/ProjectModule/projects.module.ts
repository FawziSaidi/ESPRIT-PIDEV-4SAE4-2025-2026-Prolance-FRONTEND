import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectFormComponent } from './components/project-form/project-form.component';
import { FreelancerApplyComponent } from './components/freelancer-apply/freelancerApply.component';
import { ProjectDetailsComponent } from './components/projects-details/projectDetails.component';
import { FreelancerSkillsSetupComponent } from './components/freelancer-skills-setup/freelancer-skills-setup.component';

@NgModule({
  declarations: [ProjectsComponent, ProjectFormComponent, ProjectDetailsComponent, FreelancerApplyComponent,FreelancerSkillsSetupComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ProjectsRoutingModule]
})
export class ProjectsModule {}
