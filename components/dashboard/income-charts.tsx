"use client";

import { useState } from "react";
import { MonthlyStats, AnnualStats } from "@/types/income";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IncomeChartsProps {
    monthlyStats: MonthlyStats[];
    annualStats: AnnualStats[];
    loading: boolean;
}

export function IncomeCharts({
    monthlyStats,
    annualStats,
    loading,
}: IncomeChartsProps) {
    const [viewMode, setViewMode] = useState<"month" | "year">("month");

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6">
                <Card className="glass animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-96 bg-slate-700 rounded"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const data = viewMode === "month" ? monthlyStats : annualStats;

    return (
        <div className="flex flex-col gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative group"
            >
                {/* Subtle glow border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />

                <Card className="relative glass backdrop-blur-2xl border-white/10 shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 gradient-text">
                            Income Trends
                        </CardTitle>
                        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                            <Button
                                variant={
                                    viewMode === "month" ? "secondary" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("month")}
                                className="text-xs h-8"
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={
                                    viewMode === "year" ? "secondary" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("year")}
                                className="text-xs h-8"
                            >
                                Yearly
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {viewMode === "month" ? (
                                    <AreaChart
                                        data={data}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="colorTotal"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#ec4899"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#ec4899"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="colorReceived"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="colorPending"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#f59e0b"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#f59e0b"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#334155"
                                            vertical={false}
                                            opacity={0.4}
                                        />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#94a3b8"
                                            tick={{
                                                fill: "#94a3b8",
                                                fontSize: 12,
                                            }}
                                            tickFormatter={(value) =>
                                                value.slice(0, 3)
                                            }
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tick={{
                                                fill: "#94a3b8",
                                                fontSize: 12,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                                            }
                                            dx={-10}
                                        />
                                        <Tooltip
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
                                            formatter={(
                                                value: number | undefined,
                                            ) => [
                                                `₹${(value || 0).toLocaleString()}`,
                                                undefined,
                                            ]}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: "20px",
                                            }}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            name="Total Expected"
                                            stroke="#ec4899"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTotal)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="received"
                                            name="Received"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorReceived)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="pending"
                                            name="Pending"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPending)"
                                        />
                                    </AreaChart>
                                ) : (
                                    <BarChart
                                        data={data}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#334155"
                                            vertical={false}
                                            opacity={0.4}
                                        />
                                        <XAxis
                                            dataKey="year"
                                            stroke="#94a3b8"
                                            tick={{
                                                fill: "#94a3b8",
                                                fontSize: 12,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tick={{
                                                fill: "#94a3b8",
                                                fontSize: 12,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) =>
                                                `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                                            }
                                            dx={-10}
                                        />
                                        <Tooltip
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
                                            formatter={(
                                                value: number | undefined,
                                            ) => [
                                                `₹${(value || 0).toLocaleString()}`,
                                                undefined,
                                            ]}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: "20px",
                                            }}
                                        />

                                        <Bar
                                            dataKey="received"
                                            name="Received"
                                            fill="#10b981"
                                            radius={[0, 0, 4, 4]}
                                            stackId="a"
                                        />
                                        <Bar
                                            dataKey="pending"
                                            name="Pending"
                                            fill="#f59e0b"
                                            radius={[4, 4, 0, 0]}
                                            stackId="a"
                                        />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
