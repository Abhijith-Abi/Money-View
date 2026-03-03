"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
    AppNotification,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "@/lib/notification-service";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotifications(
            user.uid,
            setNotifications,
        );
        return () => unsubscribe();
    }, [user]);

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif: AppNotification) => {
        if (!user) return;
        await markAsRead(user.uid, notif.id);
        if (notif.link) {
            router.push(notif.link);
            setOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        await markAllAsRead(user.uid);
    };

    const handleDelete = async (e: React.MouseEvent, notifId: string) => {
        e.stopPropagation();
        if (!user) return;
        await deleteNotification(user.uid, notifId);
    };

    if (!user) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-10 z-50 w-[360px] max-h-[520px] flex flex-col rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="font-semibold text-sm">
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    All read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-md hover:bg-muted transition-colors"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                                <Bell className="h-10 w-10 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        onClick={() =>
                                            handleNotificationClick(notif)
                                        }
                                        className={cn(
                                            "group flex gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/60",
                                            !notif.read && "bg-primary/5",
                                        )}
                                    >
                                        {/* Unread dot */}
                                        <div className="mt-1.5 flex-shrink-0">
                                            <div
                                                className={cn(
                                                    "h-2 w-2 rounded-full transition-colors",
                                                    notif.read
                                                        ? "bg-transparent"
                                                        : "bg-primary",
                                                )}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-sm font-medium truncate",
                                                        notif.read &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 flex-shrink-0">
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            notif.createdAt,
                                                        ),
                                                        { addSuffix: true },
                                                    )}
                                                </span>
                                            </div>

                                            {notif.body && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {notif.body}
                                                </p>
                                            )}

                                            {notif.image && (
                                                <div className="mt-2 rounded-md overflow-hidden border h-[100px]">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={notif.image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            {notif.link && (
                                                <div className="flex items-center gap-1 mt-1 text-[11px] text-primary/80">
                                                    <ExternalLink className="h-3 w-3" />
                                                    <span>Tap to view</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (user)
                                                            markAsRead(
                                                                user.uid,
                                                                notif.id,
                                                            );
                                                    }}
                                                    className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) =>
                                                    handleDelete(e, notif.id)
                                                }
                                                className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-destructive"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
