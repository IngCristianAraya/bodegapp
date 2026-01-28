import React from 'react';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import type { ProductRotation } from '../../utils/rotationAnalysis';

interface RotationAlertProps {
    deadStock: ProductRotation[];
    slowMoving: ProductRotation[];
}

const RotationAlert: React.FC<RotationAlertProps> = ({ deadStock, slowMoving }) => {
    const totalIssues = deadStock.length + slowMoving.length;

    if (totalIssues === 0) {
        return (
            <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Package className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Rotación de Inventario</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">✅ Todos los productos tienen buena rotación</p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Productos Sin Movimiento</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{totalIssues} productos requieren atención</p>
                </div>
            </div>

            <div className="space-y-3">
                {/* Dead Stock (>60 días) */}
                {deadStock.slice(0, 3).map((item) => (
                    <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <TrendingDown className="text-red-600 dark:text-red-400" size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                    {item.productName}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    {item.daysSinceLastSale} días sin vender
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full">
                            CRÍTICO
                        </span>
                    </div>
                ))}

                {/* Slow Moving (30-60 días) */}
                {slowMoving.slice(0, 2).map((item) => (
                    <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                <AlertTriangle className="text-orange-600 dark:text-orange-400" size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                    {item.productName}
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                    {item.daysSinceLastSale} días sin vender
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-full">
                            LENTO
                        </span>
                    </div>
                ))}
            </div>

            {totalIssues > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    +{totalIssues - 5} productos más requieren atención
                </p>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    💡 <strong>Sugerencia:</strong> Considera hacer promociones o descuentos en estos productos para mejorar su rotación.
                </p>
            </div>
        </div>
    );
};

export default RotationAlert;
