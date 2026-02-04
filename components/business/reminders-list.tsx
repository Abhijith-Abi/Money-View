"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAllCustomers } from "@/lib/customer-service";
import { Customer } from "@/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { BusinessLoader } from "./business-loader";

export function RemindersList() {
    const { user } = useAuth();
    const [dueCustomers, setDueCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDueCustomers() {
            if (!user) return;
            try {
                const data = await getAllCustomers(user.uid);
                // Customers who owe money (balance > 0 in our logic, where credit > debit)
                // Wait, in ledger logic: balance = credit - debit.
                // If I'm a business, and I give credit to customer (debit entry), balance goes negative.
                // If customer pays (credit entry), balance goes positive.
                // So balance < 0 means customer owes me.
                const due = data
                    .filter((c) => c.currentBalance < 0)
                    .sort((a, b) => a.currentBalance - b.currentBalance);
                setDueCustomers(due);
            } catch (error) {
                console.error("Error fetching due customers:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDueCustomers();
    }, [user]);

    if (loading) {
        return <BusinessLoader />;
    }

    return (
        <Card className="glass border-border/50 shadow-2xl shadow-amber-500/5">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/5">
                <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                    <Bell className="h-5 w-5 text-amber-400" />
                    Payment Reminders
                </CardTitle>
                <p className="text-xs text-muted-foreground/70">
                    Automatic tracking of pending collections
                </p>
            </CardHeader>
            <CardContent className="pt-6">
                {dueCustomers.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground flex-col gap-2">
                        <AlertCircle className="h-8 w-8 opacity-20" />
                        <p>No pending payments at the moment!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dueCustomers.map((customer, index) => (
                            <motion.div
                                key={customer.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 transition-all gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold shrink-0">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm sm:text-base">
                                            {customer.name}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Last updated{" "}
                                            {customer.updatedAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/10">
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm font-bold text-rose-400">
                                            ₹
                                            {Math.abs(
                                                customer.currentBalance,
                                            ).toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                            Amount Due
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="glass h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                                    >
                                        Mark Sent
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
