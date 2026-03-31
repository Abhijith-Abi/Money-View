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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <motion.h1 
                                    className="text-4xl font-bold text-white tracking-tight"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    Income Tracking
                                </motion.h1>
                                <motion.p 
                                    className="text-gray-400 mt-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Manage your finances with premium insights
                                </motion.p>
                            </div>

                            <motion.div 
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-300">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(val) => setSelectedYear(Number(val))}
                                >
                                    <SelectTrigger className="w-[120px] glass border-none h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/10">
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button className="bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl h-10 px-6 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                    Generate Report
                                </Button>
                                <div className="p-2.5 glass rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                    <Search className="w-5 h-5 text-gray-400" />
                                </div>
                            </motion.div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                            {/* Left Column - Large Chart */}
                            <div className="lg:col-span-7 space-y-6">
                                <section className="glass-gold rounded-[2rem] p-8 min-h-[460px] relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-semibold text-white/90">Income Trends</h3>
                                            <p className="text-sm text-gray-400">Monthly revenue trends</p>
                                        </div>
                                        <div className="glass px-4 py-1.5 rounded-full text-xs text-gray-400">
                                            Line Graph
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
                                <section className="glass rounded-[2rem] p-8 min-h-[380px]">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white/90">Top Income Sources</h3>
                                        <p className="text-sm text-gray-400">Distribution by category</p>
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
                                <section className="glass rounded-[2rem] p-8 min-h-[460px] flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-white/90">Customer Ledger</h3>
                                        <IncomeForm
                                            onSuccess={() => fetchData(true)}
                                            defaultYear={selectedYear}
                                            trigger={
                                                <Button variant="outline" className="glass border-white/5 hover:bg-white/5 rounded-xl text-xs h-8">
                                                    Add Transaction
                                                </Button>
                                            }
                                        />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <IncomeTable
                                            entries={entries.slice(0, 5)}
                                            loading={loading}
                                            onDelete={() => fetchData(true)}
                                            minimal
                                        />
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-gray-400">Total Accounts Receivable</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {loading ? "..." : `$${(yearlyStats?.totalPending || 0).toLocaleString()}`}
                                        </span>
                                    </div>
                                </section>

                                {/* Financial Report Card */}
                                <section className="glass rounded-[2rem] p-8 min-h-[380px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-semibold text-white/90">Real-Time Financial Report</h3>
                                        <Button variant="outline" className="glass border-white/5 hover:bg-white/5 rounded-xl text-xs h-8">
                                            Generate Report
                                        </Button>
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
