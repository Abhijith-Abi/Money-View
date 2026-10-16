"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { IncomeEntry } from "@/types/income";
import { deleteIncome, updateIncome } from "@/lib/income-service";
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
    CheckCircle,
    Pencil,
    ArrowUp,
    ArrowDown,
    Calendar,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { IncomeForm } from "./income-form";
import { motion, AnimatePresence } from "framer-motion";

interface IncomeTableProps {
    entries: IncomeEntry[];
    loading: boolean;
    onDelete: () => void;
    selectedYear?: number | "all";
    onYearChange?: (year: number) => void;
}

type StatusFilter = "all" | "pending" | "received";
type CategoryFilter = "all" | "primary" | "secondary";

export function IncomeTable({
    entries,
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
    const [tableYearFilter, setTableYearFilter] = useState<string>(
        selectedYear ? selectedYear.toString() : "all"
    );

    const [sortConfig, setSortConfig] = useState<{
        key: "amount" | "date";
        direction: "desc" | "asc";
    }>({
        key: "date",
        direction: "desc",
    });

    // Extract all unique years present in entries
    const availableYears = useMemo(() => {
        const yearsSet = new Set<number>();
        entries.forEach((e) => {
            if (e.year) yearsSet.add(e.year);
        });
        const currentYear = new Date().getFullYear();
        yearsSet.add(currentYear);
        yearsSet.add(currentYear - 1);
        yearsSet.add(currentYear - 2);
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [entries]);

    // Enhanced Filter and Sort logic
    const filteredAndSortedEntries = useMemo(() => {
        let result = [...entries];

        // Year Filter
        if (tableYearFilter !== "all") {
            const yNum = Number(tableYearFilter);
            result = result.filter((entry) => entry.year === yNum);
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
    }, [entries, tableYearFilter, statusFilter, categoryFilter, sortConfig]);

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
        const currentSet =
            tableYearFilter === "all"
                ? entries
                : entries.filter((e) => e.year === Number(tableYearFilter));

        const pending = currentSet
            .filter((e) => e.status === "pending" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        const received = currentSet
            .filter((e) => e.status === "received" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        return { pending, received };
    }, [entries, tableYearFilter]);

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
            onDelete(); // Refresh data
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
        <Card className="glass relative overflow-hidden rounded-2xl border-border/70 shadow-sm dark:shadow-2xl">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Recent Transactions
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                                {filteredAndSortedEntries.length} Records
                            </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Track, filter, and manage your income and expenses
                        </p>
                    </div>

                    {/* Filter and Sorting Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Year Filter */}
                        <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
                            <Select
                                value={tableYearFilter}
                                onValueChange={(val) => {
                                    setTableYearFilter(val);
                                    if (onYearChange && val !== "all") {
                                        onYearChange(Number(val));
                                    }
                                }}
                            >
                                <SelectTrigger className="h-7 border-none bg-transparent shadow-none text-xs font-semibold focus:ring-0 w-[100px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                    <SelectItem value="all" className="text-xs font-medium">
                                        All Years
                                    </SelectItem>
                                    {availableYears.map((y) => (
                                        <SelectItem
                                            key={y}
                                            value={y.toString()}
                                            className="text-xs font-medium"
                                        >
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border">
                            {(["all", "received", "pending"] as StatusFilter[]).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                                        statusFilter === status
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-1 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border">
                            {(["all", "primary", "secondary"] as CategoryFilter[]).map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setCategoryFilter(category)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                                        categoryFilter === category
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
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
                            className={`h-8 rounded-xl text-xs font-semibold border-border transition-all ${
                                sortConfig.key === "amount"
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "text-muted-foreground"
                            }`}
                        >
                            Sort Amount:{" "}
                            {sortConfig.key === "amount"
                                ? sortConfig.direction === "desc"
                                    ? "High → Low"
                                    : "Low → High"
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
                            className={`h-8 rounded-xl text-xs font-semibold border-border transition-all ${
                                sortConfig.key === "date"
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "text-muted-foreground"
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
                    </div>
                </div>

                {/* Filtered Totals & Summary Strip */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${statusFilter}-${categoryFilter}-${tableYearFilter}`}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2"
                >
                    {/* Credits */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-bold">
                                Credits
                            </span>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(totals.credits)}
                        </p>
                        <div className="mt-1 text-[10px] space-y-0.5 text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="font-semibold text-foreground">
                                    {formatCurrency(totals.primaryCredits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="font-semibold text-foreground">
                                    {formatCurrency(totals.secondaryCredits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Debits */}
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-rose-700 dark:text-rose-300 uppercase tracking-wider font-bold">
                                Debits
                            </span>
                            <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(totals.debits)}
                        </p>
                        <div className="mt-1 text-[10px] space-y-0.5 text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="font-semibold text-foreground">
                                    {formatCurrency(totals.primaryDebits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="font-semibold text-foreground">
                                    {formatCurrency(totals.secondaryDebits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-center">
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 uppercase tracking-wider font-bold mb-0.5">
                            Net Balance
                        </span>
                        <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                            {formatCurrency(totals.net)}
                        </p>
                        <span className="text-[10px] text-muted-foreground mt-1">
                            Filtered Income vs Expenses
                        </span>
                    </div>

                    {/* Year Pending */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 uppercase tracking-wider font-bold">
                                Year Pending
                            </span>
                            <Hourglass className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(yearTotals.pending)}
                        </p>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                            Total Uncollected
                        </span>
                    </div>

                    {/* Year Received */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-bold">
                                Year Received
                            </span>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(yearTotals.received)}
                        </p>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                            Total Collected
                        </span>
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
                        <div className="block md:hidden divide-y divide-border/40">
                            <AnimatePresence mode="popLayout">
                                {filteredAndSortedEntries.map((entry, index) => {
                                    const isReceived = entry.status === "received";
                                    const isCredit = entry.type === "credit";
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
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <span>
                                                            {entry.month} {entry.year}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="capitalize">{entry.category}</span>
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
                                                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-transform active:scale-95 ${
                                                            isReceived
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
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
                                                                className="h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg"
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
                                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                                        <TableHead className="w-[50px] text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
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
                                                                <span className="text-primary font-bold">
                                                                    {entry.year}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-xs text-foreground max-w-[200px] truncate">
                                                        {entry.description || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] capitalize font-semibold rounded-md border ${
                                                                entry.category === "primary"
                                                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                                                    : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                                                            }`}
                                                        >
                                                            {entry.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] uppercase font-bold rounded-md border ${
                                                                isCredit
                                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
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
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                                                                isReceived
                                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                                            }`}
                                                        >
                                                            {isReceived ? (
                                                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
                                                                        className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg"
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
