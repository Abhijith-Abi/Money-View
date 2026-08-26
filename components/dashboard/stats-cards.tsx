"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyStats, AllTimeStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
    TrendingUp,
    Wallet,
    CheckCircle2,
    Clock,
    Sparkles,
    ArrowUpRight,
    PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
    stats: YearlyStats | null;
    allTimeStats: AllTimeStats | null;
    loading: boolean;
    variant?: "default" | "detailed";
}

export function StatsCards({
    stats,
    allTimeStats,
    loading,
    variant = "default",
}: StatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (variant === "detailed") {
        const totalIncome = stats?.totalIncome || 0;
        const totalReceived = stats?.totalReceived || 0;
        const totalPending = stats?.totalPending || 0;
        const collectionRate =
            totalIncome > 0 ? Math.round((totalReceived / totalIncome) * 100) : 100;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                            Gross Volume
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {formatCurrency(totalIncome)}
                        </p>
                        <span className="text-[10px] text-purple-400 flex items-center gap-0.5 mt-1">
                            <ArrowUpRight className="w-3 h-3" /> Annual Recorded
                        </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20">
                        <p className="text-emerald-400/80 text-xs font-semibold uppercase tracking-wider mb-1">
                            Settled Funds
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                            {formatCurrency(totalReceived)}
                        </p>
                        <span className="text-[10px] text-emerald-400/70 flex items-center gap-0.5 mt-1">
                            <CheckCircle2 className="w-3 h-3" /> Fully Paid
                        </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20">
                        <p className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider mb-1">
                            Outstanding
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                            {formatCurrency(totalPending)}
                        </p>
                        <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5 mt-1">
                            <Clock className="w-3 h-3" /> Pending Collection
                        </span>
                    </div>
                </div>

                {/* Collection Efficiency Bar */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <PieChart className="w-3.5 h-3.5 text-purple-400" />
                            Collection Efficiency
                        </span>
                        <span className="font-extrabold text-emerald-400">
                            {collectionRate}% Collected
                        </span>
                    </div>

                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${collectionRate}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Paid: {formatCurrency(totalReceived)}</span>
                        <span>Pending: {formatCurrency(totalPending)}</span>
                    </div>
                </div>
            </div>
        );
    }

    const cards = [
        {
            title: "Total Revenue",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            colorText: "text-white",
            borderGlow: "hover:border-purple-500/40",
            iconBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
            badge: "Annual Total",
            badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        },
        {
            title: "Money Received",
            value: stats?.totalReceived || 0,
            icon: CheckCircle2,
            colorText: "text-emerald-400",
            borderGlow: "hover:border-emerald-500/40",
            iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            badge: "Collected",
            badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        },
        {
            title: "Money Pending",
            value: stats?.totalPending || 0,
            icon: Clock,
            colorText: "text-amber-400",
            borderGlow: "hover:border-amber-500/40",
            iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
            badge: "Receivable",
            badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        },
        {
            title: "Primary Income",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            colorText: "text-cyan-400",
            borderGlow: "hover:border-cyan-500/40",
            iconBg: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
            badge: "Core Sources",
            badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 },
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {cards.map((card) => (
                <motion.div
                    key={card.title}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="group"
                >
                    <div
                        className={cn(
                            "relative p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden",
                            card.borderGlow
                        )}
                    >
                        {/* Ambient Card Corner Light */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-bl-full pointer-events-none group-hover:bg-white/[0.04] transition-colors" />

                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 tracking-tight">
                                {card.title}
                            </span>
                            <div className={cn("p-2 rounded-xl", card.iconBg)}>
                                <card.icon className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className={cn("text-2xl sm:text-3xl font-black tracking-tight", card.colorText)}>
                                {formatCurrency(card.value)}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span
                                    className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                                        card.badgeColor
                                    )}
                                >
                                    {card.badge}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Live
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
