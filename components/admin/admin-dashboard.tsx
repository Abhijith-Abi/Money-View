"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCcw,
    Users,
    IndianRupee,
    Clock,
    ArrowUpCircle,
    Eye,
    CalendarClock,
    Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getAllUsersStats, AdminUserStats } from "@/lib/admin-service";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminUserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [permissionError, setPermissionError] = useState(false);
    const [missingCredentials, setMissingCredentials] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        setPermissionError(false);
        setMissingCredentials(false);
        try {
            const data = await getAllUsersStats();
            setStats(data);
            setLastUpdated(new Date());
        } catch (error: any) {
            console.error(error);
            if (error?.code === "CONFIG_MISSING") {
                setMissingCredentials(true);
            } else if (
                error?.code === "permission-denied" ||
                error?.message?.includes("Missing or insufficient permissions")
            ) {
                setPermissionError(true);
                toast({
                    variant: "destructive",
                    title: "Permission Denied",
                    description:
                        "Firestore rules blocked the request. See dashboard for fix.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error fetching data",
                    description:
                        "Could not load user statistics. Check console permissions.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalUsers = stats.length;
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const totalPending = stats.reduce(
        (acc, curr) => acc + curr.totalPending,
        0,
    );

    const filteredStats = stats.filter(
        (user) =>
            user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    if (permissionError) {
        return (
            <div className="min-h-screen p-6 md:p-12 flex items-center justify-center relative">
                <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
                <Card className="max-w-2xl w-full border-destructive/50 bg-destructive/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <IndianRupee className="w-6 h-6" />
                            Firebase Security Rule Blocked
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-base">
                            The Admin Dashboard tries to fetch{" "}
                            <strong>all users' data</strong>, but your current
                            Firestore security rules likely check for{" "}
                            <code>userId</code> match (standard security).
                        </p>
                        <div className="bg-black/5 dark:bg-black/40 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto border-l-4 border-destructive">
                            <p className="text-muted-foreground mb-2">
                                // Go to Firebase Console &gt; Firestore &gt;
                                Rules and use this for testing:
                            </p>
                            <pre className="text-destructive">
                                {`allow read: if true;`}
                            </pre>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Note: This allows <strong>anyone</strong> to read
                            your data. For better security, implement role-based
                            access in your internal backend logic or use a
                            specific admin UID check in rules.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (missingCredentials) {
        return (
            <div className="min-h-screen p-6 md:p-12 flex items-center justify-center relative">
                <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
                <Card className="max-w-2xl w-full border-amber-500/50 bg-amber-500/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <IndianRupee className="w-6 h-6" />
                            Missing Server Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-base">
                            The Admin Dashboard requires a{" "}
                            <strong>Firebase Service Account</strong> to
                            securely fetch user data.
                        </p>
                        <div className="bg-black/5 dark:bg-black/40 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto border-l-4 border-amber-500">
                            <p className="text-muted-foreground mb-2">
                                1. Go to Firebase Console &gt; Project Settings
                                &gt; Service accounts
                            </p>
                            <p className="text-muted-foreground mb-2">
                                2. Generate new private key (download JSON)
                            </p>
                            <p className="text-muted-foreground mb-2">
                                3. Set environment variable in{" "}
                                <code>.env.local</code>:
                            </p>
                            <pre className="text-amber-600 dark:text-amber-500">
                                {`GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"`}
                            </pre>
                            <p className="text-muted-foreground mt-2">
                                OR set <code>FIREBASE_SERVICE_ACCOUNT_KEY</code>{" "}
                                with the JSON content.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-12 space-y-8 relative">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-slate-50/50 dark:bg-slate-950/50 -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Overview of all user activities
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={fetchData}
                        disabled={loading}
                        className="gap-2"
                        variant="outline"
                    >
                        <RefreshCcw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh Data
                    </Button>
                    <Button
                        onClick={() => {
                            sessionStorage.removeItem("admin_auth");
                            window.location.reload();
                        }}
                        variant="destructive"
                        className="gap-2"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Hero Stats Section - Prioritizing Total Pending */}
                {/* Hero Stats Section - Professional & Clean */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Main Hero Card - Total Pending */}
                    <motion.div
                        variants={item}
                        className="md:col-span-2 lg:col-span-2"
                    >
                        <Card className="h-full relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                <Clock className="w-32 h-32" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    Total Outstanding
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl md:text-5xl font-semibold text-foreground mb-2 tracking-tight">
                                    {formatCurrency(totalPending)}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                                    Account-wide pending payments
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Secondary Stats - Total Received */}
                    <motion.div variants={item} className="lg:col-span-1">
                        <Card className="h-full relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm flex flex-col justify-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                    Total Received
                                    <IndianRupee className="h-4 w-4 text-emerald-600/70 dark:text-emerald-400/70" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-foreground">
                                    {formatCurrency(totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                                    Lifetime collected
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Total Users */}
                    <motion.div variants={item} className="lg:col-span-1">
                        <Card className="h-full relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm flex flex-col justify-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                    Total Users
                                    <Users className="h-4 w-4 text-purple-600/70 dark:text-purple-400/70" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-foreground">
                                    {totalUsers}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
                                    Active accounts
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Last Updated Card */}
                    <motion.div variants={item} className="lg:col-span-4">
                        <Card className="relative overflow-hidden border border-border/40 shadow-none bg-secondary/20">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-background rounded-full border border-border shadow-sm">
                                        <CalendarClock className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">
                                            Data Synced:
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {lastUpdated
                                                ? lastUpdated.toLocaleTimeString(
                                                      [],
                                                      {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      },
                                                  )
                                                : "Syncing..."}
                                        </span>
                                        <span className="text-xs text-muted-foreground/70">
                                            {lastUpdated
                                                ? lastUpdated.toLocaleDateString()
                                                : ""}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* User Table Section */}
                <motion.div variants={item}>
                    <Card className="border border-border/60 shadow-lg bg-card/95 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-border/40 px-6 py-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl font-bold text-foreground">
                                        User Registry
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Manage user accounts and view financial
                                        summaries
                                    </p>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-9 bg-secondary/50 border-input focus:bg-background transition-all"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/60">
                                            <TableHead className="w-[80px] font-semibold text-center text-[11px] uppercase tracking-widest text-muted-foreground/80 py-4">
                                                #
                                            </TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-widest min-w-[200px] text-muted-foreground/80">
                                                User
                                            </TableHead>
                                            <TableHead className="text-right font-semibold text-[11px] uppercase tracking-widest min-w-[150px] text-muted-foreground/80">
                                                Total Received
                                            </TableHead>
                                            <TableHead className="text-right font-semibold text-[11px] uppercase tracking-widest min-w-[150px] text-muted-foreground/80">
                                                Total Pending
                                            </TableHead>
                                            <TableHead className="text-center font-semibold text-[11px] uppercase tracking-widest w-[100px] text-muted-foreground/80">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-60 text-center"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                                        </div>
                                                        <p className="text-muted-foreground animate-pulse font-medium">
                                                            Synced with
                                                            database...
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredStats.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-60 text-center"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                        <Users className="w-12 h-12 opacity-20" />
                                                        <p className="text-lg font-medium">
                                                            No users found
                                                        </p>
                                                        <p className="text-sm">
                                                            Try adjusting your
                                                            search terms
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredStats.map((user, index) => (
                                                <TableRow
                                                    key={user.userId}
                                                    className="group hover:bg-muted/30 transition-all border-border/30 cursor-pointer"
                                                    onClick={() =>
                                                        (window.location.href = `/admin/user/${user.userId}`)
                                                    }
                                                >
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                        {(index + 1)
                                                            .toString()
                                                            .padStart(2, "0")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                                                <AvatarImage
                                                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.userName}`}
                                                                />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                    {user.userName
                                                                        .substring(
                                                                            0,
                                                                            2,
                                                                        )
                                                                        .toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                    {
                                                                        user.userName
                                                                    }
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                    {
                                                                        user.userEmail
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="font-medium text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(
                                                                user.totalIncome,
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div
                                                            className={`font-medium ${user.totalPending > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                                                        >
                                                            {formatCurrency(
                                                                user.totalPending,
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-full hover:bg-muted transition-all opacity-50 group-hover:opacity-100"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
