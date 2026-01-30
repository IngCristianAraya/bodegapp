import React from 'react';
import { Star, DollarSign, HelpCircle, TrendingDown } from 'lucide-react';
import type { ProductProfitability } from '../../utils/profitabilityAnalysis';

interface ProfitabilityMatrixProps {
    profitabilityData: ProductProfitability[];
    averageMargin: number;
}

const ProfitabilityMatrix: React.FC<ProfitabilityMatrixProps> = ({ profitabilityData, averageMargin }) => {
    // Agrupar por clasificación
    const stars = profitabilityData.filter(p => p.classification === 'star');
    const cashCows = profitabilityData.filter(p => p.classification === 'cash-cow');
    const questionMarks = profitabilityData.filter(p => p.classification === 'question-mark');
    const dogs = profitabilityData.filter(p => p.classification === 'dog');

    const getMarginColor = (margin: number) => {
        if (margin >= 30) return 'text-green-600 dark:text-green-400';
        if (margin >= 15) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 min-h-[350px] flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Matriz de Rentabilidad</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Margen promedio de la tienda: <span className={`font-bold ${getMarginColor(averageMargin)}`}>{averageMargin.toFixed(1)}%</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Estrellas -> Productos Estrella */}
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="text-yellow-600 dark:text-yellow-400" size={18} fill="currentColor" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Productos Estrella</h4>
                        <span className="ml-auto text-xs font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">
                            {stars.length}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Alto volumen + Alto margen</p>
                    {stars.slice(0, 2).map(product => (
                        <div key={product.productId} className="text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{product.productName}</span>
                            <span className={`ml-2 font-bold ${getMarginColor(product.profitMargin)}`}>
                                {product.profitMargin.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Vacas Lecheras -> Flujo Constante */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="text-green-600 dark:text-green-400" size={18} />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Flujo Constante</h4>
                        <span className="ml-auto text-xs font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                            {cashCows.length}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Alto volumen + Margen estable</p>
                    {cashCows.slice(0, 2).map(product => (
                        <div key={product.productId} className="text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{product.productName}</span>
                            <span className={`ml-2 font-bold ${getMarginColor(product.profitMargin)}`}>
                                {product.profitMargin.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Interrogantes -> Potencial / Nicho */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                        <HelpCircle className="text-blue-600 dark:text-blue-400" size={18} />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Potencial / Nicho</h4>
                        <span className="ml-auto text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            {questionMarks.length}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Bajo volumen + Alto margen</p>
                    {questionMarks.slice(0, 2).map(product => (
                        <div key={product.productId} className="text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{product.productName}</span>
                            <span className={`ml-2 font-bold ${getMarginColor(product.profitMargin)}`}>
                                {product.profitMargin.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Perros -> Baja Rotación */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="text-gray-600 dark:text-gray-400" size={18} />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Baja Rotación</h4>
                        <span className="ml-auto text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {dogs.length}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Bajo volumen + Bajo margen</p>
                    {dogs.slice(0, 2).map(product => (
                        <div key={product.productId} className="text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{product.productName}</span>
                            <span className={`ml-2 font-bold ${getMarginColor(product.profitMargin)}`}>
                                {product.profitMargin.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                    💡 <strong>Estrategia:</strong> Impulsa los <strong>Productos Estrella</strong>, mantén el <strong>Flujo Constante</strong>, promociona los de <strong>Potencial</strong> y evalúa los de <strong>Baja Rotación</strong>.
                </p>
            </div>
        </div>
    );
};

export default ProfitabilityMatrix;
