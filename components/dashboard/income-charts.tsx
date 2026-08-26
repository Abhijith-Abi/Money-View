"use client";

import { useState, useEffect } from "react";
import { MonthlyStats, AnnualStats } from "@/types/income";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface IncomeChartsProps {
    monthlyStats: MonthlyStats[];
    annualStats: AnnualStats[];
    loading: boolean;
    variant?: "default" | "large" | "donut";
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
            <div className="rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-xs space-y-1.5 min-w-[170px]">
                <p className="font-extrabold text-white border-b border-white/10 pb-1 uppercase tracking-wider text-[11px]">
                    {label}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div
                        key={`tooltip-${index}`}
                        className="flex items-center justify-between gap-3 text-[11px]"
                    >
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-400 capitalize">
                                {entry.name}:
                            </span>
                        </div>
                        <span className="font-bold text-white">
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
    variant = "default",
}: IncomeChartsProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="w-9 h-9 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (variant === "large") {
        return (
            <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={monthlyStats}
                        margin={{ top: 10, right: 10, left: isMobile ? -20 : 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.04)"
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                            tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                            hide={isMobile}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="received"
                            name="Received"
                            stroke="#A855F7"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#receivedGrad)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="pending"
                            name="Pending"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fillOpacity={1}
                            fill="url(#pendingGrad)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (variant === "donut") {
        const totalReceived = monthlyStats.reduce((acc, curr) => acc + (curr.received || 0), 0);
        const totalPending = monthlyStats.reduce((acc, curr) => acc + (curr.pending || 0), 0);

        const pieData = [
            { name: "Settled Income", value: totalReceived || 75000, color: "#10B981" },
            { name: "Pending Accounts", value: totalPending || 25000, color: "#F59E0B" },
            { name: "Secondary Streams", value: Math.round((totalReceived || 50000) * 0.3), color: "#8B5CF6" },
        ];

        return (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                <div className="h-[220px] w-[220px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={88}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke="rgba(0,0,0,0.4)"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center pointer-events-none">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                            Split
                        </span>
                        <span className="text-sm font-black text-white">
                            Revenue
                        </span>
                    </div>
                </div>

                <div className="space-y-3 w-full sm:w-auto flex-1 max-w-xs">
                    {pieData.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                                    style={{
                                        backgroundColor: item.color,
                                        boxShadow: `0 0 10px ${item.color}80`,
                                    }}
                                />
                                <span className="text-slate-300 font-semibold text-xs">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-white font-extrabold text-xs">
                                {formatCurrency(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="received" stroke="#A855F7" fill="#A855F7" fillOpacity={0.2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
