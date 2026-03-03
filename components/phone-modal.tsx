"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, savePhoneNumber } from "@/lib/user-service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, User, Loader2 } from "lucide-react";

export function PhoneNumberModal() {
    const { user, loading } = useAuth();
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [needsName, setNeedsName] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [checked, setChecked] = useState(false);

    // Once auth is ready and user is logged in, check if profile is complete
    useEffect(() => {
        if (loading || !user || checked) return;

        (async () => {
            setChecked(true);
            const profile = await getUserProfile(user.uid);

            const missingPhone = !profile?.phoneNumber;
            const missingName = !profile?.displayName;

            if (missingPhone || missingName) {
                setNeedsName(missingName);
                if (profile?.displayName) setName(profile.displayName);
                setOpen(true);
            }
        })();
    }, [user, loading, checked]);

    const validatePhone = (value: string) => {
        const digits = value.replace(/\D/g, "");
        if (digits.length !== 10)
            return "Please enter a valid 10-digit mobile number.";
        if (!/^[6-9]/.test(digits))
            return "Mobile number must start with 6, 7, 8, or 9.";
        return "";
    };

    const handleSave = async () => {
        const digits = phone.replace(/\D/g, "");
        const phoneErr = validatePhone(digits);
        if (phoneErr) {
            setError(phoneErr);
            return;
        }

        if (needsName && !name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!user) return;

        setSaving(true);
        try {
            await savePhoneNumber(
                user.uid,
                digits,
                needsName ? name.trim() : undefined,
            );
            setOpen(false);
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        // Close without saving — will show again next login
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-md"
                // Prevent closing by clicking outside
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950/60">
                            <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <DialogTitle className="text-xl">
                            Complete Your Profile
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm leading-relaxed">
                        Please provide the following details to continue. We use
                        this to personalize your experience and send
                        notifications.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {needsName && (
                        <div className="space-y-2">
                            <Label
                                htmlFor="name-input"
                                className="text-sm font-semibold"
                            >
                                Your Name
                            </Label>
                            <Input
                                id="name-input"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError("");
                                }}
                                className="w-full"
                                autoFocus={needsName}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor="phone-input"
                            className="text-sm font-semibold"
                        >
                            Mobile Number
                        </Label>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center px-3 h-10 border border-input rounded-md bg-muted/50 text-sm text-muted-foreground font-medium">
                                🇮🇳 +91
                            </div>
                            <Input
                                id="phone-input"
                                type="tel"
                                placeholder="98765 43210"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSave()
                                }
                                maxLength={10}
                                className="flex-1"
                                autoFocus={!needsName}
                            />
                        </div>
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleSkip}
                            disabled={saving}
                        >
                            Skip for now
                        </Button>
                        <Button
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={handleSave}
                            disabled={
                                saving ||
                                phone.replace(/\D/g, "").length !== 10 ||
                                (needsName && !name.trim())
                            }
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Details"
                            )}
                        </Button>
                    </div>

                    <p className="text-[11px] text-center text-muted-foreground">
                        🔒 Your data is stored securely and only used for
                        personalization and notifications.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
