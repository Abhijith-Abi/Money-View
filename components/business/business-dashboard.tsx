"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCustomerStats } from "@/lib/customer-service";
import { getRecentTransactions } from "@/lib/ledger-service";
import { getBusinessProfile } from "@/lib/business-service";
import { CustomerStats, Transaction, BusinessProfile } from "@/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    ArrowUpCircle,
    ArrowDownCircle,
    Activity,
    TrendingUp,
    Building2,
    Calendar,
    Sparkles,
    ShieldAlert,
    Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { EMICalculatorDialog } from "./emi-calculator-dialog";
import { formatCurrency, cn } from "@/lib/utils";

export function BusinessDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [statsData, transactions, profileData] = await Promise.all([
                    getCustomerStats(user.uid),
                    getRecentTransactions(user.uid, 6),
                    getBusinessProfile(user.uid),
                ]);
                setStats(statsData);
                setRecentTransactions(transactions);
                setProfile(profileData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const statCards = [
        {
            title: "Total Customers",
            value: stats?.totalCustomers || 0,
            icon: Users,
            color: "text-white",
            border: "hover:border-blue-500/40",
            iconBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            badge: "Customer Base",
            badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        },
        {
            title: "Total Receivables",
            value: formatCurrency(stats?.totalReceivables || 0),
            icon: ArrowDownCircle,
            color: "text-emerald-400",
            border: "hover:border-emerald-500/40",
            iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            badge: "Due From Customers",
            badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        },
        {
            title: "Total Payables",
            value: formatCurrency(stats?.totalPayables || 0),
            icon: ArrowUpCircle,
            color: "text-rose-400",
            border: "hover:border-rose-500/40",
            iconBg: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
            badge: "Advance Held",
            badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        },
        {
            title: "Active Accounts",
            value: stats?.activeCustomers || 0,
            icon: Activity,
            color: "text-purple-400",
            border: "hover:border-purple-500/40",
            iconBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
            badge: "Transacting",
            badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        },
    ];

    const totalReceivables = stats?.totalReceivables || 0;
    const totalPayables = stats?.totalPayables || 0;
    const totalFlow = totalReceivables + totalPayables || 1;
    const receivablePercent = Math.round((totalReceivables / totalFlow) * 100);

    return (
        <div className="space-y-6">
            {/* Business Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 rounded-[2rem] bg-gradient-to-r from-purple-900/25 via-indigo-900/15 to-slate-900/40 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Enterprise Ledger
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {profile?.businessName || "Your Enterprise"}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-purple-400" />
                        {profile?.ownerName || "Business Management Hub"}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <EMICalculatorDialog />
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
                            Today
                        </p>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-purple-400" />
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            })}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ y: -3 }}
                    >
                        <div
                            className={cn(
                                "p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 relative overflow-hidden",
                                stat.border
                            )}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-slate-400 tracking-tight">
                                    {stat.title}
                                </span>
                                <div className={cn("p-2 rounded-xl", stat.iconBg)}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={cn("text-2xl font-black tracking-tight", stat.color)}>
                                {loading ? "..." : stat.value}
                            </div>
                            <div className="mt-3 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                                <span
                                    className={cn(
                                        "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                                        stat.badgeColor
                                    )}
                                >
                                    {stat.badge}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Active
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Table */}
                <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-400" />
                                Recent Customer Ledger Activity
                            </h3>
                            <p className="text-xs text-slate-400">Real-time payment settlements & debits</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
                            Loading activity...
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
                            No ledger entries found.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {recentTransactions.map((t) => {
                                const isCredit = t.type === "credit";
                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/10 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "p-2.5 rounded-xl border shadow-inner",
                                                    isCredit
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                )}
                                            >
                                                {isCredit ? (
                                                    <ArrowDownCircle className="h-4 w-4" />
                                                ) : (
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">
                                                    {t.customerName}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {t.description || (isCredit ? "Payment Received" : "Goods / Service Due")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={cn(
                                                    "text-xs font-black tracking-tight",
                                                    isCredit ? "text-emerald-400" : "text-rose-400"
                                                )}
                                            >
                                                {isCredit ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {new Date(t.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Business Health & Recovery Meter */}
                <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight mb-1 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Business Health
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Financial liquidity & position</p>

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {totalReceivables > totalPayables
                                    ? `Receivables exceed payables. Prioritize collecting ₹${totalReceivables.toLocaleString("en-IN")} due across your ${stats?.activeCustomers || 0} active customer accounts.`
                                    : "Accounts are well balanced with positive liquidity."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-300">Receivable Ratio</span>
                                <span className="text-emerald-400">{receivablePercent}%</span>
                            </div>
                            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${receivablePercent}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                                <span>Receivables: ₹{totalReceivables.toLocaleString("en-IN")}</span>
                                <span>Payables: ₹{totalPayables.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
