import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../frontoffice/GestionEvenement/services/event.service';
import { Event } from '../../../frontoffice/GestionEvenement/models/event.model';

@Component({
  selector: 'app-admin-events',
  templateUrl: './admin-event.component.html',
  styleUrls: ['./admin-event.component.css']
})
export class AdminEventsComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = true;
  selectedEvent?: Event;

  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';

  statusOptions = ['ALL', 'PUBLISHED', 'PENDING', 'CANCELLED', 'COMPLETED'];
  categoryOptions = ['ALL', 'CONFERENCE', 'WORKSHOP', 'NETWORKING', 'HACKATHON', 'SEMINAR', 'TRAINING', 'TRADE_SHOW', 'COMPETITION', 'BUSINESS_MEETING'];

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = this.events;

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(e => e.eventStatus === this.statusFilter);
    }

    if (this.categoryFilter !== 'ALL') {
      filtered = filtered.filter(e => e.category === this.categoryFilter);
    }

    this.filteredEvents = filtered;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.categoryFilter = category;
    this.applyFilters();
  }

  selectEvent(event: Event): void {
    this.selectedEvent = event;
  }

  closeEvent(): void {
    this.selectedEvent = undefined;
  }

  deleteEvent(event: Event): void {
    if (confirm(`Delete event "${event.title}"?`)) {
      if (event.idEvent) {
        this.eventService.deleteEvent(event.idEvent).subscribe({
          next: () => {
            this.selectedEvent = undefined;
            this.loadEvents();
          },
          error: (err) => console.error('Error deleting:', err)
        });
      }
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'CONFERENCE': '🎤',
      'WORKSHOP': '🔧',
      'NETWORKING': '🤝',
      'HACKATHON': '💻',
      'SEMINAR': '📚',
      'TRAINING': '🏋️',
      'TRADE_SHOW': '🏪',
      'COMPETITION': '🏆',
      'BUSINESS_MEETING': '💼'
    };
    return icons[category] || '📅';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PUBLISHED': '#10b981',
      'PENDING': '#f59e0b',
      'CANCELLED': '#ef4444',
      'COMPLETED': '#6366f1'
    };
    return colors[status] || '#6b7280';
  }

  getEventCountByStatus(status: string): number {
    return this.events.filter(e => e.eventStatus === status).length;
  }
}