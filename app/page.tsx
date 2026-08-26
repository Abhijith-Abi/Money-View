"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    getIncomeByYear,
    getMonthlyStats,
    getYearlyStats,
    getAllTimeStats,
    getAnnualStats,
} from "@/lib/income-service";
import { incomeCache } from "@/lib/income-cache";
import {
    IncomeEntry,
    MonthlyStats,
    YearlyStats,
    AnnualStats,
} from "@/types/income";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeCharts } from "@/components/dashboard/income-charts";
import { IncomeTable } from "@/components/dashboard/income-table";
import { IncomeForm } from "@/components/dashboard/income-form";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { EMICalculatorDialog } from "@/components/business/emi-calculator-dialog";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoneyLoader } from "@/components/ui/money-loader";
import { Wallet, Briefcase, Search } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const year = new Date().getFullYear();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [selectedYear, setSelectedYear] = useState(year);
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
    const [annualStats, setAnnualStats] = useState<AnnualStats[]>([]);
    const [allTimeStats, setAllTimeStats] = useState<
        import("@/types/income").AllTimeStats | null
    >(null);
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
            const cachedAllTime = incomeCache.getAllTimeStats(user.uid);

            if (
                cachedEntries &&
                cachedMonthly &&
                cachedYearly &&
                cachedAllTime
            ) {
                // Use cached data instantly
                setEntries(cachedEntries);
                setMonthlyStats(cachedMonthly);
                setYearlyStats(cachedYearly);
                setAllTimeStats(cachedAllTime);
                // Note: annualStats not cached yet, we can fetch it or just not cache for now as it's small
                const annual = await getAnnualStats(user.uid);
                setAnnualStats(annual);

                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            const [
                entriesData,
                monthlyData,
                yearlyData,
                allTimeData,
                annualData,
            ] = await Promise.all([
                getIncomeByYear(selectedYear, user.uid),
                getMonthlyStats(selectedYear, user.uid),
                getYearlyStats(selectedYear, user.uid),
                getAllTimeStats(user.uid),
                getAnnualStats(user.uid),
            ]);

            // Add backward compatibility: default status to 'received' for existing entries
            const normalizedEntries = entriesData.map((entry) => ({
                ...entry,
                status: entry.status || ("received" as "pending" | "received"),
            }));

            setEntries(normalizedEntries);
            setMonthlyStats(monthlyData);
            setYearlyStats(yearlyData);
            setAllTimeStats(allTimeData);
            setAnnualStats(annualData);

            // Cache the results
            incomeCache.setEntries(cacheKey, normalizedEntries);
            incomeCache.setMonthlyStats(cacheKey, monthlyData);
            incomeCache.setYearlyStats(cacheKey, yearlyData);
            incomeCache.setAllTimeStats(user.uid, allTimeData);
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

    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Enforce minimum splash screen time of 2.5 seconds
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Combine auth loading and splash screen logic
    // We use a single return with AnimatePresence to handle exit animations

    // Determine what to show
    const showLoader = authLoading || showSplash;
    const showContent = !showLoader && user;

    if (!user && !showLoader) return null;

    const years = Array.from({ length: 5 }, (_, i) => 2023 + i);

    return (
        <AnimatePresence mode="wait">
            {showLoader ? (
                <motion.div
                    key="loader"
                    className="min-h-screen flex items-center justify-center bg-[#050505] fixed inset-0 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MoneyLoader />
                </motion.div>
            ) : (
                <motion.div
                    key="dashboard"
                    className="min-h-screen p-6 lg:p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-[1600px] mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 mb-1"
                                >
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        Financial Intelligence
                                    </span>
                                </motion.div>
                                <motion.h1 
                                    className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    Income & Cash Flow
                                </motion.h1>
                                <motion.p 
                                    className="text-slate-400 text-xs sm:text-sm mt-1 font-medium"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Real-time income streams, receivables, and automated analytics
                                </motion.p>
                            </div>

                            <motion.div 
                                className="flex flex-wrap items-center gap-2.5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="p-2 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2 text-xs font-semibold text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>

                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(val) => setSelectedYear(Number(val))}
                                >
                                    <SelectTrigger className="w-[110px] bg-white/[0.03] border-white/[0.08] text-white font-bold h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white">
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y.toString()} className="font-semibold">
                                                Year {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <EMICalculatorDialog />

                                <IncomeForm
                                    onSuccess={() => fetchData(true)}
                                    defaultYear={selectedYear}
                                    trigger={
                                        <Button className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl h-10 px-5 shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all">
                                            + Add Entry
                                        </Button>
                                    }
                                />
                            </motion.div>
                        </div>

                        {/* Top KPI Cards */}
                        <StatsCards
                            stats={yearlyStats}
                            allTimeStats={allTimeStats}
                            loading={loading}
                        />

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                            {/* Left Column - Large Chart */}
                            <div className="lg:col-span-7 space-y-6">
                                <section className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                                Revenue Velocity
                                                <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            </h3>
                                            <p className="text-xs text-slate-400">Monthly settled vs pending trends</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1 text-purple-400">
                                                <span className="w-2 h-2 rounded-full bg-purple-500" /> Received
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-400">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                                            </span>
                                        </div>
                                    </div>
                                    <IncomeCharts 
                                        monthlyStats={monthlyStats}
                                        annualStats={annualStats}
                                        loading={loading}
                                        variant="large"
                                    />
                                </section>

                                {/* Bottom Left - Donut Chart */}
                                <section className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-white tracking-tight">Income Distribution</h3>
                                        <p className="text-xs text-slate-400">Distribution by stream and category</p>
                                    </div>
                                    <IncomeCharts 
                                        monthlyStats={monthlyStats}
                                        annualStats={annualStats}
                                        loading={loading}
                                        variant="donut"
                                    />
                                </section>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Ledger Table */}
                                <section className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col min-h-[440px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Recent Transactions</h3>
                                            <p className="text-xs text-slate-400">Latest recorded income & expenses</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <IncomeTable
                                            entries={entries.slice(0, 6)}
                                            loading={loading}
                                            onDelete={() => fetchData(true)}
                                            minimal
                                        />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                            Accounts Receivable
                                        </span>
                                        <span className="text-xl font-black text-amber-400">
                                            {loading ? "..." : `₹${(yearlyStats?.totalPending || 0).toLocaleString("en-IN")}`}
                                        </span>
                                    </div>
                                </section>

                                {/* Financial Report Card */}
                                <section className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Collection Audit</h3>
                                            <p className="text-xs text-slate-400">Real-time recovery metrics</p>
                                        </div>
                                    </div>
                                    <StatsCards
                                        stats={yearlyStats}
                                        allTimeStats={allTimeStats}
                                        loading={loading}
                                        variant="detailed"
                                    />
                                </section>
                            </div>
                        </div>
                    </div>

                    <Toaster />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
