import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-form',
  templateUrl: './subscription-form.component.html',
  styleUrls: ['./subscription-form.component.scss'],
})
export class SubscriptionFormComponent implements OnInit {
  subscription: Subscription = {
    name: '',
    type: 'FREELANCER',
    price: 0,
    billingCycle: 'SEMESTRIELLE',
    description: '',
    maxProjects: 0,
    maxProposals: 0,
    maxActiveJobs: 0,
    featuredListing: false,
    prioritySupport: false,
    analyticsAccess: false,
    isActive: true,
  };

  isEditMode: boolean = false;
  editId: number | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  formErrors: { [key: string]: string } = {};

  constructor(
    private subscriptionService: SubscriptionService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = +id;
      this.loadSubscription(this.editId);
    }
  }

  loadSubscription(id: number): void {
    this.loading = true;
    this.subscriptionService.getSubscriptionById(id).subscribe(
      (data) => {
        this.subscription = data;
        this.loading = false;
      },
      (error) => {
        this.errorMessage = 'Impossible de charger le plan.';
        this.loading = false;
      }
    );
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.subscription.name || this.subscription.name.length < 3 || this.subscription.name.length > 50) {
      this.formErrors['name'] = 'Le nom doit contenir entre 3 et 50 caractères';
    }

    if (!this.subscription.price || this.subscription.price <= 0) {
      this.formErrors['price'] = 'Le prix doit être supérieur à 0';
    }

    if (!this.subscription.type) {
      this.formErrors['type'] = 'Sélectionnez un type';
    }

    if (!this.subscription.billingCycle) {
      this.formErrors['billingCycle'] = 'Sélectionnez un cycle de facturation';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.loading = true;

    if (this.isEditMode && this.editId) {
      this.subscriptionService.updateSubscription(this.editId, this.subscription).subscribe(
        () => {
          alert('✅ Plan modifié avec succès !');
          this.router.navigate(['/admin/subscription/list']);
        },
        (error) => {
          this.errorMessage = 'Erreur lors de la modification.';
          this.loading = false;
        }
      );
    } else {
      this.subscriptionService.createSubscription(this.subscription).subscribe(
        () => {
          alert('✅ Plan créé avec succès !');
          this.router.navigate(['/admin/subscription/list']);
        },
        (error) => {
          this.errorMessage = 'Erreur lors de la création.';
          this.loading = false;
        }
      );
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/subscription/list']);
  }
}