import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Firebase Admin not initialized. Check server logs for credentials issue.' },
      { status: 500 }
    );
  }

  try {
    // List batch of users, 1000 at a time.
    // robust implementation would handle paginationToken if user base > 1000
    const listUsersResult = await adminAuth.listUsers(1000);
    
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      creationTime: userRecord.metadata.creationTime,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users from Firebase Auth:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
