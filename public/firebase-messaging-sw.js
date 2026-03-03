importScripts(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
    apiKey: "AIzaSyCcjfii27dVKfCWoyQSaSQZvYWgKcrYyaA",
    authDomain: "money-view-e3ad1.firebaseapp.com",
    projectId: "money-view-e3ad1",
    storageBucket: "money-view-e3ad1.firebasestorage.app",
    messagingSenderId: "1224413917",
    appId: "1:1224413917:web:824e24429ed64b68588134",
    measurementId: "G-7SB8MKMLHB",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// onBackgroundMessage fires for DATA-ONLY messages (no "notification" field in payload).
// For messages WITH a "notification" field, Chrome auto-shows the native OS notification.
// Here we handle data-only payloads OR override the auto-display layout.
messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background message received:", payload);

    // Read from either data fields (data-only) or notification fields (mixed)
    const title =
        payload.data?.title ||
        payload.notification?.title ||
        "New Notification";
    const body = payload.data?.body || payload.notification?.body || "";
    const image = payload.data?.image || payload.notification?.image;
    const link = payload.data?.link || "/";

    const notificationOptions = {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [200, 100, 200, 100, 200],
        data: { url: link },
        ...(image ? { image } : {}),
        actions: [{ action: "open", title: "👁 View" }],
    };

    // Show the OS notification explicitly
    self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const urlToOpen = new URL(
        event.notification.data?.url || "/",
        self.location.origin,
    ).href;

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if ("focus" in client) {
                        client.focus();
                        if ("navigate" in client) client.navigate(urlToOpen);
                        return;
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            }),
    );
});
