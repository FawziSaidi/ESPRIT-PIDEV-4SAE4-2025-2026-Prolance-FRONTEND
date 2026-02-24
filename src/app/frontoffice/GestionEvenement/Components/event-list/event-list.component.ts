import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../models/event.model';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../../../services/auth.services';
import { CategoryEvent, EventStatus } from '../../models/event.model';
import { InscriptionService } from '../../services/inscription.service';
import { EventInscriptionRequestDTO, EventInscriptionResponseDTO } from '../../models/inscription.model';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {

  events:         Event[] = [];
  filteredEvents: Event[] = [];
  loading    = false;
  errorMsg   = '';
  successMsg = '';

  searchText     = '';
  filterCategory = '';
  filterStatus   = '';

  selectedEvent:    Event | null = null;
  inscriptionEvent: Event | null = null;
  currentUserId: number = 0;

  userInscriptions: EventInscriptionResponseDTO[] = [];

  eventStatuses = Object.values(EventStatus);
  categories    = Object.values(CategoryEvent);

  constructor(
    private eventService: EventService,
    private inscriptionService: InscriptionService,
    private router:       Router,
    private authService:  AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = (this.authService.getCurrentUser() as any)?.userId
                      ?? (this.authService.getCurrentUser() as any)?.id
                      ?? 0;
    this.loadEvents();
    this.loadUserInscriptions();
  }

  loadUserInscriptions(): void {
    if (!this.currentUserId) return;
    this.inscriptionService.getMesInscriptions(this.currentUserId).subscribe({
      next: (data) => { this.userInscriptions = data; },
      error: () => {}
    });
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events         = data;
        this.filteredEvents = data;
        this.loading        = false;
        this.applyFilters();
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement des evenements.';
        this.loading  = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredEvents = this.events.filter(e => {
      const matchSearch =
        !this.searchText ||
        e.title?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        e.location?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchCat    = !this.filterCategory || e.category    === this.filterCategory;
      const matchStatus = !this.filterStatus   || e.eventStatus === this.filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }

  resetFilters(): void {
    this.searchText     = '';
    this.filterCategory = '';
    this.filterStatus   = '';
    this.filteredEvents = [...this.events];
  }

  participerEvent(event: Event): void {
    this.selectedEvent    = null;
    this.inscriptionEvent = event;
  }

  closeInscriptionModal(): void {
    this.inscriptionEvent = null;
  }

  onInscriptionSuccess(payload: EventInscriptionRequestDTO): void {
    this.closeInscriptionModal();
    this.successMsg = 'Votre demande d\'inscription a bien été envoyée !';
    this.loadUserInscriptions();
    setTimeout(() => this.successMsg = '', 4000);
  }

  openModal(event: Event): void {
    this.selectedEvent = event;
  }

  closeModal(): void {
    this.selectedEvent = null;
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  /**
   * Retourne le statut d'inscription de l'utilisateur pour un événement donné.
   * null = pas encore inscrit
   */
  getUserInscriptionStatus(eventId: number): string | null {
    const found = this.userInscriptions.find(i => i.eventId === eventId);
    return found ? found.status : null;
  }

  /**
   * Le bouton "Participer" est disabled si l'utilisateur a une inscription PENDING ou ACCEPTED.
   * Il reste actif si REJECTED (peut re-soumettre) ou null (jamais inscrit).
   */
  isParticipateDisabled(eventId: number): boolean {
    const status = this.getUserInscriptionStatus(eventId);
    return status === 'PENDING' || status === 'ACCEPTED';
  }

  /**
   * Texte et icône du bouton selon le statut.
   */
  getParticipateLabel(eventId: number): string {
    const status = this.getUserInscriptionStatus(eventId);
    if (status === 'PENDING')  return '⏳ En attente';
    if (status === 'ACCEPTED') return '✅ Inscrit';
    if (status === 'REJECTED') return '↩ Re-soumettre';
    return 'Participer';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PUBLISHED: 'status-active',
      PENDING:   'status-pending',
      CANCELLED: 'status-cancelled',
      COMPLETED: 'status-completed'
    };
    return map[status] || 'status-pending';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDateOnly(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}