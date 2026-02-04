"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCustomerStats } from "@/lib/customer-service";
import { getRecentTransactions } from "@/lib/ledger-service";
import { getBusinessProfile } from "@/lib/business-service";
import { CustomerStats, Transaction, BusinessProfile } from "@/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    ArrowUpCircle,
    ArrowDownCircle,
    Activity,
    TrendingUp,
    Building2,
    Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

export function BusinessDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
        [],
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [statsData, transactions, profileData] =
                    await Promise.all([
                        getCustomerStats(user.uid),
                        getRecentTransactions(user.uid, 5),
                        getBusinessProfile(user.uid),
                    ]);
                setStats(statsData);
                setRecentTransactions(transactions);
                setProfile(profileData);
                console.log("Dashboard data loaded:", {
                    customers: statsData?.totalCustomers,
                    transactions: transactions.length,
                    hasProfile: !!profileData,
                });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const statCards = [
        {
            title: "Total Customers",
            value: stats?.totalCustomers || 0,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            title: "Total Receivables",
            value: `₹${(stats?.totalReceivables || 0).toLocaleString("en-IN")}`,
            icon: ArrowDownCircle,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Total Payables",
            value: `₹${(stats?.totalPayables || 0).toLocaleString("en-IN")}`,
            icon: ArrowUpCircle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
        },
        {
            title: "Active Customers",
            value: stats?.activeCustomers || 0,
            icon: Activity,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl glass border-border/50 gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                        {profile?.businessName || "Your Business"}
                    </h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {profile?.ownerName || "Business Management"}
                    </p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                        Current Date
                    </p>
                    <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        })}
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={
                            index >= 2
                                ? "col-span-1 sm:col-span-1"
                                : "col-span-1"
                        }
                    >
                        <Card className="glass border-border/50 overflow-hidden relative group hover:border-purple-500/20 transition-all h-full">
                            <div
                                className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}
                            >
                                <stat.icon
                                    size={32}
                                    className="md:size-[40px]"
                                />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
                                <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    {stat.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div
                                    className={`text-lg md:text-2xl font-bold ${stat.color} break-all`}
                                >
                                    {loading ? "..." : stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass border-border/50 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-400" />
                            Recent Business Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-40 flex items-center justify-center">
                                Loading...
                            </div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-muted-foreground">
                                No recent transactions.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentTransactions.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2 rounded-full ${t.type === "credit" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                                            >
                                                {t.type === "credit" ? (
                                                    <ArrowDownCircle className="h-4 w-4" />
                                                ) : (
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {t.customerName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.description ||
                                                        "No description"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={`font-bold ${t.type === "credit" ? "text-emerald-400" : "text-rose-400"}`}
                                            >
                                                {t.type === "credit"
                                                    ? "+"
                                                    : "-"}
                                                ₹
                                                {t.amount.toLocaleString(
                                                    "en-IN",
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    t.date,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-border/50">
                                <h3 className="text-sm font-semibold mb-2">
                                    Business Health
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your total receivables are{" "}
                                    {stats &&
                                    stats.totalReceivables > stats.totalPayables
                                        ? "higher"
                                        : "lower"}{" "}
                                    than payables. Focus on collecting due
                                    amounts from your {stats?.activeCustomers}{" "}
                                    active customers.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Receivables vs Payables</span>
                                    <span>
                                        {stats
                                            ? Math.round(
                                                  (stats.totalReceivables /
                                                      (stats.totalReceivables +
                                                          stats.totalPayables ||
                                                          1)) *
                                                      100,
                                              )
                                            : 0}
                                        %
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: stats
                                                ? `${(stats.totalReceivables / (stats.totalReceivables + stats.totalPayables || 1)) * 100}%`
                                                : "0%",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
