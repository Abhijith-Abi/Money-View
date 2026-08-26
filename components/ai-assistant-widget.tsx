"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bot,
    Send,
    X,
    Sparkles,
    Loader2,
    Calculator,
    TrendingUp,
    HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function AIAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "👋 Hello! I am your **MoneyView AI & EMI Assistant** powered by Groq. Ask me to calculate loan EMIs, analyze pending months, breakdown repayment schedules, or give financial advice!",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (textToSend?: string) => {
        const text = textToSend || inputValue;
        if (!text.trim() || loading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setLoading(true);

        try {
            // Prepare history for API
            const apiMessages = [...messages, userMsg].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: apiMessages,
                }),
            });

            const data = await response.json();

            const assistantReply =
                data.reply ||
                data.message ||
                data.choices?.[0]?.message?.content ||
                (data.error ? `Error: ${data.error}` : "I couldn't process that. Please try again.");

            const assistantMsg: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: assistantReply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error: any) {
            console.error("AI chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: "⚠️ Failed to connect to AI server. Please check your connection and try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const quickPrompts = [
        "Calculate EMI: ₹5 Lakh, 9% for 5 yrs",
        "How to calculate pending months?",
        "Difference between reducing vs flat EMI?",
    ];

    return (
        <>
            {/* Floating Trigger Button */}
            <div className="fixed bottom-8 left-8 z-50">
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "relative h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300",
                        isOpen
                            ? "bg-rose-500 text-white shadow-rose-500/30"
                            : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-purple-500/40"
                    )}
                    aria-label="Toggle AI Assistant"
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <>
                            <Bot className="h-6 w-6" />
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
                            </span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Chat Panel Modal / Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed bottom-24 left-4 sm:left-8 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[82vh] rounded-[2rem] glass-gold border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 px-5 border-b border-white/10 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-black/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                                        MoneyView AI
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-widest border border-emerald-500/30">
                                            Groq Fast
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400">
                                        EMI & Financial Intelligence
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] rounded-2xl p-3 space-y-1",
                                        msg.role === "user"
                                            ? "ml-auto bg-purple-600 text-white rounded-br-none shadow-md"
                                            : "mr-auto bg-white/5 border border-white/10 text-gray-200 rounded-bl-none shadow-sm"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] opacity-40 self-end">
                                        {msg.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            ))}
                            {loading && (
                                <div className="mr-auto bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-3 flex items-center gap-2 text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                    <span>Calculating with Groq AI...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-black/20">
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleSendMessage(prompt)}
                                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 border border-white/10 transition-colors truncate max-w-full text-left"
                                    >
                                        💡 {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Footer */}
                        <div className="p-3 border-t border-white/10 bg-black/40">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask anything about EMI, loans, or finances..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-xs h-10 rounded-xl focus:border-purple-500"
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputValue.trim() || loading}
                                    className="h-10 w-10 shrink-0 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
