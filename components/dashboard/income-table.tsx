"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { IncomeEntry } from "@/types/income";
import { Company } from "@/types/company";
import { deleteIncome, updateIncome } from "@/lib/income-service";
import { subscribeToCompanies } from "@/lib/company-service";
import { formatCurrency, MONTHS } from "@/lib/utils";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Trash2,
    TrendingUp,
    TrendingDown,
    Hourglass,
    CheckCircle2,
    Pencil,
    ArrowUp,
    ArrowDown,
    Calendar,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Building2,
    Download,
    FileText,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AnimatedTrendUpIcon,
    AnimatedTrendDownIcon,
    AnimatedWalletIcon,
    AnimatedClockIcon,
    AnimatedCheckIcon,
    AnimatedPulseRing,
} from "@/components/ui/animated-icons";
import { IncomeForm } from "./income-form";
import { motion, AnimatePresence } from "framer-motion";
import { ExportLedgerDialog } from "./export-ledger-dialog";
import { MonthlyStats } from "@/types/income";

interface IncomeTableProps {
    entries: IncomeEntry[];
    monthlyStats?: MonthlyStats[];
    loading: boolean;
    onDelete: () => void;
    selectedYear?: number | "all";
    onYearChange?: (year: number) => void;
}

type StatusFilter = "all" | "pending" | "received";
type CategoryFilter = "all" | "primary" | "secondary";

export function IncomeTable({
    entries,
    monthlyStats,
    loading,
    onDelete,
    selectedYear,
    onYearChange,
}: IncomeTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyFilter, setCompanyFilter] = useState<string>("all");

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToCompanies(user.uid, (list) => {
            setCompanies(list);
        });
        return () => unsubscribe();
    }, [user]);

    const [sortConfig, setSortConfig] = useState<{
        key: "amount" | "date";
        direction: "desc" | "asc";
    }>({
        key: "date",
        direction: "desc",
    });

    // Enhanced Filter and Sort logic
    const filteredAndSortedEntries = useMemo(() => {
        let result = [...entries];

        // Year Filter from Master Selector
        if (selectedYear && selectedYear !== "all") {
            const yNum = Number(selectedYear);
            result = result.filter((entry) => entry.year === yNum);
        }

        // Company Filter
        if (companyFilter !== "all") {
            if (companyFilter === "none") {
                result = result.filter((entry) => !entry.companyId || entry.companyId === "none");
            } else {
                result = result.filter(
                    (entry) =>
                        entry.companyId === companyFilter ||
                        entry.companyName?.toLowerCase() === companyFilter.toLowerCase()
                );
            }
        }

        // Status Filter
        if (statusFilter !== "all") {
            result = result.filter((entry) => entry.status === statusFilter);
        }

        // Category Filter
        if (categoryFilter !== "all") {
            result = result.filter((entry) => entry.category === categoryFilter);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortConfig.key === "amount") {
                return sortConfig.direction === "desc"
                    ? b.amount - a.amount
                    : a.amount - b.amount;
            }

            // Explicit Month/Year Sort
            const monthIndexA = MONTHS.indexOf(a.month);
            const monthIndexB = MONTHS.indexOf(b.month);

            const yearA = a.year || 0;
            const yearB = b.year || 0;

            if (yearA !== yearB) {
                return sortConfig.direction === "desc"
                    ? yearB - yearA
                    : yearA - yearB;
            }

            return sortConfig.direction === "desc"
                ? monthIndexB - monthIndexA
                : monthIndexA - monthIndexB;
        });

        return result;
    }, [entries, selectedYear, companyFilter, statusFilter, categoryFilter, sortConfig]);

    // Calculate totals for currently filtered view
    const totals = useMemo(() => {
        const credits = filteredAndSortedEntries
            .filter((e) => e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);

        const primaryCredits = filteredAndSortedEntries
            .filter((e) => e.type === "credit" && e.category === "primary")
            .reduce((sum, e) => sum + e.amount, 0);

        const secondaryCredits = filteredAndSortedEntries
            .filter((e) => e.type === "credit" && e.category === "secondary")
            .reduce((sum, e) => sum + e.amount, 0);

        const debits = filteredAndSortedEntries
            .filter((e) => e.type === "debit")
            .reduce((sum, e) => sum + e.amount, 0);

        const primaryDebits = filteredAndSortedEntries
            .filter((e) => e.type === "debit" && e.category === "primary")
            .reduce((sum, e) => sum + e.amount, 0);

        const secondaryDebits = filteredAndSortedEntries
            .filter((e) => e.type === "debit" && e.category === "secondary")
            .reduce((sum, e) => sum + e.amount, 0);

        const net = credits - debits;

        return {
            credits,
            primaryCredits,
            secondaryCredits,
            debits,
            primaryDebits,
            secondaryDebits,
            net,
        };
    }, [filteredAndSortedEntries]);

    // Calculate totals for the entire filtered entries set
    const yearTotals = useMemo(() => {
        const pending = filteredAndSortedEntries
            .filter((e) => e.status === "pending" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        const received = filteredAndSortedEntries
            .filter((e) => e.status === "received" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        return { pending, received };
    }, [filteredAndSortedEntries]);

    async function handleStatusUpdate(id: string, currentStatus: string) {
        if (!user || updatingId) return;
        const newStatus = currentStatus === "received" ? "pending" : "received";
        setUpdatingId(id);
        try {
            await updateIncome(id, user.uid, { status: newStatus as any });
            toast({
                title: "Status Updated",
                description: `Transaction marked as ${newStatus}`,
                duration: 1500,
            });
            onDelete();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setUpdatingId(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        if (!user) return;

        setDeletingId(id);
        try {
            await deleteIncome(id, user.uid);
            toast({
                title: "Success!",
                description: "Income entry deleted successfully",
                duration: 1500,
            });
            onDelete();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete entry",
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <Card className="glass rounded-2xl border-border/70">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-12 bg-muted rounded-xl"
                            ></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass relative overflow-hidden rounded-2xl border border-border/80 shadow-sm dark:shadow-2xl">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
                            Recent Transactions
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                                {filteredAndSortedEntries.length} Records
                            </span>
                            {selectedYear && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/80 font-bold">
                                    {selectedYear === "all" ? "All Years" : `Year: ${selectedYear}`}
                                </span>
                            )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            Track, filter, and manage your income streams and expenditures
                        </p>
                    </div>

                    {/* Filter and Sorting Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Company Filter Dropdown */}
                        <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border/70">
                            <Building2 className="w-3.5 h-3.5 text-primary ml-1.5 shrink-0" />
                            <Select value={companyFilter} onValueChange={setCompanyFilter}>
                                <SelectTrigger className="h-7 border-none bg-transparent shadow-none text-xs font-bold focus:ring-0 w-[145px] truncate">
                                    <SelectValue placeholder="All Companies" />
                                </SelectTrigger>
                                <SelectContent className="glass bg-popover text-popover-foreground border-border max-h-60">
                                    <SelectItem value="all" className="text-xs font-semibold">
                                        All Companies
                                    </SelectItem>
                                    <SelectItem value="none" className="text-xs font-semibold">
                                        Personal / No Company
                                    </SelectItem>
                                    {companies.map((comp) => (
                                        <SelectItem
                                            key={comp.id}
                                            value={comp.id}
                                            className="text-xs font-semibold"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: comp.color || "#6366f1" }}
                                                />
                                                <span className="truncate">{comp.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-muted/50 dark:bg-muted/20 p-1 rounded-xl border border-border/70">
                            {(["all", "received", "pending"] as StatusFilter[]).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                                        statusFilter === status
                                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-1 bg-muted/50 dark:bg-muted/20 p-1 rounded-xl border border-border/70">
                            {(["all", "primary", "secondary"] as CategoryFilter[]).map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setCategoryFilter(category)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                                        categoryFilter === category
                                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Sort by Amount */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSortConfig((prev) => ({
                                    key: "amount",
                                    direction:
                                        prev.key === "amount" && prev.direction === "desc"
                                            ? "asc"
                                            : "desc",
                                }))
                            }
                            className={`h-8 rounded-xl text-xs font-bold border-border/70 transition-all ${
                                sortConfig.key === "amount"
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Amount:{" "}
                            {sortConfig.key === "amount"
                                ? sortConfig.direction === "desc"
                                ? "Highest"
                                : "Lowest"
                                : "Default"}
                        </Button>

                        {/* Sort by Date */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSortConfig((prev) => ({
                                    key: "date",
                                    direction:
                                        prev.key === "date" && prev.direction === "desc"
                                            ? "asc"
                                            : "desc",
                                }))
                            }
                            className={`h-8 rounded-xl text-xs font-bold border-border/70 transition-all ${
                                sortConfig.key === "date"
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span className="flex items-center gap-1">
                                Date
                                {sortConfig.key === "date" &&
                                    (sortConfig.direction === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                    ) : (
                                        <ArrowDown className="h-3 w-3" />
                                    ))}
                            </span>
                        </Button>

                        {/* Export Statement as Modern PDF Dialog */}
                        <ExportLedgerDialog
                            allEntries={entries}
                            activeFilteredEntries={filteredAndSortedEntries}
                            companies={companies}
                            monthlyStats={monthlyStats}
                            selectedYear={selectedYear}
                            user={user}
                            trigger={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={entries.length === 0}
                                    className="h-8 rounded-xl text-xs font-bold glass border-border/80 hover:bg-primary/10 text-foreground transition-all gap-1.5 shadow-sm"
                                    title="Download Statement as PDF"
                                >
                                    <Download className="h-3.5 w-3.5 text-primary" />
                                    <span>Download PDF</span>
                                </Button>
                            }
                        />
                    </div>
                </div>

                {/* Filtered Totals & Summary Strip - Modern Clean Aesthetic */}
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${statusFilter}-${categoryFilter}-${companyFilter}-${selectedYear}`}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1"
                >
                    {/* Credits */}
                    <div className="relative overflow-hidden rounded-2xl p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Credits
                            </span>
                            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                                <AnimatedTrendUpIcon size={14} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight relative z-10">
                            {formatCurrency(totals.credits)}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground relative z-10">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="font-bold text-foreground">
                                    {formatCurrency(totals.primaryCredits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="font-bold text-foreground">
                                    {formatCurrency(totals.secondaryCredits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Debits */}
                    <div className="relative overflow-hidden rounded-2xl p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Debits
                            </span>
                            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm">
                                <AnimatedTrendDownIcon size={14} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight relative z-10">
                            {formatCurrency(totals.debits)}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-border/40 text-[10px] space-y-0.5 text-muted-foreground relative z-10">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="font-bold text-foreground">
                                    {formatCurrency(totals.primaryDebits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="font-bold text-foreground">
                                    {formatCurrency(totals.secondaryDebits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="relative overflow-hidden rounded-2xl p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Net Balance
                                </span>
                                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                                    <AnimatedWalletIcon size={14} />
                                </div>
                            </div>
                            <p className="text-xl font-black text-foreground tracking-tight">
                                {formatCurrency(totals.net)}
                            </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mt-2.5 pt-2 border-t border-border/40 relative z-10">
                            Filtered Inflow vs Outflow
                        </p>
                    </div>

                    {/* Year Pending */}
                    <div className="relative overflow-hidden rounded-2xl p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pending
                            </span>
                            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                                <AnimatedClockIcon size={14} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight relative z-10">
                            {formatCurrency(yearTotals.pending)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-2.5 pt-2 border-t border-border/40 relative z-10">
                            Uncollected in this view
                        </p>
                    </div>

                    {/* Year Received */}
                    <div className="relative overflow-hidden rounded-2xl p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all group col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Received
                            </span>
                            <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm">
                                <AnimatedCheckIcon size={14} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight relative z-10">
                            {formatCurrency(yearTotals.received)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-2.5 pt-2 border-t border-border/40 relative z-10">
                            Settled in this view
                        </p>
                    </div>
                </motion.div>
            </CardHeader>

            <CardContent className="p-0 sm:p-6 sm:pt-2">
                {filteredAndSortedEntries.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground font-medium text-sm">
                            No transactions found matching your criteria.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile List View */}
                        <div className="block md:hidden divide-y divide-border/50">
                            <AnimatePresence mode="popLayout">
                                {filteredAndSortedEntries.map((entry) => {
                                    const isReceived = entry.status === "received";
                                    const isCredit = entry.type === "credit";
                                    const entryCompany = companies.find(
                                        (c) =>
                                            c.id === entry.companyId ||
                                            (entry.companyName &&
                                                c.name.toLowerCase() ===
                                                    entry.companyName.toLowerCase())
                                    );
                                    const companyName =
                                        entryCompany?.name || entry.companyName;
                                    const companyColor =
                                        entryCompany?.color || "#6366f1";
                                    return (
                                        <motion.div
                                            layout
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                                                        isCredit
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {isCredit ? (
                                                        <ArrowDownLeft className="h-5 w-5" />
                                                    ) : (
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-foreground truncate">
                                                        {entry.description || entry.category}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                                        <span>
                                                            {entry.month} {entry.year}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="capitalize">{entry.category}</span>
                                                        {companyName && (
                                                            <>
                                                                <span>•</span>
                                                                <span
                                                                    className="inline-flex items-center gap-1 font-bold text-[11px]"
                                                                    style={{ color: companyColor }}
                                                                >
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: companyColor }}
                                                                    />
                                                                    {companyName}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0 space-y-1">
                                                <p
                                                    className={`font-black text-sm tracking-tight ${
                                                        isCredit
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-rose-600 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {isCredit ? "+" : "-"}
                                                    {formatCurrency(entry.amount)}
                                                </p>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(entry.id, entry.status)
                                                        }
                                                        disabled={updatingId === entry.id}
                                                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-transform active:scale-95 ${
                                                            isReceived
                                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                                        }`}
                                                    >
                                                        {isReceived ? "Received" : "Pending"}
                                                    </button>

                                                    <IncomeForm
                                                        onSuccess={onDelete}
                                                        defaultYear={entry.year}
                                                        initialData={entry}
                                                        trigger={
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        }
                                                    />

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(entry.id)}
                                                        disabled={deletingId === entry.id}
                                                        className="h-7 w-7 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Shadcn Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-border/60 hover:bg-transparent bg-muted/20">
                                        <TableHead className="w-[45px] text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            #
                                        </TableHead>
                                        <TableHead
                                            className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() =>
                                                setSortConfig((prev) => ({
                                                    key: "date",
                                                    direction:
                                                        prev.key === "date" && prev.direction === "desc"
                                                            ? "asc"
                                                            : "desc",
                                                }))
                                            }
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                {sortConfig.key === "date" &&
                                                    (sortConfig.direction === "asc" ? (
                                                        <ArrowUp className="h-3 w-3 text-primary" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3 text-primary" />
                                                    ))}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Company / Source
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Description
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Category
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Type
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredAndSortedEntries.map((entry, index) => {
                                            const isReceived = entry.status === "received";
                                            const isCredit = entry.type === "credit";
                                            const entryCompany = companies.find(
                                                (c) =>
                                                    c.id === entry.companyId ||
                                                    (entry.companyName &&
                                                        c.name.toLowerCase() ===
                                                            entry.companyName.toLowerCase())
                                            );
                                            const companyName =
                                                entryCompany?.name || entry.companyName;
                                            const companyColor =
                                                entryCompany?.color || "#6366f1";
                                            return (
                                                <TableRow
                                                    key={entry.id}
                                                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                                                >
                                                    <TableCell className="text-xs text-muted-foreground font-semibold">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>
                                                                {entry.month}{" "}
                                                                <span className="font-bold text-foreground">
                                                                    {entry.year}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {companyName ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] font-bold rounded-lg border inline-flex items-center gap-1.5 max-w-[140px] truncate"
                                                                style={{
                                                                    backgroundColor: `${companyColor}15`,
                                                                    color: companyColor,
                                                                    borderColor: `${companyColor}35`,
                                                                }}
                                                                title={companyName}
                                                            >
                                                                <span
                                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                    style={{ backgroundColor: companyColor }}
                                                                />
                                                                <span className="truncate">{companyName}</span>
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground/60 italic font-medium">Personal</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-xs text-foreground max-w-[200px] truncate">
                                                        {entry.description || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] capitalize font-bold rounded-lg border ${
                                                                entry.category === "primary"
                                                                    ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25"
                                                                    : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25"
                                                            }`}
                                                        >
                                                            {entry.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] uppercase font-bold rounded-lg border ${
                                                                isCredit
                                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                                                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25"
                                                            }`}
                                                        >
                                                            {entry.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStatusUpdate(entry.id, entry.status)
                                                            }
                                                            disabled={updatingId === entry.id}
                                                            title="Click to toggle status"
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                                                                isReceived
                                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                                            }`}
                                                        >
                                                            {isReceived ? (
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                            ) : (
                                                                <Hourglass className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                            )}
                                                            {isReceived ? "Received" : "Pending"}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right font-black text-sm whitespace-nowrap ${
                                                            isCredit
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-rose-600 dark:text-rose-400"
                                                        }`}
                                                    >
                                                        {isCredit ? "+" : "-"}
                                                        {formatCurrency(entry.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <IncomeForm
                                                                onSuccess={onDelete}
                                                                defaultYear={entry.year}
                                                                initialData={entry}
                                                                trigger={
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(entry.id)}
                                                                disabled={deletingId === entry.id}
                                                                className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
