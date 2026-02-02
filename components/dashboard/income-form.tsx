"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { addIncome } from "@/lib/income-service";
import { MONTHS } from "@/lib/utils";
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
}

export function IncomeForm({ onSuccess, defaultYear }: IncomeFormProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: "",
            category: "primary",
            month: "",
            year: defaultYear.toString(),
            type: "credit",
            status: "received",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;

        setLoading(true);

        // Close modal and show success immediately for faster UX
        const formData = {
            amount: Number(values.amount),
            category: values.category,
            month: values.month,
            year: Number(values.year),
            type: values.type,
            status: values.status,
            description: values.description,
        };

        console.log("📋 [IncomeForm] Submitting form with data:", formData);
        console.log("👤 [IncomeForm] User UID:", user.uid);

        // Optimistic UI update - close modal and reset form immediately
        form.reset({
            amount: "",
            category: "primary",
            month: "",
            year: defaultYear.toString(),
            type: "credit",
            status: "received",
            description: "",
        });
        setOpen(false);

        toast({
            title: "Adding entry...",
            description: "Your entry is being saved",
        });

        try {
            console.log("🚀 [IncomeForm] Calling addIncome...");
            const docId = await addIncome(formData, user.uid);
            console.log(
                "✅ [IncomeForm] Successfully added! Document ID:",
                docId,
            );

            toast({
                title: "Success!",
                description: "Income entry added successfully",
            });

            onSuccess();
        } catch (error: any) {
            console.error("❌ [IncomeForm] Failed to add income:", error);

            // Determine the error message based on error type
            let errorMessage = "Failed to add income entry. Please try again.";

            if (error?.message?.includes("timeout")) {
                errorMessage =
                    "Request timed out. Please check your Firestore security rules and try again.";
            } else if (error?.code === "permission-denied") {
                errorMessage =
                    "Permission denied. Please check your Firestore security rules.";
            } else if (error?.code === "unavailable") {
                errorMessage =
                    "Firebase server is unavailable. Please check your internet connection.";
            } else if (error?.message) {
                errorMessage = `Error: ${error.message}`;
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            // Reopen modal on error so user can retry
            setOpen(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 z-50"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Add Income Entry
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Add a new income or expense entry to your financial
                        tracker
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="29000"
                                            inputMode="numeric"
                                            {...field}
                                            className="glass border-white/10"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="glass border-white/10">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass border-white/10">
                                            <SelectItem value="credit">
                                                Credit (Income)
                                            </SelectItem>
                                            <SelectItem value="debit">
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
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="glass border-white/10">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass border-white/10">
                                            <SelectItem value="received">
                                                ✓ Received
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                ⏳ Pending
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="glass border-white/10">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass border-white/10">
                                            <SelectItem value="primary">
                                                Primary (Salary)
                                            </SelectItem>
                                            <SelectItem value="secondary">
                                                Secondary (Support & Other)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Month</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="glass border-white/10">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass border-white/10">
                                                {MONTHS.map((month) => (
                                                    <SelectItem
                                                        key={month}
                                                        value={month}
                                                    >
                                                        {month}
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
                                        <FormLabel>Year</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="2025"
                                                inputMode="numeric"
                                                maxLength={4}
                                                {...field}
                                                className="glass border-white/10"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Description (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Monthly salary, freelance payment"
                                            {...field}
                                            className="glass border-white/10"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Entry"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
