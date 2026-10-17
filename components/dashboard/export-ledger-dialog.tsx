"use client";

import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { IncomeEntry, MonthlyStats } from "@/types/income";
import { Company } from "@/types/company";
import { MONTHS, formatCurrency } from "@/lib/utils";
import {
    exportYearlyLedgerPDF,
    ReportTypeScope,
} from "@/lib/pdf-export-service";
import {
    Download,
    FileSpreadsheet,
    FileText,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    Building2,
    Filter,
    Check,
    Loader2,
    Sparkles,
    Calendar,
    Layers,
    AlertCircle,
} from "lucide-react";

interface ExportLedgerDialogProps {
    allEntries: IncomeEntry[];
    activeFilteredEntries?: IncomeEntry[];
    companies?: Company[];
    monthlyStats?: MonthlyStats[];
    selectedYear?: number | "all";
    user?: { displayName?: string | null; email?: string | null } | null;
    trigger?: React.ReactNode;
    defaultReportType?: ReportTypeScope;
}

export function ExportLedgerDialog({
    allEntries,
    activeFilteredEntries,
    companies = [],
    monthlyStats = [],
    selectedYear = new Date().getFullYear(),
    user,
    trigger,
    defaultReportType = "complete",
}: ExportLedgerDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Selected report type
    const [reportType, setReportType] = useState<ReportTypeScope>(defaultReportType);

    // Filters inside modal
    const [yearScope, setYearScope] = useState<string>(
        selectedYear === "all" ? "all" : selectedYear.toString()
    );
    const [monthScope, setMonthScope] = useState<string>("all");
    const [companyScope, setCompanyScope] = useState<string>("all");

    // Section inclusion toggles
    const [includeKPIs, setIncludeKPIs] = useState(true);
    const [includeMonthlyBreakdown, setIncludeMonthlyBreakdown] = useState(true);
    const [includeCompanyBreakdown, setIncludeCompanyBreakdown] = useState(false);
    const [includeTransactionLedger, setIncludeTransactionLedger] = useState(true);

    // Distinct years available in dataset
    const availableYears = useMemo(() => {
        const yearsSet = new Set<number>();
        allEntries.forEach((e) => {
            if (e.year) yearsSet.add(e.year);
        });
        if (typeof selectedYear === "number") yearsSet.add(selectedYear);
        const list = Array.from(yearsSet).sort((a, b) => b - a);
        return list.length > 0 ? list : [new Date().getFullYear()];
    }, [allEntries, selectedYear]);

    // Unified list of companies
    const companyOptions = useMemo(() => {
        const map = new Map<string, string>();
        companies.forEach((c) => {
            if (c.id && c.name) map.set(c.id, c.name);
        });
        allEntries.forEach((e) => {
            if (e.companyName && !map.has(e.companyId || e.companyName)) {
                map.set(e.companyId || e.companyName, e.companyName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [companies, allEntries]);

    // Check if current filtered entries differs from all entries
    const hasActiveFilterView = useMemo(() => {
        if (!activeFilteredEntries) return false;
        return activeFilteredEntries.length !== allEntries.length;
    }, [activeFilteredEntries, allEntries]);

    // Compute filtered dataset matching current dialog choices
    const filteredEntries = useMemo(() => {
        let list =
            reportType === "custom_view" && activeFilteredEntries
                ? [...activeFilteredEntries]
                : [...allEntries];

        // 1. Filter by report type scope
        if (reportType === "income_only") {
            list = list.filter((e) => e.type === "credit");
        } else if (reportType === "received_only") {
            list = list.filter((e) => e.type === "credit" && e.status === "received");
        } else if (reportType === "pending_dues") {
            list = list.filter((e) => e.type === "credit" && e.status === "pending");
        } else if (reportType === "expenses_only") {
            list = list.filter((e) => e.type === "debit");
        } else if (reportType === "company_statement") {
            if (companyScope !== "all") {
                list = list.filter(
                    (e) =>
                        (e.companyId && e.companyId === companyScope) ||
                        (e.companyName &&
                            e.companyName.toLowerCase() ===
                                companyOptions
                                    .find((c) => c.id === companyScope)
                                    ?.name.toLowerCase())
                );
            }
        }

        // 2. Filter by Year
        if (reportType !== "custom_view" && yearScope !== "all") {
            const yrNum = Number(yearScope);
            list = list.filter((e) => e.year === yrNum);
        }

        // 3. Filter by Month
        if (reportType !== "custom_view" && monthScope !== "all") {
            list = list.filter((e) => e.month === monthScope);
        }

        // 4. Filter by Company (for non-company_statement or specific drilldown)
        if (reportType !== "company_statement" && companyScope !== "all") {
            list = list.filter(
                (e) =>
                    (e.companyId && e.companyId === companyScope) ||
                    (e.companyName &&
                        e.companyName.toLowerCase() ===
                            companyOptions
                                .find((c) => c.id === companyScope)
                                ?.name.toLowerCase())
            );
        }

        return list;
    }, [
        reportType,
        yearScope,
        monthScope,
        companyScope,
        allEntries,
        activeFilteredEntries,
        companyOptions,
    ]);

    // Financial calculations for the selected scope
    const totalCredits = useMemo(
        () =>
            filteredEntries
                .filter((e) => e.type === "credit")
                .reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [filteredEntries]
    );

    const totalDebits = useMemo(
        () =>
            filteredEntries
                .filter((e) => e.type === "debit")
                .reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [filteredEntries]
    );

    const totalPending = useMemo(
        () =>
            filteredEntries
                .filter((e) => e.type === "credit" && e.status === "pending")
                .reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [filteredEntries]
    );

    const totalReceived = useMemo(
        () =>
            filteredEntries
                .filter((e) => e.type === "credit" && e.status === "received")
                .reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [filteredEntries]
    );

    const netAmount = totalCredits - totalDebits;

    // Report Type Definitions
    const reportOptions: {
        id: ReportTypeScope;
        title: string;
        desc: string;
        badgeText: string;
        icon: React.ComponentType<{ className?: string }>;
        colorClasses: string;
        accentBorder: string;
    }[] = [
        {
            id: "complete",
            title: "Complete Financial Ledger",
            desc: "Full comprehensive audit of all inflows, outflows, and net position.",
            badgeText: "All Records",
            icon: FileSpreadsheet,
            colorClasses: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
            accentBorder: "hover:border-indigo-500/50 data-[state=active]:border-indigo-500",
        },
        {
            id: "income_only",
            title: "Cash Inflow & Income",
            desc: "Primary and secondary earnings statements, both received and pending.",
            badgeText: "Credits Only",
            icon: ArrowDownLeft,
            colorClasses: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            accentBorder: "hover:border-emerald-500/50 data-[state=active]:border-emerald-500",
        },
        {
            id: "pending_dues",
            title: "Pending Collections & Dues",
            desc: "Outstanding receivables (Kadamm koduthu tharan ullath) awaiting collection.",
            badgeText: "Due Only",
            icon: Clock,
            colorClasses: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            accentBorder: "hover:border-amber-500/50 data-[state=active]:border-amber-500",
        },
        {
            id: "received_only",
            title: "Settled / Realized Revenue",
            desc: "Cleared revenue already collected and credited to bank or cash.",
            badgeText: "Received",
            icon: CheckCircle2,
            colorClasses: "bg-teal-500/10 text-teal-500 border-teal-500/20",
            accentBorder: "hover:border-teal-500/50 data-[state=active]:border-teal-500",
        },
        {
            id: "expenses_only",
            title: "Expenditure & Debits",
            desc: "Business expenses, payouts, and cash outflow transaction breakdown.",
            badgeText: "Debits Only",
            icon: ArrowUpRight,
            colorClasses: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            accentBorder: "hover:border-rose-500/50 data-[state=active]:border-rose-500",
        },
        {
            id: "company_statement",
            title: "Client / Company Audit",
            desc: "Dedicated financial reconciliation statement for a specific client.",
            badgeText: "Client Audit",
            icon: Building2,
            colorClasses: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            accentBorder: "hover:border-blue-500/50 data-[state=active]:border-blue-500",
        },
    ];

    if (hasActiveFilterView) {
        reportOptions.push({
            id: "custom_view",
            title: "Current Filtered View",
            desc: `Export only the ${activeFilteredEntries?.length} records currently visible in the active table.`,
            badgeText: "Custom Filter",
            icon: Filter,
            colorClasses: "bg-violet-500/10 text-violet-500 border-violet-500/20",
            accentBorder: "hover:border-violet-500/50 data-[state=active]:border-violet-500",
        });
    }

    // Dynamic Report Type Title
    const selectedReportConfig = reportOptions.find((r) => r.id === reportType) || reportOptions[0];
    const selectedCompanyObj = companyOptions.find((c) => c.id === companyScope);

    const handleExecuteExport = () => {
        if (filteredEntries.length === 0) {
            toast({
                title: "No records to export",
                description: "Please adjust your report type or filters as 0 transactions were found.",
                variant: "destructive",
            });
            return;
        }

        setDownloading(true);
        try {
            const filterNotice = [
                `Type: ${selectedReportConfig.title}`,
                yearScope === "all" ? "Period: All Years" : `Year: ${yearScope}`,
                monthScope !== "all" ? `Month: ${monthScope}` : null,
                companyScope !== "all" ? `Client: ${selectedCompanyObj?.name || companyScope}` : null,
            ]
                .filter(Boolean)
                .join(" • ");

            exportYearlyLedgerPDF({
                reportType,
                year: yearScope === "all" ? "all" : Number(yearScope),
                month: monthScope,
                selectedCompanyId: companyScope,
                selectedCompanyName: selectedCompanyObj?.name,
                userName: user?.displayName || "Account Holder",
                userEmail: user?.email || "",
                entries: filteredEntries,
                allCompanies: companies,
                monthlyStats,
                filterDescription: filterNotice,
                includeKPISummary: includeKPIs,
                includeMonthlyBreakdown: includeMonthlyBreakdown && yearScope !== "all",
                includeCompanyBreakdown: includeCompanyBreakdown,
                includeTransactionLedger: includeTransactionLedger,
            });

            toast({
                title: "PDF Statement Downloaded",
                description: `${selectedReportConfig.title} exported with ${filteredEntries.length} transactions.`,
            });

            setOpen(false);
        } catch (error) {
            console.error("Export failed:", error);
            toast({
                title: "Export Failed",
                description: "Failed to generate PDF statement. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="glass border-border/80 hover:bg-primary/10 text-foreground font-semibold text-xs h-9 gap-1.5 shadow-sm"
                        title="Download Audited Statement as PDF"
                    >
                        <Download className="h-3.5 w-3.5 text-primary" />
                        <span>Download PDF</span>
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl glass border-border/80 shadow-2xl">
                {/* Header Banner */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                    Export Financial Statement & Ledger
                                    <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40 text-[10px] font-semibold py-0.5 px-2">
                                        Executive PDF
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                                    Choose what statement type you need. The PDF will be custom-generated with executive styling.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 1. Report Type Selection Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                1. What type of report do you need?
                            </label>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Select statement scope
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {reportOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = reportType === opt.id;

                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setReportType(opt.id);
                                            if (opt.id === "company_statement" && companyScope === "all") {
                                                if (companyOptions.length > 0) {
                                                    setCompanyScope(companyOptions[0].id);
                                                }
                                            }
                                        }}
                                        className={`group relative text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                            isSelected
                                                ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
                                                : "glass border-border/80 hover:bg-muted/50 hover:border-border"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div
                                                className={`p-2 rounded-lg border ${opt.colorClasses} shrink-0 transition-transform group-hover:scale-105`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {opt.badgeText}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                                {opt.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                                                {opt.desc}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-primary-foreground">
                                                <Check className="h-2.5 w-2.5" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Scope & Period Filters */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            2. Timeframe & Filter Scope
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Year Selector */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Year / Annual Period
                                </span>
                                <Select value={yearScope} onValueChange={setYearScope}>
                                    <SelectTrigger className="h-9 text-xs glass border-border/80 rounded-xl">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="glass bg-popover/95 border-border">
                                        <SelectItem value="all" className="text-xs font-semibold">
                                            🌐 All Recorded Years
                                        </SelectItem>
                                        {availableYears.map((yr) => (
                                            <SelectItem
                                                key={yr}
                                                value={yr.toString()}
                                                className="text-xs font-semibold"
                                            >
                                                📅 Year {yr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Month Selector */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Month (Optional)
                                </span>
                                <Select value={monthScope} onValueChange={setMonthScope}>
                                    <SelectTrigger className="h-9 text-xs glass border-border/80 rounded-xl">
                                        <SelectValue placeholder="All Months" />
                                    </SelectTrigger>
                                    <SelectContent className="glass bg-popover/95 border-border">
                                        <SelectItem value="all" className="text-xs font-semibold">
                                            🗓️ All Months (Annual)
                                        </SelectItem>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m} value={m} className="text-xs">
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Company / Source Selector */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                                    <span>Client / Company</span>
                                    {reportType === "company_statement" && (
                                        <span className="text-[10px] text-amber-500 font-bold">
                                            *Required
                                        </span>
                                    )}
                                </span>
                                <Select value={companyScope} onValueChange={setCompanyScope}>
                                    <SelectTrigger className="h-9 text-xs glass border-border/80 rounded-xl">
                                        <SelectValue placeholder="All Companies" />
                                    </SelectTrigger>
                                    <SelectContent className="glass bg-popover/95 border-border">
                                        <SelectItem value="all" className="text-xs font-semibold">
                                            🏢 All Companies / Sources
                                        </SelectItem>
                                        {companyOptions.map((c) => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs">
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Report Customization Toggles */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-primary" />
                                3. Sections to Include in PDF
                            </label>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Click to toggle sections
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setIncludeKPIs(!includeKPIs)}
                                className={`text-xs font-semibold py-2 px-3 rounded-xl border flex items-center justify-between transition-all ${
                                    includeKPIs
                                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                                        : "glass border-border/60 text-muted-foreground opacity-60"
                                }`}
                            >
                                <span>Executive KPIs</span>
                                {includeKPIs && <Check className="h-3.5 w-3.5 ml-1 text-indigo-400" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIncludeMonthlyBreakdown(!includeMonthlyBreakdown)}
                                className={`text-xs font-semibold py-2 px-3 rounded-xl border flex items-center justify-between transition-all ${
                                    includeMonthlyBreakdown
                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                        : "glass border-border/60 text-muted-foreground opacity-60"
                                }`}
                            >
                                <span>Monthly Table</span>
                                {includeMonthlyBreakdown && (
                                    <Check className="h-3.5 w-3.5 ml-1 text-emerald-400" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIncludeCompanyBreakdown(!includeCompanyBreakdown)}
                                className={`text-xs font-semibold py-2 px-3 rounded-xl border flex items-center justify-between transition-all ${
                                    includeCompanyBreakdown
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                                        : "glass border-border/60 text-muted-foreground opacity-60"
                                }`}
                            >
                                <span>Client Breakdown</span>
                                {includeCompanyBreakdown && (
                                    <Check className="h-3.5 w-3.5 ml-1 text-blue-400" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIncludeTransactionLedger(!includeTransactionLedger)}
                                className={`text-xs font-semibold py-2 px-3 rounded-xl border flex items-center justify-between transition-all ${
                                    includeTransactionLedger
                                        ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                                        : "glass border-border/60 text-muted-foreground opacity-60"
                                }`}
                            >
                                <span>Detailed Ledger</span>
                                {includeTransactionLedger && (
                                    <Check className="h-3.5 w-3.5 ml-1 text-violet-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 4. Live Scope Preview & Data Metrics */}
                    <div className="p-4 rounded-xl glass border border-border/80 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Real-Time Scope Preview
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                Calculated from selected criteria
                            </span>
                        </div>

                        {filteredEntries.length === 0 ? (
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-2.5 text-xs font-semibold">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>
                                    No records match this combination. Try changing the Year, Month, or
                                    Company filter.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/60">
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Records in Scope
                                        </p>
                                        <p className="text-sm font-bold text-foreground">
                                            {filteredEntries.length} Transactions
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/60">
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Total Inflow (Credits)
                                        </p>
                                        <p className="text-sm font-bold text-emerald-500">
                                            {formatCurrency(totalCredits)}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/60">
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Outstanding Due
                                        </p>
                                        <p className="text-sm font-bold text-amber-500">
                                            {formatCurrency(totalPending)}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/60">
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Net Balance
                                        </p>
                                        <p className="text-sm font-bold text-violet-500">
                                            {formatCurrency(netAmount)}
                                        </p>
                                    </div>
                                </div>

                                {/* First 3 Sample Records in PDF */}
                                <div className="pt-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                        Sample Records in PDF:
                                    </p>
                                    <div className="space-y-1">
                                        {filteredEntries.slice(0, 3).map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted/40 flex items-center justify-between border border-border/40"
                                            >
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="font-semibold text-foreground">
                                                        {item.month} {item.year}
                                                    </span>
                                                    <span className="text-muted-foreground truncate">
                                                        • {item.companyName || "Personal"} (
                                                        {item.description || item.category})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span
                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                            item.status === "received"
                                                                ? "bg-emerald-500/10 text-emerald-500"
                                                                : "bg-amber-500/10 text-amber-500"
                                                        }`}
                                                    >
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                    <span
                                                        className={`font-bold ${
                                                            item.type === "credit"
                                                                ? "text-emerald-500"
                                                                : "text-rose-500"
                                                        }`}
                                                    >
                                                        {item.type === "credit" ? "+" : "-"}
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleExecuteExport}
                        disabled={downloading || filteredEntries.length === 0}
                        className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold rounded-xl px-5 h-9 text-xs shadow-md shadow-indigo-500/20 gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Generating Certified PDF...</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                <span>
                                    Download {selectedReportConfig.badgeText} PDF ({filteredEntries.length}{" "}
                                    tx •{" "}
                                    {formatCurrency(
                                        reportType === "expenses_only"
                                            ? totalDebits
                                            : reportType === "pending_dues"
                                            ? totalPending
                                            : totalCredits
                                    )}
                                    )
                                </span>
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
