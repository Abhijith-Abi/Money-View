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
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CalendarIcon, Clock } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["credit", "debit"]),
    date: z.date({
        message: "Date is required",
    }),
    hour: z.string().default("12"),
    minute: z.string().default("00"),
    description: z.string(),
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
            if (!selectedCustomer) throw new Error("Customer not found");

            // Combine date with hour and minute
            let finalDate = setHours(values.date, parseInt(values.hour));
            finalDate = setMinutes(finalDate, parseInt(values.minute));

            await addTransaction(
                {
                    customerId: values.customerId,
                    customerName: selectedCustomer.name,
                    amount: values.amount,
                    type: values.type,
                    date: finalDate,
                    description: values.description,
                    paymentMethod: values.paymentMethod,
                },
                user.uid,
            );

            toast({
                title: "Success",
                description: "Transaction recorded successfully",
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
            <DialogContent className="glass border-border/50 max-w-lg">
                <DialogHeader>
                    <DialogTitle>Record Entry</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {!customerId && (
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="glass">
                                                    <SelectValue placeholder="Select a customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass">
                                                {customers.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger
                                                    className={cn(
                                                        "glass",
                                                        field.value === "credit"
                                                            ? "border-emerald-500/50 text-emerald-400"
                                                            : "border-rose-500/50 text-rose-400",
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass">
                                                <SelectItem
                                                    value="credit"
                                                    className="text-emerald-400"
                                                >
                                                    Credit (Received)
                                                </SelectItem>
                                                <SelectItem
                                                    value="debit"
                                                    className="text-rose-400"
                                                >
                                                    Debit (Due/Sale)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                value={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                                onFocus={(e) =>
                                                    e.target.select()
                                                }
                                                className="glass"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal glass",
                                                            !field.value &&
                                                                "text-muted-foreground",
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP",
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0 glass"
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
                            <div className="space-y-2">
                                <Label>Time</Label>
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
                                                        <SelectTrigger className="glass">
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
                                    <span className="text-muted-foreground">
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
                                                        <SelectTrigger className="glass">
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
                                    <Clock className="h-4 w-4 text-muted-foreground opacity-50" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="glass">
                                                    <SelectValue placeholder="Method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass">
                                                <SelectItem value="cash">
                                                    Cash
                                                </SelectItem>
                                                <SelectItem value="upi">
                                                    UPI / Online
                                                </SelectItem>
                                                <SelectItem value="bank_transfer">
                                                    Bank Transfer
                                                </SelectItem>
                                                <SelectItem value="card">
                                                    Card
                                                </SelectItem>
                                                <SelectItem value="other">
                                                    Other
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description / Note</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="What is this for?"
                                            {...field}
                                            className="glass"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={
                                    form.watch("type") === "credit"
                                        ? "bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
                                        : "bg-rose-600 hover:bg-rose-700 w-full md:w-auto"
                                }
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {form.watch("type") === "credit"
                                    ? "Record Credit"
                                    : "Record Debit"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
