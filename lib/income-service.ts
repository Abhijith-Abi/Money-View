import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { IncomeEntry, MonthlyStats, YearlyStats } from '@/types/income'
import { MONTHS } from './utils'
import { incomeCache } from './income-cache'

const COLLECTION_NAME = 'income_entries'

// Note: Ensure Firestore has a composite index for: userId, year, createdAt (desc)
// This optimizes the query in getIncomeByYear for fast filtering
export async function addIncome(
  entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'userId'>,
  userId: string
): Promise<string> {
  console.log('🔵 [addIncome] Starting Firebase write operation...')
  console.log('📊 [addIncome] Entry data:', {
    amount: entry.amount,
    category: entry.category,
    month: entry.month,
    year: entry.year,
    type: entry.type,
    status: entry.status,
    description: entry.description,
  })
  console.log('👤 [addIncome] User ID:', userId)
  console.log('📁 [addIncome] Collection:', COLLECTION_NAME)
  
  try {
    // Create a promise that will timeout after 10 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Firebase operation timed out after 10 seconds. This may indicate a Firestore security rules issue or network problem.'))
      }, 10000)
    })
    
    // Prepare the data to be written
    const dataToWrite = {
      ...entry,
      userId,
      createdAt: Timestamp.now(),
    }
    
    console.log('📝 [addIncome] Writing to Firestore...', dataToWrite)
    
    // Race between the actual Firebase operation and the timeout
    const docRef = await Promise.race([
      addDoc(collection(db, COLLECTION_NAME), dataToWrite),
      timeoutPromise
    ])
    
    console.log('✅ [addIncome] Successfully wrote to Firebase! Document ID:', docRef.id)
    
    // Invalidate cache for this year to ensure fresh data
    incomeCache.invalidate({ userId, year: entry.year })
    
    return docRef.id
  } catch (error: any) {
    console.error('❌ [addIncome] Error adding income:', error)
    console.error('❌ [addIncome] Error type:', error?.constructor?.name)
    console.error('❌ [addIncome] Error message:', error?.message)
    console.error('❌ [addIncome] Error code:', error?.code)
    console.error('❌ [addIncome] Full error object:', error)
    
    // Provide more specific error messages
    if (error?.message?.includes('timeout')) {
      console.error('⚠️ [addIncome] TIMEOUT: Check your Firestore security rules!')
      console.error('⚠️ [addIncome] Make sure the rules allow writing to the income_entries collection')
      console.error('⚠️ [addIncome] Current rules should have: allow read, write: if true;')
    } else if (error?.code === 'permission-denied') {
      console.error('⚠️ [addIncome] PERMISSION DENIED: Firestore security rules are blocking this write')
      console.error('⚠️ [addIncome] Go to Firebase Console → Firestore → Rules and update them')
    } else if (error?.code === 'unavailable') {
      console.error('⚠️ [addIncome] UNAVAILABLE: Firebase server is not reachable')
      console.error('⚠️ [addIncome] Check your internet connection')
    }
    
    throw error
  }
}

export async function deleteIncome(id: string, userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
    // Note: We can't invalidate specific year without fetching the entry first
    // So we clear all cache for this user to be safe
    incomeCache.clear()
  } catch (error) {
    console.error('Error deleting income:', error)
    throw error
  }
}

export async function getIncomeByYear(year: number, userId: string): Promise<IncomeEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('year', '==', year),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as IncomeEntry[]
  } catch (error) {
    console.error('Error fetching income:', error)
    throw error
  }
}

export async function getMonthlyStats(year: number, userId: string): Promise<MonthlyStats[]> {
  const entries = await getIncomeByYear(year, userId)
  
  const monthlyData: Record<string, { primary: number; secondary: number; credits: number; debits: number }> = {}
  
  // Initialize all months
  MONTHS.forEach(month => {
    monthlyData[month] = { primary: 0, secondary: 0, credits: 0, debits: 0 }
  })
  
  // Aggregate data
  entries.forEach(entry => {
    const monthData = monthlyData[entry.month]
    if (monthData) {
      if (entry.type === 'credit') {
        monthData.credits += entry.amount
        if (entry.category === 'primary') {
          monthData.primary += entry.amount
        } else {
          monthData.secondary += entry.amount
        }
      } else {
        monthData.debits += entry.amount
      }
    }
  })
  
  // Convert to array
  return MONTHS.map(month => {
    const data = monthlyData[month]
    return {
      month,
      primary: data.primary,
      secondary: data.secondary,
      total: data.primary + data.secondary,
      net: data.credits - data.debits,
    }
  })
}

export async function getYearlyStats(year: number, userId: string): Promise<YearlyStats> {
  const monthlyStats = await getMonthlyStats(year, userId)
  
  const totalPrimary = monthlyStats.reduce((sum, month) => sum + month.primary, 0)
  const totalSecondary = monthlyStats.reduce((sum, month) => sum + month.secondary, 0)
  const totalIncome = totalPrimary + totalSecondary
  
  const monthlyAverage = totalIncome / 12
  
  const highestMonth = monthlyStats.reduce((max, month) => 
    month.total > max.amount ? { month: month.month, amount: month.total } : max,
    { month: '', amount: 0 }
  )
  
  return {
    totalIncome,
    totalPrimary,
    totalSecondary,
    monthlyAverage,
    highestMonth,
  }
}
