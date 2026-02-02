"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyStats } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, PiggyBank, BarChart3, Trophy } from "lucide-react";

interface StatsCardsProps {
    stats: YearlyStats | null;
    loading: boolean;
}

function AnimatedNumber({
    value,
    prefix = "",
}: {
    value: number;
    prefix?: string;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className="animate-count">
            {prefix}
            {displayValue.toLocaleString("en-IN")}
        </span>
    );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
    const cards = [
        {
            title: "Total Income",
            value: stats?.totalIncome || 0,
            icon: Wallet,
            gradient: "from-purple-500 via-purple-600 to-indigo-600",
            glowColor: "rgba(168, 85, 247, 0.4)",
            iconBg: "bg-purple-500/20",
        },
        {
            title: "Primary Income",
            value: stats?.totalPrimary || 0,
            icon: TrendingUp,
            gradient: "from-purple-500 to-pink-600",
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
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="glass animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-slate-700 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative group"
                >
                    {/* Animated glow border */}
                    <div
                        className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-xl blur opacity-0 group-hover:opacity-75 transition-all duration-500`}
                        style={{
                            animation: "glowPulse 3s ease-in-out infinite",
                        }}
                    />

                    <Card className="relative glass backdrop-blur-2xl border-white/10 overflow-hidden shadow-xl transition-all duration-300 group-hover:border-white/30">
                        {/* Gradient overlay on hover */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                        ></div>

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-slate-300">
                                {card.title}
                            </CardTitle>
                            <motion.div
                                className={`p-2 rounded-lg ${card.iconBg} relative`}
                                whileHover={{ rotate: 12, scale: 1.1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 17,
                                }}
                            >
                                {/* Icon glow */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-lg blur-sm opacity-50`}
                                />
                                <card.icon
                                    className={`h-4 w-4 relative z-10`}
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
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                {formatCurrency(card.value)}
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
