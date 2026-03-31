"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    TrendingUp,
    FileText,
    BarChart3,
    CreditCard,
    Settings,
    Wallet,
    LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: TrendingUp, label: "Income", href: "/income" },
    { icon: FileText, label: "Ledger", href: "/ledger" },
    { icon: BarChart3, label: "Reports", href: "/reports" },
    { icon: CreditCard, label: "Payments", href: "/payments" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <div className="w-64 h-screen bg-[#0A0C10] border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#D4AF37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    <Wallet className="w-6 h-6 text-black" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    FinTrack
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                    />
                                )}
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-primary" : "group-hover:text-primary"
                                    )}
                                />
                                <span className="font-medium">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
