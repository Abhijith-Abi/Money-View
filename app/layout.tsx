import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals.css";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { AIAssistantWidget } from "@/components/ai-assistant-widget";

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
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} font-sans antialiased bg-[#050505] text-white`}
                suppressHydrationWarning
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <NotificationProvider>
                            <div className="flex min-h-screen overflow-hidden">
                                <Sidebar />
                                <main className="flex-1 ml-64 relative min-h-screen overflow-y-auto">
                                    {/* Ambient mesh lighting background */}
                                    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                                        <div className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-transparent blur-[140px] rounded-full animate-float-slow" />
                                        <div className="absolute top-[35%] -right-[15%] w-[45vw] h-[45vw] bg-gradient-to-bl from-cyan-500/12 via-blue-600/8 to-transparent blur-[150px] rounded-full animate-pulse-glow" />
                                        <div className="absolute -bottom-[15%] left-[20%] w-[40vw] h-[40vw] bg-gradient-to-tr from-emerald-500/10 via-purple-900/10 to-transparent blur-[140px] rounded-full" />
                                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
                                    </div>
                                    <div className="relative z-10">{children}</div>
                                </main>
                            </div>
                            <AIAssistantWidget />
                        </NotificationProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
