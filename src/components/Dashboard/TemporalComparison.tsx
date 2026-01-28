import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import type { PeriodComparison } from '../../utils/temporalAnalysis';

interface TemporalComparisonProps {
    weekComparison: PeriodComparison;
    monthComparison: PeriodComparison;
    trend: {
        trend: 'growing' | 'stable' | 'declining';
        strength: 'strong' | 'moderate' | 'weak';
    };
}

const TemporalComparison: React.FC<TemporalComparisonProps> = ({ weekComparison, monthComparison, trend }) => {
    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600 dark:text-green-400';
        if (change < 0) return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const getChangeBg = (change: number) => {
        if (change > 0) return 'bg-green-100 dark:bg-green-900/30';
        if (change < 0) return 'bg-red-100 dark:bg-red-900/30';
        return 'bg-gray-100 dark:bg-gray-800';
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp size={14} />;
        if (change < 0) return <TrendingDown size={14} />;
        return <Minus size={14} />;
    };

    const getTrendEmoji = () => {
        if (trend.trend === 'growing') return '📈';
        if (trend.trend === 'declining') return '📉';
        return '➡️';
    };

    const getTrendText = () => {
        const strengthText = trend.strength === 'strong' ? 'fuerte' : trend.strength === 'moderate' ? 'moderado' : 'leve';
        if (trend.trend === 'growing') return `Crecimiento ${strengthText}`;
        if (trend.trend === 'declining') return `Decrecimiento ${strengthText}`;
        return 'Estable';
    };

    return (
        <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Análisis Temporal</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comparación con períodos anteriores</p>
                </div>
            </div>

            {/* Trend Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTrendEmoji()}</span>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{getTrendText()}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Tendencia general del negocio</p>
                    </div>
                </div>
            </div>

            {/* Week Comparison */}
            <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Esta Semana vs. Semana Pasada
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ventas</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            S/. {weekComparison.current.totalSales.toFixed(0)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(weekComparison.change.sales)}`}>
                            {getChangeIcon(weekComparison.change.sales)}
                            {formatChange(weekComparison.change.sales)}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Órdenes</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {weekComparison.current.totalOrders}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(weekComparison.change.orders)}`}>
                            {getChangeIcon(weekComparison.change.orders)}
                            {formatChange(weekComparison.change.orders)}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ticket Prom.</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            S/. {weekComparison.current.avgTicket.toFixed(0)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(weekComparison.change.avgTicket)}`}>
                            {getChangeIcon(weekComparison.change.avgTicket)}
                            {formatChange(weekComparison.change.avgTicket)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Month Comparison */}
            <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Este Mes vs. Mes Pasado
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ventas</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            S/. {monthComparison.current.totalSales.toFixed(0)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(monthComparison.change.sales)}`}>
                            {getChangeIcon(monthComparison.change.sales)}
                            {formatChange(monthComparison.change.sales)}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Órdenes</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {monthComparison.current.totalOrders}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(monthComparison.change.orders)}`}>
                            {getChangeIcon(monthComparison.change.orders)}
                            {formatChange(monthComparison.change.orders)}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ticket Prom.</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            S/. {monthComparison.current.avgTicket.toFixed(0)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getChangeColor(monthComparison.change.avgTicket)}`}>
                            {getChangeIcon(monthComparison.change.avgTicket)}
                            {formatChange(monthComparison.change.avgTicket)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemporalComparison;
