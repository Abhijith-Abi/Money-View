"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Transaction, Customer } from "@/types/customer";
import { addTransaction } from "@/lib/ledger-service";
import { getAllCustomers } from "@/lib/customer-service";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Loader2,
    CalendarIcon,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Info,
    IndianRupee,
    Wallet,
} from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    customerId: z.string().min(1, "Please select a customer"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["credit", "debit"]),
    date: z.date({
        message: "Date is required",
    }),
    hour: z.string().default("12"),
    minute: z.string().default("00"),
    description: z.string().default(""),
    paymentMethod: z.enum(["cash", "card", "bank_transfer", "upi", "other"]),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
    customerId?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
);

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export function TransactionForm({
    customerId,
    open,
    onOpenChange,
    onSuccess,
}: TransactionFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            customerId: customerId || "",
            amount: 0,
            type: "credit",
            date: new Date(),
            hour: format(new Date(), "HH"),
            minute: format(new Date(), "mm"),
            description: "",
            paymentMethod: "cash",
        },
    });

    const watchedType = form.watch("type");
    const watchedAmount = form.watch("amount");

    useEffect(() => {
        if (open) {
            const now = new Date();
            form.reset({
                customerId: customerId || "",
                amount: 0,
                type: "credit",
                date: now,
                hour: format(now, "HH"),
                minute: format(now, "mm"),
                description: "",
                paymentMethod: "cash",
            });
        }
    }, [open, customerId, form]);

    useEffect(() => {
        async function fetchCustomers() {
            if (!user || !open) return;
            try {
                const data = await getAllCustomers(user.uid);
                setCustomers(data);
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        }
        fetchCustomers();
    }, [user, open]);

    async function onSubmit(values: FormValues) {
        if (!user) return;
        setLoading(true);
        try {
            const selectedCustomer = customers.find(
                (c) => c.id === values.customerId,
            );
            if (!selectedCustomer && !customerId) {
                throw new Error("Customer not found");
            }

            // Combine date with hour and minute
            let finalDate = setHours(values.date, parseInt(values.hour));
            finalDate = setMinutes(finalDate, parseInt(values.minute));

            const isCredit = values.type === "credit";
            const defaultDescription = isCredit
                ? "Payment Received / പണം ലഭിച്ചത്"
                : "Money Given / കടം കൊടുത്തത്";

            await addTransaction(
                {
                    customerId: values.customerId,
                    customerName: selectedCustomer
                        ? selectedCustomer.name
                        : "Customer",
                    amount: Number(values.amount),
                    type: values.type,
                    date: finalDate,
                    description: values.description.trim() || defaultDescription,
                    paymentMethod: values.paymentMethod,
                },
                user.uid,
            );

            toast({
                title: isCredit ? "Payment Received" : "Money Given Recorded",
                description: `₹${Number(values.amount).toLocaleString("en-IN")} recorded successfully`,
            });
            onOpenChange(false);
            onSuccess();
            form.reset();
        } catch (error: any) {
            console.error("Error recording transaction:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to record transaction",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 dark:border-white/10 max-w-lg w-full p-6 sm:p-7 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[92vh]">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-purple-400" />
                        Record Entry
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Record money given (കടം / Debit) or money received (വരവ് / Credit)
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Customer Selector (if not in customer detail view) */}
                        {!customerId && (
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-foreground">
                                            Select Customer *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="glass h-11 rounded-xl text-xs border-border/60">
                                                    <SelectValue placeholder="Choose a customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass">
                                                {customers.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                        className="text-xs font-semibold"
                                                    >
                                                        {c.name} ({c.phone})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Transaction Type: Visual Interactive Cards (Money Given vs Money Received) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                Transaction Type *
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Card 1: You Gave / കടം കൊടുത്തത് (Debit) */}
                                <button
                                    type="button"
                                    onClick={() => form.setValue("type", "debit")}
                                    className={cn(
                                        "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2",
                                        watchedType === "debit"
                                            ? "bg-rose-500/15 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-2 ring-rose-500/30"
                                            : "bg-white/[0.03] border-white/10 hover:border-rose-500/40 text-muted-foreground hover:bg-rose-500/5",
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={cn(
                                                "p-2 rounded-xl border",
                                                watchedType === "debit"
                                                    ? "bg-rose-500 text-white border-rose-400"
                                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                            )}
                                        >
                                            <ArrowUpRight className="h-4 w-4" />
                                        </div>
                                        {watchedType === "debit" && (
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p
                                            className={cn(
                                                "text-xs sm:text-sm font-black tracking-tight",
                                                watchedType === "debit"
                                                    ? "text-rose-400 dark:text-rose-300"
                                                    : "text-foreground",
                                            )}
                                        >
                                            You Gave
                                        </p>
                                        <p className="text-[11px] font-semibold text-rose-400/90">
                                            കടം കൊടുത്തത്
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">
                                            Money / Goods Given (Debit)
                                        </p>
                                    </div>
                                </button>

                                {/* Card 2: You Received / പണം ലഭിച്ചത് (Credit) */}
                                <button
                                    type="button"
                                    onClick={() => form.setValue("type", "credit")}
                                    className={cn(
                                        "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2",
                                        watchedType === "credit"
                                            ? "bg-emerald-500/15 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/30"
                                            : "bg-white/[0.03] border-white/10 hover:border-emerald-500/40 text-muted-foreground hover:bg-emerald-500/5",
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={cn(
                                                "p-2 rounded-xl border",
                                                watchedType === "credit"
                                                    ? "bg-emerald-500 text-white border-emerald-400"
                                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                            )}
                                        >
                                            <ArrowDownLeft className="h-4 w-4" />
                                        </div>
                                        {watchedType === "credit" && (
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p
                                            className={cn(
                                                "text-xs sm:text-sm font-black tracking-tight",
                                                watchedType === "credit"
                                                    ? "text-emerald-400 dark:text-emerald-300"
                                                    : "text-foreground",
                                            )}
                                        >
                                            You Received
                                        </p>
                                        <p className="text-[11px] font-semibold text-emerald-400/90">
                                            പണം ലഭിച്ചത്
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">
                                            Payment Received (Credit)
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Amount Input with prominent ₹ INR Prefix */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-xs font-bold text-foreground">
                                            Amount (₹ INR) *
                                        </FormLabel>
                                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                                            Indian Rupee
                                        </span>
                                    </div>
                                    <FormControl>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-foreground font-black text-xl">
                                                ₹
                                            </div>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === 0 ? "" : field.value}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val === "" ? 0 : parseFloat(val));
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className={cn(
                                                    "glass pl-10 h-14 rounded-2xl text-2xl font-black tracking-tight border-border/80 focus:border-purple-500",
                                                    watchedType === "credit"
                                                        ? "text-emerald-400 focus:ring-emerald-500/20"
                                                        : "text-rose-400 focus:ring-rose-500/20",
                                                )}
                                            />
                                        </div>
                                    </FormControl>

                                    {/* Quick Amount Suggestion Chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                        <span className="text-[10px] font-bold text-muted-foreground mr-1">
                                            Quick:
                                        </span>
                                        {QUICK_AMOUNTS.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => {
                                                    const current = Number(form.getValues("amount")) || 0;
                                                    form.setValue("amount", current + amt);
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-bold text-foreground transition-all hover:scale-105 active:scale-95"
                                            >
                                                +₹{amt.toLocaleString("en-IN")}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => form.setValue("amount", 0)}
                                            className="px-2 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-[10px] text-muted-foreground font-semibold ml-auto"
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    {/* Dynamic Explanatory Banner */}
                                    {Number(watchedAmount) > 0 && (
                                        <div
                                            className={cn(
                                                "p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 mt-2",
                                                watchedType === "credit"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                            )}
                                        >
                                            {watchedType === "credit" ? (
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            ) : (
                                                <Info className="h-4 w-4 shrink-0" />
                                            )}
                                            <span>
                                                {watchedType === "credit"
                                                    ? `₹${Number(watchedAmount).toLocaleString("en-IN")} will decrease customer's pending balance (തരാനുള്ളതിൽ നിന്ന് കുറയും).`
                                                    : `₹${Number(watchedAmount).toLocaleString("en-IN")} will be added to customer's due (കടം / തരാനുള്ളത്).`}
                                            </span>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date and Time Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs font-bold text-foreground mb-1">
                                            Transaction Date
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3.5 h-11 text-left font-normal glass rounded-xl border-border/60",
                                                            !field.value &&
                                                                "text-muted-foreground",
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-purple-400" />
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP",
                                                            )
                                                        ) : (
                                                            <span>Pick date</span>
                                                        )}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0 glass border-border/80"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                        if (date)
                                                            field.onChange(
                                                                date,
                                                            );
                                                    }}
                                                    disabled={(date) =>
                                                        date > new Date() ||
                                                        date <
                                                            new Date(
                                                                "1900-01-01",
                                                            )
                                                    }
                                                    initialFocus
                                                    className="glass"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-foreground">Time</Label>
                                <div className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name="hour"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="glass h-11 rounded-xl border-border/60">
                                                            <SelectValue placeholder="HH" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="glass h-[200px]">
                                                        {hours.map((h) => (
                                                            <SelectItem
                                                                key={h}
                                                                value={h}
                                                            >
                                                                {h}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <span className="text-muted-foreground font-bold">
                                        :
                                    </span>
                                    <FormField
                                        control={form.control}
                                        name="minute"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="glass h-11 rounded-xl border-border/60">
                                                            <SelectValue placeholder="MM" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="glass h-[200px]">
                                                        {minutes.map((m) => (
                                                            <SelectItem
                                                                key={m}
                                                                value={m}
                                                            >
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 opacity-70" />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-foreground">
                                        Payment Method *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="glass h-11 rounded-xl border-border/60">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass">
                                            <SelectItem value="cash">
                                                💵 Cash (പണം)
                                            </SelectItem>
                                            <SelectItem value="upi">
                                                📱 UPI (GPay / PhonePe / Paytm)
                                            </SelectItem>
                                            <SelectItem value="bank_transfer">
                                                🏦 Bank Transfer (NEFT / IMPS)
                                            </SelectItem>
                                            <SelectItem value="card">
                                                💳 Card / Cheque
                                            </SelectItem>
                                            <SelectItem value="other">
                                                📝 Other / Ledger Adjustment
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description / Item Note */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-foreground">
                                        Description / Note (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={
                                                watchedType === "credit"
                                                    ? "e.g., Cash received, bill settlement..."
                                                    : "e.g., Goods purchase, loan given, service charge..."
                                            }
                                            {...field}
                                            className="glass h-11 rounded-xl text-sm border-border/60 focus:border-purple-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="h-11 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || Number(watchedAmount) <= 0}
                                className={cn(
                                    "h-11 px-6 rounded-xl font-bold text-xs text-white shadow-lg transition-all",
                                    watchedType === "credit"
                                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                                        : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/25",
                                )}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {watchedType === "credit"
                                    ? `✓ Record Money Received (+₹${Number(watchedAmount || 0).toLocaleString("en-IN")})`
                                    : `↑ Record Money Given (-₹${Number(watchedAmount || 0).toLocaleString("en-IN")})`}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
