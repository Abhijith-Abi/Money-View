import { IncomeEntry, MonthlyStats, YearlyStats } from '@/types/income'

/**
 * Simple in-memory cache for income data to reduce redundant Firestore queries
 * Cache is scoped per user and year
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface CacheKey {
  userId: string
  year: number
}

class IncomeCache {
  private entries: Map<string, CacheEntry<IncomeEntry[]>> = new Map()
  private monthlyStats: Map<string, CacheEntry<MonthlyStats[]>> = new Map()
  private yearlyStats: Map<string, CacheEntry<YearlyStats>> = new Map()
  private allTimeStats: Map<string, CacheEntry<import('@/types/income').AllTimeStats>> = new Map()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(key: { userId: string, year?: number }): string {
    return key.year ? `${key.userId}-${key.year}` : key.userId
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL
  }

  // Entries cache
  getEntries(key: CacheKey): IncomeEntry[] | null {
    const cacheKey = this.getCacheKey(key)
    const cached = this.entries.get(cacheKey)
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  setEntries(key: CacheKey, data: IncomeEntry[]): void {
    const cacheKey = this.getCacheKey(key)
    this.entries.set(cacheKey, { data, timestamp: Date.now() })
  }

  // Monthly stats cache
  getMonthlyStats(key: CacheKey): MonthlyStats[] | null {
    const cacheKey = this.getCacheKey(key)
    const cached = this.monthlyStats.get(cacheKey)
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  setMonthlyStats(key: CacheKey, data: MonthlyStats[]): void {
    const cacheKey = this.getCacheKey(key)
    this.monthlyStats.set(cacheKey, { data, timestamp: Date.now() })
  }

  // Yearly stats cache
  getYearlyStats(key: CacheKey): YearlyStats | null {
    const cacheKey = this.getCacheKey(key)
    const cached = this.yearlyStats.get(cacheKey)
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  setYearlyStats(key: CacheKey, data: YearlyStats): void {
    const cacheKey = this.getCacheKey(key)
    this.yearlyStats.set(cacheKey, { data, timestamp: Date.now() })
  }

  // All time stats cache
  getAllTimeStats(userId: string): import('@/types/income').AllTimeStats | null {
    const cacheKey = this.getCacheKey({ userId })
    const cached = this.allTimeStats.get(cacheKey)
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  setAllTimeStats(userId: string, data: import('@/types/income').AllTimeStats): void {
    const cacheKey = this.getCacheKey({ userId })
    this.allTimeStats.set(cacheKey, { data, timestamp: Date.now() })
  }

  // Invalidate cache for a specific user/year
  invalidate(key: CacheKey): void {
    const cacheKey = this.getCacheKey(key)
    this.entries.delete(cacheKey)
    this.monthlyStats.delete(cacheKey)
    this.yearlyStats.delete(cacheKey)
    // Also invalidate all-time stats when any entry changes
    this.allTimeStats.delete(this.getCacheKey({ userId: key.userId }))
  }

  // Clear all cache
  clear(): void {
    this.entries.clear()
    this.monthlyStats.clear()
    this.yearlyStats.clear()
    this.allTimeStats.clear()
  }
}

// Export singleton instance
export const incomeCache = new IncomeCache()
