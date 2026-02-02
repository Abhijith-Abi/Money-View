"use client";

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
import { LogOut, User } from "lucide-react";
import Image from "next/image";

export function UserProfile() {
    const { user, logout } = useAuth();

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 p-0 rounded-full transition-all group"
                >
                    {/* Glowing ring */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />

                    <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
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
                className="glass backdrop-blur-3xl border-white/5 w-64 p-2 shadow-2xl"
                sideOffset={10}
            >
                <DropdownMenuLabel className="font-normal px-3 py-3">
                    <div className="flex flex-col space-y-2">
                        <p className="text-sm font-semibold leading-none text-white tracking-tight">
                            {user.displayName || "Session User"}
                        </p>
                        <p className="text-xs leading-none text-slate-400 font-medium">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer rounded-lg transition-colors group"
                >
                    <div className="p-1.5 rounded-md bg-rose-500/10 group-focus:bg-rose-500/20 transition-colors">
                        <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
