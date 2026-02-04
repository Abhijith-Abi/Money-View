"use client";

import { useState, useEffect } from "react";
import { Customer, LedgerEntry } from "@/types/customer";
import { getLedgerEntries } from "@/lib/ledger-service";
import { LedgerTable } from "./ledger-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Plus,
    Download,
    Phone,
    Mail,
    MapPin,
    Loader2,
} from "lucide-react";
import { TransactionForm } from "./transaction-form";
import { useAuth } from "@/lib/auth-context";
import { exportToPDF } from "@/lib/report-service";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CustomerDetailProps {
    customer: Customer;
    onBack: () => void;
}

export function CustomerDetail({ customer, onBack }: CustomerDetailProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);

    async function fetchLedger() {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getLedgerEntries(customer.id, user.uid);
            setEntries(data);
        } catch (error) {
            console.error("Error fetching ledger:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadPDF = async () => {
        if (!user || entries.length === 0) {
            toast({
                title: "No data",
                description: "There are no transactions to export.",
                variant: "destructive",
            });
            return;
        }

        setDownloading(true);
        try {
            const balanceLabel =
                customer.currentBalance > 0
                    ? "Amount Receivable"
                    : "Amount Payable";
            const balanceValue = `₹${Math.abs(customer.currentBalance).toFixed(2)}`;

            await exportToPDF(
                `Ledger Statement - ${customer.name}`,
                [
                    { label: "Customer Name", value: customer.name },
                    { label: "Contact", value: customer.phone },
                    { label: balanceLabel, value: balanceValue },
                    {
                        label: "Total Transactions",
                        value: entries.length.toString(),
                    },
                ],
                entries.map((entry) => {
                    const amount =
                        entry.credit > 0 ? entry.credit : entry.debit;
                    const type = entry.credit > 0 ? "Cr" : "Dr";
                    return {
                        ...entry,
                        dateText: format(new Date(entry.date), "dd MMM yyyy"),
                        amountText: `₹${amount.toFixed(2)} (${type})`,
                    };
                }),
                [
                    { header: "Date", dataKey: "dateText" },
                    { header: "Type", dataKey: "type" },
                    { header: "Method", dataKey: "paymentMethod" },
                    { header: "Amount", dataKey: "amountText" },
                    { header: "Description", dataKey: "description" },
                ],
                user.uid,
            );

            toast({
                title: "Success",
                description: "Ledger PDF downloaded successfully",
            });
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast({
                title: "Error",
                description: "Failed to generate PDF",
                variant: "destructive",
            });
        } finally {
            setDownloading(true);
            // Simulate short delay for UI feedback
            setTimeout(() => setDownloading(false), 500);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [customer, user]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="hover:bg-muted/50 self-start -ml-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="glass flex-1 sm:flex-none h-9 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        onClick={handleDownloadPDF}
                        disabled={downloading || loading}
                    >
                        {downloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloading ? "Generating..." : "Download Statement"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowTransactionForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none h-9 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass border-border/50 lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">
                            {customer.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Phone className="h-4 w-4 text-purple-400" />
                            </div>
                            <span className="font-medium">
                                {customer.phone}
                            </span>
                        </div>
                        {customer.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-emerald-400" />
                                </div>
                                <span className="font-medium line-clamp-1">
                                    {customer.email}
                                </span>
                            </div>
                        )}
                        {customer.address && (
                            <div className="flex items-start gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                                    <MapPin className="h-4 w-4 text-cyan-400" />
                                </div>
                                <span className="font-medium pt-1">
                                    {customer.address}
                                </span>
                            </div>
                        )}
                        <div className="pt-6 border-t border-border/10 mt-6 bg-white/[0.02] -mx-6 px-6 py-4 rounded-b-xl">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                                Net Financial Position
                            </p>
                            <p
                                className={cn(
                                    "text-3xl font-black tracking-tight",
                                    customer.currentBalance > 0
                                        ? "text-emerald-400"
                                        : customer.currentBalance < 0
                                          ? "text-rose-400"
                                          : "text-muted-foreground",
                                )}
                            >
                                ₹
                                {Math.abs(
                                    customer.currentBalance,
                                ).toLocaleString("en-IN")}
                                <span className="text-xs ml-1 uppercase font-bold text-muted-foreground">
                                    {customer.currentBalance > 0
                                        ? "Dr"
                                        : customer.currentBalance < 0
                                          ? "Cr"
                                          : ""}
                                </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 italic">
                                {customer.currentBalance > 0
                                    ? "Customer owes you this amount"
                                    : customer.currentBalance < 0
                                      ? "You owe this amount to customer"
                                      : "Accounts are currently settled"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <Card className="glass border-border/50 h-full overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/10">
                            <CardTitle className="text-base font-bold uppercase tracking-wider text-muted-foreground/70">
                                Ledger Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <LedgerTable entries={entries} loading={loading} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TransactionForm
                customerId={customer.id}
                open={showTransactionForm}
                onOpenChange={setShowTransactionForm}
                onSuccess={() => {
                    fetchLedger();
                }}
            />
        </motion.div>
    );
}
