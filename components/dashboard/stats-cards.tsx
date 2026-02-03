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
}

export function StatsCards({ stats, allTimeStats, loading }: StatsCardsProps) {
    const cards = [
        {
            title: "Total Income",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            gradient: "from-blue-600 via-indigo-500 to-indigo-600",
            glowColor: "rgba(37, 99, 235, 0.4)",
            iconBg: "bg-blue-600/20",
        },
        {
            title: "Primary Income",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            gradient: "from-purple-500 to-[#9999ff]",
            glowColor: "rgba(236, 72, 153, 0.4)",
            iconBg: "bg-purple-500/20",
        },
        {
            title: "Secondary Income",
            value: stats?.totalSecondary || 0,
            icon: PiggyBank,
            gradient: "from-cyan-500 to-teal-600",
            glowColor: "rgba(6, 182, 212, 0.4)",
            iconBg: "bg-cyan-500/20",
        },
        {
            title: "Total Pending (All Time)",
            value: allTimeStats?.totalPending || 0,
            icon: BarChart3,
            gradient: "from-[#ffb200] to-yellow-600",
            glowColor: "rgba(255, 178, 0, 0.4)",
            iconBg: "bg-[#ffb200]/20",
        },
        {
            title: "Total Received (All Time)",
            value: allTimeStats?.totalReceived || 0,
            icon: Trophy,
            gradient: "from-green-500 to-emerald-600",
            glowColor: "rgba(34, 197, 94, 0.4)",
            iconBg: "bg-green-500/20",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
            },
        },
        hover: {
            y: -5,
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 25 },
        },
    };

    if (loading) {
        return (
            <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {[...Array(5)].map((_, i) => (
                    <Card
                        key={i}
                        className="glass animate-pulse min-w-[85vw] sm:min-w-[45vw] md:min-w-0"
                    >
                        <CardContent className="p-6">
                            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
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
            className="flex overflow-x-auto py-4 gap-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6 md:pt-0 md:pb-2 md:overflow-visible hide-scrollbar -mx-4 px-4 md:mx-0 md:px-1"
        >
            {cards.map((card) => (
                <motion.div
                    key={card.title}
                    variants={itemVariants}
                    whileHover="hover"
                    className="relative group min-w-[85vw] sm:min-w-[45vw] md:min-w-0 snap-center first:pl-0"
                >
                    <Card
                        className={`relative glass backdrop-blur-2xl overflow-hidden shadow-xl transition-all duration-300 border-border/50 group-hover:border-${
                            card.gradient.includes("blue")
                                ? "blue-500/50"
                                : card.gradient.includes("purple")
                                  ? "purple-500/50"
                                  : card.gradient.includes("cyan")
                                    ? "cyan-500/50"
                                    : card.gradient.includes("green")
                                      ? "emerald-500/50"
                                      : "[#ffb200]/50"
                        } group-hover:shadow-[0_0_40px_-5px_rgba(0,0,0,0.1)] hover:shadow-${
                            card.gradient.includes("blue")
                                ? "blue-500/30"
                                : card.gradient.includes("purple")
                                  ? "purple-500/30"
                                  : card.gradient.includes("cyan")
                                    ? "cyan-500/30"
                                    : card.gradient.includes("green")
                                      ? "emerald-500/30"
                                      : "[#ffb200]/30"
                        }`}
                    >
                        {/* Soft background glow on hover */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                        />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {card.title}
                            </CardTitle>
                            <motion.div
                                className={`p-2 rounded-lg ${card.iconBg} relative`}
                                variants={{
                                    hover: {
                                        scale: 1.1,
                                        rotate: 360,
                                        transition: {
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                        },
                                    },
                                }}
                            >
                                {/* Icon glow */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                />
                                <card.icon
                                    className={`h-4 w-4 relative z-10 transition-colors duration-300 ${
                                        card.gradient.includes("blue")
                                            ? "group-hover:text-blue-100"
                                            : card.gradient.includes("purple")
                                              ? "group-hover:text-purple-100"
                                              : card.gradient.includes("cyan")
                                                ? "group-hover:text-cyan-100"
                                                : card.gradient.includes(
                                                        "green",
                                                    )
                                                  ? "group-hover:text-emerald-100"
                                                  : "group-hover:text-amber-100" // using close match for #ffb200
                                    }`}
                                    style={{
                                        filter: `drop-shadow(0 0 8px ${card.glowColor})`,
                                    }}
                                />
                            </motion.div>
                        </CardHeader>
                        <CardContent className="relative">
                            <motion.div
                                className={`text-2xl font-bold bg-gradient-to-r ${card.gradient} gradient-text`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {formatCurrency(card.value)}
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
