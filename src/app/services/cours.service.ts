import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourseSummary, CourseDetail, CourseRequest,
  LessonResponse, LessonRequest,
  ReviewResponse, NoteResponse, CertificateResponse,
  CouponValidateResponse, LessonHistoryRecord, AdminPaymentRecord, CourseProgress
} from '../pages/cours/cours.models';

export interface PaymentRequest {
  userId: number;
  courseId: number;
  method: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  couponCode?: string;
}

export interface ProgressRequest {
  lessonId: number;
  userId: number;
  timeSpentSeconds: number;
  notes?: string;
  completedAt: string;
}

export interface ProgressResponse {
  message: string;
  certificateUnlocked: boolean;
}

export interface LessonHistoryPage {
  records: LessonHistoryRecord[];
  total: number;
}

export interface ReviewRequest {
  userId: number;
  courseId: number;
  rating: number;
  comment: string;
}

@Injectable({ providedIn: 'root' })
export class CoursService {

  private base = 'http://localhost:8222';
  private api  = `${this.base}/api/courses`;

  constructor(private http: HttpClient) {}

  // ── Public Courses ──────────────────────────────────────────────────────────

  getPublishedCourses(category?: string): Observable<CourseSummary[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<CourseSummary[]>(this.api, { params });
  }

  getCourseById(id: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.api}/${id}`);
  }

  // ── Lessons ─────────────────────────────────────────────────────────────────

  getLessons(courseId: number, userId: number): Observable<LessonResponse[]> {
    return this.http.get<LessonResponse[]>(`${this.api}/${courseId}/lessons`, {
      params: new HttpParams().set('userId', userId)
    });
  }

  // Controller: PATCH /api/lessons/{lessonId}/complete?userId=
  completeLesson(lessonId: number, userId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/api/lessons/${lessonId}/complete`, null, {
      params: new HttpParams().set('userId', userId)
    });
  }

  // ── Enroll ──────────────────────────────────────────────────────────────────

  // Controller: POST /api/courses/{courseId}/enroll  body: { userId }
  enroll(courseId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/${courseId}/enroll`, { userId });
  }

  // ── Coupon ──────────────────────────────────────────────────────────────────

  // Controller: GET /api/coupons/validate?courseId=&code=
  validateCoupon(courseId: number, code: string): Observable<CouponValidateResponse> {
    return this.http.get<CouponValidateResponse>(`${this.base}/api/coupons/validate`, {
      params: new HttpParams().set('courseId', courseId).set('code', code)
    });
  }

  // ── Payment ─────────────────────────────────────────────────────────────────

  // Controller: POST /api/payments/initiate
  initiatePayment(payload: PaymentRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/api/payments/initiate`, payload);
  }

  // ── Progress ────────────────────────────────────────────────────────────────

  // Controller: POST /api/progress/submit
  submitProgress(payload: ProgressRequest): Observable<ProgressResponse> {
    return this.http.post<ProgressResponse>(`${this.base}/api/progress/submit`, payload);
  }

  // ── Notes ───────────────────────────────────────────────────────────────────

  // Controller: GET /api/users/{userId}/notes
  getUserNotes(userId: number): Observable<NoteResponse[]> {
    return this.http.get<NoteResponse[]>(`${this.base}/api/users/${userId}/notes`);
  }

  // Controller: POST /api/lessons/{lessonId}/notes  body: { userId, content }
  saveNote(lessonId: number, userId: number, content: string): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(`${this.base}/api/lessons/${lessonId}/notes`, { userId, content });
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────

  // Controller: GET /api/courses/{courseId}/reviews
  getCourseReviews(courseId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.api}/${courseId}/reviews`);
  }

  // Controller: POST /api/reviews
  submitReview(payload: ReviewRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/api/reviews`, payload);
  }

  // Controller: POST /api/reviews/{reviewId}/helpful
  markReviewHelpful(reviewId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/api/reviews/${reviewId}/helpful`, null);
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────────

  // Controller: POST /api/lessons/{lessonId}/bookmark  body: { userId }
  bookmarkLesson(lessonId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/api/lessons/${lessonId}/bookmark`, { userId });
  }

  // Controller: DELETE /api/lessons/{lessonId}/bookmark  body: { userId }
  removeBookmark(lessonId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/lessons/${lessonId}/bookmark`, {
      body: { userId }
    });
  }

  // ── Certificates ─────────────────────────────────────────────────────────────

  // Controller: GET /api/users/{userId}/certificates
  getUserCertificates(userId: number): Observable<CertificateResponse[]> {
    return this.http.get<CertificateResponse[]>(`${this.base}/api/users/${userId}/certificates`);
  }

  // ── Admin: Courses ────────────────────────────────────────────────────────────

  // Controller: GET /api/admin/courses
  getAllCoursesAdmin(): Observable<CourseDetail[]> {
    return this.http.get<CourseDetail[]>(`${this.base}/api/admin/courses`);
  }

  createCourse(data: CourseRequest, adminId: number): Observable<CourseDetail> {
    return this.http.post<CourseDetail>(this.api, data, {
      params: new HttpParams().set('createdBy', adminId)
    });
  }

  updateCourse(id: number, data: CourseRequest): Observable<CourseDetail> {
    return this.http.put<CourseDetail>(`${this.api}/${id}`, data);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // ── Admin: Lessons ────────────────────────────────────────────────────────────

  getLessonsAdmin(courseId: number): Observable<LessonResponse[]> {
    return this.http.get<LessonResponse[]>(`${this.api}/${courseId}/lessons`);
  }

  addLesson(courseId: number, data: LessonRequest): Observable<LessonResponse> {
    return this.http.post<LessonResponse>(`${this.api}/${courseId}/lessons`, data);
  }

  updateLesson(lessonId: number, data: LessonRequest): Observable<LessonResponse> {
    return this.http.put<LessonResponse>(`${this.base}/api/lessons/${lessonId}`, data);
  }

  deleteLesson(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/lessons/${lessonId}`);
  }

  // ── Admin: History ────────────────────────────────────────────────────────────

  // Controller: GET /api/admin/lesson-history
  getAdminLessonHistory(
    courseId?: number,
    userId?: number,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    pageSize = 20
  ): Observable<LessonHistoryPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (courseId != null) params = params.set('courseId', courseId);
    if (userId   != null) params = params.set('userId',   userId);
    if (dateFrom)         params = params.set('dateFrom', dateFrom);
    if (dateTo)           params = params.set('dateTo',   dateTo);
    return this.http.get<LessonHistoryPage>(`${this.base}/api/admin/lesson-history`, { params });
  }

  exportLessonHistoryCsv(courseId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (courseId != null) params = params.set('courseId', courseId);
    return this.http.get(`${this.base}/api/admin/lesson-history/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ── Admin: Payments ───────────────────────────────────────────────────────────

  // Controller: GET /api/admin/payments
  getAdminPayments(courseId?: number): Observable<AdminPaymentRecord[]> {
    let params = new HttpParams();
    if (courseId != null) params = params.set('courseId', courseId);
    return this.http.get<AdminPaymentRecord[]>(`${this.base}/api/admin/payments`, { params });
  }

  // ── Admin: Progress ───────────────────────────────────────────────────────────

  // Controller: GET /api/admin/user-progress
  getUserProgressAdmin(courseId?: number): Observable<CourseProgress[]> {
    let params = new HttpParams();
    if (courseId != null) params = params.set('courseId', courseId);
    return this.http.get<CourseProgress[]>(`${this.base}/api/admin/user-progress`, { params });
  }
}