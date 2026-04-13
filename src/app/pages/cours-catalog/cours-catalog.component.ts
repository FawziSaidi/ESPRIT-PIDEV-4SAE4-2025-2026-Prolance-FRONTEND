// src/app/pages/cours-catalog/cours-catalog.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import { CoursService } from '../../services/cours.service';
import { CourseSummary } from '../cours/cours.models';

@Component({
  selector: 'app-cours-catalog',
  templateUrl: './cours-catalog.component.html',
  styleUrls: ['./cours-catalog.component.scss']
})
export class CoursCatalogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  allCourses: CourseSummary[] = [];
  courses: CourseSummary[] = [];
  isLoading = false;

  selectedCategory = '';
  selectedLevel = '';
  sortBy = 'default';
  searchControl = new FormControl('');

  categories = ['', 'Development', 'Design', 'Marketing', 'Writing', 'Finance'];
  levels = ['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  constructor(
    private coursService: CoursService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCourses();

    // Debounced live search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterBy(category: string): void {
    this.selectedCategory = category;
    this.loadCourses();
  }

  filterByLevel(level: string): void {
    this.selectedLevel = level;
    this.applyFilters();
  }

  setSortBy(sort: string): void {
    this.sortBy = sort;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  loadCourses(): void {
    this.isLoading = true;
    this.coursService.getPublishedCourses(this.selectedCategory || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.allCourses = courses;
          this.isLoading = false;
          this.applyFilters();
        },
        error: () => { this.isLoading = false; }
      });
  }

  applyFilters(): void {
    let result = [...this.allCourses];
    const q = (this.searchControl.value || '').toLowerCase().trim();

    if (q) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (this.selectedLevel) {
      result = result.filter(c => c.level === this.selectedLevel);
    }

    switch (this.sortBy) {
      case 'price_asc':  result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'popular':    result.sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0)); break;
      case 'rating':     result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)); break;
    }

    this.courses = result;
  }

  goToCourse(id: number): void {
    this.router.navigate(['/app/cours', id]);
  }

  thumbColor(category: string): string {
    const map: Record<string, string> = {
      'Development': '#EEEDFE', 'Design': '#E1F5EE',
      'Marketing': '#FAEEDA', 'Writing': '#E6F1FB', 'Finance': '#EAF3DE'
    };
    return map[category] ?? '#F1EFE8';
  }

  thumbEmoji(category: string): string {
    const map: Record<string, string> = {
      'Development': '💻', 'Design': '🎨',
      'Marketing': '📣', 'Writing': '✍️', 'Finance': '📊'
    };
    return map[category] ?? '📚';
  }

  levelLabel(level: string): string {
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  stars(rating?: number): string[] {
    const r = Math.round(rating ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < r ? '★' : '☆');
  }
}