import { Component, OnInit } from '@angular/core';

interface Job {
  id: number;
  title: string;
  company: string;
  budget: number;
  budgetType: 'Fixed' | 'Hourly';
  description: string;
  techStack: string[];
  postedAgo: string;
  proposals: number;
  level: 'Entry' | 'Intermediate' | 'Expert';
}

@Component({
  selector: 'app-job-feed',
  templateUrl: './job-feed.component.html',
  styleUrls: ['./job-feed.component.scss']
})
export class JobFeedComponent implements OnInit {
  searchQuery = '';
  selectedFilter = 'all';

  jobs: Job[] = [];
  filteredJobs: Job[] = [];

  constructor() {}

  ngOnInit(): void {
    this.jobs = [
      { id: 1,  title: 'React Native Mobile App',         company: 'Nova Startups',     budget: 5000,  budgetType: 'Fixed',  description: 'Build a cross-platform mobile app for our food delivery service with real-time tracking and payment integration.', techStack: ['React Native', 'Node.js', 'Firebase'],      postedAgo: '2 hours ago',  proposals: 8,  level: 'Expert' },
      { id: 2,  title: 'E-Commerce Website Redesign',      company: 'Acme Corp',         budget: 85,    budgetType: 'Hourly', description: 'Redesign our existing Shopify store with a modern, conversion-optimized layout and custom theme development.',       techStack: ['Shopify', 'Liquid', 'CSS', 'Figma'],       postedAgo: '5 hours ago',  proposals: 14, level: 'Intermediate' },
      { id: 3,  title: 'Python Data Pipeline',             company: 'TechVentures',      budget: 3200,  budgetType: 'Fixed',  description: 'Design and implement an ETL pipeline to process 10M+ daily records from multiple API sources into our data lake.',   techStack: ['Python', 'Apache Airflow', 'PostgreSQL'],   postedAgo: '1 day ago',    proposals: 5,  level: 'Expert' },
      { id: 4,  title: 'Brand Identity & Logo Design',     company: 'Global Media Inc',  budget: 1500,  budgetType: 'Fixed',  description: 'Create a complete brand identity package including logo, color palette, typography guide, and social media templates.', techStack: ['Illustrator', 'Photoshop', 'Figma'],        postedAgo: '1 day ago',    proposals: 22, level: 'Intermediate' },
      { id: 5,  title: 'WordPress SEO Optimization',       company: 'Bloom Agency',      budget: 45,    budgetType: 'Hourly', description: 'Audit and optimize our WordPress sites for SEO performance, Core Web Vitals, and schema markup implementation.',     techStack: ['WordPress', 'Yoast', 'Google Analytics'],   postedAgo: '2 days ago',   proposals: 11, level: 'Entry' },
      { id: 6,  title: 'Angular Dashboard Application',    company: 'FinServ Ltd',       budget: 8000,  budgetType: 'Fixed',  description: 'Build a comprehensive financial analytics dashboard with real-time charts, role-based access, and PDF export.',       techStack: ['Angular', 'TypeScript', 'D3.js', 'SCSS'],  postedAgo: '2 days ago',   proposals: 6,  level: 'Expert' },
      { id: 7,  title: 'iOS App UI/UX Design',             company: 'HealthTech Co',     budget: 70,    budgetType: 'Hourly', description: 'Design a complete UI/UX for a patient management iOS application following Apple Human Interface Guidelines.',         techStack: ['Figma', 'Sketch', 'Prototyping'],          postedAgo: '3 days ago',   proposals: 18, level: 'Intermediate' },
      { id: 8,  title: 'DevOps CI/CD Pipeline Setup',      company: 'CloudNine Inc',     budget: 2800,  budgetType: 'Fixed',  description: 'Set up a complete CI/CD pipeline with Docker, Kubernetes, and automated testing for our microservices architecture.',  techStack: ['Docker', 'Kubernetes', 'Jenkins', 'AWS'],   postedAgo: '3 days ago',   proposals: 3,  level: 'Expert' },
      { id: 9,  title: 'Content Writing — Tech Blog',      company: 'DevBlog Media',     budget: 35,    budgetType: 'Hourly', description: 'Write in-depth technical articles on cloud computing, AI/ML, and software architecture for our developer audience.',    techStack: ['Technical Writing', 'SEO', 'Markdown'],    postedAgo: '4 days ago',   proposals: 27, level: 'Entry' },
    ];
    this.filteredJobs = [...this.jobs];
  }

  filterJobs(): void {
    let result = [...this.jobs];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.techStack.some(t => t.toLowerCase().includes(q)) ||
        j.company.toLowerCase().includes(q)
      );
    }

    if (this.selectedFilter !== 'all') {
      result = result.filter(j => j.level.toLowerCase() === this.selectedFilter);
    }

    this.filteredJobs = result;
  }

  onSearch(): void {
    this.filterJobs();
  }

  onFilterChange(): void {
    this.filterJobs();
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'Entry':        return 'level-entry';
      case 'Intermediate': return 'level-mid';
      case 'Expert':       return 'level-expert';
      default:             return '';
    }
  }

  applyToJob(job: Job): void {
    alert(`Application submitted for "${job.title}" at ${job.company}!`);
  }
}
