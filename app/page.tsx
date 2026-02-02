"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    getIncomeByYear,
    getMonthlyStats,
    getYearlyStats,
} from "@/lib/income-service";
import { incomeCache } from "@/lib/income-cache";
import { IncomeEntry, MonthlyStats, YearlyStats } from "@/types/income";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeCharts } from "@/components/dashboard/income-charts";
import { IncomeTable } from "@/components/dashboard/income-table";
import { IncomeForm } from "@/components/dashboard/income-form";
import { UserProfile } from "@/components/auth/user-profile";
import { Toaster } from "@/components/ui/toaster";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Wallet, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
    const year = new Date().getFullYear();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [selectedYear, setSelectedYear] = useState(year);
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    async function fetchData(forceRefresh = false) {
        if (!user) return;

        const cacheKey = { userId: user.uid, year: selectedYear };

        // Try to get from cache first for instant loading
        if (!forceRefresh) {
            const cachedEntries = incomeCache.getEntries(cacheKey);
            const cachedMonthly = incomeCache.getMonthlyStats(cacheKey);
            const cachedYearly = incomeCache.getYearlyStats(cacheKey);

            if (cachedEntries && cachedMonthly && cachedYearly) {
                // Use cached data instantly
                setEntries(cachedEntries);
                setMonthlyStats(cachedMonthly);
                setYearlyStats(cachedYearly);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            const [entriesData, monthlyData, yearlyData] = await Promise.all([
                getIncomeByYear(selectedYear, user.uid),
                getMonthlyStats(selectedYear, user.uid),
                getYearlyStats(selectedYear, user.uid),
            ]);

            // Add backward compatibility: default status to 'received' for existing entries
            const normalizedEntries = entriesData.map((entry) => ({
                ...entry,
                status: entry.status || ("received" as "pending" | "received"),
            }));

            setEntries(normalizedEntries);
            setMonthlyStats(monthlyData);
            setYearlyStats(yearlyData);

            // Cache the results
            incomeCache.setEntries(cacheKey, normalizedEntries);
            incomeCache.setMonthlyStats(cacheKey, monthlyData);
            incomeCache.setYearlyStats(cacheKey, yearlyData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [selectedYear, user]);

    // Clear cache when user changes
    useEffect(() => {
        if (!user) {
            incomeCache.clear();
        }
    }, [user]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const years = Array.from({ length: 5 }, (_, i) => 2023 + i);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Subtle gradient background */}
            <div
                className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10"
                style={{
                    backgroundSize: "400% 400%",
                    animation: "gradientFlow 20s ease infinite",
                }}
            />

            {/* Subtle floating particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 blur-2xl"
                        style={{
                            width: Math.random() * 200 + 150,
                            height: Math.random() * 200 + 150,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -40, 0],
                            x: [0, Math.random() * 30 - 15, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: Math.random() * 15 + 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            <div className="relative p-6 md:p-12">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 17,
                                }}
                            >
                                {/* Icon glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur-md opacity-50" />
                                <div className="relative p-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600">
                                    <Wallet className="h-8 w-8 text-white" />
                                </div>
                            </motion.div>
                            <div>
                                <motion.h1
                                    className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-white to-cyan-200 gradient-text"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Money View
                                </motion.h1>
                                <motion.p
                                    className="text-slate-400 mt-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Welcome back,{" "}
                                    <span className="text-purple-300 font-medium">
                                        {user.displayName?.split(" ")[0] ||
                                            "there"}
                                    </span>
                                    !
                                </motion.p>
                            </div>
                        </div>

                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="text-sm text-slate-300 font-medium">
                                Year:
                            </label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(val) =>
                                    setSelectedYear(Number(val))
                                }
                            >
                                <SelectTrigger className="w-32 glass border-white/10 hover:border-white/20 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-white/10">
                                    {years.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <UserProfile />
                        </motion.div>
                    </motion.div>

                    {/* Table */}
                    <IncomeTable
                        entries={entries}
                        loading={loading}
                        onDelete={() => fetchData(true)}
                    />

                    {/* Stats Cards */}
                    <StatsCards stats={yearlyStats} loading={loading} />

                    {/* Charts */}
                    <IncomeCharts
                        monthlyStats={monthlyStats}
                        loading={loading}
                    />

                    {/* Floating Add Button */}
                    <IncomeForm
                        onSuccess={() => fetchData(true)}
                        defaultYear={selectedYear}
                    />
                </div>
            </div>

            <Toaster />
        </div>
    );
}
