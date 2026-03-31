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
    minimal?: boolean;
}

export function IncomeTable({ entries, loading, onDelete, minimal = false }: IncomeTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredAndSortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const dateA = new Date(`${a.month} 1, ${a.year || 2024}`);
            const dateB = new Date(`${b.month} 1, ${b.year || 2024}`);
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
                title: "Success!",
                description: "Entry deleted",
                duration: 1000,
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
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 glass rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    const displayEntries = filteredAndSortedEntries.slice(0, minimal ? 5 : undefined);

    if (minimal) {
        return (
            <div className="space-y-4">
                {displayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center text-primary border border-white/5 shadow-lg group-hover:shadow-primary/20 transition-all font-bold">
                                {entry.month.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm tracking-tight">{entry.description || entry.category}</p>
                                <p className="text-gray-500 text-xs">{entry.month} {entry.year || 2024}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-bold text-sm">{formatCurrency(entry.amount)}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${entry.status === 'received' ? 'text-primary' : 'text-gray-500'}`}>
                                {entry.status}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Full table implementation with updated styling
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Transaction</TableHead>
                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-widest text-right">Amount</TableHead>
                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-widest text-center">Status</TableHead>
                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedEntries.map((entry) => (
                        <TableRow key={entry.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-primary text-xs font-bold border border-white/5/10">
                                        {entry.month.slice(0, 2)}
                                    </div>
                                    <span className="text-white font-medium text-sm">{entry.description || entry.category}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-white text-sm">
                                {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                                <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                    entry.status === 'received' 
                                    ? 'bg-primary/20 text-primary border border-primary/20' 
                                    : 'bg-white/5 text-gray-500 border border-white/10'
                                }`}>
                                    {entry.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <IncomeForm
                                        onSuccess={onDelete}
                                        defaultYear={entry.year || 2024}
                                        initialData={entry}
                                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white"><Pencil className="h-4 w-4" /></Button>}
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-rose-500" 
                                        onClick={() => handleDelete(entry.id)}
                                        disabled={deletingId === entry.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
