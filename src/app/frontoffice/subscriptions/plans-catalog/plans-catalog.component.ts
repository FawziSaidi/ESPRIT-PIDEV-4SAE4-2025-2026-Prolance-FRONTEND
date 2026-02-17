import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription as RxSubscription } from 'rxjs';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';
import { RoleService } from '../../../services/role.service';

@Component({
  selector: 'app-plans-catalog',
  templateUrl: './plans-catalog.component.html',
  styleUrls: ['./plans-catalog.component.scss'],
})
export class PlansCatalogComponent implements OnInit, OnDestroy {
  plans: Subscription[] = [];
  filteredPlans: Subscription[] = [];
  selectedType: 'FREELANCER' | 'CLIENT' = 'FREELANCER';
  billingCycle: 'SEMESTRIELLE' | 'ANNUELLE' = 'SEMESTRIELLE';
  loading = false;
  errorMessage = '';
  showModal = false;
  selectedPlan: Subscription | null = null;

  private roleSub!: RxSubscription;

  constructor(
    private subscriptionService: SubscriptionService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    // ✅ Réagit au clic FREELANCER/CLIENT de la navbar automatiquement
    this.roleSub = this.roleService.role$.subscribe(role => {
      this.selectedType = role; // déjà 'FREELANCER' | 'CLIENT' en majuscules
      this.loadPlans();
    });
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
  }

  loadPlans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.subscriptionService.getSubscriptionsByType(this.selectedType).subscribe(
      (data: Subscription[]) => {
        this.plans = data.filter(p => p.isActive);
        this.filterPlans();
        this.loading = false;
      },
      (error) => {
        console.error('Erreur chargement des plans:', error);
        this.errorMessage = 'Impossible de charger les plans. Vérifiez que le serveur backend est lancé.';
        this.plans = [];
        this.filteredPlans = [];
        this.loading = false;
      }
    );
  }

  setBillingCycle(cycle: 'SEMESTRIELLE' | 'ANNUELLE'): void {
    this.billingCycle = cycle;
    this.filterPlans();
  }

  filterPlans(): void {
    this.filteredPlans = this.plans.filter(p => p.billingCycle === this.billingCycle);
  }

  getFeatures(plan: Subscription): string[] {
    const features: string[] = [];
    if (this.selectedType === 'CLIENT') {
      if (plan.maxProjects) features.push(plan.maxProjects >= 999 ? 'Offres illimitées' : `${plan.maxProjects} offres d'emploi`);
      if (plan.maxProposals) features.push(plan.maxProposals >= 999 ? 'Propositions illimitées' : `${plan.maxProposals} propositions`);
      if (plan.featuredListing) features.push('Matching IA');
      if (plan.maxActiveJobs) features.push(plan.maxActiveJobs >= 999 ? 'Équipe multi-users' : `${plan.maxActiveJobs} recrutements`);
      if (plan.analyticsAccess) features.push('Dashboard analytics');
      features.push(plan.prioritySupport ? 'Support 24/7' : 'Support email');
      if (plan.maxProjects && plan.maxProjects >= 999) {
        features.push('API access');
        features.push('Manager dédié');
        features.push('Analytics avancé');
      }
    } else {
      if (plan.maxProjects) features.push(plan.maxProjects >= 999 ? 'Projets illimités' : `${plan.maxProjects} projets max`);
      if (plan.maxProposals) features.push(`${plan.maxProposals} propositions`);
      if (plan.maxActiveJobs) features.push(`${plan.maxActiveJobs} jobs actifs`);
      features.push(plan.featuredListing ? 'Profil premium' : 'Profil basique');
      features.push(plan.prioritySupport ? 'Support prioritaire' : 'Support email');
      if (plan.analyticsAccess) features.push('Analytics complet');
    }
    return features;
  }

  getDuration(plan: Subscription): string {
    return plan.billingCycle === 'SEMESTRIELLE' ? '6 mois' : 'an';
  }

  isPopular(plan: Subscription): boolean {
    return plan.name === 'Pro' || plan.name === 'Business';
  }

  onSubscribe(plan: Subscription): void {
    this.selectedPlan = plan;
    this.showModal = true;
  }

  onModalConfirmed(event: { plan: Subscription; autoRenew: boolean }): void {
    this.showModal = false;
    this.selectedPlan = null;
    this.subscriptionService.subscribe(event.plan.id!, event.autoRenew).subscribe(
      () => alert('✅ Abonnement réussi ! Bienvenue dans le plan ' + event.plan.name),
      (error) => alert('❌ Erreur : ' + (error.error?.message || 'Impossible de souscrire. Réessayez.'))
    );
  }

  onModalCancelled(): void {
    this.showModal = false;
    this.selectedPlan = null;
  }
}