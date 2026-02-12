import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';

interface Project {
  id: number;
  title: string;
  client: string;
  freelancer: string;
  budget: number;
  progress: number;
  status: 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
  deadline: string;
  techStack: string[];
}

@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss']
})
export class MyProjectsComponent implements OnInit {
  get currentRole(): string {
    return this.roleService.currentRole;
  }

  projects: Project[] = [];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.projects = [
      { id: 1, title: 'E-commerce Redesign',      client: 'Acme Corp',         freelancer: 'Sarah Chen',    budget: 4500,  progress: 75,  status: 'In Progress',   deadline: '2026-02-28', techStack: ['Angular', 'SCSS', 'Firebase'] },
      { id: 2, title: 'Mobile App MVP',            client: 'Nova Startups',     freelancer: 'James Walker',  budget: 8000,  progress: 40,  status: 'In Progress',   deadline: '2026-03-15', techStack: ['React Native', 'Node.js'] },
      { id: 3, title: 'Brand Identity Package',    client: 'Global Media Inc',  freelancer: 'Lina Morales',  budget: 2200,  progress: 100, status: 'Completed',     deadline: '2026-01-30', techStack: ['Illustrator', 'Figma'] },
      { id: 4, title: 'API Integration Suite',     client: 'TechVentures',      freelancer: 'Aisha Patel',   budget: 5500,  progress: 90,  status: 'Under Review',  deadline: '2026-02-20', techStack: ['Python', 'FastAPI', 'PostgreSQL'] },
      { id: 5, title: 'SEO Audit & Strategy',      client: 'Bloom Agency',      freelancer: 'Sarah Chen',    budget: 1200,  progress: 20,  status: 'On Hold',       deadline: '2026-03-10', techStack: ['Google Analytics', 'SEMrush'] },
      { id: 6, title: 'DevOps Pipeline Setup',     client: 'CloudNine Inc',     freelancer: 'James Walker',  budget: 3800,  progress: 55,  status: 'In Progress',   deadline: '2026-03-01', techStack: ['Docker', 'Kubernetes', 'AWS'] },
    ];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'In Progress':   return 'status-progress';
      case 'Under Review':  return 'status-review';
      case 'Completed':     return 'status-completed';
      case 'On Hold':       return 'status-hold';
      default:              return '';
    }
  }

  getProgressClass(progress: number): string {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-info';
    if (progress >= 25) return 'bg-warning';
    return 'bg-danger';
  }

  getCounterpart(project: Project): string {
    return this.currentRole === 'freelancer' ? project.client : project.freelancer;
  }

  getCounterpartLabel(): string {
    return this.currentRole === 'freelancer' ? 'Client' : 'Freelancer';
  }
}
