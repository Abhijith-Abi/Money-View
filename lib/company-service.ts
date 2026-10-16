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
    onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Company } from "@/types/company";

const COLLECTION_NAME = "companies";
const LOCAL_STORAGE_KEY = "money_view_companies_cache";

function getCachedCompanies(userId: string): Company[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function setCachedCompanies(userId: string, companies: Company[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(companies));
    } catch (e) {
        console.error("Failed to cache companies:", e);
    }
}

export async function getCompanies(userId: string): Promise<Company[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        })) as Company[];

        setCachedCompanies(userId, list);
        return list;
    } catch (error) {
        console.warn("Error fetching companies from Firestore, using cache fallback:", error);
        return getCachedCompanies(userId);
    }
}

export function subscribeToCompanies(
    userId: string,
    callback: (companies: Company[]) => void
): () => void {
    // Deliver cached version immediately to avoid UI flicker
    const cached = getCachedCompanies(userId);
    if (cached.length > 0) {
        callback(cached);
    }

    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
                })) as Company[];

                setCachedCompanies(userId, list);
                callback(list);
            },
            (error) => {
                console.warn("Companies subscription error, falling back to cache:", error);
                callback(getCachedCompanies(userId));
            }
        );
    } catch (error) {
        console.warn("Error setting up companies listener:", error);
        return () => {};
    }
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
    try {
        const dataToWrite = {
            userId,
            name: data.name.trim(),
            category: data.category || "primary",
            color: data.color || "#6366f1",
            description: data.description?.trim() || "",
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToWrite);

        // Update local cache
        const current = getCachedCompanies(userId);
        const newEntry: Company = {
            id: docRef.id,
            userId,
            name: dataToWrite.name,
            category: dataToWrite.category as any,
            color: dataToWrite.color,
            description: dataToWrite.description,
            createdAt: new Date(),
        };
        setCachedCompanies(userId, [newEntry, ...current]);

        return docRef.id;
    } catch (error) {
        console.error("Error adding company:", error);
        throw error;
    }
}

export async function updateCompany(
    companyId: string,
    userId: string,
    updates: Partial<Omit<Company, "id" | "userId" | "createdAt">>
): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, companyId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });

        // Update local cache
        const current = getCachedCompanies(userId);
        const updated = current.map((c) =>
            c.id === companyId ? { ...c, ...updates } : c
        );
        setCachedCompanies(userId, updated);
    } catch (error) {
        console.error("Error updating company:", error);
        throw error;
    }
}

export async function deleteCompany(companyId: string, userId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, companyId));

        // Update local cache
        const current = getCachedCompanies(userId);
        const filtered = current.filter((c) => c.id !== companyId);
        setCachedCompanies(userId, filtered);
    } catch (error) {
        console.error("Error deleting company:", error);
        throw error;
    }
}
