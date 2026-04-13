// src/app/pages/cours/cours.models.ts

export type CourseLevel  = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED';

export interface CourseSummary {
  id: number;
  title: string;
  category: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  thumbnail: string | null;
  lessonCount: number;
  enrollmentCount?: number;
  averageRating?: number;
  tags?: string[];
}

export interface CourseDetail extends CourseSummary {
  description: string;
  enrollmentCount: number;
  createdAt: string;
  prerequisites?: string[];
  objectives?: string[];
  tags?: string[];
  discussionsEnabled?: boolean;
  reviewsEnabled?: boolean;
}

export interface CourseRequest {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  price: number;
  thumbnail?: string;
  status: CourseStatus;
  prerequisites?: string[];
  objectives?: string[];
  tags?: string[];
  enrollmentLimit?: number;
  discussionsEnabled?: boolean;
  reviewsEnabled?: boolean;
}

export interface LessonResponse {
  id: number;
  courseId: number;
  title: string;
  description: string;
  contentUrl: string;
  duration: number;
  orderIndex: number;
  completed: boolean;
  bookmarked?: boolean;
  notes?: string;
}

export interface LessonRequest {
  title: string;
  description: string;
  contentUrl: string;
  duration: number;
  orderIndex: number;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export interface ProgressSubmitRequest {
  lessonId: number;
  userId: number;
  completedAt?: string;
  timeSpentSeconds?: number;
  notes?: string;
}

export interface ProgressSubmitResponse {
  success: boolean;
  progressPercent: number;
  certificateUnlocked: boolean;
  message: string;
}

export interface CourseProgress {
  courseId: number;
  courseTitle: string;
  userId: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastActivity: string;
  certificateUnlocked: boolean;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentRequest {
  userId: number;
  courseId: number;
  method: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  couponCode?: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  enrolledAt: string;
}

// ── Coupon ────────────────────────────────────────────────────────────────────

export interface CouponValidateResponse {
  valid: boolean;
  discountAmount?: number;
  finalPrice?: number;
  errorMessage?: string;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  courseId: number;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface ReviewRequest {
  userId: number;
  courseId: number;
  rating: number;
  comment: string;
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface NoteResponse {
  id: number;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  userId: number;
  content: string;
  updatedAt: string;
}

// ── Certificate ───────────────────────────────────────────────────────────────

export interface CertificateResponse {
  id: number;
  userId: number;
  userName: string;
  courseId: number;
  courseTitle: string;
  issuedAt: string;
  url: string;
  verificationCode: string;
}

// ── Admin Lesson History ──────────────────────────────────────────────────────

export interface LessonHistoryRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  completedAt: string;
  timeSpentSeconds: number;
  progressAtCompletion: number;
}

export interface LessonHistoryPage {
  records: LessonHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Admin Payments ────────────────────────────────────────────────────────────

export interface AdminPaymentRecord {
  paymentId: string;
  userId: number;
  userName: string;
  userEmail: string;
  courseId: number;
  courseTitle: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
  completedAt: string;
}