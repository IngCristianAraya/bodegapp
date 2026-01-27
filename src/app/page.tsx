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

export default function Home() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // if (!user) {
  //   return <LoginForm />;
  // }

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
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={() => { }} />
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={() => { }} />
      <div className="flex-1 overflow-auto min-h-screen pt-28 px-6 pb-6 animate-in fade-in duration-500">{renderCurrentPage()}</div>
    </>
  );
}
