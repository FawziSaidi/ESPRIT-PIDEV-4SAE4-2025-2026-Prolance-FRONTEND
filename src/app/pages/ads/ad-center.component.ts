import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.services';
import { AdsService } from '../../services/ads.service';
import { AdPlan, AdCampaign, CampaignStatus, AdType, RoleType, CreateCampaignRequest } from './models/ad.models';

declare var Chart: any;

@Component({
  selector: 'app-ad-center',
  templateUrl: './ad-center.component.html',
  styleUrls: ['./ad-center.component.scss']
})
export class AdCenterComponent implements OnInit, OnDestroy, AfterViewInit {
  // ── Role (auto-detected from JWT) ──
  currentRole: RoleType = 'FREELANCER';

  // ── Role-Based Color Palette ──
  readonly ROLE_COLORS: Record<RoleType, any> = {
    FREELANCER: {
      primary: '#9c27b0',
      primaryLight: '#ab47bc',
      primaryDark: '#8e24aa',
      gradient: 'linear-gradient(135deg, #ab47bc, #8e24aa)',
      rgbaFill: 'rgba(156, 39, 176, 0.10)',
      rgbaFillLight: 'rgba(156, 39, 176, 0.04)',
      secondary: '#7b1fa2',
      cardHeaderClass: 'card-header-primary'
    },
    CLIENT: {
      primary: '#00897b',
      primaryLight: '#26a69a',
      primaryDark: '#00796b',
      gradient: 'linear-gradient(135deg, #26a69a, #00796b)',
      rgbaFill: 'rgba(0, 137, 123, 0.10)',
      rgbaFillLight: 'rgba(0, 137, 123, 0.04)',
      secondary: '#00695c',
      cardHeaderClass: 'card-header-info'
    }
  };

  // ── Loading / Empty / Toast State ──
  isLoading = false;
  plansLoading = false;
  plansError = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  private toastTimer: any;

  // ── Modal State ──
  showCreateModal = false;
  modalStep = 1;
  isEditing = false;
  editingCampaignId: number | null = null;

  // ── Delete Confirm ──
  showDeleteConfirm = false;
  deletingCampaignId: number | null = null;

  // ── Form Fields ──
  selectedPlanId: number | null = null;
  formTitle = '';
  formDescription = '';
  formImageUrl = '';
  formTargetUrl = '';
  formImageFileName = '';

  // ── KPI Stats ──
  stats = {
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0,
    remainingBudget: 0
  };

  // ── Ad Plans (loaded from backend) ──
  adPlans: AdPlan[] = [];

  // ── Campaigns (loaded from backend) ──
  campaigns: AdCampaign[] = [];

  // ── Chart References ──
  @ViewChild('perfChart', { static: false }) perfChartRef!: ElementRef<HTMLCanvasElement>;
  private perfChartInstance: any = null;

  // Market Insights Charts
  @ViewChild('reachChart', { static: false }) reachChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionChart', { static: false }) conversionChartRef!: ElementRef<HTMLCanvasElement>;
  private reachChartInstance: any = null;
  private conversionChartInstance: any = null;

  constructor(private authService: AuthService, private adsService: AdsService) {}

  ngOnInit(): void {
    // Auto-detect role from JWT — no manual toggle
    const role = this.authService.getRole();
    if (role === 'FREELANCER' || role === 'CLIENT') {
      this.currentRole = role;
    }
    this.loadPlans();
    this.loadCampaigns();
  }

  ngAfterViewInit(): void {
    this.initPerformanceChart();
    this.initMarketInsightsCharts();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.perfChartInstance) {
      this.perfChartInstance.destroy();
    }
    if (this.reachChartInstance) {
      this.reachChartInstance.destroy();
    }
    if (this.conversionChartInstance) {
      this.conversionChartInstance.destroy();
    }
  }

  // ═══════════════════════════════════════════════
  // ROLE-AWARE ACCESSORS
  // ═══════════════════════════════════════════════

  get roleColors() {
    return this.ROLE_COLORS[this.currentRole];
  }

  get roleCardHeaderClass(): string {
    return this.roleColors.cardHeaderClass;
  }

  // ── Plans filtered by active role ──
  get rolePlans(): AdPlan[] {
    return this.adPlans.filter(p => p.roleType === this.currentRole);
  }

  // ── Campaigns — no filter needed, backend returns only user's campaigns ──
  get roleCampaigns(): AdCampaign[] {
    return this.campaigns;
  }

  // ── Plan Tier Label ──
  getPlanTier(plan: AdPlan): string {
    if (plan.location === 'LANDING_PAGE') return 'Elite';
    if (plan.location === 'SEARCH_SIDEBAR' || plan.name.toLowerCase().includes('feed banner')) return 'Pro';
    return 'Starter';
  }

  // ── Dynamic Performance Section Headers ──
  get perfTitle(): string {
    return this.currentRole === 'FREELANCER' ? 'Profile Performance' : 'Jobs Visibility';
  }

  get perfCategory(): string {
    return this.currentRole === 'FREELANCER'
      ? 'How many times your profile was featured'
      : 'Reach of your promoted job postings';
  }

  // ═══════════════════════════════════════════════
  // STATUS & UI HELPERS
  // ═══════════════════════════════════════════════

  statusBadgeClass(status: CampaignStatus): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'ACTIVE': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      case 'EXPIRED': return 'badge-expired';
      default: return '';
    }
  }

  // ═══════════════════════════════════════════════
  // CRUD — CREATE  (HttpClient-ready)
  // ═══════════════════════════════════════════════

  openCreateModal(): void {
    this.isEditing = false;
    this.editingCampaignId = null;
    this.resetForm();
    this.modalStep = 1;
    this.showCreateModal = true;
  }

  // ═══════════════════════════════════════════════
  // CRUD — UPDATE  (HttpClient-ready)
  // ═══════════════════════════════════════════════

  openEditModal(campaign: AdCampaign): void {
    this.isEditing = true;
    this.editingCampaignId = campaign.id;
    this.selectedPlanId = campaign.planId;
    this.formTitle = campaign.title;
    this.formDescription = campaign.description;
    this.formImageUrl = campaign.imageUrl;
    this.formTargetUrl = campaign.targetUrl;
    this.formImageFileName = 'existing-image.jpg';
    this.modalStep = 2;
    this.showCreateModal = true;
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  // ── Step Navigation ──
  nextStep(): void {
    if (this.modalStep < 3) this.modalStep++;
  }

  prevStep(): void {
    if (this.modalStep > 1) this.modalStep--;
  }

  goToStep(step: number): void {
    if (step <= this.modalStep || this.canGoToStep(step)) {
      this.modalStep = step;
    }
  }

  canGoToStep(step: number): boolean {
    if (step === 2) return this.selectedPlanId !== null;
    if (step === 3) return this.selectedPlanId !== null && this.formTitle.trim() !== '' && this.formDescription.trim() !== '';
    return true;
  }

  // ── Select Plan ──
  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
  }

  get selectedPlan(): AdPlan | undefined {
    return this.adPlans.find(p => p.id === this.selectedPlanId);
  }

  // ── Mock Image Upload ──
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.formImageFileName = file.name;
      // Mock: generate a placeholder URL based on the plan
      const plan = this.selectedPlan;
      const color = plan?.type === 'BANNER' ? '00bcd4' : plan?.type === 'JOB_BOOST' ? 'ff9800' : '9c27b0';
      this.formImageUrl = `https://placehold.co/300x150/${color}/white?text=${encodeURIComponent(this.formTitle || 'Ad+Preview')}`;
    }
  }

  submitCampaign(): void {
    const plan = this.selectedPlan;
    if (!plan) return;

    const colorHex = this.roleColors.primary.replace('#', '');
    const payload: CreateCampaignRequest = {
      planId: plan.id,
      title: this.formTitle,
      description: this.formDescription,
      imageUrl: this.formImageUrl || `https://placehold.co/300x150/${colorHex}/white?text=${encodeURIComponent(this.formTitle)}`,
      targetUrl: this.formTargetUrl,
      roleType: this.currentRole
    };

    if (this.isEditing && this.editingCampaignId !== null) {
      this.adsService.updateCampaign(this.editingCampaignId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.displayToast('Campaign updated successfully!', 'success');
          this.loadCampaigns();
        },
        error: () => {
          this.closeModal();
          this.displayToast('Failed to update campaign. Please try again.', 'error');
        }
      });
    } else {
      this.adsService.createCampaign(payload).subscribe({
        next: () => {
          this.closeModal();
          this.displayToast('Campaign created! It is now pending approval.', 'success');
          this.loadCampaigns();
        },
        error: () => {
          this.closeModal();
          this.displayToast('Failed to create campaign. Please try again.', 'error');
        }
      });
    }
  }

  private displayToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 4000);
  }

  // ═══════════════════════════════════════════════
  // CRUD — DELETE  (HttpClient-ready)
  // ═══════════════════════════════════════════════

  /**
   * Ready for HttpClient: replace with
   *   this.http.delete(`/api/campaigns/${id}`)
   */
  confirmDelete(campaignId: number): void {
    this.deletingCampaignId = campaignId;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingCampaignId = null;
  }

  deleteCampaign(): void {
    if (this.deletingCampaignId !== null) {
      const id = this.deletingCampaignId;
      this.showDeleteConfirm = false;
      this.deletingCampaignId = null;
      this.adsService.deleteCampaign(id).subscribe({
        next: () => {
          this.displayToast('Campaign deleted.', 'success');
          this.loadCampaigns();
        },
        error: () => {
          this.displayToast('Failed to delete campaign.', 'error');
        }
      });
    } else {
      this.showDeleteConfirm = false;
      this.deletingCampaignId = null;
    }
  }

  canEdit(campaign: AdCampaign): boolean {
    return campaign.status === 'PENDING' || campaign.status === 'REJECTED';
  }

  // ═══════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════

  private loadCampaigns(): void {
    this.isLoading = true;
    this.adsService.getMyCampaigns().subscribe({
      next: (data) => {
        this.campaigns = data;
        this.recalcStats();
        this.isLoading = false;
      },
      error: () => {
        this.campaigns = [];
        this.recalcStats();
        this.isLoading = false;
      }
    });
  }

  private loadPlans(): void {
    this.plansLoading = true;
    this.plansError = false;
    this.adsService.getPlans().subscribe({
      next: (plans) => {
        const iconMap: Record<string, string> = {
          'FEATURED_PROFILE': 'person_pin', 'BANNER': 'panorama',
          'JOB_BOOST': 'work_outline'
        };
        this.adPlans = plans.map(p => ({ ...p, icon: iconMap[p.type] || 'campaign' }));
        this.plansLoading = false;
      },
      error: () => {
        this.adPlans = [];
        this.plansLoading = false;
        this.plansError = true;
      }
    });
  }

  private recalcStats(): void {
    const visible = this.roleCampaigns;
    this.stats.activeAds = visible.filter(c => c.status === 'ACTIVE').length;
    this.stats.totalImpressions = visible.reduce((sum, c) => sum + (c.views || 0), 0);
    this.stats.totalClicks = visible.reduce((sum, c) => sum + (c.clicks || 0), 0);
    this.stats.remainingBudget = this.currentRole === 'FREELANCER' ? 1520 : 3200;
  }

  private resetForm(): void {
    this.selectedPlanId = null;
    this.formTitle = '';
    this.formDescription = '';
    this.formImageUrl = '';
    this.formTargetUrl = '';
    this.formImageFileName = '';
    this.modalStep = 1;
    this.isEditing = false;
    this.editingCampaignId = null;
  }

  // ═══════════════════════════════════════════════
  // PERFORMANCE CHART (Role-Aware, Chart.js)
  // ═══════════════════════════════════════════════

  private rebuildChart(): void {
    if (this.perfChartInstance) {
      this.perfChartInstance.destroy();
      this.perfChartInstance = null;
    }
    if (this.reachChartInstance) {
      this.reachChartInstance.destroy();
      this.reachChartInstance = null;
    }
    if (this.conversionChartInstance) {
      this.conversionChartInstance.destroy();
      this.conversionChartInstance = null;
    }
    // setTimeout ensures the canvas is available after *ngIf cycles
    setTimeout(() => {
      this.initPerformanceChart();
      this.initMarketInsightsCharts();
    }, 0);
  }

  private initPerformanceChart(): void {
    if (!this.perfChartRef?.nativeElement) return;
    if (typeof Chart === 'undefined') return;

    const ctx = this.perfChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = this.roleColors;
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Role-specific mock data
    const viewsData = this.currentRole === 'FREELANCER'
      ? [320, 450, 380, 510, 620, 480, 550]
      : [410, 520, 490, 630, 710, 560, 640];
    const clicksData = this.currentRole === 'FREELANCER'
      ? [15, 28, 22, 35, 42, 30, 38]
      : [22, 35, 28, 48, 55, 40, 50];

    // Build gradient fills
    const viewsGradient = ctx.createLinearGradient(0, 0, 0, 250);
    viewsGradient.addColorStop(0, colors.rgbaFill);
    viewsGradient.addColorStop(1, 'rgba(255,255,255,0)');

    const clicksGradient = ctx.createLinearGradient(0, 0, 0, 250);
    clicksGradient.addColorStop(0, 'rgba(255, 152, 0, 0.10)');
    clicksGradient.addColorStop(1, 'rgba(255,255,255,0)');

    this.perfChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: this.currentRole === 'FREELANCER' ? 'Profile Views' : 'Job Views',
            data: viewsData,
            borderColor: colors.primary,
            backgroundColor: viewsGradient,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Clicks',
            data: clicksData,
            borderColor: '#ff9800',
            backgroundColor: clicksGradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#ff9800',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════
  // SPARKLINE (Role-Aware)
  // ═══════════════════════════════════════════════

  getSparklinePath(data: number[]): string {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data, 1);
    const width = 80;
    const height = 24;
    const step = width / (data.length - 1);
    return data.map((val, i) => {
      const x = i * step;
      const y = height - (val / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  getSparklineColor(status: CampaignStatus): string {
    const rolePrimary = this.roleColors.primary;
    switch (status) {
      case 'ACTIVE': return rolePrimary;
      case 'PENDING': return '#ff9800';
      case 'REJECTED': return '#f44336';
      case 'EXPIRED': return '#9e9e9e';
      default: return rolePrimary;
    }
  }

  // ═══════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════

  formatNumber(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  }

  // ═══════════════════════════════════════════════
  // MARKET INSIGHTS CHARTS (Role-Aware)
  // ═══════════════════════════════════════════════

  private initMarketInsightsCharts(): void {
    this.initReachChart();
    this.initConversionChart();
  }

  /**
   * Reach Statistics — Line Chart
   * Shows 'Global Impressions' over time with role-specific branding
   * Ready for HttpClient: GET /api/ads/statistics/reach?role={role}
   */
  private initReachChart(): void {
    if (!this.reachChartRef?.nativeElement) return;
    if (typeof Chart === 'undefined') return;

    const ctx = this.reachChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = this.roleColors;
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

    // Role-specific mock data (impressions over 6 weeks)
    const reachData = this.currentRole === 'FREELANCER'
      ? [1200, 1450, 1680, 1920, 2100, 2350]
      : [1800, 2100, 2450, 2680, 2900, 3200];

    // Build gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, colors.rgbaFill.replace('0.10', '0.4')); // 0.4 opacity
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    this.reachChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.currentRole === 'FREELANCER' ? 'Profile Views' : 'Job Views',
          data: reachData,
          borderColor: colors.primary,
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  /**
   * Conversion Statistics — Bar Chart
   * Shows 'Average CTR (Click-Through Rate)' by Ad Type
   * Ready for HttpClient: GET /api/ads/statistics/conversion?role={role}
   */
  private initConversionChart(): void {
    if (!this.conversionChartRef?.nativeElement) return;
    if (typeof Chart === 'undefined') return;

    const ctx = this.conversionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = this.roleColors;

    // Role-specific labels and data
    const labels = this.currentRole === 'FREELANCER'
      ? ['Profile Views', 'Skill Searches', 'Portfolio Clicks']
      : ['Job Views', 'Application Starts', 'Candidate Engagement'];

    const ctrData = this.currentRole === 'FREELANCER'
      ? [5.2, 7.8, 6.1] // CTR percentages
      : [4.8, 6.5, 5.9];

    // Build gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.primaryDark);

    this.conversionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Average CTR (%)',
          data: ctrData,
          backgroundColor: gradient,
          borderColor: colors.primaryDark,
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            beginAtZero: true,
            max: 10,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10 },
              callback: (value: any) => value + '%'
            }
          }
        }
      }
    });
  }

  get marketInsightsSubtitle(): string {
    return this.currentRole === 'FREELANCER'
      ? 'Real-time market trends for Freelancers'
      : 'Real-time market trends for Clients';
  }
}
