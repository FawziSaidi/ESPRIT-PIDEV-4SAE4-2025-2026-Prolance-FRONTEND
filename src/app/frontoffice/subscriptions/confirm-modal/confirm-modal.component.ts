import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from '../../../models/subscription.model';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Input() plan: Subscription | null = null;
  @Input() selectedType: string = 'FREELANCER';
  @Input() isVisible: boolean = false;

  /** Emits { plan, autoRenew } — matches what PlansCatalog expects */
  @Output() confirmed = new EventEmitter<{
    plan: Subscription;
    autoRenew: boolean;
  }>();
  @Output() cancelled = new EventEmitter<void>();

  autoRenew = true;
  isProcessing = false;

  // ════════════════════════════
  //  COMPUTED PRICES
  // ════════════════════════════

  get subtotal(): number {
    return this.plan?.price || 0;
  }

  get tva(): number {
    return Math.round(this.subtotal * 0.19 * 100) / 100;
  }

  get total(): number {
    return Math.round((this.subtotal + this.tva) * 100) / 100;
  }

  // ════════════════════════════
  //  HELPERS
  // ════════════════════════════

  getDuration(): string {
    if (!this.plan) return '';
    return this.plan.billingCycle === 'SEMESTRIELLE' ? '6 mois' : '12 mois';
  }

  getTypeName(): string {
    return this.selectedType === 'CLIENT' ? 'Client' : 'Freelancer';
  }

  getFeaturesSummary(): string[] {
    if (!this.plan) return [];
    const features: string[] = [];
    if (this.plan.maxProjects) {
      features.push(
        (this.plan.maxProjects ?? 0) >= 999
          ? 'Projets illimités'
          : `${this.plan.maxProjects} projets`
      );
    }
    if (this.plan.maxProposals) {
      features.push(
        (this.plan.maxProposals ?? 0) >= 999
          ? 'Propositions illimitées'
          : `${this.plan.maxProposals} propositions`
      );
    }
    if (this.plan.prioritySupport) features.push('Support prioritaire');
    if (this.plan.analyticsAccess) features.push('Analytics');
    return features;
  }

  // ════════════════════════════
  //  ACTIONS
  // ════════════════════════════

  onConfirm(): void {
    if (this.plan && !this.isProcessing) {
      this.isProcessing = true;
      this.confirmed.emit({
        plan: this.plan,
        autoRenew: this.autoRenew,
      });
      setTimeout(() => (this.isProcessing = false), 1000);
    }
  }

  onCancel(): void {
    if (!this.isProcessing) {
      this.cancelled.emit();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }
}