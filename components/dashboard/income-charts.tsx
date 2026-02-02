"use client";

import { useState } from "react";
import { MonthlyStats, AnnualStats } from "@/types/income";
import { motion, AnimatePresence } from "framer-motion";
import {
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
                        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const data =
        viewMode === "month"
            ? monthlyStats
            : annualStats.filter((stat) => stat.year >= 2023);

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
                        <CardTitle className="text-xl font-bold gradient-text bg-gradient-to-r from-foreground to-muted-foreground">
                            Income Trends
                        </CardTitle>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <Button
                                variant={
                                    viewMode === "month" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("month")}
                                className={`text-xs h-8 transition-all ${viewMode === "month" ? "shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={
                                    viewMode === "year" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("year")}
                                className={`text-xs h-8 transition-all ${viewMode === "year" ? "shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Yearly
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {viewMode === "month" ? (
                                    <BarChart
                                        data={data}
                                        barSize={32}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="receivedGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#34d399"
                                                    stopOpacity={1}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#059669"
                                                    stopOpacity={1}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="pendingGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#fbbf24"
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
                                            stroke="var(--border)"
                                            vertical={false}
                                            opacity={0.1}
                                        />
                                        <XAxis
                                            dataKey="month"
                                            stroke="var(--muted-foreground)"
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                                fontWeight: 500,
                                            }}
                                            tickFormatter={(value) =>
                                                value.slice(0, 3)
                                            }
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="var(--muted-foreground)"
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                                fontWeight: 500,
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
                                                    "hsl(var(--popover))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px",
                                                backdropFilter: "blur(12px)",
                                                boxShadow:
                                                    "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                                                padding: "12px",
                                            }}
                                            cursor={{
                                                fill: "rgba(255, 255, 255, 0.05)",
                                            }}
                                            itemStyle={{
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                            labelStyle={{
                                                color: "hsl(var(--popover-foreground))",
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
                                            fill="url(#receivedGradient)"
                                            radius={[0, 0, 4, 4]}
                                            stackId="a"
                                        />
                                        <Bar
                                            dataKey="pending"
                                            name="Pending"
                                            fill="url(#pendingGradient)"
                                            radius={[4, 4, 0, 0]}
                                            stackId="a"
                                        />
                                    </BarChart>
                                ) : (
                                    <BarChart
                                        data={data}
                                        barSize={32}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="receivedGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#34d399"
                                                    stopOpacity={1}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#059669"
                                                    stopOpacity={1}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="pendingGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#fbbf24"
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
                                            stroke="var(--border)"
                                            vertical={false}
                                            opacity={0.1}
                                        />
                                        <XAxis
                                            dataKey="year"
                                            stroke="var(--muted-foreground)"
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                                fontWeight: 500,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="var(--muted-foreground)"
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                                fontWeight: 500,
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
                                                    "hsl(var(--popover))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px",
                                                backdropFilter: "blur(12px)",
                                                boxShadow:
                                                    "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                                                padding: "12px",
                                            }}
                                            cursor={{
                                                fill: "rgba(255, 255, 255, 0.05)",
                                            }}
                                            itemStyle={{
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                            labelStyle={{
                                                color: "hsl(var(--popover-foreground))",
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
                                            fill="url(#receivedGradient)"
                                            radius={[0, 0, 4, 4]}
                                            stackId="a"
                                        />
                                        <Bar
                                            dataKey="pending"
                                            name="Pending"
                                            fill="url(#pendingGradient)"
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
