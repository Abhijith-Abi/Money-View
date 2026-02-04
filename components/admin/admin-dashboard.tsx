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
} from "lucide-react";
import { getAllUsersStats, AdminUserStats } from "@/lib/admin-service";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminUserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        setPermissionError(false);
        try {
            const data = await getAllUsersStats();
            setStats(data);
        } catch (error: any) {
            console.error(error);
            if (
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

    return (
        <div className="min-h-screen p-6 md:p-12 space-y-8 relative">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Main Hero Card - Total Pending */}
                    <motion.div
                        variants={item}
                        className="md:col-span-2 lg:col-span-2"
                    >
                        <Card className="h-full glass border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock className="w-24 h-24 text-amber-500" />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Total Outstanding
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl md:text-5xl font-bold text-amber-700 dark:text-amber-300 mb-2">
                                    {formatCurrency(totalPending)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Total pending payments across all users
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Secondary Stats */}
                    <motion.div variants={item} className="lg:col-span-1">
                        <Card className="h-full glass border-white/20 shadow-lg flex flex-col justify-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                    Total Tracked Income
                                    <IndianRupee className="h-4 w-4 text-emerald-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Lifetime revenue
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item} className="lg:col-span-1">
                        <Card className="h-full glass border-white/20 shadow-lg flex flex-col justify-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                    Total Users
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {totalUsers}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Active accounts
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* User Table Section */}
                <motion.div variants={item}>
                    <Card className="glass border-white/20 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>User Registry</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Manage and view user details
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-border/30">
                                        <TableHead className="w-[250px] font-bold">
                                            User Name
                                        </TableHead>
                                        <TableHead className="font-bold">
                                            Email
                                        </TableHead>
                                        <TableHead className="text-center font-bold">
                                            Entries
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            Total Income
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-amber-600 dark:text-amber-400">
                                            Pending
                                        </TableHead>
                                        <TableHead className="text-center font-bold">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCcw className="h-6 w-6 animate-spin" />
                                                    <p>Loading user data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : stats.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stats.map((user) => (
                                            <TableRow
                                                key={user.userId}
                                                className="hover:bg-muted/40 transition-colors border-border/30"
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-base">
                                                            {user.userName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground md:hidden">
                                                            {user.userEmail}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground hidden md:table-cell">
                                                    {user.userEmail}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-slate-100 dark:bg-slate-800"
                                                    >
                                                        {user.entryCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(
                                                        user.totalIncome,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                                                    {formatCurrency(
                                                        user.totalPending,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                                        onClick={() =>
                                                            (window.location.href = `/admin/user/${user.userId}`)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            View User
                                                        </span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
