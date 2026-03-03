import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { sendSmsToMany } from "@/lib/sms-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let body: {
        title?: string;
        body?: string;
        image?: string;
        extraPhones?: string[];
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { title, body: messageBody, image, extraPhones = [] } = body;

    if (!title || !messageBody) {
        return NextResponse.json(
            { error: "title and body are required" },
            { status: 400 }
        );
    }

    const results = {
        success: true,
        totalUsers: 0,
        sentCount: 0,
        failedCount: 0,
        tokensFound: 0,
        phonesFound: 0,
        smsSentCount: 0,
        smsFailedCount: 0,
        error: null as string | null,
        adminInitialized: !!(adminAuth && adminDb),
    };

    try {
        const tokens: string[] = [];
        const phones: string[] = [];
        const smsMessage = `${title}\n${messageBody}`;

        // 1. Notification logic (Requires Firebase Admin)
        if (adminAuth && adminDb) {
            try {
                // Fetch all users from Firebase Auth
                const listResult = await adminAuth.listUsers(1000);
                const users = listResult.users;
                results.totalUsers = users.length;

                if (users.length > 0) {
                    const batch = adminDb.batch();
                    const now = admin.firestore.FieldValue.serverTimestamp();

                    await Promise.all(
                        users.map(async (user) => {
                            // Write in-app notification
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

                            // Collect tokens and phones from Firestore
                            const userDoc = await adminDb!
                                .collection("users")
                                .doc(user.uid)
                                .get();
                            const data = userDoc.data();
                            const token = data?.fcmToken as string | undefined;
                            const phone = data?.phoneNumber as string | undefined;

                            if (token) tokens.push(token);
                            if (phone) phones.push(phone);
                        })
                    );

                    await batch.commit();
                    results.tokensFound = tokens.length;
                    results.phonesFound = phones.length;

                    // Send FCM push
                    if (tokens.length > 0 && admin.apps.length > 0) {
                        try {
                            const messaging = admin.messaging();
                            const pushMessage: admin.messaging.MulticastMessage = {
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
                            };
                            const result = await messaging.sendEachForMulticast(pushMessage);
                            results.sentCount = result.successCount;
                            results.failedCount = result.failureCount;
                        } catch (pushErr: any) {
                            console.error("[notify] Push error:", pushErr.message);
                        }
                    }
                }
            } catch (adminErr: any) {
                console.error("[notify] Admin logic error:", adminErr.message);
                results.error = "Firebase Admin logic failed: " + adminErr.message;
            }
        } else {
            console.warn("[notify] Firebase Admin NOT initialized. Skipping push/inbox.");
            results.error = "Push notifications skipped: Firebase Admin credentials missing.";
        }

        // 2. SMS logic (Twilio works independently if configured)
        const allPhones = [...new Set([...phones, ...extraPhones.filter((p) => p.trim())])];
        if (allPhones.length > 0) {
            console.log(`[notify] Sending SMS to ${allPhones.length} numbers via Twilio...`);
            const { smsSentCount, smsFailedCount } = await sendSmsToMany(allPhones, smsMessage);
            results.smsSentCount = smsSentCount;
            results.smsFailedCount = smsFailedCount;
            if (results.phonesFound === 0) results.phonesFound = allPhones.length;
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("[/api/admin/notify] Global error:", error);
        return NextResponse.json(
            { error: "Internal server error: " + error.message },
            { status: 500 }
        );
    }
}
