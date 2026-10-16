"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyStats, AllTimeStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
    TrendingUp,
    Wallet,
    PiggyBank,
    Clock,
    CheckCircle2,
    Sparkles,
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
            subtitle: "Selected Year",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            gradient: "from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-indigo-300",
            iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20",
            badge: "Annual Total",
            badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        },
        {
            title: "Primary Income",
            subtitle: "Salary / Core",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            gradient: "from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:to-violet-300",
            iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20",
            badge: "Primary Stream",
            badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        },
        {
            title: "Secondary Income",
            subtitle: "Freelance / Extra",
            value: stats?.totalSecondary || 0,
            icon: PiggyBank,
            gradient: "from-cyan-600 via-teal-600 to-emerald-600 dark:from-cyan-400 dark:to-teal-300",
            iconBg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/20",
            badge: "Secondary Stream",
            badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
        },
        {
            title: "Total Pending",
            subtitle: "All Time Receivable",
            value: allTimeStats?.totalPending ?? (stats?.totalPending || 0),
            icon: Clock,
            gradient: "from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-400 dark:to-yellow-300",
            iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20",
            badge: "Unpaid / Pending",
            badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        },
        {
            title: "Total Received",
            subtitle: "All Time Settled",
            value: allTimeStats?.totalReceived ?? (stats?.totalReceived || 0),
            icon: CheckCircle2,
            gradient: "from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:to-green-300",
            iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
            badge: "Fully Received",
            badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Card
                        key={i}
                        className="glass animate-pulse rounded-2xl border-border/60"
                    >
                        <CardContent className="p-5">
                            <div className="h-20 bg-muted rounded-xl"></div>
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
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="relative group"
                >
                    <Card className="glass relative overflow-hidden rounded-2xl border-border/70 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-xl">
                        {/* Soft ambient background */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative">
                            <div>
                                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    {card.title}
                                </CardTitle>
                                <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className={`p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative pt-1">
                            <div className={`text-2xl font-black tracking-tight bg-gradient-to-r ${card.gradient} gradient-text`}>
                                {formatCurrency(card.value)}
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${card.badgeColor}`}
                                >
                                    {card.badge}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-medium">
                                    <Sparkles className="w-2.5 h-2.5 text-primary" /> Active
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
