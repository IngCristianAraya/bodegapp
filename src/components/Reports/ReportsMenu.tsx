import React from 'react';
import { BarChart2, TrendingUp, Package, ArrowLeftRight, Wallet, Receipt, AlertTriangle } from 'lucide-react';

interface ReportsMenuProps {
  onSelect: (type: string) => void;
}

const ReportsMenu: React.FC<ReportsMenuProps> = ({ onSelect }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={24} />, color: 'indigo' },
    { id: 'ventas', label: 'Ventas', icon: <Receipt size={24} />, color: 'emerald' },
    { id: 'ganancias', label: 'Ganancias', icon: <TrendingUp size={24} />, color: 'purple' },
    { id: 'mas_vendidos', label: 'Más Vendidos', icon: <TrendingUp size={24} className="rotate-12" />, color: 'pink' },
    { id: 'inventario', label: 'Inventario', icon: <Package size={24} />, color: 'blue' },
    { id: 'sugerencias', label: 'Por Comprar', icon: <AlertTriangle size={24} />, color: 'orange' },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowLeftRight size={24} />, color: 'cyan' },
    { id: 'gastos', label: 'Gastos', icon: <Receipt size={24} />, color: 'red' },
    { id: 'cierre_caja', label: 'Cierres de Caja', icon: <Wallet size={24} />, color: 'teal' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`
            flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-200
            border border-gray-100 dark:border-gray-700
            bg-white dark:bg-slate-800 hover:shadow-md hover:-translate-y-1
            group
          `}
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-colors
            bg-${item.color}-50 text-${item.color}-600 
            dark:bg-${item.color}-900/20 dark:text-${item.color}-400
            group-hover:bg-${item.color}-100 dark:group-hover:bg-${item.color}-900/40
          `}>
            {item.icon}
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ReportsMenu;
