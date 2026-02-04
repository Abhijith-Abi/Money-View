"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Customer } from "@/types/customer";
import { addCustomer, updateCustomer } from "@/lib/customer-service";
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
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().email("Invalid email").or(z.literal("")),
    address: z.string(),
    openingBalance: z.coerce.number(),
    balanceType: z.enum(["credit", "debit"]).default("credit"),
    date: z.date({
        message: "Date is required",
    }),
    hour: z.string().default("12"),
    minute: z.string().default("00"),
    status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
    customer?: Customer | null;
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

export function CustomerForm({
    customer,
    open,
    onOpenChange,
    onSuccess,
}: CustomerFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: customer?.name || "",
            phone: customer?.phone || "",
            email: customer?.email || "",
            address: customer?.address || "",
            openingBalance: customer?.openingBalance
                ? Math.abs(customer.openingBalance)
                : 0,
            balanceType:
                customer?.openingBalance && customer.openingBalance < 0
                    ? "debit"
                    : "credit",
            date: customer?.createdAt
                ? new Date(customer.createdAt)
                : new Date(),
            hour: customer?.createdAt
                ? format(new Date(customer.createdAt), "HH")
                : format(new Date(), "HH"),
            minute: customer?.createdAt
                ? format(new Date(customer.createdAt), "mm")
                : format(new Date(), "mm"),
            status: customer?.status || "active",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: customer?.name || "",
                phone: customer?.phone || "",
                email: customer?.email || "",
                address: customer?.address || "",
                openingBalance: customer?.openingBalance
                    ? Math.abs(customer.openingBalance)
                    : 0,
                balanceType:
                    customer?.openingBalance && customer.openingBalance < 0
                        ? "debit"
                        : "credit",
                date: customer?.createdAt
                    ? new Date(customer.createdAt)
                    : new Date(),
                hour: customer?.createdAt
                    ? format(new Date(customer.createdAt), "HH")
                    : format(new Date(), "HH"),
                minute: customer?.createdAt
                    ? format(new Date(customer.createdAt), "mm")
                    : format(new Date(), "mm"),
                status: customer?.status || "active",
            });
        }
    }, [open, customer, form]);

    async function onSubmit(values: FormValues) {
        if (!user) return;
        setLoading(true);
        try {
            // Combine date with hour and minute
            let finalDate = setHours(values.date, parseInt(values.hour));
            finalDate = setMinutes(finalDate, parseInt(values.minute));

            // Adjust balance based on type (debit = negative, credit = positive)
            const finalBalance =
                values.balanceType === "debit"
                    ? -Math.abs(values.openingBalance)
                    : Math.abs(values.openingBalance);

            const customerData = {
                name: values.name,
                phone: values.phone,
                email: values.email,
                address: values.address,
                openingBalance: finalBalance,
                status: values.status,
                date: finalDate, // Passed to service to set createdAt
            };

            if (customer) {
                await updateCustomer(
                    customer.id,
                    user.uid,
                    customerData as any,
                );
                toast({
                    title: "Success",
                    description: "Customer updated successfully",
                });
            } else {
                await addCustomer(customerData as any, user.uid);
                toast({
                    title: "Success",
                    description: "Customer added successfully",
                });
            }
            onOpenChange(false);
            onSuccess();
            form.reset();
        } catch (error) {
            console.error("Error saving customer:", error);
            toast({
                title: "Error",
                description: "Failed to save customer",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-border/50 max-w-lg overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {customer ? "Edit Customer" : "Add New Customer"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Customer Name"
                                            {...field}
                                            className="glass"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+91 9876543210"
                                                {...field}
                                                className="glass"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="customer@example.com"
                                                {...field}
                                                className="glass"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Customer address"
                                            {...field}
                                            className="glass"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!customer && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="openingBalance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Opening Balance
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        {...field}
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
                                    <FormField
                                        control={form.control}
                                        name="balanceType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Balance Type
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger
                                                            className={cn(
                                                                "glass",
                                                                field.value ===
                                                                    "credit"
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
                                                            Credit (Advance)
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="debit"
                                                            className="text-rose-400"
                                                        >
                                                            Debit (Due)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                <FormLabel>
                                                    Opening Date
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
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
                                                                        Pick a
                                                                        date
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
                                                            selected={
                                                                field.value
                                                            }
                                                            onSelect={
                                                                field.onChange
                                                            }
                                                            disabled={(date) =>
                                                                date >
                                                                    new Date() ||
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
                                                                {hours.map(
                                                                    (h) => (
                                                                        <SelectItem
                                                                            key={
                                                                                h
                                                                            }
                                                                            value={
                                                                                h
                                                                            }
                                                                        >
                                                                            {h}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
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
                                                                {minutes.map(
                                                                    (m) => (
                                                                        <SelectItem
                                                                            key={
                                                                                m
                                                                            }
                                                                            value={
                                                                                m
                                                                            }
                                                                        >
                                                                            {m}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                            <Clock className="h-4 w-4 text-muted-foreground opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {customer ? "Update" : "Add Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
