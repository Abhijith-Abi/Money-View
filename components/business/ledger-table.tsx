"use client";

import { LedgerEntry } from "@/types/customer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LedgerTableProps {
    entries: LedgerEntry[];
    loading?: boolean;
}

export function LedgerTable({ entries, loading }: LedgerTableProps) {
    return (
        <div className="rounded-xl border border-border/30 glass overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/30">
                            <TableHead className="font-bold">Date</TableHead>
                            <TableHead className="font-bold">
                                Description
                            </TableHead>
                            <TableHead className="font-bold text-center">
                                Type
                            </TableHead>
                            <TableHead className="font-bold text-right">
                                Credit (In)
                            </TableHead>
                            <TableHead className="font-bold text-right">
                                Debit (Out)
                            </TableHead>
                            <TableHead className="font-bold text-right">
                                Running Balance
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-24 text-center"
                                >
                                    Loading transactions...
                                </TableCell>
                            </TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No entries yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry, index) => (
                                <TableRow
                                    key={`${entry.transactionId}-${index}`}
                                    className="hover:bg-muted/30 border-border/10 transition-colors"
                                >
                                    <TableCell className="text-sm">
                                        {format(entry.date, "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {entry.description}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {entry.credit > 0 ? (
                                                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                                    <ArrowDownLeft className="h-4 w-4" />
                                                </div>
                                            ) : entry.debit > 0 ? (
                                                <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <Minus className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-400">
                                        {entry.credit > 0
                                            ? `+₹${entry.credit.toLocaleString("en-IN")}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right text-rose-400">
                                        {entry.debit > 0
                                            ? `-₹${entry.debit.toLocaleString("en-IN")}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        <span
                                            className={
                                                entry.balance > 0
                                                    ? "text-emerald-400"
                                                    : entry.balance < 0
                                                      ? "text-rose-400"
                                                      : ""
                                            }
                                        >
                                            ₹
                                            {Math.abs(
                                                entry.balance,
                                            ).toLocaleString("en-IN")}
                                            {entry.balance > 0
                                                ? " Dr"
                                                : entry.balance < 0
                                                  ? " Cr"
                                                  : ""}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        Loading transactions...
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        No entries yet.
                    </div>
                ) : (
                    <div className="divide-y divide-border/10">
                        {entries.map((entry, index) => (
                            <div
                                key={`${entry.transactionId}-${index}`}
                                className="p-4 active:bg-muted/30 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">
                                            {format(entry.date, "dd MMM yyyy")}
                                        </span>
                                        <span className="font-medium text-sm mt-0.5">
                                            {entry.description}
                                        </span>
                                    </div>
                                    {entry.credit > 0 ? (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-tight">
                                            <ArrowDownLeft className="h-3 w-3" />
                                            Credit
                                        </div>
                                    ) : entry.debit > 0 ? (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-tight">
                                            <ArrowUpRight className="h-3 w-3" />
                                            Debit
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                            Amount
                                        </p>
                                        <p
                                            className={cn(
                                                "font-bold text-base",
                                                entry.credit > 0
                                                    ? "text-emerald-400"
                                                    : "text-rose-400",
                                            )}
                                        >
                                            {entry.credit > 0 ? "+" : "-"}₹
                                            {Math.abs(
                                                entry.credit > 0
                                                    ? entry.credit
                                                    : entry.debit,
                                            ).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                            Balance
                                        </p>
                                        <p
                                            className={cn(
                                                "font-bold text-sm",
                                                entry.balance > 0
                                                    ? "text-emerald-400"
                                                    : entry.balance < 0
                                                      ? "text-rose-400"
                                                      : "",
                                            )}
                                        >
                                            ₹
                                            {Math.abs(
                                                entry.balance,
                                            ).toLocaleString("en-IN")}
                                            <span className="text-[10px] ml-0.5 uppercase">
                                                {entry.balance > 0
                                                    ? "Dr"
                                                    : entry.balance < 0
                                                      ? "Cr"
                                                      : ""}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
