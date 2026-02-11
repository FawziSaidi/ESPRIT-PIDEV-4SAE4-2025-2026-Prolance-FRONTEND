import { Component, OnInit } from '@angular/core';

export interface Transaction {
  id: number;
  amount: number;
  senderName: string;
  receiverName: string;
  date: string;
  time: string;
  projectName: string;
  contractId: string;
  status: 'Completed' | 'Pending' | 'In Review';
}

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.scss']
})
export class TableListComponent implements OnInit {
  currentRole: 'freelancer' | 'client' = 'freelancer';
  transactions: Transaction[] = [];

  // ── Payment Modal State ──
  showModal = false;
  modalStep: 'select' | 'review' | 'processing' | 'success' = 'select';
  selectedTransaction: Transaction | null = null;
  selectedPendingId: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.transactions = [
      { id: 1,  amount: 2500,  senderName: 'Acme Corp',        receiverName: 'Sarah Chen',       date: '2026-02-10', time: '14:32', projectName: 'E-commerce Redesign',     contractId: 'CTR-0041', status: 'Completed' },
      { id: 2,  amount: 1800,  senderName: 'Nova Startups',    receiverName: 'James Walker',     date: '2026-02-09', time: '09:15', projectName: 'Mobile App MVP',           contractId: 'CTR-0042', status: 'Pending' },
      { id: 3,  amount: 3200,  senderName: 'Global Media Inc', receiverName: 'Sarah Chen',       date: '2026-02-08', time: '16:45', projectName: 'Brand Identity Package',   contractId: 'CTR-0043', status: 'Completed' },
      { id: 4,  amount: 950,   senderName: 'Acme Corp',        receiverName: 'Lina Morales',     date: '2026-02-07', time: '11:20', projectName: 'SEO Audit & Strategy',     contractId: 'CTR-0044', status: 'In Review' },
      { id: 5,  amount: 4100,  senderName: 'TechVentures',     receiverName: 'James Walker',     date: '2026-02-06', time: '08:55', projectName: 'API Integration Suite',    contractId: 'CTR-0045', status: 'Completed' },
      { id: 6,  amount: 1500,  senderName: 'Nova Startups',    receiverName: 'Aisha Patel',      date: '2026-02-05', time: '13:10', projectName: 'Landing Page Design',      contractId: 'CTR-0046', status: 'Pending' },
      { id: 7,  amount: 2750,  senderName: 'Global Media Inc', receiverName: 'Lina Morales',     date: '2026-02-04', time: '17:30', projectName: 'Content Marketing Plan',   contractId: 'CTR-0047', status: 'Completed' },
      { id: 8,  amount: 600,   senderName: 'TechVentures',     receiverName: 'Sarah Chen',       date: '2026-02-03', time: '10:05', projectName: 'Bug Fix Sprint',           contractId: 'CTR-0048', status: 'In Review' },
      { id: 9,  amount: 5000,  senderName: 'Acme Corp',        receiverName: 'Aisha Patel',      date: '2026-02-02', time: '15:40', projectName: 'Full-Stack Dashboard',     contractId: 'CTR-0049', status: 'Pending' },
      { id: 10, amount: 1200,  senderName: 'Nova Startups',    receiverName: 'James Walker',     date: '2026-02-01', time: '12:00', projectName: 'DevOps Pipeline Setup',    contractId: 'CTR-0050', status: 'Completed' },
      { id: 11, amount: 3800,  senderName: 'Global Media Inc', receiverName: 'Sarah Chen',       date: '2026-01-31', time: '09:45', projectName: 'Video Production',         contractId: 'CTR-0051', status: 'In Review' },
      { id: 12, amount: 2200,  senderName: 'TechVentures',     receiverName: 'Lina Morales',     date: '2026-01-30', time: '14:20', projectName: 'Data Analytics Report',    contractId: 'CTR-0052', status: 'Completed' },
    ];
  }

  toggleRole(): void {
    this.currentRole = this.currentRole === 'freelancer' ? 'client' : 'freelancer';
  }

  // ── Freelancer KPIs ──
  get totalEarned(): number {
    return this.transactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  }

  get activeContracts(): number {
    return this.transactions.filter(t => t.status !== 'Completed').length;
  }

  get pendingPayments(): number {
    return this.transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
  }

  get averageProjectRate(): number {
    if (!this.transactions.length) return 0;
    return Math.round(this.transactions.reduce((sum, t) => sum + t.amount, 0) / this.transactions.length);
  }

  // ── Client KPIs ──
  get totalSpent(): number {
    return this.transactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  }

  get jobsPosted(): number {
    return this.transactions.length;
  }

  get activeFreelancers(): number {
    const names = new Set(this.transactions.map(t => t.receiverName));
    return names.size;
  }

  get remainingBudget(): number {
    return 50000 - this.totalSpent;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Pending':   return 'badge-warning';
      case 'In Review': return 'badge-info';
      default:          return 'badge-secondary';
    }
  }

  // ── Payment Modal ──
  get pendingTransactions(): Transaction[] {
    return this.transactions.filter(t => t.status === 'Pending');
  }

  openGlobalPayModal(): void {
    this.selectedTransaction = null;
    this.selectedPendingId = null;
    this.modalStep = 'select';
    this.showModal = true;
  }

  onSelectPending(): void {
    if (this.selectedPendingId) {
      this.selectedTransaction = this.transactions.find(t => t.id === +this.selectedPendingId!) || null;
    } else {
      this.selectedTransaction = null;
    }
  }

  proceedToReview(): void {
    if (this.selectedTransaction) {
      this.modalStep = 'review';
    }
  }

  confirmPayment(): void {
    this.modalStep = 'processing';
    setTimeout(() => {
      if (this.selectedTransaction) {
        this.selectedTransaction.status = 'Completed';
      }
      this.modalStep = 'success';
    }, 1500);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
    this.selectedPendingId = null;
    this.modalStep = 'select';
  }
}
