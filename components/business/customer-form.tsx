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
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CalendarIcon, Clock, User, Phone, Mail, MapPin } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(2, "Customer name is required"),
    phone: z.string().min(10, "Valid 10-digit phone number is required"),
    email: z.string().email("Invalid email address").or(z.literal("")),
    address: z.string().optional().default(""),
    date: z.date({
        message: "Date is required",
    }),
    hour: z.string().default("12"),
    minute: z.string().default("00"),
    status: z.enum(["active", "inactive"]).default("active"),
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

            const customerData = {
                name: values.name.trim(),
                phone: values.phone.trim(),
                email: values.email.trim(),
                address: (values.address || "").trim(),
                openingBalance: customer?.openingBalance || 0,
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
                    title: "Updated",
                    description: `${values.name} details updated successfully`,
                });
            } else {
                await addCustomer(customerData as any, user.uid);
                toast({
                    title: "Customer Added",
                    description: `${values.name} has been added to your ledger`,
                });
            }
            onOpenChange(false);
            onSuccess();
            form.reset();
        } catch (error) {
            console.error("Error saving customer:", error);
            toast({
                title: "Error",
                description: "Failed to save customer. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 dark:border-white/10 max-w-lg w-full p-6 sm:p-7 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-400" />
                        {customer ? "Edit Customer" : "Add New Customer"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {customer
                            ? "Update customer contact details & status"
                            : "Enter customer name, contact info, and registration date"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-foreground">
                                        Customer Name *
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="e.g. Rahul Sharma"
                                                {...field}
                                                className="glass pl-10 h-11 rounded-xl text-sm border-border/60 focus:border-purple-500"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone and Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-foreground">
                                            Phone Number *
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="+91 9876543210"
                                                    {...field}
                                                    className="glass pl-10 h-11 rounded-xl text-sm border-border/60 focus:border-purple-500"
                                                />
                                            </div>
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
                                        <FormLabel className="text-xs font-bold text-foreground">
                                            Email (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    placeholder="customer@email.com"
                                                    {...field}
                                                    className="glass pl-10 h-11 rounded-xl text-sm border-border/60 focus:border-purple-500"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-foreground">
                                        Address / Location (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="City, Area or Street Address"
                                                {...field}
                                                className="glass pl-10 h-11 rounded-xl text-sm border-border/60 focus:border-purple-500"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date and Time (Creation/Joining) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs font-bold text-foreground mb-1">
                                            Date Added
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
                                                            <span>
                                                                Select date
                                                            </span>
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

                        {/* Customer Status */}
                        {customer && (
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-foreground">
                                            Status
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="glass h-11 rounded-xl border-border/60">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass">
                                                <SelectItem value="active">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="inactive">
                                                    Inactive
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
                                disabled={loading}
                                className="h-11 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {customer ? "Save Changes" : "Add Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
