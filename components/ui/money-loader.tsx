"use client";

import { motion } from "framer-motion";
import { Sparkles, Wallet } from "lucide-react";

export function MoneyLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] relative">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Glowing Outer Ripple */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [0.8, 1.8],
                        opacity: [0.5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl pointer-events-none"
                />

                {/* Main Logo Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: 0.5,
                    }}
                    className="relative z-10"
                >
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                        <div className="w-full h-full bg-[#030712] rounded-[22px] flex items-center justify-center">
                            <Wallet className="w-10 h-10 text-purple-400" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Loading Text */}
            <motion.div
                className="mt-6 text-center space-y-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                    MoneyView
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </h3>
                <p className="text-slate-400 font-medium text-xs">
                    Securing your financial workspace...
                </p>
            </motion.div>
        </div>
    );
}
