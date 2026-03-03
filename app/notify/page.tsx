"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Bell,
    Send,
    ImageIcon,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Users,
    Phone,
    Plus,
    X,
} from "lucide-react";
import Link from "next/link";

export default function NotifyPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [lastResult, setLastResult] = useState<{
        totalUsers: number;
        sentCount: number;
        failedCount: number;
        tokensFound: number;
        phonesFound: number;
        smsSentCount: number;
        smsFailedCount: number;
    } | null>(null);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [image, setImage] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneList, setPhoneList] = useState<string[]>([]);
    const [phoneError, setPhoneError] = useState("");

    const { toast } = useToast();

    const addPhone = () => {
        const digits = phoneInput.replace(/\D/g, "").slice(-10);
        if (digits.length !== 10) {
            setPhoneError("Enter a valid 10-digit Indian mobile number.");
            return;
        }
        if (!/^[6-9]/.test(digits)) {
            setPhoneError("Number must start with 6, 7, 8, or 9.");
            return;
        }
        if (phoneList.includes(digits)) {
            setPhoneError("Number already added.");
            return;
        }
        setPhoneList((prev) => [...prev, digits]);
        setPhoneInput("");
        setPhoneError("");
    };

    const removePhone = (num: string) =>
        setPhoneList((prev) => prev.filter((p) => p !== num));

    useEffect(() => {
        const auth = sessionStorage.getItem("admin_auth");
        if (auth === "true") setIsAuthenticated(true);
        setLoading(false);
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast({
                variant: "destructive",
                title: "Missing fields",
                description: "Please fill in a title and description.",
            });
            return;
        }

        setSending(true);
        setLastResult(null);
        try {
            const res = await fetch("/api/admin/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    body: body.trim(),
                    ...(image.trim() ? { image: image.trim() } : {}),
                    ...(phoneList.length > 0 ? { extraPhones: phoneList } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send");
            }

            setLastResult(data);
            toast({
                title: "✅ Notification sent!",
                description: `Push sent to ${data.sentCount}/${data.tokensFound} devices. SMS sent to ${data.smsSentCount}/${data.phonesFound} numbers. Written to ${data.totalUsers} inboxes.`,
            });

            setTitle("");
            setBody("");
            setImage("");
            setPhoneList([]);
            setPhoneInput("");
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Failed to send",
                description: err.message || "Check server logs.",
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) return null;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center relative">
                <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Bell className="w-5 h-5" />
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            You must be logged in as an admin to access this
                            page.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/admin">Go to Admin Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-12 relative">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.05),rgba(0,0,0,0))] -z-10" />

            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                        >
                            <Link href="/admin">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Broadcast Notification
                            </h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                Send a push notification to all users
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">All Users</span>
                    </div>
                </motion.div>

                {/* Compose Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border border-border/60 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-border/40 pb-5">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/60">
                                    <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                Compose Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="notif-title"
                                    className="text-sm font-semibold"
                                >
                                    Title{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="notif-title"
                                    placeholder="e.g. New Feature Available!"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-secondary/40 focus:bg-background transition-all"
                                    maxLength={100}
                                />
                                <p className="text-[11px] text-muted-foreground text-right">
                                    {title.length}/100
                                </p>
                            </div>

                            {/* Body */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="notif-body"
                                    className="text-sm font-semibold"
                                >
                                    Description{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="notif-body"
                                    placeholder="Write your notification message here..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="bg-secondary/40 focus:bg-background transition-all min-h-[120px] resize-none"
                                    maxLength={500}
                                />
                                <p className="text-[11px] text-muted-foreground text-right">
                                    {body.length}/500
                                </p>
                            </div>

                            {/* Phone Numbers */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="notif-phone"
                                    className="text-sm font-semibold flex items-center gap-1.5"
                                >
                                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                    Send SMS To{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (optional — extra numbers)
                                    </span>
                                </Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 h-10 border border-input rounded-md bg-muted/50 text-sm text-muted-foreground font-medium flex-shrink-0">
                                        🇮🇳 +91
                                    </div>
                                    <Input
                                        id="notif-phone"
                                        type="tel"
                                        placeholder="98765 43210"
                                        value={phoneInput}
                                        onChange={(e) => {
                                            setPhoneInput(e.target.value);
                                            setPhoneError("");
                                        }}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && addPhone()
                                        }
                                        maxLength={10}
                                        className="flex-1 bg-secondary/40 focus:bg-background transition-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={addPhone}
                                        className="flex-shrink-0 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950/40"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {phoneError && (
                                    <p className="text-xs text-destructive">
                                        {phoneError}
                                    </p>
                                )}
                                {phoneList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {phoneList.map((num) => (
                                            <span
                                                key={num}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                                            >
                                                <Phone className="w-3 h-3" />
                                                +91 {num}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePhone(num)
                                                    }
                                                    className="ml-0.5 hover:text-destructive transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[11px] text-muted-foreground">
                                    These numbers receive SMS in addition to all
                                    users who saved their phone number in the
                                    app.
                                </p>
                            </div>

                            {/* Image URL */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="notif-image"
                                    className="text-sm font-semibold flex items-center gap-1.5"
                                >
                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    Image URL{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="notif-image"
                                    placeholder="https://example.com/image.png"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    className="bg-secondary/40 focus:bg-background transition-all"
                                />
                                {/* Live image preview */}
                                {image.trim() && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-border/60 bg-muted/30">
                                        <img
                                            src={image}
                                            alt="Notification image preview"
                                            className="w-full max-h-52 object-cover"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).style.display = "none";
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Preview Card */}
                            {(title || body) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-1"
                                >
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
                                        Preview
                                    </p>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bell className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {title || "Title"}
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                                                {body ||
                                                    "Your message will appear here."}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Send Button */}
                            <Button
                                onClick={handleSend}
                                disabled={
                                    sending || !title.trim() || !body.trim()
                                }
                                className="w-full gap-2 h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 transition-all"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send to All Users
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Result Card */}
                {lastResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                                        Notification sent successfully
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        {[
                                            {
                                                label: "Total Users",
                                                value: lastResult.totalUsers,
                                            },
                                            {
                                                label: "Push Sent",
                                                value: lastResult.sentCount,
                                            },
                                            {
                                                label: "SMS Sent",
                                                value: lastResult.smsSentCount,
                                            },
                                            {
                                                label: "Push Failed",
                                                value: lastResult.failedCount,
                                            },
                                        ].map(({ label, value }) => (
                                            <div
                                                key={label}
                                                className="text-center"
                                            >
                                                <div className="text-2xl font-bold text-foreground">
                                                    {value}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                                    {label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {lastResult.tokensFound <
                                        lastResult.totalUsers && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ⚠️{" "}
                                            {lastResult.totalUsers -
                                                lastResult.tokensFound}{" "}
                                            user(s) have no FCM token (never
                                            granted push permission) — their
                                            in-app notification was still saved.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
