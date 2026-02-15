import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Subscription } from '../../../models/subscription.model';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent implements OnInit {
  @Input() plan: Subscription | null = null;
  @Input() selectedType: string = 'freelancer';
  @Input() isVisible: boolean = false;
  @Output() confirmed = new EventEmitter<{ plan: Subscription; autoRenew: boolean }>();
  @Output() cancelled = new EventEmitter<void>();

  autoRenew: boolean = true;
  subtotal: number = 0;
  tva: number = 0;
  total: number = 0;

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.plan) {
      this.calculatePrices();
    }
  }

  calculatePrices(): void {
    if (this.plan) {
      this.subtotal = this.plan.price;
      this.tva = Math.round(this.plan.price * 0.19 * 100) / 100;
      this.total = Math.round((this.subtotal + this.tva) * 100) / 100;
    }
  }

  getDuration(): string {
    if (!this.plan) return '';
    return this.plan.billingCycle === 'SEMESTRIELLE' ? '6 mois' : 'an';
  }

  getTypeName(): string {
    return this.selectedType === 'client' ? 'Client' : 'Freelancer';
  }

  getFeaturesSummary(): string {
    if (!this.plan) return '';
    const parts: string[] = [];
    if (this.plan.maxProjects) {
      parts.push(this.plan.maxProjects >= 999 ? 'Projets illimités' : `${this.plan.maxProjects} projets`);
    }
    if (this.plan.maxProposals) {
      parts.push(this.plan.maxProposals >= 999 ? 'Propositions illimitées' : `${this.plan.maxProposals} propositions`);
    }
    if (this.plan.prioritySupport) {
      parts.push('Support prioritaire');
    } else {
      parts.push('Support email');
    }
    return parts.join(' | ');
  }

  onConfirm(): void {
    if (this.plan) {
      this.confirmed.emit({ plan: this.plan, autoRenew: this.autoRenew });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }
}