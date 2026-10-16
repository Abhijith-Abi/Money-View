"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Building2 } from "lucide-react";
import Image from "next/image";
import { CompanySettingsDialog } from "@/components/dashboard/company-settings-dialog";

export function UserProfile() {
    const { user, logout } = useAuth();
    const [showCompanySettings, setShowCompanySettings] = useState(false);

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-10 w-10 p-0 rounded-full transition-all group"
                    >
                        {/* Glowing ring */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />

                        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                            {user.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-r from-purple-600 to-indigo-700 flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                            )}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="glass bg-popover text-popover-foreground border-border w-64 p-2 shadow-xl"
                    sideOffset={10}
                >
                    <DropdownMenuLabel className="font-normal px-3 py-2.5">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-bold leading-none text-foreground tracking-tight">
                                {user.displayName || "Session User"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground font-medium truncate">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border my-1" />
                    <DropdownMenuItem
                        onClick={() => setShowCompanySettings(true)}
                        className="flex items-center gap-2.5 px-3 py-2 text-foreground focus:bg-primary/10 cursor-pointer rounded-lg transition-colors font-medium text-xs"
                    >
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>Company Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border my-1" />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer rounded-lg transition-colors font-medium text-xs"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CompanySettingsDialog
                open={showCompanySettings}
                onOpenChange={setShowCompanySettings}
            />
        </>
    );
}
