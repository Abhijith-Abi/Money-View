"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    Loader2,
    Sparkles,
    ShieldCheck,
    TrendingUp,
    Calculator,
    Zap,
    Lock,
} from "lucide-react";
import { MoneyLoader } from "@/components/ui/money-loader";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [signingIn, setSigningIn] = useState(false);

    useEffect(() => {
        if (user && !loading) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleSignIn = async () => {
        setSigningIn(true);
        try {
            await signInWithGoogle();
            router.push("/");
        } catch (error) {
            console.error("Sign in error:", error);
            setSigningIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#030712]">
                <MoneyLoader />
            </div>
        );
    }

    const featurePills = [
        { icon: Calculator, label: "Automated EMI & Pending Months Tracking" },
        { icon: TrendingUp, label: "Real-Time Income & Business Ledger" },
        { icon: Zap, label: "Powered by Groq Financial AI" },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#030712] text-white flex items-center justify-center p-4 sm:p-6">
            {/* Ambient Background Mesh & Lighting */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-transparent blur-[140px] rounded-full animate-float-slow" />
                <div className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] bg-gradient-to-bl from-cyan-500/15 via-blue-600/10 to-transparent blur-[150px] rounded-full animate-pulse-glow" />
                <div className="absolute -bottom-[20%] left-[25%] w-[45vw] h-[45vw] bg-gradient-to-tr from-emerald-500/15 via-purple-900/15 to-transparent blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:28px_28px] opacity-60" />
            </div>

            {/* Main Center Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* Outer Glow Halo */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/40 via-indigo-500/30 to-cyan-500/40 rounded-[2.5rem] blur-xl opacity-60 pointer-events-none" />

                    {/* Card Container */}
                    <div className="relative rounded-[2.2rem] bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden space-y-7">
                        {/* Header & Logo */}
                        <div className="text-center space-y-3">
                            <motion.div
                                className="flex justify-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                        <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                                            <Wallet className="w-8 h-8 text-purple-400" />
                                        </div>
                                    </div>
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                    </span>
                                </div>
                            </motion.div>

                            <div className="space-y-1 pt-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    Financial Operating System
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-1">
                                    MoneyView
                                </h1>
                                <p className="text-slate-400 text-xs font-medium">
                                    Intelligent income tracking, ledgers & EMI analytics
                                </p>
                            </div>
                        </div>

                        {/* Feature Highlights */}
                        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                            {featurePills.map((f, idx) => (
                                <motion.div
                                    key={f.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300 font-medium"
                                >
                                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                                        <f.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{f.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Sign in Button */}
                        <div className="space-y-3 pt-1">
                            <Button
                                onClick={handleSignIn}
                                disabled={signingIn}
                                className="w-full h-13 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {signingIn ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                                        <span>Connecting to Google...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span>End-to-end encrypted financial data</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-400 font-medium">
                        By continuing, you agree to MoneyView&apos;s Secure Access terms.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
