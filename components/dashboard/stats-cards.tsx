"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { TrendingUp, Wallet, PiggyBank, BarChart3, Trophy } from "lucide-react";

interface StatsCardsProps {
    stats: YearlyStats | null;
    allTimeStats: import("@/types/income").AllTimeStats | null;
    loading: boolean;
    variant?: "default" | "detailed";
}

export function StatsCards({ stats, allTimeStats, loading, variant = "default" }: StatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 glass rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (variant === "detailed") {
        const netMargin = stats?.totalIncome ? ((stats.totalIncome - 0) / stats.totalIncome) * 100 : 0; // Simplified calculation for demo

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Gross Profit</p>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {formatCurrency(stats?.totalIncome || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Expenses</p>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {formatCurrency(0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Net Income</p>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {formatCurrency(stats?.totalIncome || 0)}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-medium">margin bar chart</span>
                        <span className="text-gray-400">(48% Net Margin)</span>
                    </div>
                    <div className="h-10 w-full glass rounded-xl overflow-hidden relative">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_20px_rgba(212,175,55,0.3)] relative z-10"
                            initial={{ width: 0 }}
                            animate={{ width: "48%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-px bg-white shadow-[0_0_10px_white]" />
                        </motion.div>
                        <div className="absolute inset-0 bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    const cards = [
        {
            title: "Total Income",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            gradient: "from-[#FFD700] to-[#D4AF37]",
            glowColor: "rgba(212, 175, 55, 0.4)",
            iconBg: "bg-primary/20",
        },
        {
            title: "Total Primary",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            gradient: "from-white/20 to-white/5",
            glowColor: "rgba(255, 255, 255, 0.1)",
            iconBg: "bg-white/10",
        },
        // ... (other cards simplified for brevity in this redesign phase)
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {cards.slice(0, 4).map((card) => (
                <motion.div
                    key={card.title}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className="group"
                >
                    <Card className="glass-gold border-white/5 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-gray-400">
                                {card.title}
                            </CardTitle>
                            <card.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(card.value)}
                            </div>
                            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: "65%" }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
