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
} from "lucide-react";
import { IncomeForm } from "./income-form";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncomeTableProps {
    entries: IncomeEntry[];
    loading: boolean;
    onDelete: () => void;
}

type StatusFilter = "all" | "pending" | "received";

export function IncomeTable({ entries, loading, onDelete }: IncomeTableProps) {
    const { user } = useAuth();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<
        "all" | "primary" | "secondary"
    >("all");
    const [sortConfig, setSortConfig] = useState<{
        key: "amount" | "date";
        direction: "desc" | "asc";
    }>({
        key: "date",
        direction: "asc",
    });

    const { toast } = useToast();

    // Enhanced Filter and Sort logic
    const filteredAndSortedEntries = useMemo(() => {
        let result = [...entries];

        // Status Filter
        if (statusFilter !== "all") {
            result = result.filter((entry) => entry.status === statusFilter);
        }

        // Category Filter
        if (categoryFilter !== "all") {
            result = result.filter(
                (entry) => entry.category === categoryFilter,
            );
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

            if (a.year !== b.year) {
                return sortConfig.direction === "desc"
                    ? b.year - a.year
                    : a.year - b.year;
            }

            return sortConfig.direction === "desc"
                ? monthIndexB - monthIndexA
                : monthIndexA - monthIndexB;
        });

        return result;
    }, [entries, statusFilter, categoryFilter, sortConfig]);

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

    // Calculate totals for the entire year (unfiltered by status/category)
    const yearTotals = useMemo(() => {
        const pending = entries
            .filter((e) => e.status === "pending" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        const received = entries
            .filter((e) => e.status === "received" && e.type === "credit")
            .reduce((sum, e) => sum + e.amount, 0);
        return { pending, received };
    }, [entries]);

    async function handleStatusUpdate(id: string, newStatus: string) {
        if (!user) return;
        try {
            await updateIncome(id, user.uid, { status: newStatus as any });
            toast({
                title: "Status Updated",
                description: `Transaction marked as ${newStatus}`,
                duration: 1000,
            });
            onDelete(); // Refresh data
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
                duration: 2000,
            });
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
                duration: 1000,
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
            <Card className="glass border-white/10">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-12 bg-gray-200 dark:bg-gray-800 rounded"
                            ></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (entries.length === 0) {
        return (
            <Card className="glass border-border/50">
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                        No income entries yet. Add your first entry to get
                        started!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass relative overflow-hidden border-border/50 shadow-2xl">
            {/* Subtle internal glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />

            <CardHeader className="relative">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 md:gap-6">
                    <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground via-muted-foreground to-foreground gradient-text">
                        Recent Transactions
                    </CardTitle>

                    {/* Mobile optimized toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center overflow-x-auto pb-1 sm:pb-0 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            {/* Status Filter */}
                            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 shrink-0">
                                {["all", "pending", "received"].map(
                                    (status) => (
                                        <Button
                                            key={status}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setStatusFilter(
                                                    status as StatusFilter,
                                                )
                                            }
                                            className={`rounded-lg px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-bold uppercase transition-all duration-300 h-7 md:h-8 ${
                                                statusFilter === status
                                                    ? status === "all"
                                                        ? "bg-background shadow-sm text-foreground"
                                                        : status === "pending"
                                                          ? "bg-[#ffb200]/10 text-[#ffb200] dark:text-[#ffb200]"
                                                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {status}
                                        </Button>
                                    ),
                                )}
                            </div>

                            {/* Category Filter */}
                            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 shrink-0">
                                {["all", "primary", "secondary"].map((cat) => (
                                    <Button
                                        key={cat}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setCategoryFilter(cat as any)
                                        }
                                        className={`rounded-lg px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-bold uppercase transition-all duration-300 h-7 md:h-8 ${
                                            categoryFilter === cat
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {cat === "primary"
                                            ? "Primary"
                                            : cat === "secondary"
                                              ? "Secondary"
                                              : "All"}
                                    </Button>
                                ))}
                            </div>

                            {/* Amount Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setSortConfig((prev) => ({
                                        key: "amount",
                                        direction:
                                            prev.key === "amount" &&
                                            prev.direction === "desc"
                                                ? "asc"
                                                : "desc",
                                    }))
                                }
                                className={`rounded-xl border border-border/50 bg-muted/50 px-3 text-[10px] md:text-[11px] font-bold uppercase transition-all h-8 md:h-9 shrink-0 ${
                                    sortConfig.key === "amount"
                                        ? "text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/30"
                                        : "text-muted-foreground"
                                }`}
                            >
                                Sort:{" "}
                                {sortConfig.key === "amount"
                                    ? sortConfig.direction === "desc"
                                        ? "Largest"
                                        : "Smallest"
                                    : "Amount"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filtered Totals & Year Summary */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${statusFilter}-${categoryFilter}`}
                    className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
                >
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors group">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                Credits
                            </p>
                            <TrendingUp className="h-3 w-3 text-emerald-500/50" />
                        </div>
                        <p className="text-xl font-bold text-emerald-400">
                            {formatCurrency(totals.credits)}
                        </p>
                        <div className="mt-2 text-[10px] space-y-0.5 text-slate-500">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="text-emerald-400/80">
                                    {formatCurrency(totals.primaryCredits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="text-emerald-400/80">
                                    {formatCurrency(totals.secondaryCredits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors group">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                Debits
                            </p>
                            <TrendingDown className="h-3 w-3 text-rose-500/50" />
                        </div>
                        <p className="text-xl font-bold text-rose-400">
                            {formatCurrency(totals.debits)}
                        </p>
                        <div className="mt-2 text-[10px] space-y-0.5 text-slate-500">
                            <div className="flex justify-between">
                                <span>Primary:</span>
                                <span className="text-rose-400/80">
                                    {formatCurrency(totals.primaryDebits)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Secondary:</span>
                                <span className="text-rose-400/80">
                                    {formatCurrency(totals.secondaryDebits)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors group flex flex-col justify-center">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
                            Net
                        </p>
                        <p className="text-xl font-bold text-purple-400">
                            {formatCurrency(totals.net)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#ffb200]/5 border border-[#ffb200]/10 hover:bg-[#ffb200]/10 transition-colors group">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
                            Total Year Pending
                        </p>
                        <div className="flex items-center gap-2">
                            <Hourglass className="h-4 w-4 text-[#ffb200]" />
                            <p className="text-xl font-bold text-[#ffb200]">
                                {formatCurrency(yearTotals.pending)}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors group">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
                            Total Year Received
                        </p>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <p className="text-xl font-bold text-emerald-400">
                                {formatCurrency(yearTotals.received)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
                {/* Modern List View (Mobile) */}
                <div className="block md:hidden">
                    <div className="divide-y divide-border/30">
                        <AnimatePresence mode="popLayout">
                            {filteredAndSortedEntries.map((entry, index) => (
                                <motion.div
                                    layout
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative p-4 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon Box */}
                                        <div
                                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                                                entry.type === "credit"
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                            }`}
                                        >
                                            {entry.type === "credit" ? (
                                                <TrendingUp className="h-5 w-5" />
                                            ) : (
                                                <TrendingDown className="h-5 w-5" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="font-bold text-base truncate pr-2">
                                                    {entry.month}
                                                </h3>
                                                <span
                                                    className={`font-bold text-base whitespace-nowrap tabular-nums ${
                                                        entry.type === "credit"
                                                            ? "text-emerald-500"
                                                            : "text-rose-500"
                                                    }`}
                                                >
                                                    {entry.type === "credit"
                                                        ? "+"
                                                        : "-"}
                                                    {formatCurrency(
                                                        entry.amount,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="font-medium">
                                                        {/* {entry.year} */}
                                                    </span>
                                                    {/* <span className="w-1 h-1 rounded-full bg-border" /> */}
                                                    <span className="truncate">
                                                        {entry.description ||
                                                            entry.category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div
                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                                            entry.status ===
                                                            "received"
                                                                ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"
                                                                : "bg-[#ffb200]/5 text-[#ffb200] dark:text-[#ffb200] border-[#ffb200]/10"
                                                        }`}
                                                    >
                                                        {entry.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions (visible on tap/long press ideally, but here inline for simplicity) */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border/50 shadow-lg">
                                        <IncomeForm
                                            onSuccess={onDelete}
                                            defaultYear={entry.year}
                                            initialData={entry}
                                            trigger={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleDelete(entry.id)
                                            }
                                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[50px] text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    No.
                                </TableHead>
                                <TableHead
                                    className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em] cursor-pointer hover:text-foreground transition-colors group/head"
                                    onClick={() =>
                                        setSortConfig((prev) => ({
                                            key: "date",
                                            direction:
                                                prev.key === "date" &&
                                                prev.direction === "desc"
                                                    ? "asc"
                                                    : "desc",
                                        }))
                                    }
                                >
                                    <div className="flex items-center gap-1">
                                        Date
                                        {sortConfig.key === "date" &&
                                            (sortConfig.direction === "asc" ? (
                                                <ArrowUp className="h-3 w-3 text-cyan-500" />
                                            ) : (
                                                <ArrowDown className="h-3 w-3 text-cyan-500" />
                                            ))}
                                    </div>
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Amount
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Type
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Category
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Status
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Description
                                </TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em] text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredAndSortedEntries.map(
                                    (entry, index) => (
                                        <motion.tr
                                            layout
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-border/50 group hover:bg-muted/50 transition-all duration-300"
                                        >
                                            <TableCell className="text-muted-foreground font-bold text-xs py-4">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground py-4 font-medium whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>{entry.month}</span>
                                                    {/* <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                                                        {entry.year}
                                                    </span> */}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-foreground tabular-nums">
                                                {formatCurrency(entry.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`p-1.5 rounded-md ${
                                                            entry.type ===
                                                            "credit"
                                                                ? "bg-emerald-500/10 text-emerald-500"
                                                                : "bg-rose-500/10 text-rose-500"
                                                        }`}
                                                    >
                                                        {entry.type ===
                                                        "credit" ? (
                                                            <TrendingUp className="h-3 w-3" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3" />
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-xs font-bold uppercase tracking-tight ${
                                                            entry.type ===
                                                            "credit"
                                                                ? "text-emerald-400"
                                                                : "text-rose-400"
                                                        }`}
                                                    >
                                                        {entry.type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border border-border/50 ${
                                                        entry.category ===
                                                        "primary"
                                                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                                            : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                                    }`}
                                                >
                                                    {entry.category ===
                                                    "primary"
                                                        ? "Primary / Salary"
                                                        : "Secondary / Other"}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Select
                                                    defaultValue={entry.status}
                                                    onValueChange={(value) =>
                                                        handleStatusUpdate(
                                                            entry.id,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={`h-7 w-fit min-w-[100px] px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border border-border/50 focus:ring-0 transition-all duration-300 ${
                                                            entry.status ===
                                                            "received"
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                                                : "bg-[#ffb200]/10 text-[#ffb200] dark:text-[#ffb200] hover:bg-[#ffb200]/20"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <SelectValue placeholder="Status" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border/50 bg-background/95 backdrop-blur-md text-foreground min-w-[120px]">
                                                        <SelectItem
                                                            value="pending"
                                                            className="text-[10px] font-bold uppercase tracking-wider focus:bg-[#ffb200]/20 focus:text-[#ffb200] dark:focus:text-[#ffb200]"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Hourglass className="h-3 w-3" />
                                                                <span>
                                                                    Pending
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="received"
                                                            className="text-[10px] font-bold uppercase tracking-wider focus:bg-emerald-500/20 focus:text-emerald-400"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="h-3 w-3" />
                                                                <span>
                                                                    Received
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            <TableCell className="text-muted-foreground max-w-[150px] truncate text-[13px]">
                                                {entry.description || (
                                                    <span className="opacity-30 italic">
                                                        No note
                                                    </span>
                                                )}
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
                                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDelete(
                                                                entry.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            entry.id
                                                        }
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ),
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
