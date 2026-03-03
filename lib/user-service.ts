"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User, updateProfile } from "firebase/auth";
import { auth } from "./firebase";

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber?: string | null;
    lastLogin: Date;
    createdAt?: Date;
}

export const COLLECTION_NAME = "users";

/**
 * Saves or updates user profile in Firestore
 */
export async function saveUserProfile(user: User): Promise<void> {
    if (!user) return;

    try {
        const userRef = doc(db, COLLECTION_NAME, user.uid);
        const userSnap = await getDoc(userRef);

        const userData: Partial<UserProfile> = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date(), // Will be converted to timestamp by Firestore
        };

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
            });
        } else {
            // If the incoming displayName is null but we already have one in Firestore, don't overwrite it
            const existingData = userSnap.data();
            if (!userData.displayName && existingData?.displayName) {
                delete userData.displayName;
            }
            // Update existing user to keep lastLogin fresh
            await setDoc(userRef, userData, { merge: true });
        }
    } catch (error) {
        console.error("Error saving user profile:", error);
        // Don't throw here to avoid blocking login flow
    }
}

/**
 * Saves the FCM push notification token for a user
 */
export async function saveFcmToken(uid: string, token: string): Promise<void> {
    try {
        const userRef = doc(db, COLLECTION_NAME, uid);
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        console.log('[FCM] Token saved to Firestore:', token);
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
}

/**
 * Fetches the full user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const userRef = doc(db, COLLECTION_NAME, uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return null;
        return snap.data() as UserProfile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Saves the user's phone number and optionally their name to Firestore
 */
export async function savePhoneNumber(uid: string, phone: string, name?: string): Promise<void> {
    try {
        const userRef = doc(db, COLLECTION_NAME, uid);
        const data: any = { phoneNumber: phone };
        if (name) data.displayName = name;
        
        await setDoc(userRef, data, { merge: true });

        // Also update the Firebase Auth profile for immediate local feedback
        if (name && auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name });
        }
        
        console.log('[User] Profile updated:', data);
    } catch (error) {
        console.error('Error updating user profile:', error);
    }
}

/**
 * Fetches all user profiles (for admin use)
 */
export async function getAllUserProfiles(): Promise<Map<string, UserProfile>> {
    const { collection, getDocs } = await import("firebase/firestore");
    
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const userMap = new Map<string, UserProfile>();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            userMap.set(doc.id, data);
        });
        
        return userMap;
    } catch (error) {
        console.error("Error fetching user profiles:", error);
        return new Map();
    }
}
