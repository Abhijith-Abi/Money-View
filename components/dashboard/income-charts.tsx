"use client";

import { useState, useEffect } from "react";
import { MonthlyStats, AnnualStats } from "@/types/income";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, BarChart3, TrendingUp } from "lucide-react";

interface IncomeChartsProps {
    monthlyStats: MonthlyStats[];
    annualStats: AnnualStats[];
    loading: boolean;
    selectedYear?: number;
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass bg-popover/95 text-popover-foreground border border-border p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[170px]">
                <p className="font-bold border-b border-border pb-1 uppercase tracking-wider text-[11px] text-foreground">
                    {label}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={`tooltip-${index}`}
                        className="flex items-center justify-between gap-3 text-[11px]"
                    >
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground capitalize font-medium">
                                {entry.name}:
                            </span>
                        </div>
                        <span className="font-bold text-foreground">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function IncomeCharts({
    monthlyStats,
    annualStats,
    loading,
    selectedYear = new Date().getFullYear(),
}: IncomeChartsProps) {
    const [viewMode, setViewMode] = useState<"month" | "year">("month");
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (loading) {
        return (
            <Card className="glass rounded-2xl border-border/70">
                <CardContent className="p-6">
                    <div className="h-80 bg-muted/40 animate-pulse rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const yearlyData = annualStats.filter((stat) => stat.year >= 2020);

    return (
        <Card className="glass relative overflow-hidden rounded-2xl border-border/70 shadow-sm dark:shadow-2xl">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Income Trends & Analytics
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {viewMode === "month"
                            ? `Monthly overview for year ${selectedYear}`
                            : "Year-over-year annual income comparison"}
                    </p>
                </div>

                {/* View Mode Toggle: Monthly vs Yearly */}
                <div className="flex bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border w-fit">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("month")}
                        className={`text-xs h-7 px-3 rounded-lg font-semibold transition-all ${
                            viewMode === "month"
                                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Monthly ({selectedYear})
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("year")}
                        className={`text-xs h-7 px-3 rounded-lg font-semibold transition-all ${
                            viewMode === "year"
                                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                        Yearly Comparison
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-2 sm:pt-4">
                <AnimatePresence mode="wait">
                    {viewMode === "month" ? (
                        <motion.div
                            key="month-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-[340px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={monthlyStats}
                                    margin={{
                                        top: 10,
                                        right: 15,
                                        left: isMobile ? -20 : 10,
                                        bottom: 5,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="receivedGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#9333ea"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#9333ea"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="pendingGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f59e0b"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f59e0b"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="currentColor"
                                        className="text-border opacity-40"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 500,
                                        }}
                                        className="text-muted-foreground"
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 500,
                                        }}
                                        className="text-muted-foreground"
                                        tickFormatter={(v) =>
                                            v >= 1000
                                                ? `₹${(v / 1000).toFixed(0)}k`
                                                : `₹${v}`
                                        }
                                        hide={isMobile}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "15px" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="received"
                                        name="Received (Paid)"
                                        stroke="#9333ea"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#receivedGrad)"
                                        activeDot={{ r: 5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        name="Pending (Receivable)"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        fillOpacity={1}
                                        fill="url(#pendingGrad)"
                                        activeDot={{ r: 4 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="year-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-[340px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={yearlyData}
                                    margin={{
                                        top: 10,
                                        right: 15,
                                        left: isMobile ? -20 : 10,
                                        bottom: 5,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="barReceivedGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#10b981"
                                                stopOpacity={1}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#059669"
                                                stopOpacity={1}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="barPendingGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#f59e0b"
                                                stopOpacity={1}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#d97706"
                                                stopOpacity={1}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="currentColor"
                                        className="text-border opacity-40"
                                    />
                                    <XAxis
                                        dataKey="year"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 500,
                                        }}
                                        className="text-muted-foreground"
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 500,
                                        }}
                                        className="text-muted-foreground"
                                        tickFormatter={(v) =>
                                            v >= 1000
                                                ? `₹${(v / 1000).toFixed(0)}k`
                                                : `₹${v}`
                                        }
                                        hide={isMobile}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "15px" }}
                                    />
                                    <Bar
                                        dataKey="received"
                                        name="Total Received"
                                        fill="url(#barReceivedGrad)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={isMobile ? 24 : 36}
                                    />
                                    <Bar
                                        dataKey="pending"
                                        name="Total Pending"
                                        fill="url(#barPendingGrad)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={isMobile ? 24 : 36}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
