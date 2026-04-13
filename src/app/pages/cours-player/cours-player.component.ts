// src/app/pages/cours-player/cours-player.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CoursService } from '../../services/cours.service';
import {
  CourseDetail, LessonResponse, ReviewResponse,
  NoteResponse, CertificateResponse, CouponValidateResponse
} from '../cours/cours.models';

interface Toast { message: string; type: 'success' | 'error' | 'info'; }

@Component({
  selector: 'app-cours-player',
  templateUrl: './cours-player.component.html',
  styleUrls: ['./cours-player.component.scss']
})
export class CoursPlayerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  course: CourseDetail | null = null;
  lessons: LessonResponse[] = [];
  activeLesson: LessonResponse | null = null;
  activeLessonIndex = 0;
  isLoading = false;
  isEnrolled = false;
  enrolling = false;

  currentUserId: number | null = null;

  // Tabs: 'overview' | 'notes' | 'reviews'
  activeTab: 'overview' | 'notes' | 'reviews' = 'overview';

  // Progress submit
  timeSpentMinutes = 0;
  submittingProgress = false;

  // Payment modal
  showPaymentModal = false;
  paymentMethod: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER' = 'CARD';
  couponCode = '';
  couponResult: CouponValidateResponse | null = null;
  validatingCoupon = false;
  processingPayment = false;

  // Notes
  noteContent = '';
  savingNote = false;
  userNotes: NoteResponse[] = [];

  // Reviews
  reviews: ReviewResponse[] = [];
  userRating = 0;
  reviewComment = '';
  submittingReview = false;
  hoverRating = 0;

  // Certificate
  showCertModal = false;
  certificate: CertificateResponse | null = null;

  // Toasts
  toasts: Toast[] = [];

  get progressPercent(): number {
    if (!this.lessons.length) return 0;
    return Math.round(this.lessons.filter(l => l.completed).length / this.lessons.length * 100);
  }

  get finalPrice(): number {
    if (!this.course) return 0;
    if (this.couponResult?.valid && this.couponResult.finalPrice != null) {
      return this.couponResult.finalPrice;
    }
    return this.course.price;
  }

  // FIX: replaces arrow function used in template
  get hasBookmarks(): boolean {
    return this.lessons.some(l => l.bookmarked);
  }

  constructor(
    private route: ActivatedRoute,
    private coursService: CoursService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('sessionUser');
    if (stored) {
      try {
        const s = JSON.parse(stored);
        this.currentUserId = s.id ?? s.userId ?? null;
      } catch {}
    }

    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.isLoading = true;

    this.coursService.getCourseById(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => { this.course = course; this.isLoading = false; this.cdr.detectChanges(); },
        error: () => { this.isLoading = false; }
      });

    if (this.currentUserId) {
      this.loadLessons(courseId);
      this.loadUserNotes();
    }

    this.loadReviews(courseId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  private loadLessons(courseId: number): void {
    this.coursService.getLessons(courseId, this.currentUserId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          this.lessons = [...lessons];
          this.isEnrolled = lessons.length > 0;
          if (lessons.length) this.selectLesson(lessons[0], 0);
          this.cdr.detectChanges();
        }
      });
  }

  selectLesson(lesson: LessonResponse, index: number): void {
    this.activeLesson = lesson;
    this.activeLessonIndex = index;
    this.timeSpentMinutes = 0;
    const note = this.userNotes.find(n => n.lessonId === lesson.id);
    this.noteContent = note?.content ?? '';
    this.cdr.detectChanges();
  }

  openVideo(): void {
    if (this.activeLesson?.contentUrl) {
      window.open(this.activeLesson.contentUrl, '_blank');
    }
  }

  goNext(): void {
    const next = this.activeLessonIndex + 1;
    if (next < this.lessons.length) this.selectLesson(this.lessons[next], next);
  }

  // ── Enroll / Payment ───────────────────────────────────────────────────────

  enroll(): void {
    if (!this.course) return;
    if (this.course.price > 0) {
      this.showPaymentModal = true;
    } else {
      this.doFreeEnroll();
    }
  }

  doFreeEnroll(): void {
    if (!this.course || !this.currentUserId) return;
    this.enrolling = true;
    this.coursService.enroll(this.course.id, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.enrolling = false;
          this.isEnrolled = true;
          this.loadLessons(this.course!.id);
          this.toast('Enrolled successfully!', 'success');
        },
        error: (err) => {
          this.enrolling = false;
          this.toast(err?.error?.message ?? 'Enrollment failed', 'error');
        }
      });
  }

  validateCoupon(): void {
    if (!this.couponCode.trim() || !this.course) return;
    this.validatingCoupon = true;
    this.coursService.validateCoupon(this.course.id, this.couponCode.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.couponResult = res;
          this.validatingCoupon = false;
          if (res.valid) this.toast(`Coupon applied! You save $${res.discountAmount?.toFixed(2)}`, 'success');
          else this.toast(res.errorMessage ?? 'Invalid coupon', 'error');
        },
        error: () => { this.validatingCoupon = false; this.toast('Could not validate coupon', 'error'); }
      });
  }

  pay(): void {
    if (!this.course || !this.currentUserId) return;
    this.processingPayment = true;
    this.coursService.initiatePayment({
      userId: this.currentUserId,
      courseId: this.course.id,
      method: this.paymentMethod,
      couponCode: this.couponCode.trim() || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.processingPayment = false;
        this.showPaymentModal = false;
        this.isEnrolled = true;
        this.loadLessons(this.course!.id);
        this.toast('Payment successful! You are now enrolled.', 'success');
      },
      error: () => {
        this.processingPayment = false;
        this.toast('Payment failed. Please try again.', 'error');
      }
    });
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.couponCode = '';
    this.couponResult = null;
  }

  // FIX: replaces bare assignment (click)="showCertModal = false" in template
  closeCertModal(): void {
    this.showCertModal = false;
  }

  // FIX: replaces inline multi-statement (click)="loadCertificate(); showCertModal = true" in template
  openCertModal(): void {
    this.loadCertificate();
    this.showCertModal = true;
  }

  // ── Progress submit ────────────────────────────────────────────────────────

  submitProgress(): void {
    if (!this.activeLesson || !this.currentUserId) return;
    this.submittingProgress = true;

    this.coursService.submitProgress({
      lessonId: this.activeLesson.id,
      userId: this.currentUserId,
      timeSpentSeconds: this.timeSpentMinutes * 60,
      notes: this.noteContent || undefined,
      completedAt: new Date().toISOString()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.submittingProgress = false;
        const idx = this.lessons.findIndex(l => l.id === this.activeLesson!.id);
        if (idx !== -1) {
          const updated = { ...this.lessons[idx], completed: true };
          this.lessons = [...this.lessons.slice(0, idx), updated, ...this.lessons.slice(idx + 1)];
          this.activeLesson = updated;
        }
        this.toast(res.message, 'success');

        if (res.certificateUnlocked) {
          this.loadCertificate();
          this.showCertModal = true;
          this.activeTab = 'reviews';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.submittingProgress = false;
        this.toast('Could not submit progress', 'error');
      }
    });
  }

  markComplete(): void {
    if (!this.activeLesson || !this.currentUserId) return;
    this.coursService.completeLesson(this.activeLesson.id, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const idx = this.lessons.findIndex(l => l.id === this.activeLesson!.id);
        if (idx !== -1) {
          const updated = { ...this.lessons[idx], completed: true };
          this.lessons = [...this.lessons.slice(0, idx), updated, ...this.lessons.slice(idx + 1)];
          this.activeLesson = updated;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Notes ──────────────────────────────────────────────────────────────────

  loadUserNotes(): void {
    if (!this.currentUserId) return;
    this.coursService.getUserNotes(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(notes => { this.userNotes = notes; });
  }

  saveNote(): void {
    if (!this.activeLesson || !this.currentUserId) return;
    this.savingNote = true;
    this.coursService.saveNote(this.activeLesson.id, this.currentUserId, this.noteContent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (note) => {
          this.savingNote = false;
          const idx = this.userNotes.findIndex(n => n.lessonId === note.lessonId);
          if (idx !== -1) this.userNotes[idx] = note;
          else this.userNotes.push(note);
          this.toast('Note saved!', 'success');
        },
        error: () => { this.savingNote = false; this.toast('Could not save note', 'error'); }
      });
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  loadReviews(courseId: number): void {
    this.coursService.getCourseReviews(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => { this.reviews = r; this.cdr.detectChanges(); });
  }

  setRating(r: number): void { this.userRating = r; }

  submitReview(): void {
    if (!this.course || !this.currentUserId || !this.userRating) return;
    this.submittingReview = true;
    this.coursService.submitReview({
      userId: this.currentUserId,
      courseId: this.course.id,
      rating: this.userRating,
      comment: this.reviewComment
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submittingReview = false;
        this.loadReviews(this.course!.id);
        this.userRating = 0;
        this.reviewComment = '';
        this.toast('Review submitted! Thank you.', 'success');
      },
      error: () => { this.submittingReview = false; this.toast('Could not submit review', 'error'); }
    });
  }

  markHelpful(reviewId: number): void {
    this.coursService.markReviewHelpful(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const r = this.reviews.find(rv => rv.id === reviewId);
        if (r) r.helpful++;
      });
  }

  averageRating(): number {
    if (!this.reviews.length) return 0;
    return Math.round(this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length * 10) / 10;
  }

  starsArray(n: number): string[] {
    const r = Math.round(n);
    return Array.from({ length: 5 }, (_, i) => i < r ? '★' : '☆');
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  toggleBookmark(lesson: LessonResponse): void {
    if (!this.currentUserId) return;
    const obs = lesson.bookmarked
      ? this.coursService.removeBookmark(lesson.id, this.currentUserId)
      : this.coursService.bookmarkLesson(lesson.id, this.currentUserId);

    obs.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const idx = this.lessons.findIndex(l => l.id === lesson.id);
      if (idx !== -1) {
        const updated = { ...this.lessons[idx], bookmarked: !lesson.bookmarked };
        this.lessons = [...this.lessons.slice(0, idx), updated, ...this.lessons.slice(idx + 1)];
        if (this.activeLesson?.id === lesson.id) this.activeLesson = updated;
        this.cdr.detectChanges();
      }
      this.toast(lesson.bookmarked ? 'Bookmark removed' : 'Lesson bookmarked!', 'info');
    });
  }

  // ── Certificate ────────────────────────────────────────────────────────────

  loadCertificate(): void {
    if (!this.course || !this.currentUserId) return;
    this.coursService.getUserCertificates(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(certs => {
        this.certificate = certs.find(c => c.courseId === this.course!.id) ?? null;
        this.cdr.detectChanges();
      });
  }

  // ── Toasts ─────────────────────────────────────────────────────────────────

  toast(message: string, type: Toast['type'] = 'info'): void {
    const t: Toast = { message, type };
    this.toasts.push(t);
    setTimeout(() => {
      this.toasts = this.toasts.filter(x => x !== t);
      this.cdr.detectChanges();
    }, 3500);
  }
}