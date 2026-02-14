import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RoleService } from '../../services/role.service';
import { Subscription } from 'rxjs';
import { AdPlan, AdCampaign, CampaignStatus, AdType, RoleType } from './models/ad.models';

declare var Chart: any;

@Component({
  selector: 'app-ad-center',
  templateUrl: './ad-center.component.html',
  styleUrls: ['./ad-center.component.scss']
})
export class AdCenterComponent implements OnInit, OnDestroy, AfterViewInit {
  // ── Role ──
  currentRole: RoleType = 'freelancer';
  private roleSub!: Subscription;

  // ── Role-Based Color Palette ──
  readonly ROLE_COLORS = {
    freelancer: {
      primary: '#9c27b0',
      primaryLight: '#ab47bc',
      primaryDark: '#8e24aa',
      gradient: 'linear-gradient(135deg, #ab47bc, #8e24aa)',
      rgbaFill: 'rgba(156, 39, 176, 0.10)',
      rgbaFillLight: 'rgba(156, 39, 176, 0.04)',
      secondary: '#7b1fa2',
      cardHeaderClass: 'card-header-primary'
    },
    client: {
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
    activeAds: 3,
    totalImpressions: 24850,
    totalClicks: 1247,
    remainingBudget: 1520
  };

  // ── Ad Plans (with roleType) ──
  adPlans: AdPlan[] = [
    // Freelancer plans
    { id: 1, name: 'Profile Spotlight', type: 'Featured_Profile', price: 29.99, location: 'Job_Feed', roleType: 'freelancer', description: 'Puts your profile at the top of search results with a highlighted border.', icon: 'person_pin' },
    { id: 2, name: 'Landing Page Banner', type: 'Banner', price: 49.99, location: 'Landing_Page', roleType: 'freelancer', description: 'High-visibility graphic banner on the main landing page.', icon: 'panorama' },
    { id: 3, name: 'Sidebar Showcase', type: 'Banner', price: 19.99, location: 'Sidebar', roleType: 'freelancer', description: 'Compact banner displayed in the sidebar across all pages.', icon: 'view_sidebar' },
    // Client plans
    { id: 4, name: 'Featured Job', type: 'Job_Boost', price: 34.99, location: 'Job_Feed', roleType: 'client', description: 'Highlights your job post with a special color and badge in the feed.', icon: 'work_outline' },
    { id: 5, name: 'Job Feed Banner', type: 'Banner', price: 44.99, location: 'Job_Feed', roleType: 'client', description: 'Large banner displayed at the top of the job feed.', icon: 'featured_video' },
    { id: 6, name: 'Landing Page Banner', type: 'Banner', price: 49.99, location: 'Landing_Page', roleType: 'client', description: 'High-visibility graphic banner on the main landing page.', icon: 'panorama' },
  ];

  // ── Campaigns (Mock Data — with roleType & targetId) ──
  campaigns: AdCampaign[] = [
    {
      id: 1, userId: 1, planId: 1, title: 'Senior Angular Dev Available',
      description: 'Experienced Angular developer available for enterprise projects.',
      imageUrl: 'https://placehold.co/300x150/9c27b0/white?text=Angular+Dev',
      targetUrl: 'https://prolance.com/profile/alex', status: 'ACTIVE',
      createdAt: new Date('2025-12-01'), roleType: 'freelancer', targetId: 101,
      planName: 'Profile Spotlight', planType: 'Featured_Profile', planLocation: 'Job_Feed',
      views: 12400, clicks: 623, sparklineData: [45, 62, 78, 95, 110, 88, 102]
    },
    {
      id: 2, userId: 1, planId: 2, title: 'Prolance — My Freelance Brand',
      description: 'Showcase my full-stack skills on the landing page.',
      imageUrl: 'https://placehold.co/300x150/7b1fa2/white?text=My+Brand',
      targetUrl: 'https://prolance.com/profile/alex', status: 'ACTIVE',
      createdAt: new Date('2025-11-15'), roleType: 'freelancer', targetId: 101,
      planName: 'Landing Page Banner', planType: 'Banner', planLocation: 'Landing_Page',
      views: 8900, clicks: 412, sparklineData: [30, 42, 55, 38, 60, 72, 65]
    },
    {
      id: 3, userId: 1, planId: 4, title: 'Urgent: React Native Developer',
      description: 'Looking for a React Native expert for a 3-month contract.',
      imageUrl: 'https://placehold.co/300x150/00897b/white?text=React+Native',
      targetUrl: 'https://prolance.com/jobs/42', status: 'PENDING',
      createdAt: new Date('2026-02-10'), roleType: 'client', targetId: 42,
      planName: 'Featured Job', planType: 'Job_Boost', planLocation: 'Job_Feed',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      id: 4, userId: 1, planId: 3, title: 'Full-Stack Freelancer — Portfolio',
      description: 'Check out my portfolio of 50+ completed projects.',
      imageUrl: 'https://placehold.co/300x150/f44336/white?text=Portfolio',
      targetUrl: 'https://prolance.com/profile/alex/portfolio', status: 'REJECTED',
      rejectionReason: 'Image contains misleading claims. Please revise and resubmit.',
      createdAt: new Date('2026-01-20'), roleType: 'freelancer', targetId: 101,
      planName: 'Sidebar Showcase', planType: 'Banner', planLocation: 'Sidebar',
      views: 3550, clicks: 212, sparklineData: [20, 15, 10, 5, 0, 0, 0]
    },
    {
      id: 5, userId: 1, planId: 5, title: 'Cloud Migration Experts Wanted',
      description: 'We need AWS/GCP certified engineers for a large-scale migration.',
      imageUrl: 'https://placehold.co/300x150/4caf50/white?text=Cloud+Jobs',
      targetUrl: 'https://prolance.com/jobs/58', status: 'EXPIRED',
      createdAt: new Date('2025-09-01'), roleType: 'client', targetId: 58,
      planName: 'Job Feed Banner', planType: 'Banner', planLocation: 'Job_Feed',
      views: 0, clicks: 0, sparklineData: [80, 75, 60, 40, 20, 5, 0]
    },
    {
      id: 6, userId: 1, planId: 6, title: 'Hire Top Designers — Banner',
      description: 'Attract world-class UI/UX designers to your projects.',
      imageUrl: 'https://placehold.co/300x150/00695c/white?text=Designers',
      targetUrl: 'https://prolance.com/jobs/71', status: 'ACTIVE',
      createdAt: new Date('2026-01-05'), roleType: 'client', targetId: 71,
      planName: 'Landing Page Banner', planType: 'Banner', planLocation: 'Landing_Page',
      views: 6200, clicks: 310, sparklineData: [50, 55, 62, 70, 68, 75, 80]
    },
  ];

  // ── Chart References ──
  @ViewChild('perfChart', { static: false }) perfChartRef!: ElementRef<HTMLCanvasElement>;
  private perfChartInstance: any = null;

  // Market Insights Charts
  @ViewChild('reachChart', { static: false }) reachChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionChart', { static: false }) conversionChartRef!: ElementRef<HTMLCanvasElement>;
  private reachChartInstance: any = null;
  private conversionChartInstance: any = null;

  private nextId = 7;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.roleSub = this.roleService.currentRole$.subscribe(role => {
      this.currentRole = role;
      this.recalcStats();
      this.rebuildChart();
    });
  }

  ngAfterViewInit(): void {
    this.initPerformanceChart();
    this.initMarketInsightsCharts();
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
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

  // ── Campaigns filtered by active role ──
  get roleCampaigns(): AdCampaign[] {
    return this.campaigns.filter(c => c.roleType === this.currentRole);
  }

  // ── Dynamic Performance Section Headers ──
  get perfTitle(): string {
    return this.currentRole === 'freelancer' ? 'Profile Performance' : 'Jobs Visibility';
  }

  get perfCategory(): string {
    return this.currentRole === 'freelancer'
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
      const color = plan?.type === 'Banner' ? '00bcd4' : plan?.type === 'Job_Boost' ? 'ff9800' : '9c27b0';
      this.formImageUrl = `https://placehold.co/300x150/${color}/white?text=${encodeURIComponent(this.formTitle || 'Ad+Preview')}`;
    }
  }

  /**
   * Submit campaign — handles both CREATE and UPDATE.
   * Ready for HttpClient: replace mock logic with
   *   this.http.post<AdCampaign>('/api/campaigns', payload)
   *   this.http.put<AdCampaign>(`/api/campaigns/${id}`, payload)
   */
  submitCampaign(): void {
    const plan = this.selectedPlan;
    if (!plan) return;

    const colorHex = this.roleColors.primary.replace('#', '');

    if (this.isEditing && this.editingCampaignId !== null) {
      const idx = this.campaigns.findIndex(c => c.id === this.editingCampaignId);
      if (idx !== -1) {
        this.campaigns[idx] = {
          ...this.campaigns[idx],
          planId: plan.id,
          title: this.formTitle,
          description: this.formDescription,
          imageUrl: this.formImageUrl || `https://placehold.co/300x150/${colorHex}/white?text=${encodeURIComponent(this.formTitle)}`,
          targetUrl: this.formTargetUrl,
          status: 'PENDING',
          rejectionReason: undefined,
          roleType: this.currentRole,
          planName: plan.name,
          planType: plan.type,
          planLocation: plan.location
        };
      }
    } else {
      const newCampaign: AdCampaign = {
        id: this.nextId++,
        userId: 1,
        planId: plan.id,
        title: this.formTitle,
        description: this.formDescription,
        imageUrl: this.formImageUrl || `https://placehold.co/300x150/${colorHex}/white?text=${encodeURIComponent(this.formTitle)}`,
        targetUrl: this.formTargetUrl,
        status: 'PENDING',
        createdAt: new Date(),
        roleType: this.currentRole,
        targetId: undefined,
        planName: plan.name,
        planType: plan.type,
        planLocation: plan.location,
        views: 0,
        clicks: 0,
        sparklineData: [0, 0, 0, 0, 0, 0, 0]
      };
      this.campaigns.unshift(newCampaign);
    }

    this.closeModal();
    this.recalcStats();
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
      this.campaigns = this.campaigns.filter(c => c.id !== this.deletingCampaignId);
      this.recalcStats();
    }
    this.showDeleteConfirm = false;
    this.deletingCampaignId = null;
  }

  canEdit(campaign: AdCampaign): boolean {
    return campaign.status === 'PENDING' || campaign.status === 'REJECTED';
  }

  // ═══════════════════════════════════════════════
  // CRUD — READ  (HttpClient-ready)
  // ═══════════════════════════════════════════════

  /**
   * Ready for HttpClient: replace with
   *   this.http.get<AdCampaign[]>(`/api/campaigns?userId=${userId}&role=${role}`)
   */
  private loadCampaigns(): void {
    // Currently uses mock data — swap with HTTP call
    this.recalcStats();
  }

  /**
   * Ready for HttpClient: replace with
   *   this.http.get<{activeAds, totalImpressions, totalClicks, remainingBudget}>(`/api/campaigns/stats?role=${role}`)
   */
  private recalcStats(): void {
    const visible = this.roleCampaigns;
    this.stats.activeAds = visible.filter(c => c.status === 'ACTIVE').length;
    this.stats.totalImpressions = visible.reduce((sum, c) => sum + (c.views || 0), 0);
    this.stats.totalClicks = visible.reduce((sum, c) => sum + (c.clicks || 0), 0);
    this.stats.remainingBudget = this.currentRole === 'freelancer' ? 1520 : 3200;
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
    const viewsData = this.currentRole === 'freelancer'
      ? [320, 450, 380, 510, 620, 480, 550]
      : [410, 520, 490, 630, 710, 560, 640];
    const clicksData = this.currentRole === 'freelancer'
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
            label: this.currentRole === 'freelancer' ? 'Profile Views' : 'Job Views',
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
    const reachData = this.currentRole === 'freelancer'
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
          label: this.currentRole === 'freelancer' ? 'Profile Views' : 'Job Views',
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
    const labels = this.currentRole === 'freelancer'
      ? ['Profile Views', 'Skill Searches', 'Portfolio Clicks']
      : ['Job Views', 'Application Starts', 'Candidate Engagement'];

    const ctrData = this.currentRole === 'freelancer'
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
    return this.currentRole === 'freelancer'
      ? 'Real-time market trends for Freelancers'
      : 'Real-time market trends for Clients';
  }
}
