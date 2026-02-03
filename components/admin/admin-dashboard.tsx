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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <motion.div variants={item}>
                    <Card className="glass border-white/20 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalUsers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active platform users
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="glass border-white/20 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Tracked Income
                            </CardTitle>
                            <IndianRupee className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across all users
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="glass border-white/20 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Pending
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(totalPending)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Outstanding payments
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="glass border-white/20 shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead>Entries</TableHead>
                                    <TableHead className="text-right">
                                        Total Income
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Pending
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Received
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
                                            Loading user data...
                                        </TableCell>
                                    </TableRow>
                                ) : stats.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            No user data found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.map((user) => (
                                        <TableRow
                                            key={user.userId}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() =>
                                                (window.location.href = `/admin/user/${user.userId}`)
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                {user.userName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {user.userEmail}
                                            </TableCell>
                                            <TableCell>
                                                {user.lastActive.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {user.entryCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(
                                                    user.totalIncome,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-amber-600 dark:text-amber-400">
                                                {formatCurrency(
                                                    user.totalPending,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-blue-600 dark:text-blue-400">
                                                {formatCurrency(
                                                    user.totalReceived,
                                                )}
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
