"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Download,
    FileText,
    Calendar,
    CalendarIcon,
    PieChart,
    TrendingUp,
    Wallet,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
    generateDailyReport,
    generateMonthlyReport,
    generateRangeReport,
    getPendingSummary,
    exportToPDF,
} from "@/lib/report-service";
import { DailyReport, MonthlyReport } from "@/types/customer";
import { BusinessLoader } from "./business-loader";
import { format, startOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ReportsView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dailySummary, setDailySummary] = useState<DailyReport | null>(null);
    const [monthlySummary, setMonthlySummary] = useState<MonthlyReport | null>(
        null,
    );
    const [pendingSummary, setPendingSummary] = useState({
        totalPending: 0,
        totalPayables: 0,
    });

    // Custom report state
    const [startDate, setStartDate] = useState<Date | undefined>(
        startOfMonth(new Date()),
    );
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [generating, setGenerating] = useState(false);
    const [customReportData, setCustomReportData] =
        useState<MonthlyReport | null>(null);

    const handleGenerateCustomReport = async () => {
        if (!user || !startDate || !endDate) {
            toast({
                title: "Missing dates",
                description: "Please select both start and end dates.",
                variant: "destructive",
            });
            return;
        }

        setGenerating(true);
        try {
            // Set end date to end of day for proper search
            const rangeEndDate = new Date(endDate);
            rangeEndDate.setHours(23, 59, 59, 999);

            const rangeStartDate = new Date(startDate);
            rangeStartDate.setHours(0, 0, 0, 0);

            const report = await generateRangeReport(
                user.uid,
                rangeStartDate,
                rangeEndDate,
            );

            setCustomReportData(report);
            toast({
                title: "Report Generated",
                description: `Showing report from ${format(rangeStartDate, "dd MMM")} to ${format(rangeEndDate, "dd MMM yyyy")}`,
            });
        } catch (error) {
            console.error("Error generating custom report:", error);
            toast({
                title: "Error",
                description: "Failed to generate custom report",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        async function fetchInitialData() {
            if (!user) return;
            setLoading(true);
            try {
                const now = new Date();
                const [daily, monthly, pending] = await Promise.all([
                    generateDailyReport(user.uid, now),
                    generateMonthlyReport(
                        user.uid,
                        now.getMonth(),
                        now.getFullYear(),
                    ),
                    getPendingSummary(user.uid),
                ]);
                setDailySummary(daily);
                setMonthlySummary(monthly);
                setPendingSummary(pending);
            } catch (error) {
                console.error("Error fetching report data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load report data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [user, toast]);

    const handleDownloadReport = async (type: "daily" | "monthly") => {
        if (!user) return;
        try {
            if (type === "daily" && dailySummary) {
                await exportToPDF(
                    `Daily Report - ${format(dailySummary.date, "PPP")}`,
                    [
                        {
                            label: "Total Received (Credit)",
                            value: `₹${dailySummary.totalCredits.toFixed(2)}`,
                        },
                        {
                            label: "Total Sales/Due (Debit)",
                            value: `₹${dailySummary.totalDebits.toFixed(2)}`,
                        },
                        {
                            label: "Net Amount",
                            value: `₹${dailySummary.netAmount.toFixed(2)}`,
                        },
                        {
                            label: "Transactions",
                            value: dailySummary.transactionCount.toString(),
                        },
                    ],
                    dailySummary.transactions.map((t) => ({
                        ...t,
                        dateText: format(new Date(t.date), "HH:mm"),
                        amountText: `₹${t.amount.toFixed(2)}`,
                    })),
                    [
                        { header: "Time", dataKey: "dateText" },
                        { header: "Customer", dataKey: "customerName" },
                        { header: "Type", dataKey: "type" },
                        { header: "Amount", dataKey: "amountText" },
                        { header: "Method", dataKey: "paymentMethod" },
                        { header: "Description", dataKey: "description" },
                    ],
                    user.uid,
                );
            } else if (type === "monthly" && monthlySummary) {
                await exportToPDF(
                    `Monthly Report - ${monthlySummary.month} ${monthlySummary.year}`,
                    [
                        {
                            label: "Total Received",
                            value: `₹${monthlySummary.totalCredits.toFixed(2)}`,
                        },
                        {
                            label: "Total Sales/Due",
                            value: `₹${monthlySummary.totalDebits.toFixed(2)}`,
                        },
                        {
                            label: "Net Amount",
                            value: `₹${monthlySummary.netAmount.toFixed(2)}`,
                        },
                        {
                            label: "Total Transactions",
                            value: monthlySummary.transactionCount.toString(),
                        },
                    ],
                    monthlySummary.customerBreakdown.map((c) => ({
                        ...c,
                        creditsText: `₹${c.credits.toFixed(2)}`,
                        debitsText: `₹${c.debits.toFixed(2)}`,
                        balanceText: `₹${c.balance.toFixed(2)}`,
                    })),
                    [
                        { header: "Customer", dataKey: "customerName" },
                        { header: "Total Received", dataKey: "creditsText" },
                        { header: "Total Due", dataKey: "debitsText" },
                        { header: "Net Balance", dataKey: "balanceText" },
                    ],
                    user.uid,
                );
            }
            toast({
                title: "Success",
                description: "Report downloaded successfully",
            });
        } catch (error) {
            console.error("Error downloading report:", error);
            toast({
                title: "Error",
                description: "Failed to download PDF",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <BusinessLoader />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="glass border-border/50 group hover:border-emerald-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 relative">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground/60 tracking-wider uppercase flex items-center justify-between">
                            Daily Summary
                            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                                <TrendingUp className="h-3.5 w-3.5" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-3xl font-bold tracking-tight text-emerald-400 drop-shadow-sm">
                                    ₹
                                    {dailySummary?.totalCredits.toLocaleString() ||
                                        "0.00"}
                                </span>
                                <p className="text-[10px] text-muted-foreground/50 font-medium">
                                    {dailySummary?.transactionCount || 0}{" "}
                                    collections today
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 rounded-xl hover:bg-emerald-500/10 text-emerald-400/50 hover:text-emerald-400 transition-all active:scale-90"
                                onClick={() => handleDownloadReport("daily")}
                                title="Download daily statement"
                            >
                                <Download className="h-4.5 w-4.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-border/50 group hover:border-purple-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 relative">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground/60 tracking-wider uppercase flex items-center justify-between">
                            Monthly Summary
                            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-500">
                                <Calendar className="h-3.5 w-3.5" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-3xl font-bold tracking-tight text-purple-400 drop-shadow-sm">
                                    ₹
                                    {monthlySummary?.totalCredits.toLocaleString() ||
                                        "0.00"}
                                </span>
                                <p className="text-[10px] text-muted-foreground/50 font-medium">
                                    Total for{" "}
                                    {monthlySummary?.month || "this month"}
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 rounded-xl hover:bg-purple-500/10 text-purple-400/50 hover:text-purple-400 transition-all active:scale-90"
                                onClick={() => handleDownloadReport("monthly")}
                                title="Download monthly statement"
                            >
                                <Download className="h-4.5 w-4.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-border/50 group hover:border-rose-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 relative">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground/60 tracking-wider uppercase flex items-center justify-between">
                            Outstandings
                            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform duration-500">
                                <Wallet className="h-3.5 w-3.5" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-3xl font-bold tracking-tight text-rose-400 drop-shadow-sm">
                                    ₹
                                    {pendingSummary.totalPending.toLocaleString() ||
                                        "0.00"}
                                </span>
                                <p className="text-[10px] text-muted-foreground/50 font-medium">
                                    Total collection due
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-rose-400/50 hover:text-rose-400 transition-all active:scale-90"
                            >
                                <Download className="h-4.5 w-4.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-border/50 overflow-hidden shadow-2xl shadow-purple-500/5">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/30 bg-muted/5 gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                            <PieChart className="h-5 w-5 text-purple-400" />
                            Custom Statement
                        </CardTitle>
                        <p className="text-xs text-muted-foreground/70">
                            Generate detailed reports for specific date ranges
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-1 bg-muted/30 rounded-lg border border-border/40">
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        size="sm"
                                        className={cn(
                                            "flex-1 sm:w-[140px] justify-start text-left font-normal hover:bg-white/5 h-8",
                                            !startDate &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-purple-400" />
                                        <span className="truncate">
                                            {startDate
                                                ? format(startDate, "dd MMM yy")
                                                : "From"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 glass border-white/10"
                                    align="end"
                                >
                                    <CalendarComponent
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <div className="hidden sm:block w-px h-4 bg-white/10" />

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        size="sm"
                                        className={cn(
                                            "flex-1 sm:w-[140px] justify-start text-left font-normal hover:bg-white/5 h-8",
                                            !endDate && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-purple-400" />
                                        <span className="truncate">
                                            {endDate
                                                ? format(endDate, "dd MMM yy")
                                                : "To"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 glass border-white/10"
                                    align="end"
                                >
                                    <CalendarComponent
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="sm"
                            disabled={generating}
                            onClick={handleGenerateCustomReport}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-500/30 px-4 h-8 transition-all active:scale-95 w-full sm:w-auto"
                        >
                            {generating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                            ) : (
                                <TrendingUp className="h-3.5 w-3.5 mr-2" />
                            )}
                            {generating ? "Loading..." : "Generate"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {customReportData ? (
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                        Total Received
                                    </p>
                                    <p className="text-xl font-bold text-emerald-400">
                                        ₹
                                        {customReportData.totalCredits.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                        Total Sales/Due
                                    </p>
                                    <p className="text-xl font-bold text-rose-400">
                                        ₹
                                        {customReportData.totalDebits.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/5 overflow-hidden">
                                <div className="hidden sm:block">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5">
                                                <TableHead className="h-8 text-[10px] font-bold uppercase">
                                                    Customer
                                                </TableHead>
                                                <TableHead className="h-8 text-[10px] font-bold uppercase text-right">
                                                    Net Balance
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customReportData.customerBreakdown
                                                .slice(0, 5)
                                                .map((c) => (
                                                    <TableRow
                                                        key={c.customerId}
                                                        className="border-white/5"
                                                    >
                                                        <TableCell className="py-2 text-xs font-medium">
                                                            {c.customerName}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-xs text-right font-bold">
                                                            <span
                                                                className={
                                                                    c.balance >=
                                                                    0
                                                                        ? "text-emerald-400"
                                                                        : "text-rose-400"
                                                                }
                                                            >
                                                                ₹
                                                                {Math.abs(
                                                                    c.balance,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="sm:hidden divide-y divide-white/5">
                                    {customReportData.customerBreakdown
                                        .slice(0, 5)
                                        .map((c) => (
                                            <div
                                                key={c.customerId}
                                                className="p-3 flex justify-between items-center bg-white/5"
                                            >
                                                <span className="text-sm font-medium">
                                                    {c.customerName}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-sm font-bold",
                                                        c.balance >= 0
                                                            ? "text-emerald-400"
                                                            : "text-rose-400",
                                                    )}
                                                >
                                                    ₹
                                                    {Math.abs(
                                                        c.balance,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full glass text-[11px] h-8 font-bold uppercase tracking-wider"
                                onClick={() => handleDownloadReport("monthly")}
                            >
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Download Full Statement
                            </Button>
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-b from-transparent to-white/[0.01]">
                            <div className="relative mb-4">
                                <FileText className="h-12 w-12 opacity-10 text-purple-400" />
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full opacity-20" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground/60">
                                Select a date range to begin
                            </p>
                            <p className="text-[10px] mt-1 text-muted-foreground/40 uppercase tracking-widest font-bold">
                                Advanced reporting engine
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="glass border-border/50 overflow-hidden shadow-2xl shadow-emerald-500/5">
                <CardHeader className="bg-muted/5 border-b border-border/30 py-4">
                    <CardTitle className="text-base flex items-center gap-2 font-semibold">
                        <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                        Monthly Performance Breakdown
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold mt-0.5">
                        Daily ledger summary for {monthlySummary?.month}{" "}
                        {monthlySummary?.year}
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {/* Desktop Performance View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/30 bg-muted/20 hover:bg-muted/20">
                                        <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">
                                            Date
                                        </TableHead>
                                        <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-emerald-400/70">
                                            Received
                                        </TableHead>
                                        <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-rose-400/70">
                                            Due (Sales)
                                        </TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlySummary?.dailyBreakdown &&
                                    monthlySummary.dailyBreakdown.length > 0 ? (
                                        monthlySummary.dailyBreakdown.map(
                                            (day) => (
                                                <TableRow
                                                    key={day.date}
                                                    className="border-white/5 hover:bg-white/[0.03] transition-colors group"
                                                >
                                                    <TableCell className="py-4 px-6 font-medium text-sm">
                                                        <div className="flex flex-col">
                                                            <span>
                                                                {format(
                                                                    new Date(
                                                                        day.date,
                                                                    ),
                                                                    "dd MMM yyyy",
                                                                )}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground/40">
                                                                {format(
                                                                    new Date(
                                                                        day.date,
                                                                    ),
                                                                    "EEEE",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <span className="text-sm font-semibold text-emerald-400/90 leading-none">
                                                            ₹
                                                            {day.credits.toLocaleString(
                                                                "en-IN",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <span className="text-sm font-semibold text-rose-400/90 leading-none">
                                                            ₹
                                                            {day.debits.toLocaleString(
                                                                "en-IN",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div
                                                            className={cn(
                                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border",
                                                                day.net >= 0
                                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                                            )}
                                                        >
                                                            ₹
                                                            {Math.abs(
                                                                day.net,
                                                            ).toLocaleString(
                                                                "en-IN",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                            {day.net >= 0
                                                                ? " +"
                                                                : " -"}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="h-48 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                                    <AlertCircle className="h-8 w-8" />
                                                    <p className="text-sm font-medium italic">
                                                        No ledger activity
                                                        recorded for this period
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Performance View */}
                        <div className="md:hidden divide-y divide-border/10">
                            {monthlySummary?.dailyBreakdown &&
                            monthlySummary.dailyBreakdown.length > 0 ? (
                                monthlySummary.dailyBreakdown.map((day) => (
                                    <div
                                        key={day.date}
                                        className="p-4 bg-muted/5"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-bold">
                                                    {format(
                                                        new Date(day.date),
                                                        "dd MMM yyyy",
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(
                                                        new Date(day.date),
                                                        "EEEE",
                                                    )}
                                                </span>
                                            </div>
                                            <div
                                                className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border",
                                                    day.net >= 0
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                                )}
                                            >
                                                ₹
                                                {Math.abs(
                                                    day.net,
                                                ).toLocaleString("en-IN")}
                                                {day.net >= 0 ? " +" : " -"}
                                            </div>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                                                    Received
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-400/90 leading-none">
                                                    ₹
                                                    {day.credits.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                                                    Due (Sales)
                                                </p>
                                                <p className="text-sm font-semibold text-rose-400/90 leading-none">
                                                    ₹
                                                    {day.debits.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2 opacity-30 h-40">
                                    <AlertCircle className="h-8 w-8" />
                                    <p className="text-sm">
                                        No activity recorded for this period
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
