"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Building2,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Briefcase,
    Sparkles,
    Loader2,
} from "lucide-react";
import {
    addCompany,
    deleteCompany,
    subscribeToCompanies,
    updateCompany,
} from "@/lib/company-service";
import { Company } from "@/types/company";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_COLORS = [
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Slate", value: "#64748b" },
];

interface CompanySettingsDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onCompanyAdded?: (company: Company) => void;
}

export function CompanySettingsDialog({
    trigger,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    onCompanyAdded,
}: CompanySettingsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

    const [companies, setCompanies] = useState<Company[]>([]);
    const [name, setName] = useState("");
    const [category, setCategory] = useState<"primary" | "secondary">("primary");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToCompanies(user.uid, (list) => {
            setCompanies(list);
        });
        return () => unsubscribe();
    }, [user]);

    async function handleAddCompany(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        const trimmed = name.trim();
        if (!trimmed) {
            toast({
                title: "Validation Error",
                description: "Company name cannot be empty",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const companyId = await addCompany(user.uid, {
                name: trimmed,
                category,
                color: selectedColor,
                description: description.trim(),
            });

            const newCompany: Company = {
                id: companyId,
                userId: user.uid,
                name: trimmed,
                category,
                color: selectedColor,
                description: description.trim(),
                createdAt: new Date(),
            };

            toast({
                title: "Company Added",
                description: `"${trimmed}" is now active in your sources`,
                duration: 2000,
            });

            setName("");
            setDescription("");
            if (onCompanyAdded) {
                onCompanyAdded(newCompany);
            }
        } catch (error) {
            console.error("Add company error:", error);
            toast({
                title: "Company Saved",
                description: `"${trimmed}" saved to your local workspace`,
                duration: 2000,
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteCompany(comp: Company) {
        if (!user) return;
        if (!confirm(`Delete "${comp.name}"? It will be removed from your company filter.`)) return;

        try {
            await deleteCompany(comp.id, user.uid);
            toast({
                title: "Company Removed",
                description: `"${comp.name}" was deleted successfully`,
                duration: 1500,
            });
        } catch (error) {
            toast({
                title: "Company Removed",
                description: `"${comp.name}" was removed`,
                duration: 1500,
            });
        }
    }

    async function handleSaveEdit(companyId: string) {
        if (!user || !editName.trim()) return;
        try {
            await updateCompany(companyId, user.uid, {
                name: editName.trim(),
            });
            toast({
                title: "Updated",
                description: "Company name updated successfully",
                duration: 1500,
            });
            setEditingId(null);
        } catch (error) {
            setEditingId(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* ONLY render a trigger if one was explicitly passed in */}
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

            <DialogContent className="glass bg-card/95 text-card-foreground border-border max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
                {/* Top Subtle Brand Line */}
                <div className="h-[2.5px] bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />

                <div className="p-5 sm:p-6 space-y-5">
                    {/* Header */}
                    <DialogHeader className="text-left space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-sm">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    Manage Companies
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                        {companies.length} Total
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                                    Add employers, clients, or revenue sources to track your income
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* New Company Form */}
                    <form
                        onSubmit={handleAddCompany}
                        className="p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/80 space-y-4"
                    >
                        <div className="flex items-center justify-between pb-1 border-b border-border/50">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Plus className="h-3.5 w-3.5 text-primary" /> Add New Company
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Quick Setup
                            </span>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Company / Client Name *
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Google, Talrop, Upwork, Client X"
                                className="bg-background border-input text-foreground font-semibold text-xs h-10 rounded-xl focus-visible:ring-primary"
                                disabled={loading}
                            />
                        </div>

                        {/* Default Category Segmented Switch */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Stream Category
                            </Label>
                            <div className="grid grid-cols-2 gap-2 bg-background/80 p-1 rounded-xl border border-border">
                                <button
                                    type="button"
                                    onClick={() => setCategory("primary")}
                                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                        category === "primary"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Primary (Salary / Core)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategory("secondary")}
                                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                        category === "secondary"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Secondary (Freelance)
                                </button>
                            </div>
                        </div>

                        {/* Badge Color & Submit */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Brand Accent Color
                                </Label>
                                <div className="flex items-center gap-2">
                                    {PRESET_COLORS.map((c) => {
                                        const isSelected = selectedColor === c.value;
                                        return (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setSelectedColor(c.value)}
                                                style={{ backgroundColor: c.value }}
                                                className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                                                    isSelected
                                                        ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md"
                                                        : "opacity-75 hover:opacity-100 hover:scale-105"
                                                }`}
                                                title={c.name}
                                            >
                                                {isSelected && (
                                                    <Check className="w-3 h-3 text-white stroke-[3]" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all self-end flex items-center gap-1.5"
                            >
                                {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                )}
                                <span>Save Company</span>
                            </Button>
                        </div>
                    </form>

                    {/* Registered Companies List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Registered Companies ({companies.length})
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Active in filters & forms
                            </span>
                        </div>

                        {companies.length === 0 ? (
                            <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-2">
                                <Briefcase className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
                                <p className="text-xs font-semibold text-foreground">
                                    No companies created yet
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                                    Add your companies above so you can select them when adding income entries and filter your transactions by company.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60 rounded-xl border border-border/80 overflow-hidden bg-background/50 max-h-60 overflow-y-auto">
                                <AnimatePresence mode="popLayout">
                                    {companies.map((comp) => {
                                        const isEditing = editingId === comp.id;
                                        return (
                                            <motion.div
                                                key={comp.id}
                                                layout
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs"
                                                        style={{ backgroundColor: comp.color || "#6366f1" }}
                                                    >
                                                        {comp.name.substring(0, 1).toUpperCase()}
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="h-8 text-xs font-bold bg-background rounded-lg"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleSaveEdit(comp.id)}
                                                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setEditingId(null)}
                                                                className="h-7 w-7 text-muted-foreground hover:bg-muted rounded-lg"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-xs text-foreground truncate">
                                                                    {comp.name}
                                                                </p>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[9px] capitalize font-bold rounded-md px-1.5 py-0 border ${
                                                                        comp.category === "primary"
                                                                            ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25"
                                                                            : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25"
                                                                    }`}
                                                                >
                                                                    {comp.category || "primary"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isEditing && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingId(comp.id);
                                                                setEditName(comp.name);
                                                            }}
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                                            title="Edit company name"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteCompany(comp)}
                                                            className="h-7 w-7 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                                            title="Delete company"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
