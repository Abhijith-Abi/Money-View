import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { BusinessProfile } from '@/types/customer'

const COLLECTION_NAME = 'business_profiles'

export async function createBusinessProfile(
  profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
  userId: string
): Promise<string> {
  try {
    const dataToWrite = {
      ...profile,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToWrite)
    console.log('Business profile created successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating business profile:', error)
    throw error
  }
}

export async function updateBusinessProfile(
  id: string,
  userId: string,
  updates: Partial<Omit<BusinessProfile, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
    console.log('Business profile updated successfully for ID:', id)
  } catch (error) {
    console.error('Error updating business profile:', error)
    throw error
  }
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    console.log(`Found ${querySnapshot.size} business profiles for user ${userId}`)
    
    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as BusinessProfile
  } catch (error) {
    console.error('Error fetching business profile:', error)
    throw error
  }
}

export async function hasBusinessProfile(userId: string): Promise<boolean> {
  try {
    const profile = await getBusinessProfile(userId)
    return profile !== null
  } catch (error) {
    console.error('Error checking business profile:', error)
    return false
  }
}
