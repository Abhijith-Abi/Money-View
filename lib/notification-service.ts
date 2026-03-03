import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    where,
    writeBatch,
    getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    image?: string | null;
    link?: string | null;
    read: boolean;
    createdAt: Date;
}

const notificationsRef = (uid: string) =>
    collection(db, "users", uid, "notifications");

/**
 * Save a new notification to Firestore
 */
export async function saveNotification(
    uid: string,
    data: Omit<AppNotification, "id" | "read" | "createdAt">
): Promise<void> {
    try {
        await addDoc(notificationsRef(uid), {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("[Notifications] Error saving:", error);
    }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
    uid: string,
    callback: (notifications: AppNotification[]) => void
): () => void {
    const q = query(
        notificationsRef(uid),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const notifications: AppNotification[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<AppNotification, "id">),
            createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        }));
        callback(notifications);
    });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(uid: string, notifId: string): Promise<void> {
    const ref = doc(db, "users", uid, "notifications", notifId);
    await updateDoc(ref, { read: true });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(uid: string): Promise<void> {
    const q = query(notificationsRef(uid), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(uid: string, notifId: string): Promise<void> {
    const ref = doc(db, "users", uid, "notifications", notifId);
    await deleteDoc(ref);
}
