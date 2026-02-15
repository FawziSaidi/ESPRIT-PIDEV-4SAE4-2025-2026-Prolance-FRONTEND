import { Component, OnInit } from '@angular/core';
import { AdCampaign, AdPlan, CampaignStatus } from '../../ads/models/ad.models';

@Component({
  selector: 'app-admin-ads',
  templateUrl: './admin-ads.component.html',
  styleUrls: ['./admin-ads.component.css']
})
export class AdminAdsComponent implements OnInit {

  // ═══════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════

  // Inspect Drawer
  inspectDrawerOpen = false;
  inspectedCampaign: AdCampaign | null = null;

  // Reject Modal
  showRejectModal = false;
  rejectingCampaignId: number | null = null;
  rejectReason = '';

  // Delete Confirm
  showDeleteConfirm = false;
  deletingCampaignId: number | null = null;

  // Fade-out animation tracking
  fadingOutIds: Set<number> = new Set();

  // ═══════════════════════════════════════════════
  // MOCK DATA — All Campaigns (cross-role, admin sees everything)
  // ═══════════════════════════════════════════════

  campaigns: AdCampaign[] = [
    // ── PENDING campaigns (Approval Queue) ──
    {
      id: 101, userId: 1, planId: 4,
      title: 'Urgent: React Native Developer',
      description: 'Looking for a React Native expert for a 3-month contract. Must have experience with Expo and TypeScript.',
      imageUrl: 'https://placehold.co/400x200/00897b/white?text=React+Native+Dev',
      targetUrl: 'https://prolance.com/jobs/42',
      status: 'PENDING', createdAt: new Date('2026-02-10'),
      roleType: 'client', targetId: 42,
      planName: 'Featured Job', planType: 'Job_Boost', planLocation: 'Job_Feed',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      id: 102, userId: 2, planId: 1,
      title: 'Senior DevOps Engineer — Hire Me',
      description: 'AWS & Kubernetes certified engineer with 8+ years of experience in CI/CD pipelines.',
      imageUrl: 'https://placehold.co/400x200/9c27b0/white?text=DevOps+Engineer',
      targetUrl: 'https://prolance.com/profile/maria',
      status: 'PENDING', createdAt: new Date('2026-02-12'),
      roleType: 'freelancer', targetId: 201,
      planName: 'Profile Spotlight', planType: 'Featured_Profile', planLocation: 'Job_Feed',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      id: 103, userId: 3, planId: 5,
      title: 'Full-Stack Team Needed — Startup',
      description: 'We are a fast-growing fintech startup seeking 3 full-stack developers for a 6-month engagement.',
      imageUrl: 'https://placehold.co/400x200/ff9800/white?text=Fintech+Startup',
      targetUrl: 'https://prolance.com/jobs/67',
      status: 'PENDING', createdAt: new Date('2026-02-13'),
      roleType: 'client', targetId: 67,
      planName: 'Job Feed Banner', planType: 'Banner', planLocation: 'Job_Feed',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      id: 104, userId: 4, planId: 2,
      title: 'Creative UI/UX Designer Portfolio',
      description: 'Award-winning designer specializing in SaaS products and mobile applications.',
      imageUrl: 'https://placehold.co/400x200/e91e63/white?text=UI+UX+Portfolio',
      targetUrl: 'https://prolance.com/profile/sarah',
      status: 'PENDING', createdAt: new Date('2026-02-14'),
      roleType: 'freelancer', targetId: 301,
      planName: 'Landing Page Banner', planType: 'Banner', planLocation: 'Landing_Page',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    },

    // ── ACTIVE campaigns (Active Inventory) ──
    {
      id: 201, userId: 1, planId: 1,
      title: 'Senior Angular Dev Available',
      description: 'Experienced Angular developer available for enterprise projects. 10+ years in the industry.',
      imageUrl: 'https://placehold.co/400x200/9c27b0/white?text=Angular+Dev',
      targetUrl: 'https://prolance.com/profile/alex',
      status: 'ACTIVE', createdAt: new Date('2025-12-01'),
      roleType: 'freelancer', targetId: 101,
      planName: 'Profile Spotlight', planType: 'Featured_Profile', planLocation: 'Job_Feed',
      views: 12400, clicks: 623, sparklineData: [45, 62, 78, 95, 110, 88, 102]
    },
    {
      id: 202, userId: 1, planId: 2,
      title: 'Prolance — My Freelance Brand',
      description: 'Showcase my full-stack skills on the landing page. Specializing in Angular, Node.js & AWS.',
      imageUrl: 'https://placehold.co/400x200/7b1fa2/white?text=Freelance+Brand',
      targetUrl: 'https://prolance.com/profile/alex',
      status: 'ACTIVE', createdAt: new Date('2025-11-15'),
      roleType: 'freelancer', targetId: 101,
      planName: 'Landing Page Banner', planType: 'Banner', planLocation: 'Landing_Page',
      views: 8900, clicks: 412, sparklineData: [30, 42, 55, 38, 60, 72, 65]
    },
    {
      id: 203, userId: 5, planId: 6,
      title: 'Hire Top Designers — Premium Banner',
      description: 'Attract world-class UI/UX designers to your projects. Premium placement guaranteed.',
      imageUrl: 'https://placehold.co/400x200/00695c/white?text=Top+Designers',
      targetUrl: 'https://prolance.com/jobs/71',
      status: 'ACTIVE', createdAt: new Date('2026-01-05'),
      roleType: 'client', targetId: 71,
      planName: 'Landing Page Banner', planType: 'Banner', planLocation: 'Landing_Page',
      views: 6200, clicks: 310, sparklineData: [50, 55, 62, 70, 68, 75, 80]
    },
    {
      id: 204, userId: 6, planId: 4,
      title: 'Blockchain Developer — Remote Contract',
      description: 'Seeking Solidity & Rust developer for DeFi protocol development. 6-month contract.',
      imageUrl: 'https://placehold.co/400x200/3f51b5/white?text=Blockchain+Dev',
      targetUrl: 'https://prolance.com/jobs/89',
      status: 'ACTIVE', createdAt: new Date('2026-01-20'),
      roleType: 'client', targetId: 89,
      planName: 'Featured Job', planType: 'Job_Boost', planLocation: 'Job_Feed',
      views: 4500, clicks: 198, sparklineData: [20, 35, 42, 55, 48, 60, 72]
    },
    {
      id: 205, userId: 7, planId: 3,
      title: 'Data Science Freelancer — ML Expert',
      description: 'Machine learning specialist with publications in NeurIPS. Available for consulting.',
      imageUrl: 'https://placehold.co/400x200/4caf50/white?text=ML+Expert',
      targetUrl: 'https://prolance.com/profile/james',
      status: 'ACTIVE', createdAt: new Date('2026-02-01'),
      roleType: 'freelancer', targetId: 401,
      planName: 'Sidebar Showcase', planType: 'Banner', planLocation: 'Sidebar',
      views: 3200, clicks: 145, sparklineData: [15, 22, 30, 28, 35, 40, 38]
    },

    // ── REJECTED (for reference in inspect) ──
    {
      id: 301, userId: 8, planId: 3,
      title: 'Get Rich Quick — Freelancing Secrets',
      description: 'Learn the secrets to making $10k/month freelancing. Limited time offer!',
      imageUrl: 'https://placehold.co/400x200/f44336/white?text=REJECTED',
      targetUrl: 'https://spam-site.com/offer',
      status: 'REJECTED',
      rejectionReason: 'Misleading claims and spam content. Violates advertising guidelines.',
      createdAt: new Date('2026-01-28'),
      roleType: 'freelancer', targetId: 501,
      planName: 'Sidebar Showcase', planType: 'Banner', planLocation: 'Sidebar',
      views: 0, clicks: 0, sparklineData: [0, 0, 0, 0, 0, 0, 0]
    }
  ];

  // Mock user data keyed by userId
  readonly userMap: Record<number, { name: string; email: string; avatar: string }> = {
    1: { name: 'Alex Johnson', email: 'alex@prolance.com', avatar: 'AJ' },
    2: { name: 'Maria Garcia', email: 'maria@prolance.com', avatar: 'MG' },
    3: { name: 'TechFin Corp', email: 'hr@techfin.io', avatar: 'TF' },
    4: { name: 'Sarah Chen', email: 'sarah@prolance.com', avatar: 'SC' },
    5: { name: 'GlobalHire Ltd', email: 'ads@globalhire.com', avatar: 'GH' },
    6: { name: 'DeFi Labs', email: 'talent@defilabs.io', avatar: 'DL' },
    7: { name: 'James Wright', email: 'james@prolance.com', avatar: 'JW' },
    8: { name: 'Spam Account', email: 'spam@fake.com', avatar: 'SA' }
  };

  constructor() {}

  ngOnInit(): void {}

  // ═══════════════════════════════════════════════
  // COMPUTED VIEWS
  // ═══════════════════════════════════════════════

  get pendingCampaigns(): AdCampaign[] {
    return this.campaigns.filter(c => c.status === 'PENDING');
  }

  get activeCampaigns(): AdCampaign[] {
    return this.campaigns.filter(c => c.status === 'ACTIVE');
  }

  // ═══════════════════════════════════════════════
  // KPI STATS
  // ═══════════════════════════════════════════════

  get totalPending(): number {
    return this.pendingCampaigns.length;
  }

  get totalActive(): number {
    return this.activeCampaigns.length;
  }

  get totalImpressions(): number {
    return this.activeCampaigns.reduce((sum, c) => sum + (c.views || 0), 0);
  }

  get totalClicks(): number {
    return this.activeCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  }

  get totalRevenue(): number {
    return this.activeCampaigns.length * 39.99; // Avg plan cost mock
  }

  // ═══════════════════════════════════════════════
  // USER INFO HELPERS
  // ═══════════════════════════════════════════════

  getUserName(userId: number): string {
    return this.userMap[userId]?.name || 'Unknown User';
  }

  getUserEmail(userId: number): string {
    return this.userMap[userId]?.email || '—';
  }

  getUserAvatar(userId: number): string {
    return this.userMap[userId]?.avatar || '??';
  }

  getRoleBadge(role: string): string {
    return role === 'freelancer' ? 'Freelancer' : 'Client';
  }

  // ═══════════════════════════════════════════════
  // APPROVE
  // ═══════════════════════════════════════════════

  approveCampaign(campaign: AdCampaign): void {
    const idx = this.campaigns.findIndex(c => c.id === campaign.id);
    if (idx !== -1) {
      this.campaigns[idx] = {
        ...this.campaigns[idx],
        status: 'ACTIVE',
        views: 0,
        clicks: 0
      };
    }
  }

  // ═══════════════════════════════════════════════
  // REJECT (with reason)
  // ═══════════════════════════════════════════════

  openRejectModal(campaignId: number): void {
    this.rejectingCampaignId = campaignId;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectingCampaignId = null;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (this.rejectingCampaignId === null) return;
    const idx = this.campaigns.findIndex(c => c.id === this.rejectingCampaignId);
    if (idx !== -1) {
      this.campaigns[idx] = {
        ...this.campaigns[idx],
        status: 'REJECTED',
        rejectionReason: this.rejectReason.trim() || 'Rejected by admin.'
      };
    }
    this.showRejectModal = false;
    this.rejectingCampaignId = null;
    this.rejectReason = '';
  }

  // ═══════════════════════════════════════════════
  // FORCE STOP / DELETE (with fade-out)
  // ═══════════════════════════════════════════════

  openDeleteConfirm(campaignId: number): void {
    this.deletingCampaignId = campaignId;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingCampaignId = null;
  }

  confirmDelete(): void {
    if (this.deletingCampaignId === null) return;
    const id = this.deletingCampaignId;
    this.fadingOutIds.add(id);
    this.showDeleteConfirm = false;
    this.deletingCampaignId = null;

    // Wait for CSS fade animation, then remove from array
    setTimeout(() => {
      this.campaigns = this.campaigns.filter(c => c.id !== id);
      this.fadingOutIds.delete(id);
    }, 400);
  }

  isFadingOut(campaignId: number): boolean {
    return this.fadingOutIds.has(campaignId);
  }

  // ═══════════════════════════════════════════════
  // INSPECT DRAWER
  // ═══════════════════════════════════════════════

  openInspect(campaign: AdCampaign): void {
    this.inspectedCampaign = campaign;
    this.inspectDrawerOpen = true;
  }

  closeInspect(): void {
    this.inspectDrawerOpen = false;
    setTimeout(() => {
      this.inspectedCampaign = null;
    }, 300);
  }

  // ═══════════════════════════════════════════════
  // UI HELPERS
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

  formatNumber(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  }

  formatCurrency(val: number): string {
    return '$' + val.toFixed(2);
  }

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

  getCTR(campaign: AdCampaign): string {
    if (!campaign.views || campaign.views === 0) return '0%';
    return ((campaign.clicks || 0) / campaign.views * 100).toFixed(1) + '%';
  }
}
