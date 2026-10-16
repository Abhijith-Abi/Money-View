"use client";

import { useState, useEffect, useMemo } from "react";
import { MonthlyStats, AnnualStats } from "@/types/income";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
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
import {
    Calendar,
    BarChart3,
    Activity,
    Layers,
    Sparkles,
} from "lucide-react";
import {
    AnimatedTrendUpIcon,
    AnimatedPulseRing,
} from "@/components/ui/animated-icons";

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
        const total = payload.reduce((acc: number, entry: any) => acc + (Number(entry.value) || 0), 0);
        return (
            <div className="glass bg-popover/95 text-popover-foreground border border-border/80 p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[190px] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                    <span className="font-black uppercase tracking-wider text-[11px] text-foreground">
                        {label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60">
                        {formatCurrency(total)}
                    </span>
                </div>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div
                            key={`tooltip-${index}`}
                            className="flex items-center justify-between gap-3 text-[11px]"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20 shrink-0"
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
    const [timeframe, setTimeframe] = useState<"month" | "year">("month");
    const [chartType, setChartType] = useState<"area" | "bar">("area");
    const [metricFilter, setMetricFilter] = useState<"settlement" | "streams">("settlement");
    const isMobile = useMediaQuery("(max-width: 768px)");

    // Normalize yearly data so if there are only 1-2 years, it renders proportionally
    const normalizedYearlyData = useMemo(() => {
        const yearsMap = new Map<number, { year: number; received: number; pending: number; total: number }>();
        
        // Base range from min year to max year
        const currentY = new Date().getFullYear();
        const baseYears = [currentY - 2, currentY - 1, currentY, currentY + 1];
        baseYears.forEach((y) => {
            yearsMap.set(y, { year: y, received: 0, pending: 0, total: 0 });
        });

        annualStats.forEach((stat) => {
            if (stat.year >= 2020) {
                yearsMap.set(stat.year, {
                    year: stat.year,
                    received: stat.received || 0,
                    pending: stat.pending || 0,
                    total: stat.total || 0,
                });
            }
        });

        return Array.from(yearsMap.values()).sort((a, b) => a.year - b.year);
    }, [annualStats]);

    // Active dataset totals
    const activeSummary = useMemo(() => {
        if (timeframe === "month") {
            const totalReceived = monthlyStats.reduce((sum, m) => sum + (m.received || 0), 0);
            const totalPending = monthlyStats.reduce((sum, m) => sum + (m.pending || 0), 0);
            const grandTotal = totalReceived + totalPending;
            const settlementRate = grandTotal > 0 ? Math.round((totalReceived / grandTotal) * 100) : 0;
            return { totalReceived, totalPending, grandTotal, settlementRate };
        } else {
            const totalReceived = annualStats.reduce((sum, a) => sum + (a.received || 0), 0);
            const totalPending = annualStats.reduce((sum, a) => sum + (a.pending || 0), 0);
            const grandTotal = totalReceived + totalPending;
            const settlementRate = grandTotal > 0 ? Math.round((totalReceived / grandTotal) * 100) : 0;
            return { totalReceived, totalPending, grandTotal, settlementRate };
        }
    }, [timeframe, monthlyStats, annualStats]);

    if (loading) {
        return (
            <Card className="glass rounded-3xl border-border/70">
                <CardContent className="p-6">
                    <div className="h-80 bg-muted/40 animate-pulse rounded-2xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentData = timeframe === "month" ? monthlyStats : normalizedYearlyData;

    return (
        <Card className="glass relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all">
            {/* Header with Title and Mode Controls */}
            <CardHeader className="p-5 sm:p-7 pb-3 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Title & Info */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 shrink-0">
                            <AnimatedTrendUpIcon size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                Financial Analytics & Trends
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider hidden sm:inline">
                                    Interactive
                                </span>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                {timeframe === "month"
                                    ? `Monthly inflow progression for FY ${selectedYear}`
                                    : "Year-over-year annual income progression"}
                            </p>
                        </div>
                    </div>

                    {/* Controls: Timeframe, Chart Style & Metric Switch */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Timeframe Toggle */}
                        <div className="flex bg-muted/70 dark:bg-zinc-800/60 p-1 rounded-xl border border-border/70">
                            <button
                                type="button"
                                onClick={() => setTimeframe("month")}
                                className={`text-xs h-8 px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    timeframe === "month"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Monthly ({selectedYear})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimeframe("year")}
                                className={`text-xs h-8 px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    timeframe === "year"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Annual</span>
                            </button>
                        </div>

                        {/* Chart Model Toggle (Area Wave vs Rounded Pillars) */}
                        <div className="flex bg-muted/70 dark:bg-zinc-800/60 p-1 rounded-xl border border-border/70">
                            <button
                                type="button"
                                onClick={() => setChartType("area")}
                                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                                    chartType === "area"
                                        ? "bg-background text-foreground shadow-sm border border-border/60"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Smooth Area Wave Chart"
                            >
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                <span className="hidden sm:inline">Wave</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartType("bar")}
                                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                                    chartType === "bar"
                                        ? "bg-background text-foreground shadow-sm border border-border/60"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Modern Rounded Pillar Chart"
                            >
                                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                                <span className="hidden sm:inline">Pillars</span>
                            </button>
                        </div>

                        {/* Stream vs Settlement Metric Toggle (for Monthly view) */}
                        {timeframe === "month" && (
                            <div className="flex bg-muted/70 dark:bg-zinc-800/60 p-1 rounded-xl border border-border/70">
                                <button
                                    type="button"
                                    onClick={() => setMetricFilter("settlement")}
                                    className={`text-[11px] h-8 px-2.5 rounded-lg font-bold transition-all ${
                                        metricFilter === "settlement"
                                            ? "bg-background text-foreground shadow-sm border border-border/60"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Settlement
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMetricFilter("streams")}
                                    className={`text-[11px] h-8 px-2.5 rounded-lg font-bold transition-all ${
                                        metricFilter === "streams"
                                            ? "bg-background text-foreground shadow-sm border border-border/60"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Streams
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Integrated KPI Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl border border-border/60 bg-background/50 dark:bg-zinc-900/40">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Total Inflow
                        </span>
                        <p className="text-base sm:text-lg font-black text-foreground mt-0.5">
                            {formatCurrency(activeSummary.grandTotal)}
                        </p>
                    </div>

                    <div className="p-3 rounded-2xl border border-border/60 bg-background/50 dark:bg-zinc-900/40">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Settled Inflow
                        </span>
                        <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatCurrency(activeSummary.totalReceived)}
                        </p>
                    </div>

                    <div className="p-3 rounded-2xl border border-border/60 bg-background/50 dark:bg-zinc-900/40">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending Inflow
                        </span>
                        <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                            {formatCurrency(activeSummary.totalPending)}
                        </p>
                    </div>

                    <div className="p-3 rounded-2xl border border-border/60 bg-background/50 dark:bg-zinc-900/40">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                            <AnimatedPulseRing color="bg-primary" /> Settlement Rate
                        </span>
                        <p className="text-base sm:text-lg font-black text-primary mt-0.5">
                            {activeSummary.settlementRate}%
                        </p>
                    </div>
                </div>
            </CardHeader>

            {/* Interactive Chart Canvas */}
            <CardContent className="p-5 sm:p-7 pt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${timeframe}-${chartType}-${metricFilter}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="h-[340px] sm:h-[380px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === "area" ? (
                                <AreaChart
                                    data={currentData}
                                    margin={{
                                        top: 15,
                                        right: 15,
                                        left: isMobile ? -20 : 10,
                                        bottom: 5,
                                    }}
                                >
                                    <defs>
                                        {/* Gradient Emerald for Received */}
                                        <linearGradient id="areaReceivedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>

                                        {/* Gradient Amber for Pending */}
                                        <linearGradient id="areaPendingGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                                        </linearGradient>

                                        {/* Gradient Violet for Primary Stream */}
                                        <linearGradient id="areaPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                        </linearGradient>

                                        {/* Gradient Sky for Secondary Stream */}
                                        <linearGradient id="areaSecondaryGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={false}
                                        stroke="currentColor"
                                        className="text-slate-200 dark:text-white/[0.06]"
                                    />

                                    <XAxis
                                        dataKey={timeframe === "month" ? "month" : "year"}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 600,
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
                                            fontWeight: 600,
                                        }}
                                        className="text-muted-foreground"
                                        tickFormatter={(v) =>
                                            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                                        }
                                        hide={isMobile}
                                    />

                                    <Tooltip content={<CustomTooltip />} />

                                    {timeframe === "month" && metricFilter === "streams" ? (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey="primary"
                                                name="Primary Stream"
                                                stroke="#8b5cf6"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#areaPrimaryGrad)"
                                                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="secondary"
                                                name="Secondary Stream"
                                                stroke="#0ea5e9"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#areaSecondaryGrad)"
                                                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey="received"
                                                name="Received (Settled)"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#areaReceivedGrad)"
                                                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="pending"
                                                name="Pending (Receivable)"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                fillOpacity={1}
                                                fill="url(#areaPendingGrad)"
                                                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                                            />
                                        </>
                                    )}
                                </AreaChart>
                            ) : (
                                <BarChart
                                    data={currentData}
                                    margin={{
                                        top: 15,
                                        right: 15,
                                        left: isMobile ? -20 : 10,
                                        bottom: 5,
                                    }}
                                    barGap={8}
                                    barCategoryGap="25%"
                                >
                                    <defs>
                                        <linearGradient id="barReceivedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                                        </linearGradient>

                                        <linearGradient id="barPendingGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                                        </linearGradient>

                                        <linearGradient id="barPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.85} />
                                        </linearGradient>

                                        <linearGradient id="barSecondaryGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={false}
                                        stroke="currentColor"
                                        className="text-slate-200 dark:text-white/[0.06]"
                                    />

                                    <XAxis
                                        dataKey={timeframe === "month" ? "month" : "year"}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "currentColor",
                                            fontSize: isMobile ? 10 : 12,
                                            fontWeight: 600,
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
                                            fontWeight: 600,
                                        }}
                                        className="text-muted-foreground"
                                        tickFormatter={(v) =>
                                            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                                        }
                                        hide={isMobile}
                                    />

                                    <Tooltip content={<CustomTooltip />} />

                                    {timeframe === "month" && metricFilter === "streams" ? (
                                        <>
                                            <Bar
                                                dataKey="primary"
                                                name="Primary Stream"
                                                fill="url(#barPrimaryGrad)"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={32}
                                            />
                                            <Bar
                                                dataKey="secondary"
                                                name="Secondary Stream"
                                                fill="url(#barSecondaryGrad)"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={32}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Bar
                                                dataKey="received"
                                                name="Total Received"
                                                fill="url(#barReceivedGrad)"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={32}
                                            />
                                            <Bar
                                                dataKey="pending"
                                                name="Total Pending"
                                                fill="url(#barPendingGrad)"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={32}
                                            />
                                        </>
                                    )}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
