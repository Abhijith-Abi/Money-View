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
    UserCheck,
    Phone,
    Mail,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";

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
            (balanceFilter === "receivable" && c.currentBalance < 0) ||
            (balanceFilter === "payable" && c.currentBalance > 0) ||
            (balanceFilter === "zero" && c.currentBalance === 0);

        return matchesSearch && matchesStatus && matchesBalance;
    });

    const isFiltered = statusFilter !== "all" || balanceFilter !== "all";

    return (
        <div className="space-y-4">
            {/* Action & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, phone or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-10 text-xs focus:border-purple-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "bg-white/[0.04] border-white/10 text-white font-bold h-10 px-4 rounded-xl text-xs transition-all",
                                    isFiltered
                                        ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                                        : "hover:bg-white/10"
                                )}
                            >
                                <Filter
                                    className={cn(
                                        "h-3.5 w-3.5 mr-2",
                                        isFiltered && "text-purple-400"
                                    )}
                                />
                                {isFiltered ? "Filtered" : "Filter"}
                                {isFiltered && (
                                    <Badge className="ml-2 h-4 w-4 p-0 flex items-center justify-center bg-purple-500 text-white border-none text-[9px]">
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
                            className="bg-slate-950/95 backdrop-blur-2xl border-white/10 w-56 p-2 rounded-2xl text-white shadow-2xl"
                        >
                            <div className="px-2 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Status
                            </div>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    statusFilter === "all" && "bg-white/10"
                                )}
                                onClick={() => setStatusFilter("all")}
                            >
                                All Statuses
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    statusFilter === "active" &&
                                        "bg-emerald-500/20 text-emerald-300"
                                )}
                                onClick={() => setStatusFilter("active")}
                            >
                                Active Only
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    statusFilter === "inactive" &&
                                        "bg-rose-500/20 text-rose-300"
                                )}
                                onClick={() => setStatusFilter("inactive")}
                            >
                                Inactive Only
                            </DropdownMenuItem>

                            <div className="h-px bg-white/10 my-2" />

                            <div className="px-2 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Balance Filter
                            </div>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    balanceFilter === "all" && "bg-white/10"
                                )}
                                onClick={() => setBalanceFilter("all")}
                            >
                                All Balances
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    balanceFilter === "receivable" &&
                                        "bg-rose-500/20 text-rose-300"
                                )}
                                onClick={() => setBalanceFilter("receivable")}
                            >
                                Due / Receivable (Dr)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    balanceFilter === "payable" &&
                                        "bg-emerald-500/20 text-emerald-300"
                                )}
                                onClick={() => setBalanceFilter("payable")}
                            >
                                Advance / Payable (Cr)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={cn(
                                    "cursor-pointer text-xs rounded-xl",
                                    balanceFilter === "zero" && "bg-white/10"
                                )}
                                onClick={() => setBalanceFilter("zero")}
                            >
                                Settled (Zero Balance)
                            </DropdownMenuItem>

                            {isFiltered && (
                                <>
                                    <div className="h-px bg-white/10 my-2" />
                                    <DropdownMenuItem
                                        className="cursor-pointer justify-center text-rose-400 font-bold text-xs rounded-xl"
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
                        className="h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl px-4 text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Desktop & Mobile Card Containers */}
            <div className="rounded-[2rem] border border-white/[0.08] bg-slate-950/40 backdrop-blur-xl overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-white/[0.03] border-b border-white/[0.08]">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                                    Customer Name
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                                    Contact Info
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider text-center">
                                    Status
                                </TableHead>
                                <TableHead className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider text-right">
                                    Balance
                                </TableHead>
                                <TableHead className="w-16"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-slate-500 text-xs"
                                    >
                                        Loading customer ledger...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-slate-500 text-xs"
                                    >
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        className="cursor-pointer hover:bg-white/[0.03] border-b border-white/[0.04] transition-colors"
                                        onClick={() => onView(customer)}
                                    >
                                        <TableCell className="font-semibold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-xs">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-white text-xs font-bold hover:text-purple-300 transition-colors">
                                                        {customer.name}
                                                    </span>
                                                    {customer.address && (
                                                        <span className="text-[10px] text-slate-400 block line-clamp-1">
                                                            {customer.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs space-y-0.5">
                                                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-slate-500" />
                                                    {customer.phone}
                                                </span>
                                                {customer.email && (
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3 text-slate-500" />
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={cn(
                                                    "text-[9px] font-extrabold uppercase tracking-wider border",
                                                    customer.status === "active"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-white/5 text-slate-400 border-white/10"
                                                )}
                                            >
                                                {customer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={cn(
                                                    "text-xs font-black tracking-tight",
                                                    customer.currentBalance < 0
                                                        ? "text-rose-400"
                                                        : customer.currentBalance > 0
                                                          ? "text-emerald-400"
                                                          : "text-slate-400 font-medium"
                                                )}
                                            >
                                                ₹
                                                {Math.abs(
                                                    customer.currentBalance,
                                                ).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                                <span className="text-[10px] ml-1 font-extrabold uppercase">
                                                    {customer.currentBalance < 0
                                                        ? " (Due)"
                                                        : customer.currentBalance > 0
                                                          ? " (Advance)"
                                                          : " (Settled)"}
                                                </span>
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
                                                        className="h-8 w-8 text-slate-400 hover:text-white rounded-lg"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-1.5"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => onView(customer)}
                                                        className="cursor-pointer text-xs rounded-xl"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                                        View Ledger
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(customer)}
                                                        className="cursor-pointer text-xs rounded-xl"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                                        Edit Info
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-rose-400 cursor-pointer text-xs rounded-xl"
                                                        onClick={() => onDelete(customer)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
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
                <div className="md:hidden divide-y divide-white/[0.04]">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            Loading customers...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            No customers found.
                        </div>
                    ) : (
                        filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="p-4 active:bg-white/[0.05] transition-colors"
                                onClick={() => onView(customer)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-xs">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-white block">
                                                {customer.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {customer.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "text-[9px] font-extrabold uppercase tracking-wider border",
                                            customer.status === "active"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-white/5 text-slate-400 border-white/10"
                                        )}
                                    >
                                        {customer.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/[0.04]">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                        Current Balance
                                    </span>
                                    <p
                                        className={cn(
                                            "font-extrabold text-xs tracking-tight",
                                            customer.currentBalance < 0
                                                ? "text-rose-400"
                                                : customer.currentBalance > 0
                                                  ? "text-emerald-400"
                                                  : "text-slate-400"
                                        )}
                                    >
                                        ₹{Math.abs(customer.currentBalance).toLocaleString("en-IN")}
                                        <span className="text-[10px] ml-1">
                                            {customer.currentBalance < 0
                                                ? "Due (Dr)"
                                                : customer.currentBalance > 0
                                                  ? "Adv (Cr)"
                                                  : "Settled"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
