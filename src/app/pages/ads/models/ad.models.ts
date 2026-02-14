// ── Ad Plan Entity (PostgreSQL Ready) ──
export type AdType = 'Banner' | 'Featured_Profile' | 'Job_Boost';
export type AdLocation = 'Landing_Page' | 'Job_Feed' | 'Sidebar';
export type CampaignStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';
export type RoleType = 'freelancer' | 'client';

export interface AdPlan {
  id: number;
  name: string;
  type: AdType;
  price: number;
  location: AdLocation;
  roleType: RoleType;
  description?: string;
  icon?: string;
}

// ── Ad Campaign Entity (PostgreSQL Ready) ──
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
  createdAt: Date;
  // Backend-ready fields for Spring Boot / PostgreSQL
  roleType: RoleType;       // Links campaign to 'freelancer' or 'client' context
  targetId?: number;        // Links to Freelancer Profile ID or Job Post ID
  // Computed / display fields
  planName?: string;
  planType?: AdType;
  planLocation?: AdLocation;
  views?: number;
  clicks?: number;
  sparklineData?: number[];
}
