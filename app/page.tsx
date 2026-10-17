"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    getIncomeByYear,
    getAllIncome,
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
    AllTimeStats,
} from "@/types/income";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeCharts } from "@/components/dashboard/income-charts";
import { IncomeTable } from "@/components/dashboard/income-table";
import { IncomeForm } from "@/components/dashboard/income-form";
import { CompanySettingsDialog } from "@/components/dashboard/company-settings-dialog";
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
import { Wallet, Briefcase, Plus, Building2, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ExportLedgerDialog } from "@/components/dashboard/export-ledger-dialog";
import { subscribeToCompanies } from "@/lib/company-service";
import { Company } from "@/types/company";

export default function Home() {
    const currentYear = new Date().getFullYear();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedYear, setSelectedYear] = useState<number | "all">(currentYear);
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
    const [annualStats, setAnnualStats] = useState<AnnualStats[]>([]);
    const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToCompanies(user.uid, (list) => {
            setCompanies(list);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        // Enforce smooth splash screen display
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    async function fetchData(forceRefresh = false) {
        if (!user) return;

        const isAll = selectedYear === "all";
        const cacheKey = {
            userId: user.uid,
            year: isAll ? undefined : (selectedYear as number),
        };

        // Try cache for single years
        if (!forceRefresh && !isAll) {
            const cachedEntries = incomeCache.getEntries(cacheKey as any);
            const cachedMonthly = incomeCache.getMonthlyStats(cacheKey as any);
            const cachedYearly = incomeCache.getYearlyStats(cacheKey as any);
            const cachedAllTime = incomeCache.getAllTimeStats(user.uid);

            if (cachedEntries && cachedMonthly && cachedYearly && cachedAllTime) {
                setEntries(cachedEntries);
                setMonthlyStats(cachedMonthly);
                setYearlyStats(cachedYearly);
                setAllTimeStats(cachedAllTime);
                const annual = await getAnnualStats(user.uid);
                setAnnualStats(annual);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            if (isAll) {
                const [entriesData, allTimeData, annualData, monthlyData, yearlyData] =
                    await Promise.all([
                        getAllIncome(user.uid),
                        getAllTimeStats(user.uid),
                        getAnnualStats(user.uid),
                        getMonthlyStats(currentYear, user.uid),
                        getYearlyStats(currentYear, user.uid),
                    ]);

                const normalizedEntries = entriesData.map((entry) => ({
                    ...entry,
                    status: entry.status || ("received" as "pending" | "received"),
                }));

                const allTimeTotalPrimary = normalizedEntries
                    .filter((e) => e.type === "credit" && e.category === "primary")
                    .reduce((sum, e) => sum + e.amount, 0);
                const allTimeTotalSecondary = normalizedEntries
                    .filter((e) => e.type === "credit" && e.category === "secondary")
                    .reduce((sum, e) => sum + e.amount, 0);
                const allTimeTotalIncome = allTimeTotalPrimary + allTimeTotalSecondary;
                const allTimePending = normalizedEntries
                    .filter((e) => e.type === "credit" && e.status === "pending")
                    .reduce((sum, e) => sum + e.amount, 0);
                const allTimeReceived = normalizedEntries
                    .filter((e) => e.type === "credit" && e.status === "received")
                    .reduce((sum, e) => sum + e.amount, 0);

                const aggregateStats: YearlyStats = {
                    total: allTimeTotalIncome,
                    totalIncome: allTimeTotalIncome,
                    totalPrimary: allTimeTotalPrimary,
                    totalSecondary: allTimeTotalSecondary,
                    totalPending: allTimePending,
                    totalReceived: allTimeReceived,
                    monthlyAverage: Math.round(allTimeTotalIncome / 12),
                    highestMonth: yearlyData.highestMonth,
                };

                setEntries(normalizedEntries);
                setAllTimeStats(allTimeData);
                setAnnualStats(annualData);
                setMonthlyStats(monthlyData);
                setYearlyStats(aggregateStats);
            } else {
                const yearNum = selectedYear as number;
                const [entriesData, monthlyData, yearlyData, allTimeData, annualData] =
                    await Promise.all([
                        getIncomeByYear(yearNum, user.uid),
                        getMonthlyStats(yearNum, user.uid),
                        getYearlyStats(yearNum, user.uid),
                        getAllTimeStats(user.uid),
                        getAnnualStats(user.uid),
                    ]);

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
                incomeCache.setEntries(cacheKey as any, normalizedEntries);
                incomeCache.setMonthlyStats(cacheKey as any, monthlyData);
                incomeCache.setYearlyStats(cacheKey as any, yearlyData);
                incomeCache.setAllTimeStats(user.uid, allTimeData);
            }
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

    useEffect(() => {
        if (!user) {
            incomeCache.clear();
        }
    }, [user]);

    // Build unique dynamic years list
    const availableYears = useMemo(() => {
        const yearsSet = new Set<number>();
        annualStats.forEach((s) => yearsSet.add(s.year));
        for (let y = 2023; y <= currentYear + 1; y++) {
            yearsSet.add(y);
        }
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [annualStats, currentYear]);

    const showLoader = authLoading || showSplash;
    if (!user && !showLoader) return null;

    const effectiveYearNumber =
        selectedYear === "all" ? currentYear : (selectedYear as number);

    return (
        <AnimatePresence mode="wait">
            {showLoader ? (
                <motion.div
                    key="loader"
                    className="min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-md fixed inset-0 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <MoneyLoader />
                </motion.div>
            ) : (
                <motion.div
                    key="dashboard"
                    className="min-h-screen relative overflow-x-hidden bg-background"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Subtle modern ambient background mesh */}
                    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                        <div className="absolute -top-[15%] -left-[10%] w-[45vw] h-[45vw] bg-violet-500/8 dark:bg-violet-600/10 blur-[130px] rounded-full animate-float-slow" />
                        <div className="absolute top-[25%] -right-[10%] w-[40vw] h-[40vw] bg-indigo-500/8 dark:bg-indigo-600/10 blur-[130px] rounded-full animate-pulse-glow" />
                        <div className="absolute -bottom-[15%] left-[20%] w-[40vw] h-[40vw] bg-emerald-500/5 dark:bg-emerald-600/5 blur-[140px] rounded-full" />
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
                            {/* Dashboard Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2"
                            >
                                {/* Brand & User Greeting */}
                                <div className="flex items-center gap-3.5 sm:gap-4">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-md opacity-30" />
                                        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 text-white">
                                            <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight gradient-text">
                                            Money View
                                        </h1>
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                                            Welcome back,{" "}
                                            <span className="text-primary font-bold">
                                                {user?.displayName?.split(" ")[0] || "there"}
                                            </span>
                                            !
                                        </p>
                                    </div>
                                </div>

                                {/* Controls Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    {/* Year Selector */}
                                    <div className="flex items-center gap-1.5 glass rounded-xl px-2.5 py-1 border border-border/80">
                                        <span className="text-xs text-muted-foreground font-semibold">
                                            Year:
                                        </span>
                                        <Select
                                            value={selectedYear.toString()}
                                            onValueChange={(val) => {
                                                if (val === "all") {
                                                    setSelectedYear("all");
                                                } else {
                                                    setSelectedYear(Number(val));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[100px] border-none bg-transparent shadow-none text-xs font-bold focus:ring-0 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                                <SelectItem value="all" className="text-xs font-semibold">
                                                    All Years
                                                </SelectItem>
                                                {availableYears.map((yr) => (
                                                    <SelectItem
                                                        key={yr}
                                                        value={yr.toString()}
                                                        className="text-xs font-semibold"
                                                    >
                                                        {yr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* EMI Helper Dialog */}
                                    <EMICalculatorDialog />

                                    {/* Company Management in Settings */}
                                    <CompanySettingsDialog
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="glass border-border/80 hover:bg-accent font-semibold text-xs h-9"
                                                title="Manage Companies & Sources"
                                            >
                                                <Building2 className="h-4 w-4 mr-1.5 text-primary" />
                                                Companies
                                            </Button>
                                        }
                                    />

                                    {/* Business Link */}
                                    <Link href="/business">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="glass border-border/80 hover:bg-accent font-semibold text-xs h-9"
                                            title="Business Management"
                                        >
                                            <Briefcase className="h-4 w-4 mr-1.5 text-primary" />
                                            Business
                                        </Button>
                                    </Link>

                                    {/* Download Audited Statement PDF Button */}
                                    <ExportLedgerDialog
                                        allEntries={entries}
                                        companies={companies}
                                        monthlyStats={monthlyStats}
                                        selectedYear={selectedYear}
                                        user={user}
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={entries.length === 0}
                                                className="glass border-border/80 hover:bg-primary/10 text-foreground font-semibold text-xs h-9 gap-1.5"
                                                title="Download Audited Statement as PDF"
                                            >
                                                <Download className="h-3.5 w-3.5 text-primary" />
                                                <span className="hidden md:inline">Download PDF</span>
                                            </Button>
                                        }
                                    />

                                    {/* Add Entry Header Button */}
                                    <IncomeForm
                                        onSuccess={() => fetchData(true)}
                                        defaultYear={effectiveYearNumber}
                                        trigger={
                                            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl h-9 px-4 text-xs shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]">
                                                <Plus className="h-3.5 w-3.5" />
                                                <span>Add Entry</span>
                                            </Button>
                                        }
                                    />

                                    {/* Notification Bell */}
                                    <NotificationBell />

                                    {/* Dark & White Theme Toggle */}
                                    <ModeToggle />

                                    {/* User Profile */}
                                    <UserProfile />
                                </div>
                            </motion.div>

                            {/* Top Stats Cards */}
                            <StatsCards
                                stats={yearlyStats}
                                allTimeStats={allTimeStats}
                                loading={loading}
                                selectedYear={selectedYear}
                            />

                            {/* Transactions Table - Full Shadcn Table with Filtering & Totals */}
                            <IncomeTable
                                entries={entries}
                                monthlyStats={monthlyStats}
                                loading={loading}
                                onDelete={() => fetchData(true)}
                                selectedYear={selectedYear}
                                onYearChange={(yr) => setSelectedYear(yr)}
                            />

                            {/* Charts Section - Monthly & Yearly Analytics */}
                            <IncomeCharts
                                monthlyStats={monthlyStats}
                                annualStats={annualStats}
                                loading={loading}
                                selectedYear={effectiveYearNumber}
                            />

                            {/* Floating Action Button for Quick Adding */}
                            <IncomeForm
                                onSuccess={() => fetchData(true)}
                                defaultYear={effectiveYearNumber}
                            />
                        </div>
                    </div>

                    <Toaster />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
