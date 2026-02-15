import { Component, OnInit } from '@angular/core';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-stats',
  templateUrl: './subscription-stats.component.html',
  styleUrls: ['./subscription-stats.component.scss'],
})
export class SubscriptionStatsComponent implements OnInit {
  subscriptions: Subscription[] = [];
  loading: boolean = false;

  // KPI
  totalSubscribers: number = 0;
  monthlyRevenue: number = 0;
  cancellationRate: number = 0;
  popularPlan: string = '';
  popularPlanPercentage: number = 0;

  // Chart data
  planChartData: { name: string; subscribers: number; color: string }[] = [];
  freelancerPercentage: number = 0;
  clientPercentage: number = 0;

  // Revenue table
  revenueData: { name: string; subscribers: number; price: number; totalRevenue: number }[] = [];

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.subscriptionService.getAllSubscriptions().subscribe(
      (data: Subscription[]) => {
        this.subscriptions = data.filter((s) => s.isActive);
        this.calculateStats();
        this.loading = false;
      },
      (error) => {
        console.error('Erreur:', error);
        this.loading = false;
      }
    );
  }

  calculateStats(): void {
    // Total abonnés
    this.totalSubscribers = this.subscriptions.reduce(
      (sum, s) => sum + (s.activeSubscribersCount || 0), 0
    );

    // Revenus mensuels
    this.monthlyRevenue = this.subscriptions.reduce(
      (sum, s) => sum + (s.price * (s.activeSubscribersCount || 0)), 0
    );
    this.monthlyRevenue = Math.round(this.monthlyRevenue * 100) / 100;

    // Taux d'annulation (simulé)
    this.cancellationRate = 5.2;

    // Plan populaire
    const sorted = [...this.subscriptions].sort(
      (a, b) => (b.activeSubscribersCount || 0) - (a.activeSubscribersCount || 0)
    );
    if (sorted.length > 0) {
      this.popularPlan = sorted[0].name;
      this.popularPlanPercentage = this.totalSubscribers > 0
        ? Math.round(((sorted[0].activeSubscribersCount || 0) / this.totalSubscribers) * 100)
        : 0;
    }

    // Chart data
    const colors = ['#7c4dff', '#9c27b0', '#ff9800', '#00bcd4', '#ff5722', '#4caf50'];
    this.planChartData = this.subscriptions.map((s, i) => ({
      name: `${s.name} ${s.type.charAt(0)}.`,
      subscribers: s.activeSubscribersCount || 0,
      color: colors[i % colors.length],
    }));

    // Répartition par type
    const freelancerSubs = this.subscriptions
      .filter((s) => s.type === 'FREELANCER')
      .reduce((sum, s) => sum + (s.activeSubscribersCount || 0), 0);
    const clientSubs = this.subscriptions
      .filter((s) => s.type === 'CLIENT')
      .reduce((sum, s) => sum + (s.activeSubscribersCount || 0), 0);

    this.freelancerPercentage = this.totalSubscribers > 0
      ? Math.round((freelancerSubs / this.totalSubscribers) * 100)
      : 0;
    this.clientPercentage = 100 - this.freelancerPercentage;

    // Revenue table
    this.revenueData = sorted
      .filter((s) => (s.activeSubscribersCount || 0) > 0)
      .map((s) => ({
        name: `${s.name} ${s.type === 'FREELANCER' ? 'Freelancer' : 'Client'}`,
        subscribers: s.activeSubscribersCount || 0,
        price: s.price,
        totalRevenue: Math.round(s.price * (s.activeSubscribersCount || 0) * 100) / 100,
      }));
  }

  getBarHeight(subscribers: number): number {
    const max = Math.max(...this.planChartData.map((d) => d.subscribers), 1);
    return (subscribers / max) * 200;
  }
}