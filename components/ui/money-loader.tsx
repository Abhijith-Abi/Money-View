"use client";

import { motion } from "framer-motion";
import { CircleDollarSign, Wallet } from "lucide-react";

export function MoneyLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] relative">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* 1. Wallet Appears First */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: 0.5,
                    }}
                    className="relative z-10"
                >
                    <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-2xl shadow-indigo-500/30">
                        <Wallet className="w-16 h-16 text-white" />
                    </div>
                </motion.div>

                {/* 2. Coin Flies In and Hits */}
                <motion.div
                    initial={{ y: -200, opacity: 0, scale: 2, rotate: -45 }}
                    animate={{
                        y: [-200, 0], // Drop down
                        opacity: [0, 1],
                        scale: [2, 1],
                        rotate: [-45, 0],
                    }}
                    transition={{
                        delay: 0.4, // Wait for wallet
                        duration: 0.6,
                        type: "spring",
                        bounce: 0.5,
                    }}
                    className="absolute z-20 -top-2 -right-2 bg-yellow-400 rounded-full p-2 border-4 border-white dark:border-slate-900 shadow-lg"
                >
                    <CircleDollarSign className="w-10 h-10 text-yellow-900" />
                </motion.div>

                {/* 3. Impact Ripple/Shockwave */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [0.8, 2.5],
                        opacity: [0.6, 0],
                    }}
                    transition={{
                        delay: 0.9, // Sync with coin hit
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                    }}
                    className="absolute inset-0 bg-yellow-400/30 rounded-full"
                />
            </div>

            {/* Loading Text */}
            <motion.div
                className="mt-8 text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Money View
                </h3>
                <p className="text-muted-foreground font-medium text-sm">
                    Organizing your finances...
                </p>
            </motion.div>
        </div>
    );
}
