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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    Settings,
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
    { name: "Indigo", value: "#6366f1", bg: "bg-indigo-500" },
    { name: "Violet", value: "#8b5cf6", bg: "bg-violet-500" },
    { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
    { name: "Emerald", value: "#10b981", bg: "bg-emerald-500" },
    { name: "Amber", value: "#f59e0b", bg: "bg-amber-500" },
    { name: "Rose", value: "#f43f5e", bg: "bg-rose-500" },
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
        if (!name.trim()) {
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
                name: name.trim(),
                category,
                color: selectedColor,
                description: description.trim(),
            });

            const newCompany: Company = {
                id: companyId,
                userId: user.uid,
                name: name.trim(),
                category,
                color: selectedColor,
                description: description.trim(),
                createdAt: new Date(),
            };

            toast({
                title: "Company Added",
                description: `"${name.trim()}" was successfully saved to your settings.`,
                duration: 2000,
            });

            setName("");
            setDescription("");
            if (onCompanyAdded) {
                onCompanyAdded(newCompany);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add company. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteCompany(comp: Company) {
        if (!user) return;
        if (!confirm(`Are you sure you want to delete "${comp.name}"? Existing entries will keep their history.`)) {
            return;
        }

        try {
            await deleteCompany(comp.id, user.uid);
            toast({
                title: "Company Deleted",
                description: `"${comp.name}" removed from settings`,
                duration: 1500,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete company",
                variant: "destructive",
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
            toast({
                title: "Error",
                description: "Failed to update company",
                variant: "destructive",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="glass border-border/80 hover:bg-accent font-semibold text-xs h-9 gap-1.5"
                    >
                        <Settings className="h-4 w-4 text-primary" />
                        <span>Settings</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass bg-card/95 text-card-foreground border-border max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
                {/* Top Brand Gradient Accent */}
                <div className="h-[3px] bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />
                <div className="p-6 space-y-6">
                    <DialogHeader className="text-left space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    Company Settings & Management
                                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs">
                                    Add and manage your employers, freelance clients, and revenue sources
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* New Company Creation Form */}
                    <form
                        onSubmit={handleAddCompany}
                        className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3.5"
                    >
                        <div className="flex items-center justify-between pb-1 border-b border-border/50">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Plus className="h-3.5 w-3.5 text-primary" /> Add New Company
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Fast setup
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Company / Client Name *
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Google, Acme Corp, Upwork"
                                    className="bg-background border-input text-foreground font-semibold text-xs h-10 rounded-xl"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Default Category
                                </Label>
                                <Select
                                    value={category}
                                    onValueChange={(val: "primary" | "secondary") => setCategory(val)}
                                >
                                    <SelectTrigger className="bg-background border-input text-foreground text-xs font-medium h-10 rounded-xl">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="glass bg-popover text-popover-foreground border-border">
                                        <SelectItem value="primary" className="text-xs font-semibold">
                                            Primary Stream (Salary / Core)
                                        </SelectItem>
                                        <SelectItem value="secondary" className="text-xs font-semibold">
                                            Secondary Stream (Freelance / Extra)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Color Picker & Description */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Badge Accent Color
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setSelectedColor(c.value)}
                                            style={{ backgroundColor: c.value }}
                                            className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                                                selectedColor === c.value
                                                    ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-sm"
                                                    : "opacity-75 hover:opacity-100"
                                            }`}
                                            title={c.name}
                                        >
                                            {selectedColor === c.value && (
                                                <Check className="w-3 h-3 text-white stroke-[3]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all self-end"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Save Company
                            </Button>
                        </div>
                    </form>

                    {/* Companies List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Registered Companies ({companies.length})
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Available in transaction form & table filter
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
                            <div className="divide-y divide-border/60 rounded-xl border border-border/80 overflow-hidden bg-background/50">
                                <AnimatePresence mode="popLayout">
                                    {companies.map((comp) => {
                                        const isEditing = editingId === comp.id;
                                        return (
                                            <motion.div
                                                key={comp.id}
                                                layout
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
                                                        style={{ backgroundColor: comp.color || "#6366f1" }}
                                                    >
                                                        <Building2 className="w-4 h-4" />
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
                                                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setEditingId(null)}
                                                                className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                                                            >
                                                                <X className="h-4 w-4" />
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
                                                            {comp.description && (
                                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                                    {comp.description}
                                                                </p>
                                                            )}
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
