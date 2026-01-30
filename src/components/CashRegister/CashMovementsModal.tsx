import React, { useState } from 'react';
import { registrarMovimiento } from '../../lib/supabaseCashRegister';
import { useTenant } from '../../contexts/TenantContext'; // Assuming context exists
import { useCashRegister } from '../../hooks/useCashRegister';
import { X, ArrowUpCircle, ArrowDownCircle, DollarSign, FileText } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface CashMovementsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CashMovementsModal: React.FC<CashMovementsModalProps> = ({ isOpen, onClose }) => {
    const { tenant } = useTenant();
    const { cashRegister, checkRegisterStatus } = useCashRegister(); // To get current ID
    const { showToast } = useToast();

    const [type, setType] = useState<'ingreso' | 'egreso'>('egreso');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !cashRegister) return;

        setLoading(true);
        try {
            await registrarMovimiento(
                tenant.id,
                cashRegister.id,
                type,
                Number(amount),
                description
            );
            showToast('Movimiento registrado correctamente', 'success');
            checkRegisterStatus(); // Optional: Refresh summary if needed elsewhere
            // Reset form
            setAmount('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Error al registrar movimiento', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Movimiento de Caja</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setType('ingreso')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${type === 'ingreso'
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500 ring-offset-2'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <ArrowUpCircle size={20} />
                            <span className="font-bold">Ingreso</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('egreso')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${type === 'egreso'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 ring-2 ring-red-500 ring-offset-2'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <ArrowDownCircle size={20} />
                            <span className="font-bold">Egreso</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Monto
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                    placeholder="0.00"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Descripción / Motivo
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24 text-sm"
                                    placeholder={type === 'egreso' ? "Ej. Pago de delivery, compra de bolsas..." : "Ej. Ingreso de sencillo..."}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount || !description}
                            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${type === 'ingreso'
                                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                                : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                }`}
                        >
                            {loading ? 'Guardando...' : type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Salida'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashMovementsModal;
