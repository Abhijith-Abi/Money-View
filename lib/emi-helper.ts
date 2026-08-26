import { EMIPlan, EMIPayment, EMIScheduleMonth, EMISummary, InterestType } from '@/types/emi';
import { MONTHS } from './utils';

/**
 * Calculates the monthly EMI amount for a loan.
 *
 * Reducing Balance Formula:
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * where:
 *   P = Principal
 *   r = Monthly interest rate (annualRate / 12 / 100)
 *   n = Tenure in months
 *
 * Flat Rate Formula:
 * Total Interest = P * (annualRate / 100) * (tenureMonths / 12)
 * E = (P + Total Interest) / tenureMonths
 */
export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: InterestType = 'reducing'
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  
  // 0% interest loan
  if (annualInterestRate <= 0) {
    return Math.round((principal / tenureMonths) * 100) / 100;
  }

  if (interestType === 'flat') {
    const totalInterest = principal * (annualInterestRate / 100) * (tenureMonths / 12);
    const totalPayable = principal + totalInterest;
    return Math.round((totalPayable / tenureMonths) * 100) / 100;
  }

  // Reducing Balance
  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);

  if (isNaN(emi) || !isFinite(emi)) {
    return Math.round((principal / tenureMonths) * 100) / 100;
  }

  return Math.round(emi * 100) / 100;
}

/**
 * Calculates total interest and total payable for a loan plan.
 */
export function calculateLoanTotals(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: InterestType = 'reducing',
  customEMI?: number
): { monthlyEMI: number; totalInterest: number; totalPayable: number } {
  const monthlyEMI = customEMI && customEMI > 0
    ? customEMI
    : calculateEMI(principal, annualInterestRate, tenureMonths, interestType);

  const totalPayable = Math.round(monthlyEMI * tenureMonths * 100) / 100;
  const totalInterest = Math.max(0, Math.round((totalPayable - principal) * 100) / 100);

  return { monthlyEMI, totalInterest, totalPayable };
}

/**
 * Calculates date-wise pending months between start date, tenure, and reference date (today).
 */
export function calculateDateWisePendingMonths(
  startDateInput: Date | string,
  tenureMonths: number,
  paidMonthsCount: number = 0,
  referenceDateInput: Date | string = new Date()
): {
  elapsedMonths: number;
  expectedPaidMonths: number;
  pendingMonths: number;
  overdueMonths: number;
  remainingMonths: number;
} {
  const startDate = new Date(startDateInput);
  const refDate = new Date(referenceDateInput);

  // Calculate elapsed months since start date
  const yearDiff = refDate.getFullYear() - startDate.getFullYear();
  const monthDiff = refDate.getMonth() - startDate.getMonth();
  const rawElapsed = yearDiff * 12 + monthDiff + (refDate.getDate() >= startDate.getDate() ? 1 : 0);
  const elapsedMonths = Math.max(0, Math.min(tenureMonths, rawElapsed));

  // Expected paid months up to reference date
  const expectedPaidMonths = elapsedMonths;

  // Remaining total tenure months not yet paid
  const remainingMonths = Math.max(0, tenureMonths - paidMonthsCount);

  // Overdue months: months that should have been paid by now but haven't been
  const overdueMonths = Math.max(0, expectedPaidMonths - paidMonthsCount);

  // Pending months total
  const pendingMonths = remainingMonths;

  return {
    elapsedMonths,
    expectedPaidMonths,
    pendingMonths,
    overdueMonths,
    remainingMonths,
  };
}

/**
 * Generates the full month-by-month EMI amortization schedule with payment statuses.
 */
export function generateEMISchedule(
  plan: EMIPlan,
  payments: EMIPayment[] = [],
  referenceDateInput: Date | string = new Date()
): EMIScheduleMonth[] {
  const { principal, annualInterestRate, tenureMonths, interestType = 'reducing' } = plan;
  const startDate = new Date(plan.startDate);
  const refDate = new Date(referenceDateInput);
  const monthlyEMI = plan.emiAmount && plan.emiAmount > 0
    ? plan.emiAmount
    : calculateEMI(principal, annualInterestRate, tenureMonths, interestType);

  const monthlyRate = annualInterestRate / (12 * 100);
  let currentBalance = principal;
  const schedule: EMIScheduleMonth[] = [];

  // Create a map for quick payment lookup
  const paymentsMap = new Map<number, EMIPayment>();
  payments.forEach((p) => paymentsMap.set(p.monthIndex, p));

  // For flat rate, interest per month is fixed
  const flatMonthlyInterest = interestType === 'flat'
    ? (principal * (annualInterestRate / 100)) / 12
    : 0;

  for (let i = 1; i <= tenureMonths; i++) {
    // Calculate due date for this month
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate());
    const monthName = `${MONTHS[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
    const month = MONTHS[dueDate.getMonth()];
    const year = dueDate.getFullYear();

    let interestComponent = 0;
    let principalComponent = 0;

    if (interestType === 'flat') {
      interestComponent = annualInterestRate > 0 ? Math.round(flatMonthlyInterest * 100) / 100 : 0;
      principalComponent = Math.round((monthlyEMI - interestComponent) * 100) / 100;
    } else {
      // Reducing balance
      interestComponent = annualInterestRate > 0 ? Math.round(currentBalance * monthlyRate * 100) / 100 : 0;
      principalComponent = Math.min(currentBalance, Math.round((monthlyEMI - interestComponent) * 100) / 100);
    }

    currentBalance = Math.max(0, Math.round((currentBalance - principalComponent) * 100) / 100);

    // Check payment status
    const payment = paymentsMap.get(i);
    let status: EMIScheduleMonth['status'] = 'pending';
    let paidAmount = 0;
    let paidDate: Date | undefined;

    if (payment) {
      status = payment.status;
      paidAmount = payment.amountPaid;
      paidDate = payment.paymentDate ? new Date(payment.paymentDate) : undefined;
    }

    const isOverdue = status === 'pending' && dueDate < refDate;
    if (isOverdue) {
      status = 'overdue';
    }

    schedule.push({
      monthIndex: i,
      monthName,
      month,
      year,
      dueDate,
      emiAmount: monthlyEMI,
      principalComponent,
      interestComponent,
      remainingBalance: currentBalance,
      status,
      paidAmount,
      paidDate,
      isOverdue,
    });
  }

  return schedule;
}

/**
 * Computes a comprehensive EMI summary including auto-calculated paid and pending amounts,
 * date-wise pending months, overdue count, and next due date.
 */
export function calculateEMISummary(
  plan: EMIPlan,
  payments: EMIPayment[] = [],
  referenceDateInput: Date | string = new Date()
): EMISummary {
  const { principal, annualInterestRate, tenureMonths, interestType = 'reducing' } = plan;
  const refDate = new Date(referenceDateInput);

  const { monthlyEMI, totalInterest, totalPayable } = calculateLoanTotals(
    principal,
    annualInterestRate,
    tenureMonths,
    interestType,
    plan.emiAmount
  );

  const schedule = generateEMISchedule(plan, payments, refDate);

  // Auto-calculate money paid
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amountPaid || monthlyEMI), 0);

  // Auto-calculate money pending
  const totalPending = Math.max(0, Math.round((totalPayable - totalPaid) * 100) / 100);

  // Count paid and pending months
  const paidMonthsCount = schedule.filter((m) => m.status === 'paid').length;
  const pendingMonthsCount = schedule.filter((m) => m.status === 'pending' || m.status === 'overdue').length;
  const overdueMonthsCount = schedule.filter((m) => m.status === 'overdue').length;

  const paidPercentage = totalPayable > 0
    ? Math.min(100, Math.round((totalPaid / totalPayable) * 100))
    : 0;

  // Find next pending or overdue month
  const nextPendingMonth = schedule.find((m) => m.status === 'pending' || m.status === 'overdue');
  const nextDueDate = nextPendingMonth ? nextPendingMonth.dueDate : null;
  const nextDueAmount = nextPendingMonth ? nextPendingMonth.emiAmount : 0;

  const isFullyPaid = pendingMonthsCount === 0 || totalPending <= 0;

  // Completion date (last month due date)
  const lastMonth = schedule[schedule.length - 1];
  const completionDate = lastMonth ? lastMonth.dueDate : new Date();

  return {
    totalPrincipal: principal,
    totalInterest,
    totalPayable,
    monthlyEMI,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalPending,
    paidMonthsCount,
    pendingMonthsCount,
    overdueMonthsCount,
    totalMonths: tenureMonths,
    paidPercentage,
    nextDueDate,
    nextDueAmount,
    isFullyPaid,
    completionDate,
    schedule,
  };
}
