export interface Customer {
  id: string
  userId: string
  name: string
  email?: string
  phone: string
  address?: string
  openingBalance: number
  currentBalance: number
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  customerId: string
  customerName: string
  amount: number
  type: 'credit' | 'debit'
  date: Date
  description?: string
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'other'
  balanceAfter: number
  createdAt: Date
}

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  ownerName: string
  email?: string
  phone: string
  address?: string
  taxId?: string
  logo?: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface LedgerEntry {
  date: Date
  description: string
  credit: number
  debit: number
  balance: number
  transactionId: string
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  totalReceivables: number
  totalPayables: number
}

export interface DashboardStats {
  totalCustomers: number
  totalReceivables: number
  totalPayables: number
  transactionsToday: number
  transactionsThisMonth: number
  topCustomers: Array<{
    id: string
    name: string
    balance: number
  }>
}

export interface DailyReport {
  date: Date
  totalCredits: number
  totalDebits: number
  netAmount: number
  transactionCount: number
  transactions: Transaction[]
}

export interface MonthlyReport {
  month: string
  year: number
  totalCredits: number
  totalDebits: number
  netAmount: number
  transactionCount: number
  dailyBreakdown: Array<{
    date: string
    credits: number
    debits: number
    net: number
  }>
  customerBreakdown: Array<{
    customerId: string
    customerName: string
    credits: number
    debits: number
    balance: number
  }>
}

export interface Reminder {
  id: string
  customerId: string
  customerName: string
  dueAmount: number
  dueDate: Date
  reminded: boolean
  remindedAt?: Date
}

export type UserRole = 'owner' | 'staff'

export interface UserPermissions {
  canManageCustomers: boolean
  canManageTransactions: boolean
  canViewReports: boolean
  canExportData: boolean
  canManageBusinessProfile: boolean
  canManageUsers: boolean
}
