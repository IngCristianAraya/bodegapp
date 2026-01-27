import React from 'react';
import { BarChart2, TrendingUp, Package, ArrowLeftRight } from 'lucide-react';

interface ReportsMenuProps {
  onSelect: (type: string) => void;
}

const ReportsMenu: React.FC<ReportsMenuProps> = ({ onSelect }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSelect('ventas')}
        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium flex items-center gap-2 transition-colors"
      >
        <BarChart2 size={18} />
        Ventas
      </button>
      <button
        onClick={() => onSelect('inventario')}
        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center gap-2 transition-colors"
      >
        <Package size={18} />
        Inventario
      </button>
      <button
        onClick={() => onSelect('ganancias')}
        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium flex items-center gap-2 transition-colors"
      >
        <TrendingUp size={18} />
        Ganancias
      </button>
      <button
        onClick={() => onSelect('movimientos')}
        className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium flex items-center gap-2 transition-colors"
      >
        <ArrowLeftRight size={18} />
        Movimientos
      </button>
    </div>
  );
};

export default ReportsMenu;
