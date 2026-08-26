"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { addIncome, updateIncome } from "@/lib/income-service";
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
import { Plus, Loader2, Pencil } from "lucide-react";

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
    const { toast } = useToast();

    const isEditing = !!initialData;

    const currentMonthName = MONTHS[new Date().getMonth()];
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: initialData?.amount.toString() || "",
            category: initialData?.category || "primary",
            month: initialData?.month || currentMonthName,
            year: (initialData?.year || defaultYear || new Date().getFullYear()).toString(),
            type: initialData?.type || "credit",
            status: initialData?.status || "received",
            description: initialData?.description || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;

        setLoading(true);

        const formData = {
            amount: Number(values.amount),
            category: values.category,
            month: values.month,
            year: Number(values.year),
            type: values.type,
            status: values.status,
            description: values.description,
        };

        try {
            if (isEditing && initialData) {
                console.log("🚀 [IncomeForm] Calling updateIncome...");
                await updateIncome(initialData.id, user.uid, formData);
                toast({
                    title: "Success!",
                    description: "Entry updated successfully",
                    duration: 1000,
                });
            } else {
                console.log("🚀 [IncomeForm] Calling addIncome...");
                await addIncome(formData, user.uid);
                toast({
                    title: "Success!",
                    description: "Income entry added successfully",
                    duration: 1000,
                });
            }

            setOpen(false);
            if (!isEditing) {
                form.reset();
            }
            onSuccess();
        } catch (error: any) {
            console.error("❌ [IncomeForm] Error:", error);
            let errorMessage = "Operation failed. Please try again.";
            if (error?.message) errorMessage = error.message;

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="lg"
                        className="fixed bottom-8 right-8 h-16 w-16 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.3)] bg-primary hover:bg-primary/90 text-black font-bold z-50 transition-all hover:scale-110 active:scale-95 group"
                    >
                        <Plus className="h-8 w-8 transition-transform group-hover:rotate-90" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 sm:max-w-[440px] p-0 overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
                
                <DialogHeader className="p-7 pb-3">
                    <DialogTitle className="text-white text-2xl font-black tracking-tight">
                        {isEditing ? "Edit Transaction" : "Record Transaction"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium text-xs">
                        {isEditing
                            ? "Modify the details of this financial record"
                            : "Add a new income or expense stream to your ledger"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-7 pt-2 space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Amount (₹)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-black text-lg">₹</span>
                                            <Input
                                                placeholder="0.00"
                                                inputMode="numeric"
                                                {...field}
                                                className="bg-white/[0.04] border-white/10 focus:border-purple-500 text-white pl-9 h-12 font-black text-xl rounded-xl"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                                            Month
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-xl text-xs font-semibold">
                                                    <SelectValue placeholder="Select Month" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white max-h-56 rounded-xl">
                                                {MONTHS.map((m) => (
                                                    <SelectItem key={m} value={m} className="font-semibold text-xs">
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
                                        <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                                            Year
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-xl text-xs font-semibold">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white rounded-xl">
                                                {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                                                    <SelectItem key={y} value={y.toString()} className="font-semibold text-xs">
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

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-xl text-xs font-semibold">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white rounded-xl">
                                                <SelectItem value="credit" className="text-emerald-400 font-bold text-xs">Credit (Income)</SelectItem>
                                                <SelectItem value="debit" className="text-rose-400 font-bold text-xs">Debit (Expense)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-xl text-xs font-semibold">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white rounded-xl">
                                                <SelectItem value="received" className="text-emerald-400 font-bold text-xs">Received (Paid)</SelectItem>
                                                <SelectItem value="pending" className="text-amber-400 font-bold text-xs">Pending (Unpaid)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-xl text-xs font-semibold">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white rounded-xl">
                                            <SelectItem value="primary" className="font-semibold text-xs">Primary / Salary</SelectItem>
                                            <SelectItem value="secondary" className="font-semibold text-xs">Secondary / Freelance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Consulting, Client Payment, Retainer"
                                            {...field}
                                            className="bg-white/[0.04] border-white/10 focus:border-purple-500 text-white h-11 rounded-xl text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isEditing ? (
                                "Update Transaction"
                            ) : (
                                "Save Transaction"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
