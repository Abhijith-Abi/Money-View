"use client";

import { Card, CardContent } from "@/components/ui/card";
import { YearlyStats, AllTimeStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
    TrendingUp,
    Wallet,
    Layers,
    Clock,
    CheckCircle2,
    ArrowUpRight,
} from "lucide-react";

interface StatsCardsProps {
    stats: YearlyStats | null;
    allTimeStats: AllTimeStats | null;
    loading: boolean;
}

export function StatsCards({ stats, allTimeStats, loading }: StatsCardsProps) {
    const cards = [
        {
            title: "Total Income",
            subtitle: "Selected Year Inflow",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            iconBg: "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20",
            badge: "Annual Total",
            badgeStyle: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
            topGradient: "from-violet-500 via-indigo-500 to-cyan-500",
            glowColor: "from-indigo-500/20",
            valueColor: "text-foreground",
        },
        {
            title: "Primary Income",
            subtitle: "Salary / Core Streams",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            iconBg: "bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/20",
            badge: "Primary Stream",
            badgeStyle: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
            topGradient: "from-purple-500 via-violet-500 to-indigo-500",
            glowColor: "from-violet-500/20",
            valueColor: "text-foreground",
        },
        {
            title: "Secondary Income",
            subtitle: "Freelance / Extra",
            value: stats?.totalSecondary || 0,
            icon: Layers,
            iconBg: "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20",
            badge: "Secondary Stream",
            badgeStyle: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
            topGradient: "from-cyan-500 via-sky-500 to-blue-600",
            glowColor: "from-cyan-500/20",
            valueColor: "text-foreground",
        },
        {
            title: "Total Pending",
            subtitle: "All Time Receivable",
            value: allTimeStats?.totalPending ?? (stats?.totalPending || 0),
            icon: Clock,
            iconBg: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20",
            badge: "Receivable",
            badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
            topGradient: "from-amber-500 via-orange-500 to-yellow-500",
            glowColor: "from-amber-500/20",
            valueColor: "text-amber-600 dark:text-amber-400",
        },
        {
            title: "Total Received",
            subtitle: "All Time Settled",
            value: allTimeStats?.totalReceived ?? (stats?.totalReceived || 0),
            icon: CheckCircle2,
            iconBg: "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20",
            badge: "Settled",
            badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
            topGradient: "from-emerald-500 via-teal-500 to-cyan-500",
            glowColor: "from-emerald-500/20",
            valueColor: "text-emerald-600 dark:text-emerald-400",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 320,
                damping: 24,
            },
        },
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Card
                        key={i}
                        className="glass animate-pulse rounded-2xl border-border/70"
                    >
                        <CardContent className="p-5">
                            <div className="h-24 bg-muted/50 rounded-xl"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
            {cards.map((card) => (
                <motion.div
                    key={card.title}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="relative group"
                >
                    <div className="glass-card relative overflow-hidden rounded-2xl p-5 border border-slate-200/90 dark:border-white/[0.08] transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-2xl">
                        {/* Top Gradient Accent Strip */}
                        <div
                            className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${card.topGradient}`}
                        />

                        {/* Top Edge Specular Highlight */}
                        <div className="absolute inset-x-0 top-[2.5px] h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />

                        {/* Hover Ambient Top Glow */}
                        <div
                            className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${card.glowColor} to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                        />

                        {/* Header: Title and Icon */}
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div>
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider text-[11px]">
                                    {card.title}
                                </span>
                                <p className="text-[10px] text-muted-foreground/75 font-medium mt-0.5">
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </div>

                        {/* Value & Bottom Strip */}
                        <div className="space-y-2.5 relative z-10 pt-1">
                            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${card.valueColor}`}>
                                {formatCurrency(card.value)}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                <span
                                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${card.badgeStyle}`}
                                >
                                    {card.badge}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
