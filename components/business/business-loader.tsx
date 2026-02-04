"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function BusinessLoader() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Card
                        key={i}
                        className="glass border-border/30 overflow-hidden relative"
                    >
                        <CardHeader className="pb-2">
                            <div className="h-4 w-24 bg-muted/40 rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-8 w-32 bg-muted/60 rounded" />
                                <div className="h-8 w-8 bg-muted/40 rounded" />
                            </div>
                            <div className="h-3 w-40 bg-muted/30 rounded" />
                        </CardContent>
                        {/* Shimmer effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent -translate-x-full"
                            animate={{ x: ["100%", "-100%"] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    </Card>
                ))}
            </div>

            <Card className="glass border-border/30 overflow-hidden relative">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted/60 rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-40 w-full bg-muted/20 rounded-xl border border-border/20" />
                </CardContent>
            </Card>

            <Card className="glass border-border/30 overflow-hidden relative">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted/60 rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-2 border-b border-border/10 last:border-0"
                            >
                                <div className="space-y-2">
                                    <div className="h-4 w-60 bg-muted/60 rounded" />
                                    <div className="h-3 w-32 bg-muted/30 rounded" />
                                </div>
                                <div className="h-8 w-16 bg-muted/30 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function TransactionSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-4 glass border-border/20 rounded-xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted/40" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted/60 rounded" />
                            <div className="h-3 w-24 bg-muted/30 rounded" />
                        </div>
                    </div>
                    <div className="h-6 w-20 bg-muted/60 rounded" />
                </div>
            ))}
        </div>
    );
}
