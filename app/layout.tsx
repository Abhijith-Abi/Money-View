import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Money View - Financial Income Tracker",
    description:
        "Track and visualize your income with beautiful charts and analytics",
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
