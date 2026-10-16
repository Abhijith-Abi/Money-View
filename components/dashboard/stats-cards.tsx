"use client";

import { Card, CardContent } from "@/components/ui/card";
import { YearlyStats, AllTimeStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
    AnimatedWalletIcon,
    AnimatedTrendUpIcon,
    AnimatedLayersIcon,
    AnimatedClockIcon,
    AnimatedCheckIcon,
    AnimatedPulseRing,
} from "@/components/ui/animated-icons";

interface StatsCardsProps {
    stats: YearlyStats | null;
    allTimeStats: AllTimeStats | null;
    loading: boolean;
    selectedYear?: number | "all";
}

export function StatsCards({ stats, allTimeStats, loading, selectedYear }: StatsCardsProps) {
    const isAll = selectedYear === "all";
    const yearLabel = isAll ? "All Time" : (selectedYear ? `${selectedYear}` : "Annual");

    const pendingValue = isAll
        ? (allTimeStats?.totalPending ?? stats?.totalPending ?? 0)
        : (stats?.totalPending ?? 0);

    const receivedValue = isAll
        ? (allTimeStats?.totalReceived ?? stats?.totalReceived ?? 0)
        : (stats?.totalReceived ?? 0);

    const cards = [
        {
            title: "Total Income",
            subtitle: `${yearLabel} Inflow`,
            value: stats?.totalIncome || 0,
            iconComponent: AnimatedWalletIcon,
            iconStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
            badge: `${yearLabel} Total`,
            badgeStyle: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
            valueColor: "text-foreground",
            hoverGlow: "from-indigo-500/10",
        },
        {
            title: "Primary Income",
            subtitle: `${yearLabel} Primary Stream`,
            value: stats?.totalPrimary || 0,
            iconComponent: AnimatedTrendUpIcon,
            iconStyle: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
            badge: "Primary Stream",
            badgeStyle: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
            valueColor: "text-foreground",
            hoverGlow: "from-violet-500/10",
        },
        {
            title: "Secondary Income",
            subtitle: `${yearLabel} Extra Streams`,
            value: stats?.totalSecondary || 0,
            iconComponent: AnimatedLayersIcon,
            iconStyle: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
            badge: "Secondary Stream",
            badgeStyle: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
            valueColor: "text-foreground",
            hoverGlow: "from-sky-500/10",
        },
        {
            title: "Total Pending",
            subtitle: `${yearLabel} Receivable`,
            value: pendingValue,
            iconComponent: AnimatedClockIcon,
            iconStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            badge: "Unpaid / Pending",
            badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
            valueColor: "text-amber-600 dark:text-amber-400",
            hoverGlow: "from-amber-500/10",
        },
        {
            title: "Total Received",
            subtitle: `${yearLabel} Settled`,
            value: receivedValue,
            iconComponent: AnimatedCheckIcon,
            iconStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            badge: "Fully Settled",
            badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
            valueColor: "text-emerald-600 dark:text-emerald-400",
            hoverGlow: "from-emerald-500/10",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
            },
        },
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {[...Array(5)].map((_, i) => (
                    <Card
                        key={i}
                        className="glass animate-pulse rounded-2xl border-border/70"
                    >
                        <CardContent className="p-5">
                            <div className="h-20 bg-muted/40 rounded-xl"></div>
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5"
        >
            {cards.map((card) => {
                const IconComp = card.iconComponent;
                return (
                    <motion.div
                        key={card.title}
                        variants={itemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        className="relative group"
                    >
                        <div className="relative overflow-hidden rounded-2xl p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm hover:shadow-lg dark:hover:border-white/[0.16] transition-all duration-300">
                            {/* Hover Ambient Radial Glow */}
                            <div
                                className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${card.hoverGlow} to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                            />

                            {/* Header: Title and Animated Icon */}
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <div>
                                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                                        {card.title}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                                        {card.subtitle}
                                    </p>
                                </div>
                                <div className={`p-2.5 rounded-xl shrink-0 border transition-transform duration-300 group-hover:scale-105 shadow-sm ${card.iconStyle}`}>
                                    <IconComp size={18} />
                                </div>
                            </div>

                            {/* Value & Bottom Badge */}
                            <div className="space-y-2.5 relative z-10 pt-0.5">
                                <div className={`text-2xl sm:text-[26px] font-black tracking-tight ${card.valueColor}`}>
                                    {formatCurrency(card.value)}
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                    <span
                                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${card.badgeStyle}`}
                                    >
                                        {card.badge}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <AnimatedPulseRing color="bg-emerald-500" /> Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
