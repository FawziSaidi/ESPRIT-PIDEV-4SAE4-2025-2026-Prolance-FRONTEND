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
        console.error('Error:', error);
        this.errorMessage = 'Unable to load plans.';
        this.loading = false;
      }
    );
  }

  applyFilters(): void {
    let result = [...this.subscriptions];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (this.filterType !== 'ALL') {
      result = result.filter((s) => s.type === this.filterType);
    }

    // Sort
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
    return cycle === 'SEMESTRIELLE' ? 'SEMI.' : 'ANNUAL';
  }

  onToggleActive(sub: Subscription): void {
    if (sub.isActive) {
      this.subscriptionService.deactivateSubscription(sub.id!).subscribe(
        () => { sub.isActive = false; },
        (error) => alert('Error: ' + error.message)
      );
    } else {
      this.subscriptionService.activateSubscription(sub.id!).subscribe(
        () => { sub.isActive = true; },
        (error) => alert('Error: ' + error.message)
      );
    }
  }
}