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
    Clock,
    CheckCircle2,
    Pencil,
} from "lucide-react";
import { IncomeForm } from "./income-form";

import { motion } from "framer-motion";
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
                                className="h-12 bg-slate-700 rounded"
                            ></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (entries.length === 0) {
        return (
            <Card className="glass border-white/10">
                <CardContent className="p-12 text-center">
                    <p className="text-slate-400">
                        No income entries yet. Add your first entry to get
                        started!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass relative overflow-hidden border-white/5 shadow-2xl">
            {/* Subtle internal glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />

            <CardHeader className="relative">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 gradient-text">
                        Recent Transactions
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Status Filter */}
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            {["all", "pending", "received"].map((status) => (
                                <Button
                                    key={status}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setStatusFilter(status as StatusFilter)
                                    }
                                    className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase transition-all duration-300 ${
                                        statusFilter === status
                                            ? status === "all"
                                                ? "bg-white/10 text-white"
                                                : status === "pending"
                                                  ? "bg-amber-500/20 text-amber-400"
                                                  : "bg-emerald-500/20 text-emerald-400"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            {["all", "primary", "secondary"].map((cat) => (
                                <Button
                                    key={cat}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setCategoryFilter(cat as any)
                                    }
                                    className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase transition-all duration-300 ${
                                        categoryFilter === cat
                                            ? "bg-purple-500/20 text-purple-400"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    {cat === "primary"
                                        ? "Primary / Salary"
                                        : cat === "secondary"
                                          ? "Secondary / Other"
                                          : cat}
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
                            className={`rounded-xl border border-white/5 bg-black/40 px-3 text-[11px] font-bold uppercase transition-all ${
                                sortConfig.key === "amount"
                                    ? "text-cyan-400 ring-1 ring-cyan-500/30"
                                    : "text-slate-500"
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

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors group">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
                            Total Year Pending
                        </p>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-400" />
                            <p className="text-xl font-bold text-amber-400">
                                {formatCurrency(yearTotals.pending)}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors group">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
                            Total Year Received
                        </p>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <p className="text-xl font-bold text-emerald-400">
                                {formatCurrency(yearTotals.received)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Date
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Amount
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Type
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Category
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Status
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                                    Description
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em] text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedEntries.map((entry, index) => (
                                <motion.tr
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="border-white/5 group hover:bg-white/[0.04] transition-all duration-300"
                                >
                                    <TableCell className="text-slate-300 py-4 font-medium whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span>{entry.month}</span>
                                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                                                {entry.year}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-100 tabular-nums">
                                        {formatCurrency(entry.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`p-1.5 rounded-md ${
                                                    entry.type === "credit"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-rose-500/10 text-rose-500"
                                                }`}
                                            >
                                                {entry.type === "credit" ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                            </div>
                                            <span
                                                className={`text-xs font-bold uppercase tracking-tight ${
                                                    entry.type === "credit"
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
                                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border border-white/5 ${
                                                entry.category === "primary"
                                                    ? "bg-purple-500/10 text-purple-400"
                                                    : "bg-cyan-500/10 text-cyan-400"
                                            }`}
                                        >
                                            {entry.category === "primary"
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
                                                className={`h-7 w-fit min-w-[100px] px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border border-white/5 focus:ring-0 transition-all duration-300 ${
                                                    entry.status === "received"
                                                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {entry.status ===
                                                    "received" ? (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    ) : (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    <SelectValue placeholder="Status" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="glass border-white/10 bg-slate-900/90 text-white min-w-[120px]">
                                                <SelectItem
                                                    value="pending"
                                                    className="text-[10px] font-bold uppercase tracking-wider focus:bg-amber-500/20 focus:text-amber-400"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Pending</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem
                                                    value="received"
                                                    className="text-[10px] font-bold uppercase tracking-wider focus:bg-emerald-500/20 focus:text-emerald-400"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        <span>Received</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>

                                    <TableCell className="text-slate-400 max-w-[150px] truncate text-[13px]">
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
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
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
                                                disabled={
                                                    deletingId === entry.id
                                                }
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
