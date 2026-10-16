"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="glass border-border/80 hover:bg-accent transition-colors h-9 w-9 rounded-xl"
                >
                    <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all text-amber-500 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all text-indigo-400 dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass bg-popover text-popover-foreground border-border/80 shadow-xl rounded-xl p-1 min-w-[120px]">
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer font-semibold text-xs rounded-lg">
                    ☀️ Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer font-semibold text-xs rounded-lg">
                    🌙 Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer font-semibold text-xs rounded-lg">
                    💻 System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
