export interface IncomeEntry {
  id: string
  userId: string
  amount: number
  category: 'primary' | 'secondary'
  month: string
  year: number
  type: 'credit' | 'debit'
  status: 'pending' | 'received'
  description?: string
  createdAt: Date
}

export interface MonthlyStats {
  month: string
  primary: number
  secondary: number
  total: number
  net: number
}

export interface YearlyStats {
  totalIncome: number
  totalPrimary: number
  totalSecondary: number
  monthlyAverage: number
  highestMonth: {
    month: string
    amount: number
  }
}
