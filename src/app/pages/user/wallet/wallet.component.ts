import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';

interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit' | 'pending';
  description: string;
  project: string;
  amount: number;
  date: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  get currentRole(): string {
    return this.roleService.currentRole;
  }

  balance = 12450;
  pendingAmount = 8300;
  totalWithdrawn = 34200;

  transactions: WalletTransaction[] = [];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.transactions = [
      { id: 1, type: 'credit',  description: 'Payment received',     project: 'E-commerce Redesign',    amount: 2500, date: '2026-02-10' },
      { id: 2, type: 'credit',  description: 'Milestone payment',    project: 'Brand Identity Package', amount: 3200, date: '2026-02-08' },
      { id: 3, type: 'debit',   description: 'Withdrawal to bank',   project: '—',                      amount: 4000, date: '2026-02-06' },
      { id: 4, type: 'pending', description: 'Awaiting release',     project: 'Mobile App MVP',         amount: 1800, date: '2026-02-05' },
      { id: 5, type: 'credit',  description: 'Payment received',     project: 'Content Marketing Plan', amount: 2750, date: '2026-02-04' },
      { id: 6, type: 'pending', description: 'Under review',         project: 'Full-Stack Dashboard',   amount: 5000, date: '2026-02-02' },
      { id: 7, type: 'debit',   description: 'Withdrawal to bank',   project: '—',                      amount: 3000, date: '2026-01-28' },
      { id: 8, type: 'credit',  description: 'Payment received',     project: 'DevOps Pipeline Setup',  amount: 1200, date: '2026-01-25' },
    ];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'credit':  return 'arrow_downward';
      case 'debit':   return 'arrow_upward';
      case 'pending': return 'schedule';
      default:        return 'swap_horiz';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'credit':  return 'tx-credit';
      case 'debit':   return 'tx-debit';
      case 'pending': return 'tx-pending';
      default:        return '';
    }
  }
}
