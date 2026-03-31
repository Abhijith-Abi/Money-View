import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals.css";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";

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
                                    {/* Background decorative elements */}
                                    <div className="fixed inset-0 pointer-events-none -z-10">
                                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full opacity-30 animate-pulse" />
                                        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full opacity-20" />
                                    </div>
                                    <div className="relative z-10">{children}</div>
                                </main>
                            </div>
                        </NotificationProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
