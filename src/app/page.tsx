"use client";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/Auth/LoginForm";
import Navbar from "../components/Layout/Navbar";
import Dashboard from "../components/Dashboard/Dashboard";
import POS from "../components/POS/POS";
import Inventory from "../components/Inventory/Inventory";
import Reports from "../components/Reports/Reports";
import LowStockManager from "../components/LowStock/LowStockManager";
import Settings from "../components/Settings/Settings";
import SupplierManager from '../components/Suppliers/SupplierManager';
import LandingNavbar from "../components/Landing/LandingNavbar";
import Hero from "../components/Landing/Hero";
import Features from "../components/Landing/Features";
import Pricing from "../components/Landing/Pricing";
import Footer from "../components/Landing/Footer";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLandingPage, setIsLandingPage] = useState(false);

  React.useEffect(() => {
    // Basic detection: If localhost or main domain -> Landing
    // If subdomain -> Login
    const hostname = window.location.hostname;
    const isLocalhostRoot = hostname === 'localhost';
    // 'bodegapp.tubarrio.pe' será la Landing Page
    // 'alguna-bodega.tubarrio.pe' será el Login del Tenant
    const isProdRoot = hostname === 'bodegapp.tubarrio.pe' || hostname === 'www.bodegapp.tubarrio.pe' || hostname === 'bodegapp.com';

    setIsLandingPage(isLocalhostRoot || isProdRoot);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    if (isLandingPage) {
      return (
        <main className="min-h-screen bg-slate-900">
          <LandingNavbar />
          <Hero />
          <Features />
          <Pricing />
          <Footer />
        </main>
      );
    }
    return <LoginForm />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "pos":
        return <POS />;
      case "inventory":
        return <Inventory />;
      case "reports":
        return <Reports />;
      case "lowstock":
        return <LowStockManager />;
      case "suppliers":
        return <SupplierManager />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={logout} />
      <div className="flex-1 overflow-auto min-h-screen pt-28 px-6 pb-6 animate-in fade-in duration-500">{renderCurrentPage()}</div>
    </>
  );
}
