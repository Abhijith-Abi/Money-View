import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { IncomeEntry } from '@/types/income';
import { getAllUserProfiles } from './user-service';

export interface AdminUserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalIncome: number;
  totalPending: number;
  totalReceived: number;
  entryCount: number;
  lastActive: Date;
}

const COLLECTION_NAME = 'income_entries';

// Cache for user info to avoid repeated lookups
const userInfoCache = new Map<string, { name: string; email: string }>();

export async function getAllUsersStats(): Promise<AdminUserStats[]> {
  try {
    const response = await fetch('/api/admin/stats');
    
    if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        (error as any).code = errorData.code; // Propagate the error code
        throw error;
    }

    const data = await response.json();
    
    // Parse the date strings back to Date objects
    if (data.stats && Array.isArray(data.stats)) {
        return data.stats.map((stat: any) => ({
            ...stat,
            lastActive: new Date(stat.lastActive)
        }));
    }
    
    return [];

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    // Propagate error so UI can show the error state (or permission denied message if applicable)
    throw error;
  }
}

export async function getUserEntries(userId: string): Promise<IncomeEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as IncomeEntry[];
  } catch (error) {
    console.error('Error fetching user entries:', error);
    throw error;
  }
}


export async function getUserDetails(userId: string): Promise<AdminUserStats | undefined> {
    // For now, we reuse the all-users fetch since we don't have a single-user API yet.
    // In a larger app, we would make a dedicated endpoint /api/admin/users/[userId]
    const allStats = await getAllUsersStats();
    return allStats.find(s => s.userId === userId);
}
