import React, { useState } from 'react';
import './app/layout-fix.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { LowStockProvider } from './contexts/LowStockContext';
import LoginForm from './components/Auth/LoginForm';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import POS from "./components/POS/POS";
import Inventory from './components/Inventory/Inventory';
import Reports from './components/Reports/Reports';
import LowStockManager from './components/LowStock/LowStockManager';


const AppContent: React.FC = () => {
  // Mover el hook useAuth a la raíz del componente
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      case 'lowstock':
        return <LowStockManager />;
      case 'suppliers':
        return <div className="p-6"><h1 className="text-2xl font-bold">Proveedores - Próximamente</h1></div>;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Configuración - Próximamente</h1></div>;
      default:
        return <Dashboard />;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      alert('Error al cerrar sesión');
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
      <div className="flex-1 overflow-auto min-h-screen bg-gray-50 pt-16">
        {renderCurrentPage()}
      </div>
    </>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <TenantProvider>
      <AuthProvider>
        <LowStockProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </LowStockProvider>
      </AuthProvider>
    </TenantProvider>
  </ToastProvider>
);

export default App;