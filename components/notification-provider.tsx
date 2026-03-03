"use client";

import { useEffect } from "react";
import {
    getMessaging,
    getToken,
    onMessage,
    isSupported,
} from "firebase/messaging";
import { app, firebaseConfig } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { saveFcmToken } from "@/lib/user-service";
import { saveNotification } from "@/lib/notification-service";
import { useRouter } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

async function registerSW(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js",
    );
    if (existing) return existing;
    return navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

async function sendConfigToSW(registration: ServiceWorkerRegistration) {
    const target =
        registration.active || registration.installing || registration.waiting;
    if (!target) return;

    const sendMsg = (sw: ServiceWorker) => {
        sw.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });
    };

    if (target.state === "activated") {
        sendMsg(target);
    } else {
        target.addEventListener("statechange", function handler() {
            if (this.state === "activated") {
                sendMsg(this as ServiceWorker);
                target.removeEventListener("statechange", handler);
            }
        });
    }
}

export function NotificationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        const initFCM = async () => {
            try {
                const supported = await isSupported();
                if (!supported) {
                    console.warn("[FCM] Not supported in this browser.");
                    return;
                }

                if (!("serviceWorker" in navigator)) {
                    console.warn("[FCM] Service workers not available.");
                    return;
                }

                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                if (!vapidKey) {
                    console.error(
                        "[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set in .env.local",
                    );
                    return;
                }

                const permission = await Notification.requestPermission();
                console.log("[FCM] Notification permission:", permission);
                if (permission !== "granted") return;

                const registration = await registerSW();
                await sendConfigToSW(registration);

                const messaging = getMessaging(app);
                const token = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration,
                });

                if (token) {
                    console.log(
                        "%c[FCM] TOKEN — copy this for testing:",
                        "color: green; font-weight: bold; font-size: 14px;",
                    );
                    console.log(token);
                    await saveFcmToken(user.uid, token);
                } else {
                    console.warn(
                        "[FCM] No token received. Check VAPID key and browser permissions.",
                    );
                }
            } catch (error) {
                console.error("[FCM] Error initializing:", error);
            }
        };

        initFCM();
    }, [user]);

    useEffect(() => {
        const playNotificationSound = () => {
            try {
                const audio = new Audio("/notification.wav");
                audio.volume = 0.7;
                audio.play().catch(() => {
                    // Autoplay may be blocked until user has interacted with the page
                });
            } catch {
                // Ignore audio errors silently
            }
        };

        const setupForegroundMessages = async () => {
            const supported = await isSupported();
            if (!supported) return;

            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log("[FCM] Foreground message:", payload);
                const { title, body, image } = payload.notification || {};
                const link = payload.data?.link;

                playNotificationSound();

                // Save to Firestore so it appears in notification bell
                if (user) {
                    saveNotification(user.uid, {
                        title: title || "New Notification",
                        body: body || "",
                        image: image || null,
                        link: link || null,
                    });
                }

                toast({
                    title: title || "New Notification",
                    description: (
                        <div className="flex flex-col flex-1 mt-1 gap-2">
                            {body && (
                                <p className="text-sm opacity-90">{body}</p>
                            )}
                            {image && (
                                <div className="relative h-[150px] w-full rounded-md mt-2 border overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image}
                                        alt="Notification Image"
                                        className="object-cover w-full h-[150px]"
                                    />
                                </div>
                            )}
                        </div>
                    ),
                    action: link ? (
                        <ToastAction
                            altText="View"
                            onClick={() => router.push(link)}
                        >
                            View
                        </ToastAction>
                    ) : undefined,
                });
            });

            return () => unsubscribe();
        };

        let cleanup: (() => void) | undefined;
        setupForegroundMessages().then((unsub) => {
            cleanup = unsub;
        });
        return () => {
            if (cleanup) cleanup();
        };
    }, [toast, router]);

    return <>{children}</>;
}
