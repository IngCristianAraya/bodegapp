import React, { useState, useEffect, useRef } from 'react';
import { X, Calculator, Banknote } from 'lucide-react';

interface CashPaymentModalProps {
    total: number;
    onConfirm: (amountPaid: number, change: number) => void;
    onClose: () => void;
}

export default function CashPaymentModal({ total, onConfirm, onClose }: CashPaymentModalProps) {
    const [amountPaid, setAmountPaid] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto focus input on mount
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, []);

    const numericAmount = parseFloat(amountPaid) || 0;
    const change = numericAmount - total;
    const isValid = numericAmount >= total;

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isValid) {
            onConfirm(numericAmount, change);
        }
    };

    const handleQuickAmount = (amount: number) => {
        setAmountPaid(amount.toString());
        // Optional: Auto submit if exact or greater? 
        // Better UX: Just set value, let user verify change then hit Enter
        inputRef.current?.focus();
    };

    const quickAmounts = [
        { label: 'Exacto', value: total },
        { label: 'S/ 10', value: 10 },
        { label: 'S/ 20', value: 20 },
        { label: 'S/ 50', value: 50 },
        { label: 'S/ 100', value: 100 },
        { label: 'S/ 200', value: 200 },
    ].filter(opt => opt.value >= total || opt.label === 'Exacto'); // Filter out smaller bills if total is larger

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
                {/* Header */}
                <div className="bg-emerald-600 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Total a Pagar</p>
                    <h2 className="text-5xl font-black">S/ {total.toFixed(2)}</h2>
                </div>

                <div className="p-8 space-y-6">
                    {/* Input Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
                            Monto Recibido
                        </label>
                        <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                ref={inputRef}
                                type="number"
                                value={amountPaid}
                                onChange={e => setAmountPaid(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                className="w-full pl-12 pr-4 py-4 text-3xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-gray-300"
                                placeholder="0.00"
                                step="0.10"
                            />
                        </div>
                    </div>

                    {/* Quick Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        {quickAmounts.slice(0, 6).map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickAmount(opt.value)}
                                className="py-2 px-1 bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-sm"
                            >
                                {opt.label === 'Exacto' ? 'Exacto' : `S/ ${opt.value}`}
                            </button>
                        ))}
                    </div>

                    {/* Change Display */}
                    <div className="bg-slate-100 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl transition-colors ${isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                                <Calculator size={24} />
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Vuelto</span>
                        </div>
                        <span className={`text-4xl font-black transition-colors ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-700'}`}>
                            S/ {Math.max(0, change).toFixed(2)}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!isValid}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 text-white font-bold py-4 rounded-2xl text-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        Confirmar Cobro
                    </button>
                </div>
            </div>
        </div>
    );
}
