// ═══════════════════════════════════════════════
// Backend Enums (Match Spring Boot exactly)
// ═══════════════════════════════════════════════
export type AdType = 'BANNER' | 'FEATURED_PROFILE' | 'JOB_BOOST';
export type AdLocation = 'LANDING_PAGE' | 'JOB_FEED' | 'SEARCH_SIDEBAR';
export type CampaignStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';
export type RoleType = 'FREELANCER' | 'CLIENT';

// ═══════════════════════════════════════════════
// AdPlan DTO (GET /plans response item)
// ═══════════════════════════════════════════════
export interface AdPlan {
  id: number;
  name: string;
  type: AdType;
  price: number;
  location: AdLocation;
  roleType: RoleType;
  description?: string;
  icon?: string;           // Frontend-only (mapped locally)
}

// ═══════════════════════════════════════════════
// CampaignResponse DTO (GET /campaigns response item)
// ═══════════════════════════════════════════════
export interface AdCampaign {
  id: number;
  userId: number;
  planId: number;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  status: CampaignStatus;
  rejectionReason?: string;
  createdAt: Date | string;
  roleType: RoleType;
  targetId?: number;
  // Enriched / joined fields from backend
  planName?: string;
  planType?: AdType;
  planLocation?: AdLocation;
  views?: number;
  clicks?: number;
  // Frontend-only display fields
  sparklineData?: number[];
}

// ═══════════════════════════════════════════════
// CreateCampaignRequest DTO (POST /campaigns body)
// ═══════════════════════════════════════════════
export interface CreateCampaignRequest {
  planId: number;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  roleType: RoleType;
  targetId?: number;
}

// ═══════════════════════════════════════════════
// Admin action DTOs
// ═══════════════════════════════════════════════
export interface RejectCampaignRequest {
  rejectionReason: string;
}
