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
import { Plus, Loader2 } from "lucide-react";

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
                await updateIncome(initialData.id, user.uid, formData);
                toast({
                    title: "Success!",
                    description: "Entry updated successfully",
                    duration: 1500,
                });
            } else {
                await addIncome(formData, user.uid);
                toast({
                    title: "Success!",
                    description: "Income entry added successfully",
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="icon"
                        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold z-50 transition-all hover:scale-105 active:scale-95 group"
                    >
                        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
                        <span className="sr-only">Add Income Entry</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass bg-card/95 text-card-foreground border-border sm:max-w-[440px] p-0 overflow-hidden rounded-2xl shadow-2xl">
                <div className="p-6 pb-2">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                            {isEditing ? "Edit Entry" : "Record Transaction"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium text-xs">
                            {isEditing
                                ? "Update the details of this financial record"
                                : "Add a new income or expense entry to your ledger"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-6 pt-2 space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Amount (₹)
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-base">
                                                ₹
                                            </span>
                                            <Input
                                                placeholder="0.00"
                                                inputMode="numeric"
                                                {...field}
                                                className="pl-8 h-11 bg-background/50 border-input text-foreground font-bold text-lg rounded-xl focus-visible:ring-primary"
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
                                        <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Month
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs font-medium">
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
                                                <SelectTrigger className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs font-medium">
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

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Type
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs font-medium">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                                <SelectItem value="credit" className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                                    Credit (Income)
                                                </SelectItem>
                                                <SelectItem value="debit" className="text-rose-600 dark:text-rose-400 font-semibold text-xs">
                                                    Debit (Expense)
                                                </SelectItem>
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
                                        <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Status
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs font-medium">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                                <SelectItem value="received" className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                                    Received (Paid)
                                                </SelectItem>
                                                <SelectItem value="pending" className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                                                    Pending (Unpaid)
                                                </SelectItem>
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
                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Category
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs font-medium">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                            <SelectItem value="primary" className="text-xs">
                                                Primary / Salary
                                            </SelectItem>
                                            <SelectItem value="secondary" className="text-xs">
                                                Secondary / Freelance
                                            </SelectItem>
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
                                    <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Description (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Salary, Consulting, Bonus, Equipment"
                                            {...field}
                                            className="bg-background/50 border-input text-foreground h-11 rounded-xl text-xs focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl shadow-md transition-all mt-2"
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
