"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    TrendingUp,
    Briefcase,
    CreditCard,
    Settings,
    Wallet,
    LogOut,
    Calculator,
    Bell,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { EMICalculatorDialog } from "@/components/business/emi-calculator-dialog";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Briefcase, label: "Business & Ledger", href: "/business" },
    { icon: Bell, label: "Notifications", href: "/notify" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 h-screen bg-[#030712]/90 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
            {/* Brand Logo */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/[0.06]">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(139,92,246,0.35)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.55)] transition-all duration-300">
                            <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div>
                        <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                            MoneyView
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                        <p className="text-[10px] text-purple-300/60 font-semibold tracking-wider uppercase">
                            Finance & EMI OS
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                <div className="px-3 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Main Navigation
                    </p>
                </div>

                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-xs font-semibold",
                                    isActive
                                        ? "bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-r-full shadow-[0_0_10px_#a855f7]"
                                    />
                                )}
                                <div
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-purple-500/20 text-purple-300"
                                            : "bg-white/[0.04] text-slate-400 group-hover:text-purple-300 group-hover:bg-purple-500/10"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="flex-1">{item.label}</span>
                                {item.href === "/business" && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                                        Pro
                                    </span>
                                )}
                            </motion.div>
                        </Link>
                    );
                })}

                {/* Quick EMI Calculator Trigger in Sidebar */}
                <div className="pt-4 px-1">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 shadow-inner">
                        <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-1">
                            <Calculator className="w-3.5 h-3.5 text-purple-400" />
                            <span>EMI & Loan Helper</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                            Auto calculate money paid, pending months & schedules.
                        </p>
                        <EMICalculatorDialog
                            trigger={
                                <button className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-1.5">
                                    <Calculator className="w-3 h-3" />
                                    Launch Calculator
                                </button>
                            }
                        />
                    </div>
                </div>
            </nav>

            {/* User Profile & Logout */}
            <div className="p-3 border-t border-white/[0.06] bg-black/30 space-y-2">
                {user && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                            {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">
                                {user.displayName || "FinTrack User"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => logout()}
                    className="flex items-center justify-center gap-2 px-3 py-2 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-xs font-semibold"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
