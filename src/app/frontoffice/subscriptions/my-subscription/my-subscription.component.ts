import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserSubscription } from '../../../models/user-subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-my-subscription',
  templateUrl: './my-subscription.component.html',
  styleUrls: ['./my-subscription.component.scss'],
})
export class MySubscriptionComponent implements OnInit {
  currentSubscription: UserSubscription | null = null;
  subscriptionHistory: UserSubscription[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMySubscription();
  }

  loadMySubscription(): void {
    this.loading = true;
    this.errorMessage = '';

    this.subscriptionService.getMySubscription().subscribe(
      (data: UserSubscription) => {
        this.currentSubscription = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Impossible de charger votre abonnement.';
        this.loading = false;
      }
    );
  }

  getStatusLabel(): string {
    if (!this.currentSubscription) return '';
    const statusMap: { [key: string]: string } = {
      ACTIVE: 'ACTIF',
      EXPIRED: 'EXPIRÉ',
      CANCELLED: 'ANNULÉ',
      SUSPENDED: 'SUSPENDU',
      PENDING_PAYMENT: 'EN ATTENTE',
    };
    return statusMap[this.currentSubscription.status] || this.currentSubscription.status;
  }

  getStatusClass(): string {
    if (!this.currentSubscription) return '';
    const classMap: { [key: string]: string } = {
      ACTIVE: 'status-active',
      EXPIRED: 'status-expired',
      CANCELLED: 'status-cancelled',
      SUSPENDED: 'status-suspended',
      PENDING_PAYMENT: 'status-pending',
    };
    return classMap[this.currentSubscription.status] || '';
  }

  getPlanName(): string {
    if (!this.currentSubscription?.subscription) return '';
    const sub = this.currentSubscription.subscription;
    const typeName = sub.type === 'FREELANCER' ? 'Freelancer' : 'Client';
    return `Plan ${sub.name} - ${typeName}`;
  }

  getPlanPrice(): string {
    if (!this.currentSubscription?.subscription) return '';
    const sub = this.currentSubscription.subscription;
    const cycle = sub.billingCycle === 'SEMESTRIELLE' ? 'Semestriel' : 'Annuel';
    return `${sub.price} DT / ${cycle}`;
  }

  getDaysRemaining(): number {
    if (!this.currentSubscription) return 0;
    if (this.currentSubscription.daysRemaining !== undefined) {
      return this.currentSubscription.daysRemaining;
    }
    const end = new Date(this.currentSubscription.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getProjectsPercentage(): number {
    if (!this.currentSubscription?.subscription?.maxProjects) return 0;
    return Math.round(
      (this.currentSubscription.currentProjects / this.currentSubscription.subscription.maxProjects) * 100
    );
  }

  getProposalsPercentage(): number {
    if (!this.currentSubscription?.subscription?.maxProposals) return 0;
    return Math.round(
      (this.currentSubscription.currentProposals / this.currentSubscription.subscription.maxProposals) * 100
    );
  }

  getJobsPercentage(): number {
    if (!this.currentSubscription?.subscription?.maxActiveJobs) return 0;
    return 50; // Placeholder — à remplacer par la vraie valeur
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
  }

  onChangePlan(): void {
    this.router.navigate(['/app/subscription/plans']);
  }

  onToggleAutoRenew(): void {
    if (!this.currentSubscription?.id) return;
    this.subscriptionService.toggleAutoRenew(this.currentSubscription.id).subscribe(
      (updated) => {
        if (this.currentSubscription) {
          this.currentSubscription.autoRenew = updated.autoRenew;
        }
        alert(updated.autoRenew ? '✅ Renouvellement auto activé' : '✅ Renouvellement auto désactivé');
      },
      (error) => {
        alert('❌ Erreur : ' + (error.error?.message || 'Impossible de modifier'));
      }
    );
  }

  onCancelSubscription(): void {
    if (!this.currentSubscription?.id) return;
    if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      this.subscriptionService.cancelSubscription(this.currentSubscription.id).subscribe(
        (updated) => {
          this.currentSubscription = updated;
          alert('✅ Abonnement annulé');
        },
        (error) => {
          alert('❌ Erreur : ' + (error.error?.message || 'Impossible d\'annuler'));
        }
      );
    }
  }
}