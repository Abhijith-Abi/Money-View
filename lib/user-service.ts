"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
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
            // Update existing user to keep lastLogin fresh
            await setDoc(userRef, userData, { merge: true });
        }
    } catch (error) {
        console.error("Error saving user profile:", error);
        // Don't throw here to avoid blocking login flow
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
