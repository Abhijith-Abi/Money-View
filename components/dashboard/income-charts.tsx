"use client";

import { MonthlyStats } from "@/types/income";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncomeChartsProps {
    monthlyStats: MonthlyStats[];
    loading: boolean;
}

const COLORS = {
    primary: "#a855f7", // Purple
    secondary: "#06b6d4", // Cyan
    total: "#ec4899", // Pink
};

export function IncomeCharts({ monthlyStats, loading }: IncomeChartsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="glass animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-80 bg-slate-700 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const pieData = [
        {
            name: "Primary Income",
            value: monthlyStats.reduce((sum, m) => sum + m.primary, 0),
        },
        {
            name: "Secondary Income",
            value: monthlyStats.reduce((sum, m) => sum + m.secondary, 0),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Bar Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -4 }}
                className="relative group"
            >
                {/* Subtle glow border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

                <Card className="relative glass backdrop-blur-2xl border-white/10 shadow-xl group-hover:border-white/20 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 gradient-text">
                            Income Breakdown: Primary vs Secondary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={monthlyStats}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="primaryGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#a855f7"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#7e22ce"
                                            stopOpacity={0.4}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="secondaryGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#06b6d4"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#0891b2"
                                            stopOpacity={0.4}
                                        />
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur
                                            stdDeviation="3"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#334155"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) =>
                                        `₹${value.toLocaleString()}`
                                    }
                                />
                                <Tooltip
                                    cursor={{
                                        fill: "rgba(255, 255, 255, 0.05)",
                                    }}
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(15, 23, 42, 0.9)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: "12px",
                                        backdropFilter: "blur(12px)",
                                        boxShadow:
                                            "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                                        padding: "12px",
                                    }}
                                    itemStyle={{
                                        fontSize: "13px",
                                        fontWeight: 500,
                                    }}
                                    labelStyle={{
                                        color: "#f8fafc",
                                        marginBottom: "8px",
                                        fontWeight: 600,
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                    verticalAlign="bottom"
                                    height={36}
                                />
                                <Bar
                                    dataKey="primary"
                                    fill="url(#primaryGradient)"
                                    name="Primary"
                                    radius={[6, 6, 0, 0]}
                                    style={{ filter: "url(#glow)" }}
                                    barSize={24}
                                />
                                <Bar
                                    dataKey="secondary"
                                    fill="url(#secondaryGradient)"
                                    name="Secondary"
                                    radius={[6, 6, 0, 0]}
                                    style={{ filter: "url(#glow)" }}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
