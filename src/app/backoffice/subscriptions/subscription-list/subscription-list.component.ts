import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-list',
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.scss'],
})
export class SubscriptionListComponent implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];
  searchTerm: string = '';
  filterType: string = 'ALL';
  sortBy: string = 'price_asc';
  loading: boolean = false;
  errorMessage: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionService.getAllSubscriptions().subscribe(
      (data: Subscription[]) => {
        this.subscriptions = data;
        this.applyFilters();
        this.loading = false;
      },
      (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Impossible de charger les plans.';
        this.loading = false;
      }
    );
  }

  applyFilters(): void {
    let result = [...this.subscriptions];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (this.filterType !== 'ALL') {
      result = result.filter((s) => s.type === this.filterType);
    }

    // Tri
    switch (this.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    this.totalPages = Math.ceil(result.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredSubscriptions = result.slice(start, start + this.itemsPerPage);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterType(type: string): void {
    this.filterType = type;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(sort: string): void {
    this.sortBy = sort;
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.applyFilters();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getTotalFiltered(): number {
    let result = [...this.subscriptions];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(term) || s.type.toLowerCase().includes(term)
      );
    }
    if (this.filterType !== 'ALL') {
      result = result.filter((s) => s.type === this.filterType);
    }
    return result.length;
  }

  getCycleLabel(cycle: string): string {
    return cycle === 'SEMESTRIELLE' ? 'SEMEST.' : 'ANNUEL';
  }

  onToggleActive(sub: Subscription): void {
    if (sub.isActive) {
      this.subscriptionService.deactivateSubscription(sub.id!).subscribe(
        () => { sub.isActive = false; },
        (error) => alert('Erreur: ' + error.message)
      );
    } else {
      this.subscriptionService.activateSubscription(sub.id!).subscribe(
        () => { sub.isActive = true; },
        (error) => alert('Erreur: ' + error.message)
      );
    }
  }

  onCreate(): void {
    this.router.navigate(['/admin/subscription/create']);
  }

  onEdit(id: number): void {
    this.router.navigate(['/admin/subscription/edit', id]);
  }

  onDelete(sub: Subscription): void {
    if (confirm(`Supprimer le plan "${sub.name}" ?`)) {
      this.subscriptionService.deleteSubscription(sub.id!).subscribe(
        () => {
          this.subscriptions = this.subscriptions.filter((s) => s.id !== sub.id);
          this.applyFilters();
        },
        (error) => alert('Erreur: ' + error.message)
      );
    }
  }
}