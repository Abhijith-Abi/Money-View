"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { BusinessProfile } from "@/types/customer";
import { getBusinessProfile } from "@/lib/business-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Building2, User, Mail, Phone, MapPin, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { BusinessLoader } from "./business-loader";

export function BusinessProfileCard({ onEdit }: { onEdit?: () => void }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const data = await getBusinessProfile(user.uid);
                setProfile(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    if (loading) return <BusinessLoader />;

    if (!profile) {
        return (
            <Card className="glass border-border/50 text-center p-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Business Profile</CardTitle>
                <p className="text-muted-foreground mb-6">
                    Setup your business profile to start managing customers and
                    ledgers.
                </p>
                <Button onClick={onEdit}>Setup Profile</Button>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <Card className="glass border-border/50 overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Building2 size={120} />
                </div>

                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        {profile.businessName}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="hover:bg-muted/50 h-8 w-8"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                    Owner
                                </p>
                                <p className="text-sm font-semibold">
                                    {profile.ownerName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                    Phone
                                </p>
                                <p className="text-sm font-semibold">
                                    {profile.phone}
                                </p>
                            </div>
                        </div>
                        {profile.email && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                        Email
                                    </p>
                                    <p className="text-sm font-semibold truncate">
                                        {profile.email}
                                    </p>
                                </div>
                            </div>
                        )}
                        {profile.taxId && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                    <Hash className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                        Tax ID / GSTIN
                                    </p>
                                    <p className="text-sm font-semibold uppercase tracking-tight">
                                        {profile.taxId}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {profile.address && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5 shrink-0">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                    Address
                                </p>
                                <p className="text-sm font-semibold leading-relaxed">
                                    {profile.address}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
