import React from 'react';
import { Home, ShoppingCart, Package, Truck, BarChart3, Settings, LogOut, CircleAlert } from 'lucide-react';
import { useLowStock } from '../../contexts/LowStockContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'lowstock', label: 'Bajo Stock', icon: CircleAlert },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'reports', label: 'Reportes', icon: BarChart3 },
  { id: 'settings', label: 'Configuración', icon: Settings }
];

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange, onLogout }) => {
  // Use try-catch to handle case where context might not be available
  let criticalStockCount = 0;
  try {
    const lowStockContext = useLowStock();
    criticalStockCount = lowStockContext.criticalStockCount;
  } catch (error) {
    // Context not available yet, use default value
    console.warn('LowStockContext not available in Navbar');
  }
  return (
    <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl glass shadow-lg border border-white/20 dark:border-white/10 dark:bg-slate-900/80">
      <div className="w-full px-6 flex items-center justify-between h-18">
        {/* Logo con degradado premium */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-emerald-500/20 shadow-lg">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent tracking-tight font-heading">
            Bodegapp
          </span>
        </div>

        {/* Menú de Navegación */}
        <div className="flex-1 flex justify-center">
          <ul className="flex items-center space-x-2 bg-secondary/50 dark:bg-slate-800/50 p-1.5 rounded-full backdrop-blur-sm">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onPageChange(item.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out
                      ${isActive
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-md font-semibold transform scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-600 dark:text-white' : ''} />
                    <span className="text-sm hidden sm:inline-block">{item.label}</span>
                    {item.id === 'lowstock' && criticalStockCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {criticalStockCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm hidden sm:inline-block">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
