import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { 
        error: 'Firebase Admin not initialized. Missing Service Account credentials.',
        code: 'CONFIG_MISSING' 
      },
      { status: 401 } // Unauthorized / Configuration Missing
    );
  }

  try {
    // 1. Fetch all users from Auth
    const listUsersResult = await adminAuth.listUsers(1000);
    const authUsers = listUsersResult.users;
    
    // Create a map for easy lookup
    const userMap = new Map();
    authUsers.forEach(user => {
        userMap.set(user.uid, {
            userName: user.displayName || (user.email ? user.email.split('@')[0] : 'Unknown User'),
            userEmail: user.email || 'N/A',
            uid: user.uid
        });
    });

    // 2. Fetch all income entries from Firestore (Admin SDK bypasses security rules)
    const entriesSnap = await adminDb.collection('income_entries').get();
    
    // 3. Aggregate Stats
    const statsMap = new Map();

    // Initialize stats for all known Auth users (so even users with 0 entries show up)
    authUsers.forEach(user => {
        statsMap.set(user.uid, {
            userId: user.uid,
            userName: user.displayName || (user.email ? user.email.split('@')[0] : 'Unknown User'),
            userEmail: user.email || 'N/A',
            totalIncome: 0,
            totalPending: 0,
            totalReceived: 0,
            entryCount: 0,
            lastActive: new Date(0), // Epoch
        });
    });

    entriesSnap.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        
        if (!userId) return;

        // If we found an entry for a user not in Auth list (maybe deleted user?), create a stub
        if (!statsMap.has(userId)) {
             statsMap.set(userId, {
                userId,
                userName: `User ${userId.substring(0, 8)}...`,
                userEmail: 'N/A',
                totalIncome: 0,
                totalPending: 0,
                totalReceived: 0,
                entryCount: 0,
                lastActive: new Date(0),
            });
        }

        const stats = statsMap.get(userId);
        
        // Update counts
        stats.entryCount += 1;
        
        // Parse dates
        const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
        if (createdAt > stats.lastActive) {
            stats.lastActive = createdAt;
        }

        // Financials
        if (data.type === 'credit') {
            const amount = Number(data.amount) || 0;
            stats.totalIncome += amount;
            
            const status = data.status || 'received';
            if (status === 'pending') {
                stats.totalPending += amount;
            } else {
                stats.totalReceived += amount;
            }
        }
    });
    
    const statsArray = Array.from(statsMap.values());

    // Sort by Total Pending (Descending) by default, then Total Income
    statsArray.sort((a, b) => b.totalPending - a.totalPending || b.totalIncome - a.totalIncome);

    return NextResponse.json({ stats: statsArray });

  } catch (error) {
    console.error('Error in /api/admin/stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
