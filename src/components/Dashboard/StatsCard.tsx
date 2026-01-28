import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorMap: Record<string, { bgIcon: string, textIcon: string, blob: string, ring: string }> = {
  emerald: {
    bgIcon: 'bg-emerald-50 dark:bg-emerald-900/40',
    textIcon: 'text-emerald-700 dark:text-emerald-400',
    blob: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    ring: 'ring-emerald-200/30'
  },
  amber: {
    bgIcon: 'bg-amber-50 dark:bg-amber-900/40',
    textIcon: 'text-amber-700 dark:text-amber-400',
    blob: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    ring: 'ring-amber-200/30'
  },
  blue: {
    bgIcon: 'bg-blue-50 dark:bg-blue-900/40',
    textIcon: 'text-blue-700 dark:text-blue-400',
    blob: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    ring: 'ring-blue-200/30'
  },
  red: {
    bgIcon: 'bg-red-50 dark:bg-red-900/40',
    textIcon: 'text-red-700 dark:text-red-400',
    blob: 'bg-red-500/10 group-hover:bg-red-500/20',
    ring: 'ring-red-200/30'
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  // Extraer el color base (ej: 'bg-emerald-500' -> 'emerald')
  const colorName = color.replace('bg-', '').replace('-500', '') || 'emerald';
  const theme = colorMap[colorName] || colorMap.emerald;

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 glass-card group hover:scale-[1.02] transition-transform duration-300 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Fondo degradado sutil */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all ${theme.blob}`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</h3>

          {trend && (
            <div className={`flex items-center mt-2 text-xs font-bold ${trend.isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {trend.isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
              <span>{trend.value}%</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium ml-1">vs mes anterior</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl transition-all duration-300 shadow-sm group-hover:shadow-md ring-1 ring-inset ${theme.bgIcon} ${theme.textIcon} ${theme.ring}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;