import {
    collection,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    Timestamp,
    onSnapshot,
    getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { Company } from "@/types/company";

const LOCAL_STORAGE_KEY = "money_view_companies_cache";

// Global in-memory listeners so all components update synchronously
const localListeners = new Map<string, Set<(companies: Company[]) => void>>();

function getCachedCompanies(userId: string): Company[] {
    if (typeof window === "undefined" || !userId) return [];
    try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.map((item) => ({
                  ...item,
                  createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              }))
            : [];
    } catch {
        return [];
    }
}

function setCachedCompanies(userId: string, companies: Company[]): void {
    if (typeof window === "undefined" || !userId) return;
    try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(companies));
    } catch (e) {
        console.warn("Failed to cache companies to localStorage:", e);
    }

    // Broadcast to all active local listeners for this user
    const userListeners = localListeners.get(userId);
    if (userListeners) {
        userListeners.forEach((listener) => {
            try {
                listener(companies);
            } catch (err) {
                console.error("Error in company subscriber callback:", err);
            }
        });
    }
}

/**
 * Returns the collection reference for a user's companies (nested under user profile)
 */
function getCompaniesRef(userId: string) {
    return collection(db, "users", userId, "companies");
}

export async function getCompanies(userId: string): Promise<Company[]> {
    if (!userId) return [];
    const cached = getCachedCompanies(userId);

    try {
        const q = query(getCompaniesRef(userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const list = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            })) as Company[];

            setCachedCompanies(userId, list);
            return list;
        }
        return cached;
    } catch (error) {
        // Fallback cleanly to local storage if Firestore rules block or offline
        return cached;
    }
}

export function subscribeToCompanies(
    userId: string,
    callback: (companies: Company[]) => void
): () => void {
    if (!userId) {
        callback([]);
        return () => {};
    }

    // Register callback in local listeners set
    if (!localListeners.has(userId)) {
        localListeners.set(userId, new Set());
    }
    const userListeners = localListeners.get(userId)!;
    userListeners.add(callback);

    // Immediately deliver cached version
    const cached = getCachedCompanies(userId);
    callback(cached);

    let unsubscribeFirestore: (() => void) | null = null;

    try {
        const q = query(getCompaniesRef(userId), orderBy("createdAt", "desc"));
        unsubscribeFirestore = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
                })) as Company[];

                setCachedCompanies(userId, list);
            },
            (error) => {
                // Silently maintain local storage cache if permission-denied
                console.info("Firestore companies sync using local storage:", error.message || error);
                callback(getCachedCompanies(userId));
            }
        );
    } catch (error) {
        console.info("Using local storage companies store.");
    }

    return () => {
        userListeners.delete(callback);
        if (unsubscribeFirestore) {
            unsubscribeFirestore();
        }
    };
}

export async function addCompany(
    userId: string,
    data: {
        name: string;
        category?: "primary" | "secondary";
        color?: string;
        description?: string;
    }
): Promise<string> {
    if (!userId) throw new Error("User ID is required to add a company");

    const newId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCompany: Company = {
        id: newId,
        userId,
        name: data.name.trim(),
        category: data.category || "primary",
        color: data.color || "#6366f1",
        description: data.description?.trim() || "",
        createdAt: new Date(),
    };

    // 1. Immediately save to local storage & notify all subscribers (instant UI response)
    const current = getCachedCompanies(userId);
    const updatedList = [newCompany, ...current.filter((c) => c.id !== newId)];
    setCachedCompanies(userId, updatedList);

    // 2. Attempt Firestore sync in background without breaking if rules fail
    try {
        const dataToWrite = {
            ...newCompany,
            createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, "users", userId, "companies", newId), dataToWrite);
    } catch (firestoreError) {
        console.warn("Company saved locally (Firestore permissions not yet updated):", firestoreError);
    }

    return newId;
}

export async function updateCompany(
    companyId: string,
    userId: string,
    updates: Partial<Omit<Company, "id" | "userId" | "createdAt">>
): Promise<void> {
    if (!userId || !companyId) return;

    // 1. Update local storage & broadcast immediately
    const current = getCachedCompanies(userId);
    const updated = current.map((c) => (c.id === companyId ? { ...c, ...updates } : c));
    setCachedCompanies(userId, updated);

    // 2. Attempt Firestore update
    try {
        const docRef = doc(db, "users", userId, "companies", companyId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.warn("Company update saved locally:", error);
    }
}

export async function deleteCompany(companyId: string, userId: string): Promise<void> {
    if (!userId || !companyId) return;

    // 1. Delete from local storage & broadcast immediately
    const current = getCachedCompanies(userId);
    const filtered = current.filter((c) => c.id !== companyId);
    setCachedCompanies(userId, filtered);

    // 2. Attempt Firestore delete
    try {
        await deleteDoc(doc(db, "users", userId, "companies", companyId));
    } catch (error) {
        console.warn("Company deletion synced locally:", error);
    }
}
