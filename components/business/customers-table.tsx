"use client";

import { useState } from "react";
import { Customer } from "@/types/customer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Plus,
    Filter,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CustomersTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onView: (customer: Customer) => void;
    onAdd: () => void;
    loading?: boolean;
}

export function CustomersTable({
    customers,
    onEdit,
    onDelete,
    onView,
    onAdd,
    loading,
}: CustomersTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "active" | "inactive"
    >("all");
    const [balanceFilter, setBalanceFilter] = useState<
        "all" | "receivable" | "payable" | "zero"
    >("all");

    const filteredCustomers = customers.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || c.status === statusFilter;

        const matchesBalance =
            balanceFilter === "all" ||
            (balanceFilter === "receivable" && c.currentBalance > 0) ||
            (balanceFilter === "payable" && c.currentBalance < 0) ||
            (balanceFilter === "zero" && c.currentBalance === 0);

        return matchesSearch && matchesStatus && matchesBalance;
    });

    const isFiltered = statusFilter !== "all" || balanceFilter !== "all";

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 glass"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "glass h-10 px-4 transition-all duration-300",
                                    isFiltered
                                        ? "border-purple-500/50 bg-purple-500/5 text-purple-400"
                                        : "border-border/50 shadow-sm",
                                )}
                            >
                                <Filter
                                    className={cn(
                                        "h-4 w-4 mr-2",
                                        isFiltered && "animate-pulse",
                                    )}
                                />
                                {isFiltered ? "Filtered" : "Filter"}
                                {isFiltered && (
                                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-500 text-white border-none text-[10px]">
                                        {
                                            [
                                                statusFilter !== "all",
                                                balanceFilter !== "all",
                                            ].filter(Boolean).length
                                        }
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="glass border-border/50 w-56 p-2"
                        >
                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Status
                            </div>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    statusFilter === "all" && "bg-muted/50",
                                )}
                                onClick={() => setStatusFilter("all")}
                            >
                                All Statuses
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    statusFilter === "active" &&
                                        "bg-emerald-500/10 text-emerald-400",
                                )}
                                onClick={() => setStatusFilter("active")}
                            >
                                Active Only
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    statusFilter === "inactive" &&
                                        "bg-rose-500/10 text-rose-400",
                                )}
                                onClick={() => setStatusFilter("inactive")}
                            >
                                Inactive Only
                            </DropdownMenuItem>

                            <div className="h-px bg-border/50 my-2" />

                            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Balance
                            </div>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    balanceFilter === "all" && "bg-muted/50",
                                )}
                                onClick={() => setBalanceFilter("all")}
                            >
                                All Balances
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    balanceFilter === "receivable" &&
                                        "bg-emerald-500/10 text-emerald-400",
                                )}
                                onClick={() => setBalanceFilter("receivable")}
                            >
                                Receivable (Dr)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    balanceFilter === "payable" &&
                                        "bg-rose-500/10 text-rose-400",
                                )}
                                onClick={() => setBalanceFilter("payable")}
                            >
                                Payable (Cr)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer",
                                    balanceFilter === "zero" && "bg-muted/50",
                                )}
                                onClick={() => setBalanceFilter("zero")}
                            >
                                Settled (Zero)
                            </DropdownMenuItem>

                            {isFiltered && (
                                <>
                                    <div className="h-px bg-border/50 my-2" />
                                    <DropdownMenuItem
                                        className="cursor-pointer justify-center text-rose-400 font-bold text-xs"
                                        onClick={() => {
                                            setStatusFilter("all");
                                            setBalanceFilter("all");
                                        }}
                                    >
                                        Clear All Filters
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onClick={onAdd}
                        className="h-10 bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-border/30 glass overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/30">
                                <TableHead className="font-bold">
                                    Customer Name
                                </TableHead>
                                <TableHead className="font-bold">
                                    Contact Info
                                </TableHead>
                                <TableHead className="font-bold">
                                    Status
                                </TableHead>
                                <TableHead className="font-bold text-right">
                                    Balance
                                </TableHead>
                                <TableHead className="w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center"
                                    >
                                        Loading customers...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        className="cursor-pointer hover:bg-muted/30 border-border/10 transition-colors"
                                        onClick={() => onView(customer)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{customer.name}</span>
                                                {customer.address && (
                                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                                        {customer.address}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{customer.phone}</span>
                                                {customer.email && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    customer.status === "active"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className={
                                                    customer.status === "active"
                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                                        : ""
                                                }
                                            >
                                                {customer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    customer.currentBalance > 0
                                                        ? "text-emerald-400 font-bold"
                                                        : customer.currentBalance <
                                                            0
                                                          ? "text-rose-400 font-bold"
                                                          : "font-medium"
                                                }
                                            >
                                                ₹
                                                {Math.abs(
                                                    customer.currentBalance,
                                                ).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                                {customer.currentBalance > 0
                                                    ? " (Receivable)"
                                                    : customer.currentBalance <
                                                        0
                                                      ? " (Payable)"
                                                      : ""}
                                            </span>
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="glass border-white/10"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onView(customer)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Ledger
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onEdit(customer)
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-rose-400"
                                                        onClick={() =>
                                                            onDelete(customer)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            Loading customers...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No customers found.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/10">
                            {filteredCustomers.map((customer, index) => (
                                <div
                                    key={customer.id}
                                    className="p-4 active:bg-muted/30 transition-colors"
                                    onClick={() => onView(customer)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">
                                                {customer.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {customer.phone}
                                            </span>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                asChild
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 -mr-2"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="glass border-white/10"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onView(customer)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Ledger
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onEdit(customer)
                                                    }
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-rose-400"
                                                    onClick={() =>
                                                        onDelete(customer)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <Badge
                                            variant={
                                                customer.status === "active"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className={
                                                customer.status === "active"
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : ""
                                            }
                                        >
                                            {customer.status}
                                        </Badge>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                Balance
                                            </p>
                                            <p
                                                className={cn(
                                                    "font-bold",
                                                    customer.currentBalance > 0
                                                        ? "text-emerald-400"
                                                        : customer.currentBalance <
                                                            0
                                                          ? "text-rose-400"
                                                          : "",
                                                )}
                                            >
                                                ₹
                                                {Math.abs(
                                                    customer.currentBalance,
                                                ).toLocaleString("en-IN")}
                                                <span className="text-[10px] ml-1">
                                                    {customer.currentBalance > 0
                                                        ? "Dr"
                                                        : customer.currentBalance <
                                                            0
                                                          ? "Cr"
                                                          : ""}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
