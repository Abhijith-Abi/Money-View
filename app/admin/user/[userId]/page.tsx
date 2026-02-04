"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    RefreshCcw,
    History,
    ArrowUp as ArrowUpIcon,
    ArrowDown as ArrowDownIcon,
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserDetails, AdminUserStats } from "@/lib/admin-service";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [userDetails, setUserDetails] = useState<
        AdminUserStats | undefined
    >();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof IncomeEntry | "amount";
        direction: "asc" | "desc";
    }>({ key: "createdAt", direction: "desc" });
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [entriesData, userData] = await Promise.all([
                    getUserEntries(userId),
                    getUserDetails(userId),
                ]);
                setEntries(entriesData);
                setUserDetails(userData);
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load user data",
                });
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const filteredEntries = entries.filter((entry) => {
        if (filter === "all") return true;
        return entry.status === filter;
    });

    const totalPending = entries
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + e.amount, 0);

    const totalReceived = entries
        .filter((e) => e.status === "received")
        .reduce((sum, e) => sum + e.amount, 0);

    const sortedEntries = [...filteredEntries].sort((a, b) => {
        const { key, direction } = sortConfig;
        let aValue: any = a[key as keyof IncomeEntry];
        let bValue: any = b[key as keyof IncomeEntry];

        if (key === "createdAt") {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        } else if (key === "amount") {
            aValue = a.amount;
            bValue = b.amount;
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const requestSort = (key: keyof IncomeEntry | "amount") => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4" />;
        return sortConfig.direction === "asc" ? (
            <ArrowUpIcon className="w-4 h-4 ml-1" />
        ) : (
            <ArrowDownIcon className="w-4 h-4 ml-1" />
        );
    };

    return (
        <div className="min-h-screen p-6 md:p-12 space-y-8 relative">
            <div className="fixed inset-0 bg-slate-50/50 dark:bg-slate-950/50 -z-10" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            {userDetails?.userName || "User Details"}
                        </h1>
                        <div className="flex flex-col gap-1 mt-1">
                            {userDetails?.userEmail &&
                                userDetails.userEmail !== "N/A" && (
                                    <p className="text-sm font-medium text-foreground">
                                        {userDetails.userEmail}
                                    </p>
                                )}
                            <p className="text-muted-foreground text-xs font-mono">
                                ID: {userId}
                            </p>
                        </div>
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

            {/* Stats Cards - Professional Modern Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Total Pending Card */}
                <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Outstanding
                        </CardTitle>
                        <div className="p-2 bg-amber-500/10 rounded-full">
                            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-semibold text-foreground">
                            {formatCurrency(totalPending)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                            Awaiting payment
                        </p>
                    </CardContent>
                </Card>

                {/* Total Received Card */}
                <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <DollarSign className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Received
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-full">
                            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-semibold text-foreground">
                            {formatCurrency(totalReceived)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                            Lifetime collected
                        </p>
                    </CardContent>
                </Card>

                {/* Last Activity Card */}
                <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <History className="w-32 h-32" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Last Activity
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl font-semibold text-foreground">
                            {userDetails?.lastActive
                                ? userDetails.lastActive.toLocaleString(
                                      "default",
                                      { month: "short", year: "numeric" },
                                  )
                                : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500/60" />
                            Most recent update
                        </p>
                    </CardContent>
                </Card>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border border-border/60 shadow-lg bg-card/95 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-border/40 bg-secondary/10 pb-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <span className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <RefreshCcw className="w-5 h-5" />
                                </span>
                                Transactions
                            </CardTitle>
                            <Tabs
                                defaultValue="all"
                                value={filter}
                                onValueChange={setFilter}
                                className="w-full md:w-auto"
                            >
                                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger
                                        value="pending"
                                        className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/40 dark:data-[state=active]:text-amber-100"
                                    >
                                        Pending
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="received"
                                        className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-100"
                                    >
                                        Received
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border/60">
                                    <TableHead className="w-[60px] text-center text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80 py-4">
                                        #
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:text-primary transition-colors text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80"
                                        onClick={() => requestSort("createdAt")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Date {getSortIcon("createdAt")}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:text-primary transition-colors text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80"
                                        onClick={() => requestSort("month")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Period {getSortIcon("month")}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:text-primary transition-colors text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80"
                                        onClick={() => requestSort("category")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Category {getSortIcon("category")}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:text-primary transition-colors text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80"
                                        onClick={() => requestSort("status")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Status {getSortIcon("status")}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80">
                                        Description
                                    </TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:text-primary transition-colors text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/80"
                                        onClick={() => requestSort("amount")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Amount {getSortIcon("amount")}
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCcw className="h-6 w-6 animate-spin" />
                                                <p>Loading transactions...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedEntries.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            No {filter === "all" ? "" : filter}{" "}
                                            transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedEntries.map((entry, index) => (
                                        <TableRow
                                            key={entry.id}
                                            className="hover:bg-muted/30 transition-all duration-200 border-border/30 group"
                                        >
                                            <TableCell className="text-center font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                {String(index + 1).padStart(
                                                    2,
                                                    "0",
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-foreground/80">
                                                {entry.createdAt.toLocaleDateString(
                                                    undefined,
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    },
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <span className="font-medium text-foreground/90">
                                                    {entry.month}
                                                </span>{" "}
                                                <span className="text-muted-foreground text-xs">
                                                    {entry.year}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        entry.category ===
                                                        "primary"
                                                            ? "border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10 dark:text-purple-300 transition-colors"
                                                            : "border-slate-500/30 text-slate-600 bg-slate-500/5 hover:bg-slate-500/10 dark:text-slate-400 transition-colors"
                                                    }
                                                >
                                                    {entry.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        entry.status ===
                                                        "pending"
                                                            ? "border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 dark:text-amber-400 transition-colors"
                                                            : "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 transition-colors"
                                                    }
                                                >
                                                    {entry.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm font-light">
                                                {entry.description || "-"}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-mono font-bold text-base tracking-tight ${
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
