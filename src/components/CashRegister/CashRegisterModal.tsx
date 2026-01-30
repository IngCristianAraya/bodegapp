import React, { useState, useEffect } from 'react';
import { useCashRegister } from '../../hooks/useCashRegister';
import { X, DollarSign, Calculator, Lock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

import { StoreSettings } from '../../lib/supabaseSettings';

interface CashRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'open' | 'close';
    onSuccess?: () => void;
    settings?: StoreSettings | null;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose, mode, onSuccess, settings }) => {
    const { openRegister, closeRegister, fetchSummary, summary, loading: hookLoading } = useCashRegister();
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'summary' | 'auth'>('input'); // Added auth step
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && mode === 'close') {
            fetchSummary();
            setStep('summary'); // Start with summary for closing
        } else {
            setStep('input');
        }
        setAmount('');
        setNotes('');
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Logic for Closing with PIN
        if (mode === 'close' && settings?.admin_pin) {
            if (step !== 'auth') {
                setStep('auth');
                return;
            }
            // Verify PIN
            if (pin !== settings.admin_pin) {
                setError('PIN Incorrecto');
                return;
            }
        }

        setLoading(true);
        try {
            if (mode === 'open') {
                await openRegister(Number(amount));
            } else {
                await closeRegister(Number(amount), notes);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className={`p-6 text-white flex justify-between items-center ${mode === 'open' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        {mode === 'open' ? <Lock size={24} className="text-emerald-200" /> : <Calculator size={24} className="text-slate-300" />}
                        <div>
                            <h2 className="text-xl font-bold">{mode === 'open' ? 'Apertura de Caja' : 'Cierre de Caja'}</h2>
                            <p className="text-xs opacity-80">{mode === 'open' ? 'Ingresa el fondo inicial para comenzar' : 'Realiza el arqueo final del turno'}</p>
                        </div>
                    </div>
                    {!loading && <button onClick={onClose} className="text-white/70 hover:text-white"><X size={24} /></button>}
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {mode === 'close' && summary && (
                        <div className="mb-6 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            {settings?.admin_pin ? (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Lock className="text-slate-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Modo Cierre Ciego Activo</h3>
                                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                                        Por seguridad, el resumen de montos está oculto.
                                    </p>
                                    <p className="text-xs font-bold text-emerald-600 mt-2">
                                        Cuente el dinero físico e ingréselo.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">Resumen del Sistema</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Fondo Inicial:</span>
                                            <span className="font-mono font-medium">S/ {summary.opening_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-emerald-600 font-medium">Ventas Efectivo (+):</span>
                                            <span className="font-mono font-medium text-emerald-600">S/ {summary.total_sales_cash.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between opacity-70">
                                            <span className="text-slate-500 dark:text-slate-400">Ventas Digitales (Ref):</span>
                                            <span className="font-mono font-medium text-slate-500 dark:text-slate-400">S/ {(summary.total_sales_digital || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-500">Ingresos (+):</span>
                                            <span className="font-mono font-medium text-blue-500">S/ {summary.total_ingresos.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b border-dashed border-slate-300">
                                            <span className="text-red-500">Salidas (-):</span>
                                            <span className="font-mono font-medium text-red-500">S/ {summary.total_egresos.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 text-lg font-bold">
                                            <span>Total Esperado:</span>
                                            <span>S/ {summary.expected_amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'auth' && (
                        <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
                                <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Autorización Requerida</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-300">Ingrese el PIN de Supervisor para confirmar el cierre.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PIN de 4 dígitos</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                                            setError('');
                                        }}
                                        className="w-full text-center tracking-[1em] text-2xl font-bold py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs font-bold mt-2 text-center">{error}</p>}
                            </div>
                        </div>
                    )}

                    {step !== 'auth' && (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {mode === 'open' ? 'Monto Inicial (Sencillo)' : 'Monto Real en Caja (Tu Conteo)'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">S/</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="0.00"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {mode === 'close' && summary && amount && !settings?.admin_pin && (
                                    <div className={`mt-3 flex items-center gap-2 text-sm p-3 rounded-lg ${Math.abs(Number(amount) - summary.expected_amount) < 0.1
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {Math.abs(Number(amount) - summary.expected_amount) < 0.1 ? (
                                            <>
                                                <CheckCircle size={16} />
                                                <span className="font-bold">¡Caja Cuadrada!</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={16} />
                                                <span className="font-bold">
                                                    Diferencia: S/ {(Number(amount) - summary.expected_amount).toFixed(2)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {mode === 'close' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Notas / Observaciones
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-3 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-20 text-sm"
                                        placeholder="Ej. Faltó S/ 0.50 por redondeo..."
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 'auth') {
                                    setStep('input');
                                    setPin('');
                                    setError('');
                                } else {
                                    onClose();
                                }
                            }}
                            className="px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            disabled={loading}
                        >
                            {step === 'auth' ? 'Atrás' : 'Cancelar'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!amount && step !== 'auth')}
                            className={`px-4 py-3 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex justify-center items-center gap-2 ${mode === 'open' || step === 'auth'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:to-teal-500'
                                : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:bg-slate-600'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                step === 'auth' ? 'Confirmar' : mode === 'open' ? 'Abrir Caja' : settings?.admin_pin ? 'Continuar' : 'Cerrar Caja'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashRegisterModal;
