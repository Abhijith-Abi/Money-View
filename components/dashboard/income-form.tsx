"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { addIncome, updateIncome } from "@/lib/income-service";
import { subscribeToCompanies } from "@/lib/company-service";
import { Company } from "@/types/company";
import { CompanySettingsDialog } from "./company-settings-dialog";
import { MONTHS } from "@/lib/utils";
import { IncomeEntry } from "@/types/income";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Plus,
    Loader2,
    Building2,
    Calendar,
    Sparkles,
    Check,
    Coins,
} from "lucide-react";
import {
    AnimatedTrendUpIcon,
    AnimatedTrendDownIcon,
    AnimatedClockIcon,
    AnimatedCheckIcon,
    AnimatedRupeeIcon,
} from "@/components/ui/animated-icons";

const formSchema = z.object({
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
    category: z.enum(["primary", "secondary"]),
    month: z.string().min(1, "Please select a month"),
    year: z
        .string()
        .min(1, "Year is required")
        .refine((val) => !isNaN(Number(val)) && Number(val) >= 2000, {
            message: "Year must be 2000 or later",
        }),
    type: z.enum(["credit", "debit"]),
    status: z.enum(["pending", "received"]),
    companyId: z.string().optional(),
    description: z.string().optional(),
});

interface IncomeFormProps {
    onSuccess: () => void;
    defaultYear: number;
    initialData?: IncomeEntry;
    trigger?: React.ReactNode;
}

export function IncomeForm({
    onSuccess,
    defaultYear,
    initialData,
    trigger,
}: IncomeFormProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showCompanySettings, setShowCompanySettings] = useState(false);
    const { toast } = useToast();

    const isEditing = !!initialData;
    const currentMonthName = MONTHS[new Date().getMonth()];

    // Subscribe to real-time companies
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToCompanies(user.uid, (list) => {
            setCompanies(list);
        });
        return () => unsub();
    }, [user]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: initialData?.amount.toString() || "",
            category: initialData?.category || "primary",
            month: initialData?.month || currentMonthName,
            year: (initialData?.year || defaultYear || new Date().getFullYear()).toString(),
            type: initialData?.type || "credit",
            status: initialData?.status || "received",
            companyId: initialData?.companyId || "none",
            description: initialData?.description || "",
        },
    });

    // Update form when editing initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                amount: initialData.amount.toString(),
                category: initialData.category,
                month: initialData.month,
                year: initialData.year.toString(),
                type: initialData.type,
                status: initialData.status,
                companyId: initialData.companyId || "none",
                description: initialData.description || "",
            });
        }
    }, [initialData, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;

        setLoading(true);

        const selectedCompany = companies.find((c) => c.id === values.companyId);

        const formData = {
            amount: Number(values.amount),
            category: values.category,
            month: values.month,
            year: Number(values.year),
            type: values.type,
            status: values.status,
            companyId: values.companyId && values.companyId !== "none" ? values.companyId : null,
            companyName: selectedCompany ? selectedCompany.name : null,
            description: values.description,
        };

        try {
            if (isEditing && initialData) {
                await updateIncome(initialData.id, user.uid, formData);
                toast({
                    title: "Success!",
                    description: "Transaction updated successfully",
                    duration: 1500,
                });
            } else {
                await addIncome(formData, user.uid);
                toast({
                    title: "Success!",
                    description: "Transaction recorded successfully",
                    duration: 1500,
                });
            }

            setOpen(false);
            if (!isEditing) {
                form.reset();
            }
            onSuccess();
        } catch (error: any) {
            console.error("❌ [IncomeForm] Error:", error);
            const errorMessage = error?.message || "Operation failed. Please try again.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 2500,
            });
        } finally {
            setLoading(false);
        }
    }

    const availableYears = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

    // Quick increment helper
    const handleQuickAdd = (increment: number) => {
        const current = Number(form.getValues("amount")) || 0;
        form.setValue("amount", (current + increment).toString(), { shouldValidate: true });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="icon"
                        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold z-50 transition-all hover:scale-105 active:scale-95 group shadow-violet-500/30 hover:shadow-violet-500/50"
                    >
                        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
                        <span className="sr-only">Add Transaction</span>
                    </Button>
                )}
            </DialogTrigger>

            {/* 70% Width Modal with modern light/sleek aesthetic */}
            <DialogContent className="glass bg-card/98 text-card-foreground border-border w-[95vw] md:w-[85vw] lg:w-[70vw] sm:max-w-[70vw] max-w-[70vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl shadow-2xl">
                {/* Modern Header */}
                <div className="p-6 sm:p-7 pb-4 border-b border-border/50">
                    <DialogHeader className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 shrink-0">
                                    <AnimatedRupeeIcon size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                        {isEditing ? "Edit Transaction" : "Record Transaction"}
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                            70% Width Ledger
                                        </span>
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground font-medium text-xs sm:text-sm mt-0.5">
                                        {isEditing
                                            ? "Update details for this financial record in your ledger"
                                            : "Add a new income inflow or business expenditure to your ledger"}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/60">
                                    FY {form.watch("year") || defaultYear}
                                </span>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Form Body - 2 Columns Layout for 70% Width */}
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-6 sm:p-7 pt-4 space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LEFT COLUMN: Numbers, Date & Entity */}
                            <div className="space-y-5">
                                {/* Hero Amount Card */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Coins className="w-3.5 h-3.5 text-primary" />
                                                        Transaction Amount (₹) *
                                                    </FormLabel>
                                                    <span className="text-[11px] font-semibold text-primary">
                                                        Direct Value
                                                    </span>
                                                </div>
                                                <FormControl>
                                                    <div className="relative mt-1">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-2xl select-none">
                                                            ₹
                                                        </span>
                                                        <Input
                                                            placeholder="0.00"
                                                            inputMode="numeric"
                                                            {...field}
                                                            className="pl-10 h-14 bg-background/80 border-input text-foreground font-black text-2xl sm:text-3xl rounded-2xl focus-visible:ring-primary shadow-inner"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Quick Increment Chips */}
                                    <div className="pt-1">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            Quick Presets:
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[1000, 5000, 10000, 25000, 50000].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => handleQuickAdd(val)}
                                                    className="px-2.5 py-1 text-xs font-bold rounded-xl border border-border/70 bg-background/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
                                                >
                                                    +₹{val >= 1000 ? `${val / 1000}k` : val}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => form.setValue("amount", "", { shouldValidate: true })}
                                                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-border/50 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Date Period: Month & Year */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-1 border-b border-border/40">
                                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            Timeline & Period
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-semibold">
                                            Accounting Month
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="month"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                        Month
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/80 border-input text-foreground h-11 rounded-xl text-xs font-semibold">
                                                                <SelectValue placeholder="Select Month" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="glass bg-popover text-popover-foreground border-border max-h-56">
                                                            {MONTHS.map((m) => (
                                                                <SelectItem key={m} value={m} className="text-xs">
                                                                    {m}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="year"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                        Year
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={(val) => field.onChange(val)}
                                                        value={field.value?.toString()}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/80 border-input text-foreground h-11 rounded-xl text-xs font-semibold">
                                                                <SelectValue placeholder="Year" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                                            {availableYears.map((y) => (
                                                                <SelectItem key={y} value={y.toString()} className="text-xs">
                                                                    {y}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Company / Client Source */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-primary" />
                                                        Company / Client Source
                                                    </FormLabel>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCompanySettings(true)}
                                                        className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                                                    >
                                                        + Manage Companies
                                                    </button>
                                                </div>
                                                <Select
                                                    onValueChange={(val) => {
                                                        if (val === "manage_companies") {
                                                            setShowCompanySettings(true);
                                                            return;
                                                        }
                                                        field.onChange(val);
                                                        const comp = companies.find((c) => c.id === val);
                                                        if (comp?.category) {
                                                            form.setValue("category", comp.category);
                                                        }
                                                    }}
                                                    value={field.value || "none"}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/80 border-input text-foreground h-11 rounded-xl text-xs font-semibold">
                                                            <SelectValue placeholder="Select Company or Source" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="glass bg-popover text-popover-foreground border-border max-h-56">
                                                        <SelectItem value="none" className="text-xs">
                                                            — Personal / None —
                                                        </SelectItem>
                                                        {companies.map((c) => (
                                                            <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: c.color || "#6366f1" }}
                                                                    />
                                                                    <span>{c.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase ml-1">
                                                                        ({c.category || "primary"})
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem
                                                            value="manage_companies"
                                                            className="text-xs text-primary font-bold border-t border-border/60 cursor-pointer"
                                                        >
                                                            + Add / Manage in Settings...
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Classification, Type, Status & Notes */}
                            <div className="space-y-5">
                                {/* Interactive Transaction Type Selector */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                                                    <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                        Transaction Type *
                                                    </FormLabel>
                                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                                        Flow Direction
                                                    </span>
                                                </div>

                                                <FormControl>
                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                        {/* Credit Card */}
                                                        <div
                                                            role="button"
                                                            onClick={() => field.onChange("credit")}
                                                            className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                                                                field.value === "credit"
                                                                    ? "border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md"
                                                                    : "border-border/80 bg-background/60 hover:bg-muted/40 opacity-80 hover:opacity-100"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                    <AnimatedTrendUpIcon size={16} />
                                                                </div>
                                                                {field.value === "credit" && (
                                                                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                                                    Credit (Income)
                                                                </h4>
                                                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                                    Money inflow, salary, payments
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Debit Card */}
                                                        <div
                                                            role="button"
                                                            onClick={() => field.onChange("debit")}
                                                            className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                                                                field.value === "debit"
                                                                    ? "border-rose-500/80 bg-rose-500/10 dark:bg-rose-500/15 ring-2 ring-rose-500/30 shadow-md"
                                                                    : "border-border/80 bg-background/60 hover:bg-muted/40 opacity-80 hover:opacity-100"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                                    <AnimatedTrendDownIcon size={16} />
                                                                </div>
                                                                {field.value === "debit" && (
                                                                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-rose-700 dark:text-rose-300">
                                                                    Debit (Expense)
                                                                </h4>
                                                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                                    Money outflow, equipment, cost
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Status & Category Controls */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-4">
                                    {/* Status Switch */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                        Settlement Status *
                                                    </FormLabel>
                                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                                        Realized vs Receivable
                                                    </span>
                                                </div>
                                                <FormControl>
                                                    <div className="grid grid-cols-2 gap-2 bg-background/80 p-1.5 rounded-2xl border border-border">
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange("received")}
                                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                                field.value === "received"
                                                                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            <AnimatedCheckIcon size={14} />
                                                            <span>Received (Paid)</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange("pending")}
                                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                                field.value === "pending"
                                                                    ? "bg-amber-600 text-white shadow-sm shadow-amber-500/25"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            <AnimatedClockIcon size={14} />
                                                            <span>Pending (Unpaid)</span>
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Stream Category Switch */}
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2 pt-1 border-t border-border/40">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                        Stream Classification *
                                                    </FormLabel>
                                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                                        Income Stream
                                                    </span>
                                                </div>
                                                <FormControl>
                                                    <div className="grid grid-cols-2 gap-2 bg-background/80 p-1.5 rounded-2xl border border-border">
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange("primary")}
                                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                                field.value === "primary"
                                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            Primary (Salary / Core)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange("secondary")}
                                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                                field.value === "secondary"
                                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            Secondary (Freelance / Extra)
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Description Input */}
                                <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                    Transaction Description / Notes (Optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Monthly salary payout, Client retainership, MacBook Pro..."
                                                        {...field}
                                                        className="bg-background/80 border-input text-foreground h-11 rounded-xl text-xs font-medium focus-visible:ring-primary mt-1"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                Ledger entry will update your dashboard metrics instantly
                            </span>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="w-1/2 sm:w-auto h-11 px-5 rounded-xl border-border text-xs font-bold"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2 sm:w-auto min-w-[180px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-violet-500/25 transition-all text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : isEditing ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            <span>Update Transaction</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            <span>Save Transaction</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>

            {/* Sub-dialog for company settings */}
            <CompanySettingsDialog
                open={showCompanySettings}
                onOpenChange={setShowCompanySettings}
                onCompanyAdded={(newComp) => {
                    form.setValue("companyId", newComp.id);
                    if (newComp.category) {
                        form.setValue("category", newComp.category);
                    }
                }}
            />
        </Dialog>
    );
}
