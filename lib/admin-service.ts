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
    // Note: This requires Firestore rules to allow reading all documents
    // otherwise this will fail with permission-denied.
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as IncomeEntry[];

    const userMap = new Map<string, AdminUserStats>();

    entries.forEach(entry => {
      const data = entry as any;
      const userId = data.userId;

      if (!userId) return;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: 'Loading...',
          userEmail: '',
          totalIncome: 0,
          totalPending: 0,
          totalReceived: 0,
          entryCount: 0,
          lastActive: new Date(0),
        });
      }

      const stats = userMap.get(userId)!;
      
      // Update stats
      if (entry.type === 'credit') {
        stats.totalIncome += entry.amount;
        
        const status = entry.status || 'received';
        if (status === 'pending') {
          stats.totalPending += entry.amount;
        } else {
          stats.totalReceived += entry.amount;
        }
      }

      stats.entryCount++;

      if (entry.createdAt > stats.lastActive) {
        stats.lastActive = entry.createdAt;
      }
    });

    // Fetch all user profiles
    const userProfiles = await getAllUserProfiles();
    
    // Populate user names from profiles
    const statsArray = Array.from(userMap.values());
    
    statsArray.forEach(stat => {
      const profile = userProfiles.get(stat.userId);
      if (profile) {
        stat.userName = profile.displayName || stat.userName;
        stat.userEmail = profile.email || stat.userEmail;
      } else {
         // Fallback for users not yet in the new collection
         if (stat.userId === auth.currentUser?.uid) {
             stat.userName = auth.currentUser.displayName || 'Current User';
             stat.userEmail = auth.currentUser.email || '';
         } else {
             stat.userName = `User ${stat.userId.substring(0, 8)}...`;
             stat.userEmail = 'N/A';
         }
      }
    });

    return statsArray;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
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

