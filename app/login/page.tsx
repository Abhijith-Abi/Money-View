"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
            {/* Animated gradient background */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900"
                style={{
                    backgroundSize: "400% 400%",
                    animation: "gradientFlow 15s ease infinite",
                }}
            />

            {/* Additional gradient overlay */}
            <div
                className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-blue-500/10"
                style={{
                    backgroundSize: "400% 400%",
                    animation: "gradientFlow 20s ease infinite reverse",
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-gradient-to-br from-purple-400/20 to-cyan-400/20 blur-xl"
                        style={{
                            width: Math.random() * 300 + 100,
                            height: Math.random() * 300 + 100,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Glowing card wrapper */}
                <div className="relative">
                    {/* Animated glow border */}
                    <div
                        className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur-lg opacity-50"
                        style={{
                            backgroundSize: "400% 400%",
                            animation:
                                "gradientFlow 8s ease infinite, glowPulse 3s ease-in-out infinite",
                        }}
                    />

                    {/* Main card */}
                    <Card className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden">
                        {/* Gradient overlay on card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

                        <CardHeader className="text-center space-y-6 relative">
                            {/* Icon container */}
                            <motion.div
                                className="flex justify-center"
                                initial={{ opacity: 0, rotate: 0, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: 360, scale: 1 }}
                                transition={{
                                    duration: 1,
                                    ease: "easeOut",
                                    delay: 0.2,
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl blur-md opacity-50" />
                                    <div className="relative p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-cyan-600">
                                        <Wallet className="h-12 w-12 text-white" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 gradient-text">
                                    Money View
                                </CardTitle>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <CardDescription className="text-slate-300 text-base">
                                    Track your financial journey with ease
                                </CardDescription>
                            </motion.div>
                        </CardHeader>

                        <CardContent className="space-y-5 relative">
                            {/* Sign in button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <Button
                                    onClick={handleSignIn}
                                    disabled={signingIn}
                                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                                    size="lg"
                                >
                                    {/* Button gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100/0 via-purple-100/50 to-cyan-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <span className="relative flex items-center justify-center">
                                        {signingIn ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="mr-3 h-6 w-6"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        fill="currentColor"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                                Sign in with Google
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </motion.div>

                            {/* Security text */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                                className="text-xs text-center text-slate-400"
                            >
                                🔒 Secure authentication powered by Google
                            </motion.p>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom text */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center text-sm text-slate-300 mt-8 font-medium"
                >
                    ✨ Your financial data is private and secure
                </motion.p>
            </motion.div>
        </div>
    );
}
