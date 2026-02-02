import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { IncomeEntry, MonthlyStats, YearlyStats, AllTimeStats, AnnualStats } from '@/types/income'
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
    
    // Check for existing entry to aggregate
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('year', '==', entry.year),
      where('month', '==', entry.month),
      where('type', '==', entry.type),
      where('category', '==', entry.category),
      where('status', '==', entry.status)
    );

    const querySnapshot = await getDocs(q);
    
    // If a matching entry exists, update it instead of creating new
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      const existingAmount = existingData.amount || 0;
      const existingDescription = existingData.description || '';
      
      const newAmount = existingAmount + entry.amount;
      
      // Merge descriptions if requested entry has one
      let newDescription = existingDescription;
      if (entry.description && entry.description.trim() !== '') {
        if (existingDescription && existingDescription.trim() !== '') {
           // Avoid duplicating if description is identical
           if (!existingDescription.includes(entry.description)) {
              newDescription = `${existingDescription} | ${entry.description}`;
           }
        } else {
          newDescription = entry.description;
        }
      }

      console.log('🔄 [addIncome] Found existing entry, aggregating...', {
        id: existingDoc.id,
        oldAmount: existingAmount,
        newAmount: newAmount
      });

      await updateDoc(doc(db, COLLECTION_NAME, existingDoc.id), {
        amount: newAmount,
        description: newDescription,
        // Update createdAt so it jumps to top/recent if sorted by date? 
        // Or keep original date? Keeping original date is usually better for history, 
        // but user might expect it to show as "recent". 
        // For now, let's just update the content.
      });

      // Invalidate cache
      incomeCache.invalidate({ userId, year: entry.year });
      
      return existingDoc.id;
    }

    // No existing entry found, proceed to add new
    console.log('📝 [addIncome] No matching entry found. Writing new doc to Firestore...', dataToWrite)
    
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

export async function updateIncome(
  id: string,
  userId: string,
  updates: Partial<Omit<IncomeEntry, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, updates)
    
    // If year was updated or to be safe, clear cache
    incomeCache.clear()
  } catch (error) {
    console.error('Error updating income:', error)
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
  
  const monthlyData: Record<string, { primary: number; secondary: number; credits: number; debits: number; pending: number; received: number }> = {}
  
  // Initialize all months
  MONTHS.forEach(month => {
    monthlyData[month] = { primary: 0, secondary: 0, credits: 0, debits: 0, pending: 0, received: 0 }
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
        
        // Calculate pending vs received
        const status = entry.status || 'received'
        if (status === 'pending') {
          monthData.pending += entry.amount
        } else {
          monthData.received += entry.amount
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
      pending: data.pending,
      received: data.received,
    }
  })
}

export async function getAnnualStats(userId: string): Promise<AnnualStats[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const entries = querySnapshot.docs.map(doc => doc.data() as IncomeEntry)
    
    const annualData: Record<number, { total: number; pending: number; received: number }> = {}
    
    entries.forEach(entry => {
      if (!annualData[entry.year]) {
        annualData[entry.year] = { total: 0, pending: 0, received: 0 }
      }
      
      const yearData = annualData[entry.year]
      if (entry.type === 'credit') { // Only count income
        yearData.total += entry.amount
        
        const status = entry.status || 'received'
        if (status === 'pending') {
          yearData.pending += entry.amount
        } else {
          yearData.received += entry.amount
        }
      }
    })
    
    return Object.entries(annualData).map(([year, data]) => ({
      year: parseInt(year),
      total: data.total,
      pending: data.pending,
      received: data.received
    })).sort((a, b) => a.year - b.year) // Sort by year ascending
    
  } catch (error) {
    console.error('Error fetching annual stats:', error)
    return []
  }
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

export async function getAllTimeStats(userId: string): Promise<AllTimeStats> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const entries = querySnapshot.docs.map(doc => doc.data() as IncomeEntry)

    const stats = entries.reduce(
      (acc, entry) => {
        // Default to received if no status (backward compatibility)
        const status = entry.status || 'received'
        
        if (status === 'pending') {
          acc.totalPending += entry.amount
        } else {
          acc.totalReceived += entry.amount
        }
        return acc
      },
      { totalPending: 0, totalReceived: 0 }
    )

    return stats
  } catch (error) {
    console.error('Error fetching all-time stats:', error)
    return { totalPending: 0, totalReceived: 0 }
  }
}
