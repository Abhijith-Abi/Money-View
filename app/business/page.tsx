"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    ChevronLeft,
    LayoutDashboard,
    Users,
    BookOpen,
    BarChart3,
    Settings,
    Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessDashboard as NewBusinessDashboard } from "@/components/business/business-dashboard";
import { CustomersTable } from "@/components/business/customers-table";
import { CustomerDetail } from "@/components/business/customer-detail";
import { BusinessProfileForm } from "@/components/business/business-profile-form";
import { BusinessProfileCard } from "@/components/business/business-profile-card";
import { CustomerForm } from "@/components/business/customer-form";
import { ReportsView } from "@/components/business/reports-view";
import { RemindersList } from "@/components/business/reminders-list";
import { getAllCustomers, deleteCustomer } from "@/lib/customer-service";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

export default function BusinessManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("dashboard");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null,
    );
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );
    const [viewingDetail, setViewingDetail] = useState(false);
    const [showProfileForm, setShowProfileForm] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    async function fetchCustomers() {
        if (!user) return;
        setLoadingCustomers(true);
        try {
            const data = await getAllCustomers(user.uid);
            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoadingCustomers(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchCustomers();
        }
    }, [user]);

    const handleDeleteCustomer = async (customer: Customer) => {
        if (!user) return;
        if (
            confirm(
                `Are you sure you want to delete ${customer.name}? This will remove all their transaction history.`,
            )
        ) {
            try {
                await deleteCustomer(customer.id, user.uid);
                toast({
                    title: "Deleted",
                    description: "Customer removed successfully",
                });
                fetchCustomers();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete customer",
                    variant: "destructive",
                });
            }
        }
    };

    if (authLoading || !user) return null;

    if (authLoading || !user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Background elements (matching main app) */}
            <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/20 to-background -z-10" />
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-gradient-to-br from-purple-500/5 to-cyan-500/5 blur-3xl"
                        style={{
                            width: 300,
                            height: 300,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -40, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="relative p-6 lg:p-12 max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/")}
                            className="glass hover:bg-white/10"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Business Management
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Manage customers, ledgers, and reports
                            </p>
                        </div>
                    </div>
                    <ModeToggle />
                </div>

                <Tabs
                    defaultValue="dashboard"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <div className="overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                        <TabsList className="bg-muted/50 border border-border p-1 w-max md:w-auto">
                            <TabsTrigger
                                value="dashboard"
                                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                            >
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Dashboard
                            </TabsTrigger>
                            <TabsTrigger
                                value="customers"
                                className="data-[state=active]:bg-purple-600"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Customers
                            </TabsTrigger>
                            <TabsTrigger
                                value="reports"
                                className="data-[state=active]:bg-purple-600"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Reports
                            </TabsTrigger>
                            <TabsTrigger
                                value="reminders"
                                className="data-[state=active]:bg-purple-600"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                Reminders
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="data-[state=active]:bg-purple-600"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TabsContent
                                value="dashboard"
                                className="space-y-6 outline-none m-0"
                            >
                                <NewBusinessDashboard />
                            </TabsContent>

                            <TabsContent
                                value="customers"
                                className="space-y-6 outline-none m-0"
                            >
                                {viewingDetail && selectedCustomer ? (
                                    <CustomerDetail
                                        customer={selectedCustomer}
                                        onBack={() => {
                                            setViewingDetail(false);
                                            fetchCustomers();
                                        }}
                                    />
                                ) : (
                                    <CustomersTable
                                        customers={customers}
                                        loading={loadingCustomers}
                                        onAdd={() => {
                                            setEditingCustomer(null);
                                            setShowCustomerForm(true);
                                        }}
                                        onEdit={(c) => {
                                            setEditingCustomer(c);
                                            setShowCustomerForm(true);
                                        }}
                                        onDelete={handleDeleteCustomer}
                                        onView={(c) => {
                                            setSelectedCustomer(c);
                                            setViewingDetail(true);
                                        }}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent
                                value="reports"
                                className="outline-none m-0"
                            >
                                <ReportsView />
                            </TabsContent>

                            <TabsContent
                                value="reminders"
                                className="outline-none m-0"
                            >
                                <RemindersList />
                            </TabsContent>

                            <TabsContent
                                value="settings"
                                className="space-y-6 outline-none m-0"
                            >
                                {showProfileForm ? (
                                    <div className="max-w-2xl mx-auto">
                                        <Button
                                            variant="link"
                                            className="mb-4"
                                            onClick={() =>
                                                setShowProfileForm(false)
                                            }
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Back to Profile
                                        </Button>
                                        <BusinessProfileForm
                                            onSuccess={() =>
                                                setShowProfileForm(false)
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div className="max-w-3xl mx-auto">
                                        <BusinessProfileCard
                                            onEdit={() =>
                                                setShowProfileForm(true)
                                            }
                                        />
                                    </div>
                                )}
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>

            <CustomerForm
                open={showCustomerForm}
                onOpenChange={setShowCustomerForm}
                customer={editingCustomer}
                onSuccess={fetchCustomers}
            />
        </div>
    );
}
