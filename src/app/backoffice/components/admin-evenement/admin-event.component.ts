import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';
import { EventService, EventFilterParams, PageResponse } from '../../../frontoffice/GestionEvenement/services/event.service';
import { Event, CategoryEvent, EventStatus } from '../../../frontoffice/GestionEvenement/models/event.model';
import { AuthService } from 'app/services/auth.services';
import { EventInscriptionResponseDTO, InscriptionStatus } from '../../../frontoffice/GestionEvenement/models/inscription.model';
import { InscriptionService } from '../../../frontoffice/GestionEvenement/services/inscription.service';

// ══════════════════════════════════════════════════
//  CUSTOM VALIDATORS
// ══════════════════════════════════════════════════

const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9\u00C0-\u024F\s.,:''\-]+$/;
const NAME_PATTERN          = /^[a-zA-Z0-9\u00C0-\u024F\s]+$/;

function noEdgeSpacesValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v: string = ctrl.value || '';
  return v !== v.trim() ? { edgeSpaces: true } : null;
}
function alphanumericValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim();
  return v.length === 0 ? null : ALPHANUMERIC_PATTERN.test(v) ? null : { specialChars: true };
}
function nameOnlyValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim();
  return v.length === 0 ? null : NAME_PATTERN.test(v) ? null : { specialChars: true };
}
function locationValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim();
  if (v.length === 0) return null;
  if (v.length < 3)   return { locationShort: true };
  if (/^\d+$/.test(v)) return { locationNumeric: true };
  if (!ALPHANUMERIC_PATTERN.test(v)) return { specialChars: true };
  return null;
}
function capacityValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value;
  if (v === null || v === '') return null;
  if (!Number.isInteger(+v) || +v < 1) return { capacityMin: true };
  if (+v > 10_000) return { capacityMax: true };
  return null;
}
function futureDateValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  return new Date(ctrl.value).getTime() < Date.now() - 5 * 60_000 ? { pastDate: true } : null;
}
function endAfterStartValidator(group: AbstractControl): ValidationErrors | null {
  const s = group.get('startDate')?.value;
  const e = group.get('endDate')?.value;
  return s && e && new Date(e) <= new Date(s) ? { endBeforeStart: true } : null;
}

// ══════════════════════════════════════════════════

@Component({
  selector: 'app-admin-events',
  templateUrl: './admin-event.component.html',
  styleUrls: ['./admin-event.component.css']
})
export class AdminEventsComponent implements OnInit, OnDestroy {

  // ── Données ──
  events: Event[]         = [];
  filteredEvents: Event[] = [];
  pageData: PageResponse<Event> | null = null;
  loading = false;
  selectedEvent?: Event;

  // ── Filtres toolbar ──
  searchQuery    = '';
  statusFilter   = 'ALL';
  categoryFilter = 'ALL';

  // ── Filtres avancés ──
  showAdvancedFilters  = false;
  advLocation          = '';
  advActivity          = '';
  advStartDateFrom     = '';
  advStartDateTo       = '';
  advCapacityMin:     number | null = null;
  advCapacityMax:     number | null = null;
  advParticipantsMin: number | null = null;
  advParticipantsMax: number | null = null;

  // ── Pagination ──
  currentPage = 0;
  pageSize    = 10;

  // ── Tri ──
  sortBy:  string          = 'idEvent';
  sortDir: 'asc' | 'desc' = 'desc';

  // ── Vue ──
  viewMode: 'list' | 'cards' = 'cards';

  // ── Options ──
  statusOptions   = ['ALL', 'PUBLISHED', 'PENDING', 'CANCELLED', 'COMPLETED'];
  categoryOptions = ['ALL', 'CONFERENCE', 'WORKSHOP', 'NETWORKING', 'HACKATHON',
                     'SEMINAR', 'TRAINING', 'TRADE_SHOW', 'COMPETITION', 'BUSINESS_MEETING'];

  // ── Modal Create/Edit ──
  showModal   = false;
  isEditMode  = false;
  editEventId?: number;
  eventForm!: FormGroup;
  formLoading = false;
  formSuccess = '';
  formError   = '';
  submitted   = false;

  selectedFile: File | null   = null;
  imagePreview: string | null = null;
  isDragging = false;

  eventStatuses = Object.values(EventStatus);
  categories    = Object.values(CategoryEvent);

  // ── Modal Suppression ──
  showDeleteModal = false;
  eventToDelete?: Event;
  deleteLoading   = false;

  // ── Modal Registration Requests ──
  showRegistrationsModal   = false;
  registrations: EventInscriptionResponseDTO[] = [];
  registrationsLoading     = false;
  registrationsError       = '';
  registrationSearch       = '';
  registrationStatusFilter = 'ALL';
  registrationActionLoading: { [id: number]: boolean } = {};

  // Debounce subjects
  private searchDebounce$   = new Subject<string>();
  private locationDebounce$ = new Subject<string>();
  private activityDebounce$ = new Subject<string>();
  private destroy$          = new Subject<void>();

  constructor(
    private eventService: EventService,
    private inscriptionService: InscriptionService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAllEventsForStats();
    this.loadFilteredEvents();

    this.searchDebounce$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 0; this.loadFilteredEvents(); });

    this.locationDebounce$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 0; this.loadFilteredEvents(); });

    this.activityDebounce$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 0; this.loadFilteredEvents(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════
  //  BADGE filtres avancés actifs
  // ══════════════════════════════════════════════════

  get activeAdvancedCount(): number {
    let n = 0;
    if (this.advLocation.trim())          n++;
    if (this.advActivity.trim())          n++;
    if (this.advStartDateFrom)            n++;
    if (this.advStartDateTo)              n++;
    if (this.advCapacityMin    != null)   n++;
    if (this.advCapacityMax    != null)   n++;
    if (this.advParticipantsMin != null)  n++;
    if (this.advParticipantsMax != null)  n++;
    return n;
  }

  // ══════════════════════════════════════════════════
  //  CHARGEMENT
  // ══════════════════════════════════════════════════

  loadAllEventsForStats(): void {
    this.eventService.getAllEvents().subscribe({
      next: (data) => { this.events = data; },
      error: () => {}
    });
  }

  loadFilteredEvents(): void {
    this.loading = true;

    const params: EventFilterParams = {
      titleContains:    this.searchQuery.trim()    || undefined,
      status:           this.statusFilter   !== 'ALL' ? this.statusFilter   : undefined,
      category:         this.categoryFilter !== 'ALL' ? this.categoryFilter : undefined,
      locationContains: this.advLocation.trim()  || undefined,
      startDateFrom:    this.advStartDateFrom ? `${this.advStartDateFrom}T00:00:00` : undefined,
      startDateTo:      this.advStartDateTo   ? `${this.advStartDateTo}T23:59:59`   : undefined,
      capacityMin:      this.advCapacityMin    ?? undefined,
      capacityMax:      this.advCapacityMax    ?? undefined,
      participantsMin:  this.advParticipantsMin ?? undefined,
      participantsMax:  this.advParticipantsMax ?? undefined,
      sortBy:           this.sortBy,
      sortDir:          this.sortDir,
      page:             this.currentPage,
      size:             this.pageSize,
    };

    this.eventService.filterEvents(params).subscribe({
      next: (page) => {
        this.pageData = page;
        const keyword = this.advActivity.trim().toLowerCase();
        if (keyword) {
          this.filteredEvents = page.content.filter(event =>
            event.activities?.some(act =>
              act.name?.toLowerCase().includes(keyword) ||
              act.description?.toLowerCase().includes(keyword)
            )
          );
        } else {
          this.filteredEvents = page.content;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ══════════════════════════════════════════════════
  //  FILTRES TOOLBAR
  // ══════════════════════════════════════════════════

  onSearchChange(q: string): void   { this.searchQuery = q;   this.searchDebounce$.next(q); }
  onStatusChange(s: string): void   { this.statusFilter = s;   this.currentPage = 0; this.loadFilteredEvents(); }
  onCategoryChange(c: string): void { this.categoryFilter = c; this.currentPage = 0; this.loadFilteredEvents(); }

  // ══════════════════════════════════════════════════
  //  FILTRES AVANCÉS
  // ══════════════════════════════════════════════════

  onLocationInput(): void { this.locationDebounce$.next(this.advLocation); }
  onActivityInput(): void { this.activityDebounce$.next(this.advActivity); }

  applyAdvancedFilters(): void { this.currentPage = 0; this.loadFilteredEvents(); }

  resetAdvancedFilters(): void {
    this.advLocation        = '';
    this.advActivity        = '';
    this.advStartDateFrom   = '';
    this.advStartDateTo     = '';
    this.advCapacityMin     = null;
    this.advCapacityMax     = null;
    this.advParticipantsMin = null;
    this.advParticipantsMax = null;
    this.sortBy             = 'idEvent';
    this.sortDir            = 'desc';
    this.currentPage        = 0;
    this.loadFilteredEvents();
  }

  // ══════════════════════════════════════════════════
  //  PAGINATION
  // ══════════════════════════════════════════════════

  get totalPages(): number   { return this.pageData?.totalPages  ?? 0; }
  get hasPrevious(): boolean { return this.pageData?.hasPrevious ?? false; }
  get hasNext(): boolean     { return this.pageData?.hasNext     ?? false; }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p;
    this.loadFilteredEvents();
  }
  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ══════════════════════════════════════════════════
  //  VUE & SÉLECTION
  // ══════════════════════════════════════════════════

  setView(m: 'list' | 'cards'): void { this.viewMode = m; }
  selectEvent(e: Event): void         { this.selectedEvent = e; }
  closeEvent(): void                  { this.selectedEvent = undefined; }

  // ══════════════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════════════

  deleteEvent(event: Event): void {
    this.eventToDelete  = event;
    this.showDeleteModal = true;
    this.deleteLoading  = false;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.eventToDelete  = undefined;
  }

  confirmDelete(): void {
    if (!this.eventToDelete?.idEvent) return;
    this.deleteLoading = true;
    this.eventService.deleteEvent(this.eventToDelete.idEvent).subscribe({
      next: () => {
        if (this.selectedEvent?.idEvent === this.eventToDelete?.idEvent) {
          this.selectedEvent = undefined;
        }
        this.deleteLoading  = false;
        this.showDeleteModal = false;
        this.eventToDelete  = undefined;
        this.loadAllEventsForStats();
        this.loadFilteredEvents();
      },
      error: (err) => { console.error(err); this.deleteLoading = false; }
    });
  }

  // ══════════════════════════════════════════════════
  //  REGISTRATION REQUESTS MODAL
  //  Uses getInscriptionsByEvent() per event via forkJoin
  // ══════════════════════════════════════════════════

  openRegistrationsModal(): void {
    this.showRegistrationsModal   = true;
    this.registrationsError       = '';
    this.registrationSearch       = '';
    this.registrationStatusFilter = 'ALL';
    this.loadAllRegistrations();
  }

  closeRegistrationsModal(): void {
    this.showRegistrationsModal = false;
    this.registrations          = [];
    this.registrationsError     = '';
  }

  loadAllRegistrations(): void {
    this.registrationsLoading = true;
    this.registrationsError   = '';
    this.registrations        = [];

    const eventIds = this.events
      .map(e => e.idEvent)
      .filter((id): id is number => id != null);

    if (eventIds.length === 0) {
      this.registrationsLoading = false;
      return;
    }

    // Fetch inscriptions for all events in parallel; swallow individual errors
    const requests = eventIds.map(id =>
      this.inscriptionService.getInscriptionsByEvent(id).pipe(
        catchError(() => of([] as EventInscriptionResponseDTO[]))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const all = ([] as EventInscriptionResponseDTO[]).concat(...results);
        // Deduplicate by id, then sort newest-first
        const seen = new Set<number>();
        this.registrations = all
          .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
          .sort((a, b) =>
            new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
          );
        this.registrationsLoading = false;
      },
      error: () => {
        this.registrationsError   = 'Unable to load registration requests.';
        this.registrationsLoading = false;
      }
    });
  }

  // ── Filtered list (search + status tab) ──
  get filteredRegistrations(): EventInscriptionResponseDTO[] {
    const kw = this.registrationSearch.trim().toLowerCase();
    return this.registrations.filter(r => {
      const matchStatus = this.registrationStatusFilter === 'ALL'
        || r.status === this.registrationStatusFilter;
      const matchSearch = !kw
        || r.participantNom?.toLowerCase().includes(kw)
        || r.participantPrenom?.toLowerCase().includes(kw)
        || r.eventTitle?.toLowerCase().includes(kw)
        || r.participantRole?.toLowerCase().includes(kw)
        || r.domaine?.toLowerCase().includes(kw);
      return matchStatus && matchSearch;
    });
  }

  get registrationStatusOptions(): string[] {
    return ['ALL', ...Object.values(InscriptionStatus)];
  }

  // ── Summary counts for pills ──
  countByStatus(status: string): number {
    return this.registrations.filter(r => r.status === status).length;
  }

  // Badge on the "Registration Requests" button
  get pendingCount(): number {
    return this.countByStatus(InscriptionStatus.PENDING);
  }

  // ── Accept ──
  approveRegistration(id: number): void {
    this.registrationActionLoading[id] = true;
    this.inscriptionService.acceptInscription(id).subscribe({
      next: (updated) => {
        const idx = this.registrations.findIndex(r => r.id === id);
        if (idx !== -1) this.registrations[idx] = updated;
        this.registrationActionLoading[id] = false;
        this.loadAllEventsForStats();
      },
      error: () => { this.registrationActionLoading[id] = false; }
    });
  }

  // ── Reject ──
  rejectRegistration(id: number): void {
    this.registrationActionLoading[id] = true;
    this.inscriptionService.rejectInscription(id).subscribe({
      next: (updated) => {
        const idx = this.registrations.findIndex(r => r.id === id);
        if (idx !== -1) this.registrations[idx] = updated;
        this.registrationActionLoading[id] = false;
      },
      error: () => { this.registrationActionLoading[id] = false; }
    });
  }

  // ── Status display helpers ──
  getRegistrationStatusColor(status: string): string {
    const map: { [k: string]: string } = {
      [InscriptionStatus.PENDING]:  '#f59e0b',
      [InscriptionStatus.ACCEPTED]: '#10b981',
      [InscriptionStatus.REJECTED]: '#ef4444',
    };
    return map[status] || '#6b7280';
  }

  getRegistrationStatusIcon(status: string): string {
    const map: { [k: string]: string } = {
      [InscriptionStatus.PENDING]:  '⏳',
      [InscriptionStatus.ACCEPTED]: '✅',
      [InscriptionStatus.REJECTED]: '❌',
    };
    return map[status] || '❓';
  }

  // ══════════════════════════════════════════════════
  //  STATS
  // ══════════════════════════════════════════════════

  getEventCountByStatus(s: string): number {
    return this.events.filter(e => e.eventStatus === s).length;
  }

  // ══════════════════════════════════════════════════
  //  HELPERS CARDS
  // ══════════════════════════════════════════════════

  getCapacityPercent(event: Event): number {
    if (!event.capacity) return 0;
    return Math.round(((event.currentParticipants || 0) / event.capacity) * 100);
  }
  isEventAlmostFull(event: Event): boolean { return this.getCapacityPercent(event) >= 80; }

  getCardGradient(category: string): string {
    const g: { [k: string]: string } = {
      'CONFERENCE':       'linear-gradient(135deg,#1a0533,#2d1052,#4a1a7a)',
      'WORKSHOP':         'linear-gradient(135deg,#0a1628,#1b3a5c,#0f4c81)',
      'NETWORKING':       'linear-gradient(135deg,#0d2818,#1a4731,#0f7040)',
      'HACKATHON':        'linear-gradient(135deg,#1a0a2e,#2d1b5c,#4a2880)',
      'SEMINAR':          'linear-gradient(135deg,#1a1000,#3d2800,#6b4400)',
      'TRAINING':         'linear-gradient(135deg,#0d1f3c,#1a3a6b,#1e4d8c)',
      'TRADE_SHOW':       'linear-gradient(135deg,#1a0a0a,#3d1515,#6b2020)',
      'COMPETITION':      'linear-gradient(135deg,#0a1a0a,#1a3d1a,#1f5c1f)',
      'BUSINESS_MEETING': 'linear-gradient(135deg,#111,#2a2a2a,#3d3d3d)',
    };
    return g[category] || 'linear-gradient(135deg,#1e293b,#0f172a)';
  }

  getCapacityBarColor(p: number): string {
    if (p >= 90) return 'linear-gradient(90deg,#ef4444,#dc2626)';
    if (p >= 70) return 'linear-gradient(90deg,#f59e0b,#d97706)';
    return 'linear-gradient(90deg,#a855f7,#7c3aed)';
  }

  getCategoryIcon(c: string): string {
    const i: { [k: string]: string } = {
      'CONFERENCE':       '🎤',
      'WORKSHOP':         '🔧',
      'NETWORKING':       '🤝',
      'HACKATHON':        '💻',
      'SEMINAR':          '📚',
      'TRAINING':         '🏋️',
      'TRADE_SHOW':       '🏪',
      'COMPETITION':      '🏆',
      'BUSINESS_MEETING': '💼'
    };
    return i[c] || '📅';
  }

  getStatusColor(s: string): string {
    const c: { [k: string]: string } = {
      'PUBLISHED': '#10b981',
      'PENDING':   '#f59e0b',
      'CANCELLED': '#ef4444',
      'COMPLETED': '#6366f1'
    };
    return c[s] || '#6b7280';
  }

  // ══════════════════════════════════════════════════
  //  IMAGE UPLOAD
  // ══════════════════════════════════════════════════

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
  }
  onDragOver(e: DragEvent): void  { e.preventDefault(); e.stopPropagation(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragging = false;
    if (e.dataTransfer?.files?.[0]) this.processFile(e.dataTransfer.files[0]);
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) { this.formError = 'Image invalide.'; return; }
    if (file.size > 5 * 1024 * 1024)    { this.formError = 'Image trop lourde (max 5 Mo).'; return; }
    this.selectedFile = file; this.formError = '';
    const img = new Image(); const reader = new FileReader();
    reader.onload = (ev: any) => {
      img.src = ev.target.result;
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 1200 || h > 900) { const s = Math.min(1200/w, 900/h); w = Math.round(w*s); h = Math.round(h*s); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        let compressed = '';
        for (const q of [0.85, 0.75, 0.65, 0.55]) {
          compressed = canvas.toDataURL('image/jpeg', q);
          if (Math.round((compressed.length * 3) / 4 / 1024) <= 700) break;
        }
        const kb = Math.round((compressed.length * 3) / 4 / 1024);
        if (kb > 700) { this.formError = `Image trop lourde (${kb} KB).`; this.selectedFile = null; return; }
        this.imagePreview = compressed;
        this.eventForm.patchValue({ imageUrl: compressed });
      };
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void      { this.selectedFile = null; this.imagePreview = null; this.eventForm.patchValue({ imageUrl: '' }); }
  triggerFileInput(): void { document.getElementById('modalImageInput')?.click(); }

  // ══════════════════════════════════════════════════
  //  FORM
  // ══════════════════════════════════════════════════

  initForm(): void {
    this.submitted = false;
    this.eventForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120), noEdgeSpacesValidator, alphanumericValidator]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000), alphanumericValidator]],
      startDate:   ['', [Validators.required, futureDateValidator]],
      endDate:     ['', [Validators.required]],
      eventStatus: [EventStatus.PENDING, Validators.required],
      category:    [CategoryEvent.CONFERENCE, Validators.required],
      location:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150), locationValidator]],
      capacity:    [10, [Validators.required, Validators.min(1), Validators.max(10000), capacityValidator]],
      imageUrl:    [''],
      activities:  this.fb.array([])
    }, { validators: endAfterStartValidator });
  }

  f(name: string): AbstractControl               { return this.eventForm.get(name)!; }
  fieldInvalid(name: string): boolean            { const c = this.f(name); return c.invalid && (c.dirty || c.touched || this.submitted); }
  fieldValid(name: string): boolean              { const c = this.f(name); return c.valid  && (c.dirty || c.touched); }
  fieldError(name: string, err: string): boolean { return this.f(name).hasError(err); }
  charCount(name: string): number                { return (this.f(name).value || '').length; }
  get dateRangeInvalid(): boolean { return this.eventForm.hasError('endBeforeStart') && (this.submitted || this.f('endDate').touched); }

  get activities(): FormArray                              { return this.eventForm.get('activities') as FormArray; }
  getActivityGroup(i: number): FormGroup                  { return this.activities.at(i) as FormGroup; }
  actField(i: number, name: string): AbstractControl      { return this.getActivityGroup(i).get(name)!; }
  actFieldInvalid(i: number, name: string): boolean       { const c = this.actField(i, name); return c.invalid && (c.dirty || c.touched || this.submitted); }
  actFieldValid(i: number, name: string): boolean         { const c = this.actField(i, name); return c.valid && !!c.value && (c.dirty || c.touched); }
  actCharCount(i: number, name: string): number           { return (this.actField(i, name).value || '').length; }

  createActivityGroup(): FormGroup {
    return this.fb.group({
      idActivity:   [null],
      name:         ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), noEdgeSpacesValidator, nameOnlyValidator]],
      description:  ['', [Validators.minLength(50), Validators.maxLength(500), alphanumericValidator]],
      requirements: ['', [Validators.minLength(10), Validators.maxLength(300), alphanumericValidator]]
    });
  }
  addActivity(): void             { this.activities.push(this.createActivityGroup()); }
  removeActivity(i: number): void { this.activities.removeAt(i); }

  // ══════════════════════════════════════════════════
  //  MODAL CREATE / EDIT
  // ══════════════════════════════════════════════════

  openCreateModal(): void {
    this.isEditMode = false; this.editEventId = undefined;
    this.formSuccess = ''; this.formError = '';
    this.selectedFile = null; this.imagePreview = null;
    this.initForm(); this.showModal = true;
  }

  openEditModal(event: Event): void {
    this.isEditMode = true; this.editEventId = event.idEvent;
    this.formSuccess = ''; this.formError = '';
    this.selectedFile = null; this.imagePreview = event.imageUrl || null;
    this.initForm();
    this.eventForm.patchValue({
      title:       event.title,
      description: event.description,
      startDate:   event.startDate ? (event.startDate as string).substring(0, 16) : '',
      endDate:     event.endDate   ? (event.endDate   as string).substring(0, 16) : '',
      eventStatus: event.eventStatus,
      location:    event.location,
      capacity:    event.capacity,
      imageUrl:    event.imageUrl || '',
      category:    event.category
    });
    if (event.activities?.length) {
      event.activities.forEach(act => {
        const g = this.createActivityGroup();
        g.patchValue(act);
        this.activities.push(g);
      });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false; this.submitted = false;
    this.selectedFile = null; this.imagePreview = null;
  }

  // ══════════════════════════════════════════════════
  //  SUBMIT
  // ══════════════════════════════════════════════════

  onSubmit(): void {
    this.submitted = true; this.formSuccess = ''; this.formError = '';
    this.eventForm.markAllAsTouched();
    if (this.eventForm.invalid) { this.formError = 'Veuillez corriger les erreurs avant de sauvegarder.'; return; }

    this.formLoading = true;
    const userId = this.authService.getCurrentUserId();
    if (!userId) { this.formError = 'Vous devez être connecté.'; this.formLoading = false; return; }
    const payload = { ...this.eventForm.value, userId };

    if (this.isEditMode && this.editEventId) {
      this.eventService.updateEvent(this.editEventId, payload).subscribe({
        next: () => {
          this.formSuccess = 'Événement mis à jour avec succès !';
          this.formLoading = false;
          this.loadAllEventsForStats();
          this.loadFilteredEvents();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: () => { this.formError = 'Erreur lors de la mise à jour.'; this.formLoading = false; }
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: () => {
          this.formSuccess = 'Événement créé avec succès !';
          this.formLoading = false;
          this.loadAllEventsForStats();
          this.loadFilteredEvents();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: () => { this.formError = 'Erreur lors de la création.'; this.formLoading = false; }
      });
    }
  }
}