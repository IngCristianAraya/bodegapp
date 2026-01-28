'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '../../types/inventory';
import { X, TrendingUp, AlertCircle, Check } from 'lucide-react';

interface QuickPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSave: (newPrice: number) => Promise<void>;
    loading: boolean;
}

const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
    isOpen,
    onClose,
    product,
    onSave,
    loading,
}) => {
    const [newPrice, setNewPrice] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setNewPrice(product.salePrice || 0);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const cost = product.averageCost || 0;
    const margin = newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 : 0;

    let marginColor = 'text-emerald-600 dark:text-emerald-400';
    if (margin < 5) marginColor = 'text-red-600 dark:text-red-400';
    else if (margin < 15) marginColor = 'text-amber-600 dark:text-amber-400';

    const handleSave = async () => {
        if (newPrice <= 0) {
            setError('El precio debe ser mayor a 0');
            return;
        }
        setError(null);
        await onSave(newPrice);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 overflow-hidden transform animate-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ajustar Precio</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{product.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Costo Actual (CPP):</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">S/. {cost.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                Nuevo Precio de Venta
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/.</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl text-2xl font-black text-gray-900 dark:text-white transition-all outline-none"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Rentabilidad Final</span>
                                <span className={`text-2xl font-black ${marginColor}`}>
                                    {margin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-right flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Ganancia Bruta</span>
                                <span className={`text-lg font-bold ${marginColor}`}>
                                    S/. {(newPrice - cost).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {margin < 5 && (
                            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs leading-relaxed">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p><strong>¡Atención!</strong> El margen es muy bajo. Podrías estar perdiendo rentabilidad al cubrir costos operativos.</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors border border-gray-200 dark:border-gray-600"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || newPrice <= 0}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={20} />
                                Guardar Precio
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickPriceModal;
