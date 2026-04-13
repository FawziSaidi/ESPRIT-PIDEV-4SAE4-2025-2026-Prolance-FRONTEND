import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CoursService } from '../../../services/cours.service';
import { CourseDetail, CourseRequest, LessonResponse, LessonRequest } from '../../cours/cours.models';

@Component({
  selector: 'app-admin-cours',
  templateUrl: './admin-cours.component.html',
  styleUrls: ['./admin-cours.component.scss']
})
export class AdminCoursComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courses: CourseDetail[] = [];
  lessons: LessonResponse[] = [];
  activeCourse: CourseDetail | null = null;
  editingCourse: CourseDetail | null = null;
  editingLesson: LessonResponse | null = null;

  showCourseModal = false;
  showLessonsModal = false;
  showLessonForm = false;
  isLoading = false;

  currentAdminId: number = 1;

  categories = ['Development', 'Design', 'Marketing', 'Writing', 'Finance'];

  courseForm: FormGroup;
  lessonForm: FormGroup;

  constructor(
    private coursService: CoursService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.courseForm = this.fb.group({
      title:       ['', Validators.required],
      description: ['', Validators.required],
      category:    ['Development', Validators.required],
      level:       ['BEGINNER', Validators.required],
      price:       [0, [Validators.required, Validators.min(0)]],
      thumbnail:   [''],
      status:      ['DRAFT', Validators.required]
    });

    this.lessonForm = this.fb.group({
      title:       ['', Validators.required],
      description: [''],
      contentUrl:  ['', Validators.required],
      duration:    [0, Validators.required],
      orderIndex:  [0]
    });
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('sessionUser');
    if (stored) {
      try { this.currentAdminId = JSON.parse(stored).id; } catch {}
    }
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.coursService.getAllCoursesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => { this.courses = c; this.isLoading = false; this.cdr.detectChanges(); },
        error: () => { this.isLoading = false; this.cdr.detectChanges(); }
      });
  }

  openCourseModal(course?: CourseDetail): void {
    this.editingCourse = course ?? null;
    if (course) {
      this.courseForm.patchValue({
        title: course.title, description: course.description,
        category: course.category, level: course.level,
        price: course.price, thumbnail: course.thumbnail ?? '',
        status: course.status
      });
    } else {
      this.courseForm.reset({ category: 'Development', level: 'BEGINNER', price: 0, status: 'DRAFT' });
    }
    this.showCourseModal = true;
    this.cdr.detectChanges();
  }

  saveCourse(): void {
    if (this.courseForm.invalid) return;
    const data: CourseRequest = this.courseForm.value;
    if (this.editingCourse) {
      this.coursService.updateCourse(this.editingCourse.id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.loadCourses(); this.closeCourseModal(); });
    } else {
      this.coursService.createCourse(data, this.currentAdminId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.loadCourses(); this.closeCourseModal(); });
    }
  }

  deleteCourse(id: number): void {
    if (!confirm('Delete this course and all its lessons?')) return;
    this.coursService.deleteCourse(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadCourses());
  }

  closeCourseModal(): void {
    this.showCourseModal = false;
    this.editingCourse = null;
    this.courseForm.reset({ category: 'Development', level: 'BEGINNER', price: 0, status: 'DRAFT' });
    this.cdr.detectChanges();
  }

  manageLessons(course: CourseDetail): void {
    this.activeCourse = course;
    this.showLessonsModal = true;
    this.loadLessons(course.id);
    this.cdr.detectChanges();
  }

  loadLessons(courseId: number): void {
    this.coursService.getLessonsAdmin(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => { this.lessons = l; this.cdr.detectChanges(); });
  }

  openLessonForm(lesson?: LessonResponse): void {
    this.editingLesson = lesson ?? null;
    if (lesson) {
      this.lessonForm.patchValue({
        title: lesson.title, description: lesson.description,
        contentUrl: lesson.contentUrl, duration: lesson.duration,
        orderIndex: lesson.orderIndex
      });
    } else {
      this.lessonForm.reset({ duration: 0, orderIndex: this.lessons.length + 1 });
    }
    this.showLessonForm = true;
    this.cdr.detectChanges();
  }

  saveLesson(): void {
    if (this.lessonForm.invalid || !this.activeCourse) return;
    const data: LessonRequest = this.lessonForm.value;
    if (this.editingLesson) {
      this.coursService.updateLesson(this.editingLesson.id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.loadLessons(this.activeCourse!.id); this.showLessonForm = false; this.cdr.detectChanges(); });
    } else {
      this.coursService.addLesson(this.activeCourse.id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.loadLessons(this.activeCourse!.id); this.showLessonForm = false; this.cdr.detectChanges(); });
    }
  }

  deleteLesson(lessonId: number): void {
    if (!confirm('Delete this lesson?')) return;
    this.coursService.deleteLesson(lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadLessons(this.activeCourse!.id));
  }

  closeLessonsModal(): void {
    this.showLessonsModal = false;
    this.activeCourse = null;
    this.showLessonForm = false;
    this.cdr.detectChanges();
  }
}