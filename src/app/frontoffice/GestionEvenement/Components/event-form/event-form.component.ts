import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { CategoryEvent, EventStatus } from '../../models/event.model';
import { AuthService } from 'app/services/auth.services';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm!: FormGroup;
  isEditMode = false;
  eventId?: number;
  loading = false;
  successMsg = '';
  errorMsg = '';

  eventStatuses = Object.values(EventStatus);
  categories = Object.values(CategoryEvent);

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute,
     private authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.eventId = +params['id'];
        this.loadEvent(this.eventId);
      }
    });
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      startDate:   ['', Validators.required],
      endDate:     ['', Validators.required],
      eventStatus: [EventStatus.PENDING, Validators.required],
      location:    ['', Validators.required],
      capacity:    [10, [Validators.required, Validators.min(1)]],
      imageUrl:    [''],
      category:    [CategoryEvent.CONFERENCE, Validators.required],
      activities:  this.fb.array([])
    });
  }

  get activities(): FormArray {
    return this.eventForm.get('activities') as FormArray;
  }

  // Retourne le FormGroup d'une activité à l'index donné
  getActivityGroup(index: number): FormGroup {
    return this.activities.at(index) as FormGroup;
  }

  createActivityGroup(): FormGroup {
    return this.fb.group({
      idActivity:      [null],
      name:           ['', Validators.required],
      description:     [''],
      requirements: ['', Validators.required],
      maxParticipants: [10, [Validators.required, Validators.min(1)]]
    });
  }

  addActivity(): void {
    this.activities.push(this.createActivityGroup());
  }

  removeActivity(index: number): void {
    this.activities.removeAt(index);
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.eventForm.patchValue({
          title:       event.title,
          description: event.description,
          startDate:   event.startDate?.substring(0, 16),
          endDate:     event.endDate?.substring(0, 16),
          eventStatus: event.eventStatus,
          location:    event.location,
          capacity:    event.capacity,
          imageUrl:    event.imageUrl,
          category:    event.category
        });
        // Remplir les activités existantes
        if (event.activities && event.activities.length > 0) {
          event.activities.forEach(act => {
            const group = this.createActivityGroup();
            group.patchValue({
              idActivity:      act.idActivity,
              name:           act.name,
              description:     act.description,
              requirements:    act.requirements,
              maxParticipants: act.maxParticipants
            });
            this.activities.push(group);
          });
        }
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement de l\'événement.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

     // Get current user from localStorage

     const userId = this.authService.getCurrentUserId();
 

  if (!userId) {
    this.errorMsg = 'Vous devez être connecté pour créer un événement.';
    this.loading = false;
    this.router.navigate(['/login']);
    return;
  }

  const formValue = {
    ...this.eventForm.value,
    userId: userId
  };

  console.log('Payload envoyé:', JSON.stringify(formValue, null, 2));

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, formValue).subscribe({
        next: () => {
          this.successMsg = 'Événement modifié avec succès !';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/app/events']), 1500);
        },
        error: () => {
          this.errorMsg = 'Erreur lors de la modification.';
          this.loading = false;
        }
      });
    } else {
      this.eventService.createEvent(formValue).subscribe({
        next: () => {
          this.successMsg = 'Événement créé avec succès !';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/app/events']), 1500);
        },
        error: () => {
          this.errorMsg = 'Erreur lors de la création.';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/app/events']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}