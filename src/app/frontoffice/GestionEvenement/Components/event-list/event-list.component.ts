import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../models/event.model';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';
  expandedEventId: number | null = null;

  constructor(private eventService: EventService, private router: Router) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement des événements.';
        this.loading = false;
      }
    });
  }

  goToCreate(): void {
    this.router.navigate(['/app/events/create']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/app/events/edit', id]);
  }

  deleteEvent(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement et toutes ses activités ?')) return;
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        this.successMsg = 'Événement supprimé avec succès.';
        this.loadEvents();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => {
        this.errorMsg = 'Erreur lors de la suppression.';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  toggleActivities(eventId: number): void {
    this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'status-active',
      PENDING: 'status-pending',
      CANCELLED: 'status-cancelled',
      COMPLETED: 'status-completed'
    };
    return map[status] || 'status-pending';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}