import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    if (!adminAuth || !adminDb) {
        return NextResponse.json(
            {
                error: "Firebase Admin not initialized. Check server credentials.",
                code: "CONFIG_MISSING",
            },
            { status: 500 }
        );
    }

    let body: { title?: string; body?: string; image?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, body: messageBody, image } = body;

    if (!title || !messageBody) {
        return NextResponse.json(
            { error: "title and body are required" },
            { status: 400 }
        );
    }

    try {
        // 1. Fetch all users from Firebase Auth
        const listResult = await adminAuth.listUsers(1000);
        const users = listResult.users;

        if (users.length === 0) {
            return NextResponse.json({ success: true, sentCount: 0, failedCount: 0 });
        }

        // 2. For each user: collect FCM token + write notification to Firestore
        const tokens: string[] = [];
        const batch = adminDb.batch();
        const now = admin.firestore.FieldValue.serverTimestamp();

        await Promise.all(
            users.map(async (user) => {
                // Write in-app notification to Firestore sub-collection
                const notifRef = adminDb!
                    .collection("users")
                    .doc(user.uid)
                    .collection("notifications")
                    .doc();

                batch.set(notifRef, {
                    title,
                    body: messageBody,
                    image: image || null,
                    link: null,
                    read: false,
                    createdAt: now,
                });

                // Collect FCM token if available
                const userDoc = await adminDb!.collection("users").doc(user.uid).get();
                const token = userDoc.data()?.fcmToken as string | undefined;
                if (token) tokens.push(token);
            })
        );

        // 3. Commit all Firestore notification writes
        await batch.commit();

        // 4. Send FCM push to all collected tokens
        let sentCount = 0;
        let failedCount = 0;

        if (tokens.length > 0) {
            const messaging = admin.messaging();
            const message: admin.messaging.MulticastMessage = {
                tokens,
                notification: {
                    title,
                    body: messageBody,
                    ...(image ? { imageUrl: image } : {}),
                },
                data: {
                    title,
                    body: messageBody,
                    ...(image ? { image } : {}),
                    link: "/",
                },
                webpush: {
                    notification: {
                        title,
                        body: messageBody,
                        ...(image ? { image } : {}),
                        icon: "/icon-192x192.png",
                        badge: "/icon-192x192.png",
                    },
                    fcmOptions: {
                        link: "/",
                    },
                },
            };

            const result = await messaging.sendEachForMulticast(message);
            sentCount = result.successCount;
            failedCount = result.failureCount;
        }

        return NextResponse.json({
            success: true,
            totalUsers: users.length,
            sentCount,
            failedCount,
            tokensFound: tokens.length,
        });
    } catch (error) {
        console.error("[/api/admin/notify] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
