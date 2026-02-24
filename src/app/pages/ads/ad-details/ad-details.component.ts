import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdsService } from '../../../services/ads.service';
import { AdTrackingService } from '../../../services/ad-tracking.service';
import { AdCampaign, RoleType } from '../models/ad.models';

@Component({
  selector: 'app-ad-details',
  templateUrl: './ad-details.component.html',
  styleUrls: ['./ad-details.component.scss']
})
export class AdDetailsComponent implements OnInit {
  ad: AdCampaign | null = null;
  isLoading = true;
  error = false;
  adId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adsService: AdsService,
    private adTrackingService: AdTrackingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.adId = +params['id'];
      if (this.adId) {
        this.loadAdDetails();
      } else {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private loadAdDetails(): void {
    this.isLoading = true;
    this.error = false;

    this.adsService.getAdById(this.adId).subscribe({
      next: (ad) => {
        // Normalize roleType to uppercase to match enum
        if (ad.roleType) {
          ad.roleType = (ad.roleType as string).toUpperCase() as RoleType;
        }
        this.ad = ad;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load ad details:', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  getAdImage(): string {
    if (this.ad?.imageUrl && this.ad.imageUrl.trim() !== '') {
      return this.ad.imageUrl;
    }
    return this.ad?.roleType === 'FREELANCER'
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.ad?.title || 'ad')}`
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(this.ad?.title || 'ad')}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.ad?.roleType === 'FREELANCER'
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.ad?.title || 'ad')}`
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(this.ad?.title || 'ad')}`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get roleGradient(): string {
    return this.ad?.roleType === 'FREELANCER'
      ? 'linear-gradient(135deg, #7B68EE, #6A5ACD)'
      : 'linear-gradient(135deg, #483D8B, #2F2A5C)';
  }

  get rolePrimary(): string {
    return this.ad?.roleType === 'FREELANCER' ? '#7B68EE' : '#483D8B';
  }
}
