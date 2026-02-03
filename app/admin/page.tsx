"use client";

import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session storage for persistence across refreshes
        const auth = sessionStorage.getItem("admin_auth");
        if (auth === "true") {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = () => {
        sessionStorage.setItem("admin_auth", "true");
        setIsAuthenticated(true);
    };

    if (loading) return null;

    return isAuthenticated ? (
        <AdminDashboard />
    ) : (
        <AdminLogin onLogin={handleLogin} />
    );
}
