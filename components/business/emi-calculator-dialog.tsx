"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Calculator,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    TrendingUp,
    Wallet,
    Percent,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import {
    calculateEMI,
    calculateEMISummary,
    calculateLoanTotals,
} from "@/lib/emi-helper";
import { EMIPlan, EMIPayment, InterestType } from "@/types/emi";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EMICalculatorDialogProps {
    trigger?: React.ReactNode;
    initialPrincipal?: number;
    initialRate?: number;
    initialTenure?: number;
}

export function EMICalculatorDialog({
    trigger,
    initialPrincipal = 100000,
    initialRate = 12,
    initialTenure = 12,
}: EMICalculatorDialogProps) {
    const [open, setOpen] = useState(false);
    const [principal, setPrincipal] = useState<number>(initialPrincipal);
    const [rate, setRate] = useState<number>(initialRate);
    const [tenure, setTenure] = useState<number>(initialTenure);
    const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");
    const [interestType, setInterestType] = useState<InterestType>("reducing");
    const [startDate, setStartDate] = useState<string>(
        format(new Date(), "yyyy-MM-dd")
    );

    // Track which months are marked as paid
    const [paidMonthIndices, setPaidMonthIndices] = useState<Set<number>>(
        new Set()
    );

    const effectiveTenureMonths = useMemo(() => {
        return tenureUnit === "years" ? tenure * 12 : tenure;
    }, [tenure, tenureUnit]);

    const emiPlan: EMIPlan = useMemo(() => {
        return {
            principal: Math.max(0, principal || 0),
            annualInterestRate: Math.max(0, rate || 0),
            tenureMonths: Math.max(1, effectiveTenureMonths || 1),
            startDate: new Date(startDate || new Date()),
            interestType,
        };
    }, [principal, rate, effectiveTenureMonths, startDate, interestType]);

    // Build EMIPayments array based on paidMonthIndices
    const payments: EMIPayment[] = useMemo(() => {
        const monthlyEMI = calculateEMI(
            emiPlan.principal,
            emiPlan.annualInterestRate,
            emiPlan.tenureMonths,
            emiPlan.interestType
        );

        return Array.from(paidMonthIndices).map((monthIndex) => ({
            id: `pay-${monthIndex}`,
            monthIndex,
            paymentDate: new Date(),
            amountPaid: monthlyEMI,
            status: "paid",
        }));
    }, [paidMonthIndices, emiPlan]);

    // Summary calculation
    const summary = useMemo(() => {
        return calculateEMISummary(emiPlan, payments, new Date());
    }, [emiPlan, payments]);

    const toggleMonthPaid = (monthIndex: number) => {
        setPaidMonthIndices((prev) => {
            const next = new Set(prev);
            if (next.has(monthIndex)) {
                next.delete(monthIndex);
            } else {
                next.add(monthIndex);
            }
            return next;
        });
    };

    const markAllPaid = () => {
        const allIndices = new Set<number>();
        for (let i = 1; i <= emiPlan.tenureMonths; i++) {
            allIndices.add(i);
        }
        setPaidMonthIndices(allIndices);
    };

    const resetPaid = () => {
        setPaidMonthIndices(new Set());
    };

    const downloadAmortizationPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("EMI Amortization & Repayment Schedule", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Principal: Rs. ${summary.totalPrincipal.toLocaleString()}`, 14, 28);
        doc.text(`Interest Rate: ${rate}% p.a. (${interestType})`, 14, 34);
        doc.text(`Tenure: ${effectiveTenureMonths} Months`, 14, 40);
        doc.text(`Monthly EMI: Rs. ${summary.monthlyEMI.toLocaleString()}`, 110, 28);
        doc.text(`Total Paid: Rs. ${summary.totalPaid.toLocaleString()} (${summary.paidMonthsCount} mos)`, 110, 34);
        doc.text(`Total Pending: Rs. ${summary.totalPending.toLocaleString()} (${summary.pendingMonthsCount} mos)`, 110, 40);

        autoTable(doc, {
            startY: 48,
            head: [["#", "Month / Year", "Due Date", "EMI Amount", "Principal", "Interest", "Balance", "Status"]],
            body: summary.schedule.map((row) => [
                row.monthIndex,
                row.monthName,
                format(row.dueDate, "dd-MMM-yyyy"),
                `Rs. ${row.emiAmount.toLocaleString()}`,
                `Rs. ${row.principalComponent.toLocaleString()}`,
                `Rs. ${row.interestComponent.toLocaleString()}`,
                `Rs. ${row.remainingBalance.toLocaleString()}`,
                row.status.toUpperCase(),
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [88, 28, 135] },
        });

        doc.save(`EMI_Schedule_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        className="glass border-purple-500/30 hover:bg-purple-500/10 text-purple-300 font-semibold gap-2"
                    >
                        <Calculator className="h-4 w-4 text-purple-400" />
                        EMI Helper
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass-gold border-white/10 max-w-4xl max-h-[92vh] overflow-y-auto p-0">
                <div className="p-6 md:p-8 space-y-6">
                    {/* Header */}
                    <DialogHeader className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    <Calculator className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                        EMI & Loan Calculator
                                        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400 text-xs md:text-sm">
                                        Automatic paid vs pending calculation with date-wise pending months tracking
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Input Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">
                                Principal (₹)
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
                                className="glass bg-black/40 border-white/10 text-white font-bold h-10"
                                placeholder="100000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">
                                Interest Rate (% p.a.)
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                                    className="glass bg-black/40 border-white/10 text-white font-bold h-10 pr-8"
                                    placeholder="12"
                                />
                                <Percent className="h-3.5 w-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">
                                    Tenure
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setTenureUnit(tenureUnit === "months" ? "years" : "months")}
                                    className="text-[10px] text-purple-400 hover:underline font-bold uppercase"
                                >
                                    In {tenureUnit === "months" ? "Years" : "Months"}
                                </button>
                            </div>
                            <Input
                                type="number"
                                min={1}
                                value={tenure}
                                onChange={(e) => setTenure(Number(e.target.value) || 1)}
                                className="glass bg-black/40 border-white/10 text-white font-bold h-10"
                                placeholder="12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">
                                Start Date
                            </Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="glass bg-black/40 border-white/10 text-white font-bold h-10"
                            />
                        </div>

                        <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs text-gray-400">
                            <div className="flex items-center gap-4">
                                <span className="font-bold">Method:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="interestType"
                                        checked={interestType === "reducing"}
                                        onChange={() => setInterestType("reducing")}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Reducing Balance</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="interestType"
                                        checked={interestType === "flat"}
                                        onChange={() => setInterestType("flat")}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Flat Rate</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={markAllPaid}
                                    className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark All Paid
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={resetPaid}
                                    className="h-7 text-xs text-gray-400 hover:bg-white/5"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* KPI Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                            <div className="flex items-center justify-between text-purple-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Monthly EMI</span>
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-black text-white">
                                ₹{summary.monthlyEMI.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                For {summary.totalMonths} total installments
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                            <div className="flex items-center justify-between text-emerald-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Total Paid</span>
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-black text-emerald-400">
                                ₹{summary.totalPaid.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {summary.paidMonthsCount} of {summary.totalMonths} months paid
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20">
                            <div className="flex items-center justify-between text-rose-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Total Pending</span>
                                <Wallet className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-black text-rose-400">
                                ₹{summary.totalPending.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {summary.pendingMonthsCount} pending months
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                            <div className="flex items-center justify-between text-amber-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Months</span>
                                <Clock className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-black text-amber-400">
                                {summary.overdueMonthsCount}{" "}
                                <span className="text-sm font-normal text-gray-400">months</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {summary.nextDueDate ? `Next: ${format(summary.nextDueDate, "dd MMM yyyy")}` : "Fully settled"}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">
                                Repayment Progress ({summary.paidPercentage}%)
                            </span>
                            <span className="text-white font-medium">
                                ₹{summary.totalPaid.toLocaleString("en-IN")} / ₹{summary.totalPayable.toLocaleString("en-IN")}
                            </span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-emerald-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${summary.paidPercentage}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                            <span>Principal: ₹{summary.totalPrincipal.toLocaleString("en-IN")}</span>
                            <span>Total Interest: ₹{summary.totalInterest.toLocaleString("en-IN")}</span>
                            <span>Total Payable: ₹{summary.totalPayable.toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    {/* Amortization Schedule Table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-bold text-white tracking-tight">
                                    Monthly Amortization Schedule
                                </h4>
                                <p className="text-xs text-gray-400">
                                    Click any row to toggle Paid / Pending status
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadAmortizationPDF}
                                className="glass border-white/10 h-8 text-xs font-bold gap-1.5"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export PDF
                            </Button>
                        </div>

                        <div className="rounded-xl border border-white/10 overflow-hidden glass max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 w-12 text-center">
                                            #
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400">
                                            Month / Year
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400">
                                            Due Date
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">
                                            EMI Amount
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">
                                            Principal
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">
                                            Interest
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">
                                            Remaining
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.schedule.map((row) => {
                                        const isPaid = row.status === "paid";
                                        const isOverdue = row.status === "overdue";

                                        return (
                                            <TableRow
                                                key={row.monthIndex}
                                                onClick={() => toggleMonthPaid(row.monthIndex)}
                                                className={cn(
                                                    "border-white/5 cursor-pointer transition-colors",
                                                    isPaid
                                                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                                                        : isOverdue
                                                          ? "bg-rose-500/5 hover:bg-rose-500/10"
                                                          : "hover:bg-white/5"
                                                )}
                                            >
                                                <TableCell className="text-center font-bold text-xs text-gray-400">
                                                    {row.monthIndex}
                                                </TableCell>
                                                <TableCell className="font-semibold text-xs text-white">
                                                    {row.monthName}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-400">
                                                    {format(row.dueDate, "dd MMM yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-xs text-white">
                                                    ₹{row.emiAmount.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-emerald-400/80">
                                                    ₹{row.principalComponent.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-amber-400/80">
                                                    ₹{row.interestComponent.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-xs text-gray-300">
                                                    ₹{row.remainingBalance.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider border-none",
                                                            isPaid
                                                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                                : isOverdue
                                                                  ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                                                  : "bg-white/10 text-gray-400 hover:bg-white/20"
                                                        )}
                                                    >
                                                        {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
