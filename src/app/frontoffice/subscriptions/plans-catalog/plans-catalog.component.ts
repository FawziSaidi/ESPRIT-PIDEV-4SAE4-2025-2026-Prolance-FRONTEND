import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription as RxSubscription } from 'rxjs';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';
import { RoleService } from '../../../services/role.service';
import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
} from '@angular/animations';

@Component({
  selector: 'app-plans-catalog',
  templateUrl: './plans-catalog.component.html',
  styleUrls: ['./plans-catalog.component.scss'],
  animations: [
    trigger('staggerCards', [
      transition(':enter', [
        query(
          '.plan-card',
          [
            style({ opacity: 0, transform: 'translateY(40px) scale(0.95)' }),
            stagger(120, [
              animate(
                '500ms cubic-bezier(0.23, 1, 0.32, 1)',
                style({ opacity: 1, transform: 'translateY(0) scale(1)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
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
  showComparison = false;

  private roleSub!: RxSubscription;

  constructor(
    private subscriptionService: SubscriptionService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.roleSub = this.roleService.role$.subscribe((role) => {
      this.selectedType = role;
      this.loadPlans();
    });
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
  }

  // ========================
  // DATA
  // ========================

  loadPlans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.subscriptionService.getSubscriptionsByType(this.selectedType).subscribe(
      (data: Subscription[]) => {
        this.plans = data.filter((p) => p.isActive);
        this.filterPlans();
        this.loading = false;
      },
      (error) => {
        console.error('Erreur chargement des plans:', error);
        this.errorMessage =
          'Impossible de charger les plans. Vérifiez votre connexion.';
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
    this.filteredPlans = this.plans.filter(
      (p) => p.billingCycle === this.billingCycle
    );
  }

  toggleComparison(): void {
    this.showComparison = !this.showComparison;
  }

  // ========================
  // FEATURES
  // ========================

  getFeatures(plan: Subscription): { text: string; highlight: boolean }[] {
    const features: { text: string; highlight: boolean }[] = [];

    if (this.selectedType === 'CLIENT') {
      if (plan.maxProjects)
        features.push({
          text:
            plan.maxProjects >= 999
              ? 'Offres illimitées'
              : `${plan.maxProjects} offres d'emploi`,
          highlight: (plan.maxProjects ?? 0) >= 999,
        });
      if (plan.maxProposals)
        features.push({
          text:
            plan.maxProposals >= 999
              ? 'Propositions illimitées'
              : `${plan.maxProposals} propositions`,
          highlight: (plan.maxProposals ?? 0) >= 999,
        });
      if (plan.featuredListing)
        features.push({ text: 'Matching IA avancé', highlight: true });
      if (plan.maxActiveJobs)
        features.push({
          text:
            plan.maxActiveJobs >= 999
              ? 'Équipe multi-users'
              : `${plan.maxActiveJobs} recrutements actifs`,
          highlight: false,
        });
      if (plan.analyticsAccess)
        features.push({ text: 'Dashboard analytics', highlight: true });
      features.push({
        text: plan.prioritySupport
          ? 'Support prioritaire 24/7'
          : 'Support par email',
        highlight: plan.prioritySupport,
      });
      if (plan.maxProjects && plan.maxProjects >= 999) {
        features.push({ text: 'API access', highlight: true });
        features.push({ text: 'Manager dédié', highlight: true });
      }
    } else {
      // FREELANCER
      if (plan.maxProjects)
        features.push({
          text:
            plan.maxProjects >= 999
              ? 'Projets illimités'
              : `${plan.maxProjects} projets max`,
          highlight: (plan.maxProjects ?? 0) >= 999,
        });
      if (plan.maxProposals)
        features.push({
          text:
            plan.maxProposals >= 999
              ? 'Propositions illimitées'
              : `${plan.maxProposals} propositions/mois`,
          highlight: (plan.maxProposals ?? 0) >= 999,
        });
      if (plan.maxActiveJobs)
        features.push({
          text: `${plan.maxActiveJobs} jobs actifs simultanés`,
          highlight: false,
        });
      features.push({
        text: plan.featuredListing ? 'Profil mis en avant' : 'Profil standard',
        highlight: plan.featuredListing,
      });
      features.push({
        text: plan.prioritySupport ? 'Support prioritaire' : 'Support email',
        highlight: plan.prioritySupport,
      });
      if (plan.analyticsAccess)
        features.push({ text: 'Analytics & statistiques', highlight: true });
    }
    return features;
  }

  // ========================
  // HELPERS
  // ========================

  getDuration(plan: Subscription): string {
    return plan.billingCycle === 'SEMESTRIELLE' ? '6 mois' : 'an';
  }

  getMonthlyPrice(plan: Subscription): string {
    const months = plan.billingCycle === 'SEMESTRIELLE' ? 6 : 12;
    return (plan.price / months).toFixed(1);
  }

  isPopular(plan: Subscription): boolean {
    return plan.name === 'Pro' || plan.name === 'Business';
  }

  getPlanTier(plan: Subscription): 'starter' | 'pro' | 'elite' {
    if (plan.name === 'Starter' || plan.name === 'Basic') return 'starter';
    if (plan.name === 'Elite' || plan.name === 'Enterprise') return 'elite';
    return 'pro';
  }

  getPlanIcon(plan: Subscription): string {
    const tier = this.getPlanTier(plan);
    if (tier === 'starter') return '🚀';
    if (tier === 'pro') return '⚡';
    return '👑';
  }

  getSavingsPercent(plan: Subscription): number | null {
    if (plan.billingCycle !== 'ANNUELLE') return null;
    const semPlan = this.plans.find(
      (p) => p.name === plan.name && p.billingCycle === 'SEMESTRIELLE'
    );
    if (!semPlan) return null;
    const annualFromSem = semPlan.price * 2;
    if (annualFromSem <= plan.price) return null;
    return Math.round(((annualFromSem - plan.price) / annualFromSem) * 100);
  }

  // ========================
  // ACTIONS
  // ========================

  onSubscribe(plan: Subscription): void {
    this.selectedPlan = plan;
    this.showModal = true;
  }

  onModalConfirmed(event: { plan: Subscription; autoRenew: boolean }): void {
    this.showModal = false;
    this.selectedPlan = null;

    this.subscriptionService
      .subscribe(event.plan.id!, event.autoRenew)
      .subscribe(
        () =>
          alert(
            '✅ Abonnement réussi ! Bienvenue dans le plan ' + event.plan.name
          ),
        (error) =>
          alert(
            '❌ Erreur : ' +
              (error.error?.message || 'Impossible de souscrire.')
          )
      );
  }

  onModalCancelled(): void {
    this.showModal = false;
    this.selectedPlan = null;
  }
}