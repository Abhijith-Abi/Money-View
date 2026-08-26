export type InterestType = 'reducing' | 'flat';

export type EMIPaymentStatus = 'paid' | 'pending' | 'overdue' | 'waived';

export interface EMIPlan {
  id?: string;
  name?: string;
  principal: number;
  annualInterestRate: number; // e.g. 12 for 12%
  tenureMonths: number;
  startDate: Date | string;
  interestType?: InterestType; // default: 'reducing'
  emiAmount?: number; // optional pre-calculated or overridden EMI
  downPayment?: number;
  processingFee?: number;
  notes?: string;
}

export interface EMIPayment {
  id: string;
  monthIndex: number; // 1-indexed (Month 1, 2, ...)
  paymentDate: Date | string;
  amountPaid: number;
  status: EMIPaymentStatus;
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';
  transactionReference?: string;
  notes?: string;
}

export interface EMIScheduleMonth {
  monthIndex: number; // 1-indexed (1 to tenureMonths)
  monthName: string; // e.g. "January 2025"
  month: string; // e.g. "January"
  year: number; // e.g. 2025
  dueDate: Date;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  status: EMIPaymentStatus;
  paidAmount: number;
  paidDate?: Date;
  isOverdue: boolean;
}

export interface EMISummary {
  totalPrincipal: number;
  totalInterest: number;
  totalPayable: number;
  monthlyEMI: number;
  totalPaid: number;
  totalPending: number;
  paidMonthsCount: number;
  pendingMonthsCount: number;
  overdueMonthsCount: number;
  totalMonths: number;
  paidPercentage: number;
  nextDueDate: Date | null;
  nextDueAmount: number;
  isFullyPaid: boolean;
  completionDate: Date;
  schedule: EMIScheduleMonth[];
}
