"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getUserEntries } from "@/lib/admin-service";
import { IncomeEntry } from "@/types/income";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchEntries = async () => {
            setLoading(true);
            try {
                const data = await getUserEntries(userId);
                setEntries(data);
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load user entries",
                });
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchEntries();
        }
    }, [userId]);

    const totalIncome = entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + e.amount, 0);

    const totalPending = entries
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + e.amount, 0);

    const totalReceived = entries
        .filter((e) => e.status === "received")
        .reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="min-h-screen p-6 md:p-12 space-y-8 relative">
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            User Details
                        </h1>
                        <p className="text-muted-foreground text-sm font-mono mt-1">
                            {userId}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        sessionStorage.removeItem("admin_auth");
                        router.push("/admin");
                    }}
                    variant="destructive"
                    size="sm"
                >
                    Logout
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass border-white/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Income
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(totalIncome)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(totalPending)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting payment
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Received
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(totalReceived)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Completed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="glass border-white/20 shadow-xl">
                    <CardHeader>
                        <CardTitle>All Income Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Month/Year</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            Loading entries...
                                        </TableCell>
                                    </TableRow>
                                ) : entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            No entries found for this user.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-sm">
                                                {entry.createdAt.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {entry.month} {entry.year}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        entry.category ===
                                                        "primary"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {entry.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        entry.type === "credit"
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                >
                                                    {entry.type === "credit" ? (
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                    )}
                                                    {entry.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        entry.status ===
                                                        "received"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                >
                                                    {entry.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                                {entry.description || "-"}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-medium ${
                                                    entry.type === "credit"
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-red-600 dark:text-red-400"
                                                }`}
                                            >
                                                {entry.type === "credit"
                                                    ? "+"
                                                    : "-"}
                                                {formatCurrency(entry.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
