"use client";

import { useState, useEffect } from "react";
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

export function IncomeCharts({
    monthlyStats,
    annualStats,
    loading,
    variant = "default",
}: IncomeChartsProps) {
    const [viewMode, setViewMode] = useState<"month" | "year">("month");
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (variant === "large") {
        return (
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickFormatter={(val) => val.charAt(0)}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                            itemStyle={{ color: "#fff" }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="received" 
                            stroke="var(--primary)" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="pending" 
                            stroke="#ffffff" 
                            strokeWidth={2} 
                            strokeOpacity={0.3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (variant === "donut") {
        const pieData = [
            { name: "Sales", value: 28400, color: "#FFFFFF" },
            { name: "Services", value: 19100, color: "#D4AF37" },
            { name: "Investments", value: 11200, color: "#454749" },
        ];

        return (
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[250px] w-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-4 flex-1">
                    {pieData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-gray-400">{item.name}</span>
                            </div>
                            <span className="text-white font-bold">${(item.value / 1000).toFixed(1)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="received" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
