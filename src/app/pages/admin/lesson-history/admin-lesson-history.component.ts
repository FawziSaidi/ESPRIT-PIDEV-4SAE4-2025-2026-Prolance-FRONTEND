import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CoursService } from '../../../services/cours.service';
import { LessonHistoryRecord, AdminPaymentRecord, CourseProgress, CourseDetail } from '../../cours/cours.models';

type AdminTab = 'history' | 'progress' | 'payments';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-admin-lesson-history',
  templateUrl: './admin-lesson-history.component.html',
  styleUrls: ['./admin-lesson-history.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminLessonHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab: AdminTab = 'history';

  // History
  historyRecords: LessonHistoryRecord[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyPageSize = 20;
  historyLoading = false;

  // Filters
  courses: CourseDetail[] = [];
  filterCourseId: number | '' = '';
  filterDateFrom = '';
  filterDateTo = '';
  historySearch = '';

  // Payments
  payments: AdminPaymentRecord[] = [];
  paymentsLoading = false;
  paymentSearch = '';

  // Progress
  userProgress: CourseProgress[] = [];
  progressLoading = false;

  // Toasts
  toasts: Toast[] = [];

  // Computed
  get filteredHistory(): LessonHistoryRecord[] {
    const q = this.historySearch.toLowerCase();
    if (!q) return this.historyRecords;
    return this.historyRecords.filter(r =>
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.courseTitle.toLowerCase().includes(q) ||
      r.lessonTitle.toLowerCase().includes(q)
    );
  }

  get filteredPayments(): AdminPaymentRecord[] {
    const q = this.paymentSearch.toLowerCase();
    if (!q) return this.payments;
    return this.payments.filter(p =>
      p.userName.toLowerCase().includes(q) ||
      p.userEmail.toLowerCase().includes(q) ||
      p.courseTitle.toLowerCase().includes(q)
    );
  }

  get totalRevenue(): number {
    return this.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((s, p) => s + p.amount, 0);
  }

  get pendingCount(): number {
    return this.payments.filter(p => p.status === 'PENDING').length;
  }

  get totalPages(): number {
    return Math.ceil(this.historyTotal / this.historyPageSize);
  }

  constructor(
    private coursService: CoursService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'history' && this.historyRecords.length === 0) this.loadHistory();
    if (tab === 'payments' && this.payments.length === 0) this.loadPayments();
    if (tab === 'progress' && this.userProgress.length === 0) this.loadProgress();
  }

  // ── Courses for filter ──────────────────────────────────────────────────────
  loadCourses(): void {
    this.coursService.getAllCoursesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => { this.courses = c; });
  }

  // ── History ─────────────────────────────────────────────────────────────────
  loadHistory(): void {
    this.historyLoading = true;
    const courseId = this.filterCourseId !== '' ? Number(this.filterCourseId) : undefined;
    this.coursService.getAdminLessonHistory(
      courseId, undefined,
      this.filterDateFrom || undefined,
      this.filterDateTo || undefined,
      this.historyPage, this.historyPageSize
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.historyRecords = data.records;
        this.historyTotal = data.total;
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.historyLoading = false; }
    });
  }

  applyHistoryFilters(): void {
    this.historyPage = 1;
    this.loadHistory();
  }

  resetHistoryFilters(): void {
    this.filterCourseId = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.historySearch = '';
    this.historyPage = 1;
    this.loadHistory();
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.historyPage = p;
    this.loadHistory();
  }

  formatTime(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  exportCsv(): void {
    const courseId = this.filterCourseId !== '' ? Number(this.filterCourseId) : undefined;
    this.coursService.exportLessonHistoryCsv(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'lesson-history.csv';
          a.click();
          URL.revokeObjectURL(url);
          this.toast('CSV downloaded!', 'success');
        },
        error: () => this.toast('Export failed', 'error')
      });
  }

  // ── Payments ─────────────────────────────────────────────────────────────────
  loadPayments(): void {
    this.paymentsLoading = true;
    const courseId = this.filterCourseId !== '' ? Number(this.filterCourseId) : undefined;
    this.coursService.getAdminPayments(courseId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (p) => { this.payments = p; this.paymentsLoading = false; this.cdr.detectChanges(); },
        error: () => { this.paymentsLoading = false; }
      });
  }

  // ── Progress ──────────────────────────────────────────────────────────────────
  loadProgress(): void {
    this.progressLoading = true;
    const courseId = this.filterCourseId !== '' ? Number(this.filterCourseId) : undefined;
    this.coursService.getUserProgressAdmin(courseId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (p) => { this.userProgress = p; this.progressLoading = false; this.cdr.detectChanges(); },
        error: () => { this.progressLoading = false; }
      });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast(message: string, type: Toast['type']): void {
    const t: Toast = { message, type };
    this.toasts.push(t);
    setTimeout(() => { this.toasts = this.toasts.filter(x => x !== t); this.cdr.detectChanges(); }, 3000);
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}