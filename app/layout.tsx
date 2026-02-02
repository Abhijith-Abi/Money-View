import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: {
        default: "Money View - Financial Income Tracker",
        template: "%s | Money View",
    },
    description:
        "Track and visualize your income with beautiful charts and analytics. Securely manage your financial journey with ease.",
    keywords: [
        "finance",
        "tracker",
        "income",
        "money",
        "view",
        "analytics",
        "dashboard",
    ],
    authors: [{ name: "Money View Team" }],
    creator: "Money View",
    publisher: "Money View",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL("https://money-view.abisolutions.online"),
    openGraph: {
        title: "Money View - Financial Income Tracker",
        description:
            "Track and visualize your income with beautiful charts and analytics.",
        url: "https://money-view.abisolutions.online",
        siteName: "Money View",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Money View - Financial Income Tracker",
        description:
            "Track and visualize your income with beautiful charts and analytics.",
        creator: "@moneyview",
    },
    icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/icon.svg",
    },
    manifest: "/manifest.json",
};

export const viewport = {
    themeColor: "#9333ea",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.variable} font-sans antialiased`}
                suppressHydrationWarning
            >
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
