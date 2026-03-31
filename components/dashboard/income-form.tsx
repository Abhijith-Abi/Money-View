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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: initialData?.amount.toString() || "",
            category: initialData?.category || "primary",
            month: initialData?.month || "",
            year: (initialData?.year || defaultYear).toString(),
            type: initialData?.type || "credit",
            status: initialData?.status || "pending",
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
            <DialogContent className="glass-gold border-white/10 dark:border-white/5 sm:max-w-[425px] p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-none" />
                
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-white text-2xl font-bold tracking-tight">
                        {isEditing ? "Edit Transaction" : "New Transaction"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-medium">
                        {isEditing
                            ? "Modify the details of this financial record"
                            : "Record a new entry to your financial ledger"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-8 pt-2 space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-400 text-xs font-bold uppercase tracking-widest">Amount</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                                            <Input
                                                placeholder="0.00"
                                                inputMode="numeric"
                                                {...field}
                                                className="bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 text-white pl-8 h-12 font-bold text-lg"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-400 text-xs font-bold uppercase tracking-widest">Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="glass border-white/10 text-white h-11">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass-gold border-white/10 text-white">
                                                <SelectItem value="credit">Credit</SelectItem>
                                                <SelectItem value="debit">Debit</SelectItem>
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
                                        <FormLabel className="text-gray-400 text-xs font-bold uppercase tracking-widest">Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="glass border-white/10 text-white h-11">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass-gold border-white/10 text-white">
                                                <SelectItem value="received">Received</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
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
                                    <FormLabel className="text-gray-400 text-xs font-bold uppercase tracking-widest">Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="glass border-white/10 text-white h-11">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="glass-gold border-white/10 text-white">
                                            <SelectItem value="primary">Primary / Salary</SelectItem>
                                            <SelectItem value="secondary">Secondary / Freelance</SelectItem>
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
                                    <FormLabel className="text-gray-400 text-xs font-bold uppercase tracking-widest">Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="What's this for?"
                                            {...field}
                                            className="bg-white/5 border-white/10 focus:border-primary text-white h-11"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 rounded-xl shadow-lg transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isEditing ? (
                                "Update Transaction"
                            ) : (
                                "Confirm Transaction"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
