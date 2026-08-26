"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { IncomeEntry } from "@/types/income";
import { deleteIncome } from "@/lib/income-service";
import { formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Trash2,
    CheckCircle2,
    Clock,
    Pencil,
    ArrowDownLeft,
    Tag,
} from "lucide-react";
import { IncomeForm } from "./income-form";
import { cn } from "@/lib/utils";

interface IncomeTableProps {
    entries: IncomeEntry[];
    loading: boolean;
    onDelete: () => void;
    minimal?: boolean;
}

export function IncomeTable({
    entries,
    loading,
    onDelete,
    minimal = false,
}: IncomeTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredAndSortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const dateA = new Date(`${a.month} 1, ${a.year || new Date().getFullYear()}`);
            const dateB = new Date(`${b.month} 1, ${b.year || new Date().getFullYear()}`);
            return dateB.getTime() - dateA.getTime();
        });
    }, [entries]);

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        if (!user) return;

        setDeletingId(id);
        try {
            await deleteIncome(id, user.uid);
            toast({
                title: "Deleted",
                description: "Transaction entry removed successfully.",
            });
            onDelete();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete entry",
                variant: "destructive",
            });
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="py-12 text-center text-slate-500 text-xs">
                <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                No transactions found. Click &quot;Add Transaction&quot; to begin.
            </div>
        );
    }

    const displayEntries = filteredAndSortedEntries.slice(
        0,
        minimal ? 5 : undefined
    );

    if (minimal) {
        return (
            <div className="space-y-2.5">
                {displayEntries.map((entry) => {
                    const isReceived = entry.status === "received";
                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner",
                                        isReceived
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    )}
                                >
                                    {isReceived ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <Clock className="w-4 h-4" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-xs tracking-tight group-hover:text-purple-300 transition-colors line-clamp-1">
                                        {entry.description || entry.category}
                                    </p>
                                    <p className="text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5">
                                        <span>{entry.month} {entry.year || new Date().getFullYear()}</span>
                                        <span>•</span>
                                        <span className="capitalize">{entry.category}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-extrabold text-xs tracking-tight">
                                    {formatCurrency(entry.amount)}
                                </p>
                                <span
                                    className={cn(
                                        "text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                                        isReceived
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    )}
                                >
                                    {isReceived ? "Paid" : "Pending"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-slate-950/40 backdrop-blur-xl">
            <Table>
                <TableHeader className="bg-white/[0.04] border-b border-white/[0.08]">
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                            Source / Description
                        </TableHead>
                        <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                            Period
                        </TableHead>
                        <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider text-right">
                            Amount
                        </TableHead>
                        <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider text-center">
                            Status
                        </TableHead>
                        <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider text-right">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedEntries.map((entry) => {
                        const isReceived = entry.status === "received";
                        return (
                            <TableRow
                                key={entry.id}
                                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-purple-400">
                                            <Tag className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-xs">
                                                {entry.description || entry.category}
                                            </p>
                                            <p className="text-[10px] text-slate-400 capitalize">
                                                {entry.category} • {entry.type || "credit"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-300 font-medium">
                                    {entry.month} {entry.year || new Date().getFullYear()}
                                </TableCell>
                                <TableCell className="text-right font-bold text-white text-xs">
                                    {formatCurrency(entry.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                                            isReceived
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                        )}
                                    >
                                        {isReceived ? (
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                        ) : (
                                            <Clock className="w-2.5 h-2.5" />
                                        )}
                                        {isReceived ? "Paid" : "Pending"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <IncomeForm
                                            onSuccess={onDelete}
                                            defaultYear={entry.year || new Date().getFullYear()}
                                            initialData={entry}
                                            trigger={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                            onClick={() => handleDelete(entry.id)}
                                            disabled={deletingId === entry.id}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
