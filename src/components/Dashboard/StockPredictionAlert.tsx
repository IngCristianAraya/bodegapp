import React from 'react';
import { TrendingUp, AlertCircle, Package } from 'lucide-react';
import type { StockPrediction } from '../../utils/stockPrediction';

interface StockPredictionAlertProps {
    criticalAlerts: StockPrediction[];
    warningAlerts: StockPrediction[];
    totalProducts?: number;
}

const StockPredictionAlert: React.FC<StockPredictionAlertProps> = ({ criticalAlerts, warningAlerts, totalProducts = 0 }) => {
    const totalAlerts = criticalAlerts.length + warningAlerts.length;

    if (totalAlerts === 0) {
        return (
            <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 min-h-[350px] flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Package className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Predicción de Stock</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-green-100 dark:border-green-900/30 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">100%</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase">Saludable</span>
                        </div>
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Inventario bajo control
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
                            Monitoreando <strong>{totalProducts}</strong> productos. No se detectan quiebres de stock próximos.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 min-h-[350px] flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <AlertCircle className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Alertas de Reabastecimiento</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{totalAlerts} productos requieren atención</p>
                </div>
            </div>

            <div className="space-y-3">
                {/* Critical Alerts */}
                {criticalAlerts.slice(0, 3).map((alert) => (
                    <div
                        key={alert.productId}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <AlertCircle className="text-red-600 dark:text-red-400" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {alert.productName}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    Se agota en {Math.ceil(alert.daysUntilStockout)} días
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full block mb-1">
                                URGENTE
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                Stock: {alert.currentStock.toFixed(1)}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Warning Alerts */}
                {warningAlerts.slice(0, 2).map((alert) => (
                    <div
                        key={alert.productId}
                        className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                                <TrendingUp className="text-yellow-600 dark:text-yellow-400" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {alert.productName}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                    Reabastecer en {Math.ceil(alert.daysUntilStockout - 3)} días
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded-full block mb-1">
                                PRONTO
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                Stock: {alert.currentStock.toFixed(1)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {totalAlerts > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    +{totalAlerts - 5} productos más requieren reabastecimiento
                </p>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    📦 <strong>Predicción Inteligente:</strong> Basado en la velocidad de venta de los últimos 7 días.
                </p>
            </div>
        </div>
    );
};

export default StockPredictionAlert;
