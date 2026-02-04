"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BusinessProfile } from "@/types/customer";
import {
    createBusinessProfile,
    updateBusinessProfile,
    getBusinessProfile,
} from "@/lib/business-service";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Invalid email").or(z.literal("")),
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string(),
    taxId: z.string(),
    currency: z.string(),
});

interface FormValues {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    currency: string;
}

export function BusinessProfileForm({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: "",
            ownerName: "",
            email: "",
            phone: "",
            address: "",
            taxId: "",
            currency: "INR",
        },
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const data = await getBusinessProfile(user.uid);
                if (data) {
                    setProfile(data);
                    form.reset({
                        businessName: data.businessName,
                        ownerName: data.ownerName,
                        email: data.email || "",
                        phone: data.phone,
                        address: data.address || "",
                        taxId: data.taxId || "",
                        currency: data.currency,
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setFetching(false);
            }
        }
        fetchProfile();
    }, [user, form]);

    async function onSubmit(values: FormValues) {
        if (!user) return;
        setLoading(true);
        try {
            if (profile) {
                await updateBusinessProfile(profile.id, user.uid, values);
                toast({
                    title: "Success",
                    description: "Business profile updated successfully",
                });
            } else {
                await createBusinessProfile(values, user.uid);
                toast({
                    title: "Success",
                    description: "Business profile created successfully",
                });
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save business profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="glass border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/10">
                    <CardTitle className="text-xl font-bold">
                        Business Profile Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Business Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Acme Corp"
                                                    {...field}
                                                    className="glass h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ownerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Owner Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="John Doe"
                                                    {...field}
                                                    className="glass h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Business Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="info@acme.com"
                                                    {...field}
                                                    className="glass h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Phone Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="+91 9876543210"
                                                    {...field}
                                                    className="glass h-11"
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123 Street Name, City"
                                                {...field}
                                                className="glass h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="taxId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Tax ID / GSTIN (Optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="GSTIN12345"
                                                    {...field}
                                                    className="glass h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Currency
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="INR"
                                                    {...field}
                                                    className="glass h-11 text-center"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-widest text-xs"
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {profile ? "Update Profile" : "Create Profile"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </motion.div>
    );
}
