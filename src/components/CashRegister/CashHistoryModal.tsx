import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { X, Calendar, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
// import { format } from 'date-fns';
// import { es } from 'date-fns/locale';

interface CashRegisterLog {
    id: string;
    opened_at: string;
    closed_at: string;
    opening_amount: number;
    closing_amount: number;
    expected_amount: number;
    notes?: string;
}

interface CashHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CashHistoryModal: React.FC<CashHistoryModalProps> = ({ isOpen, onClose }) => {
    const { tenant } = useTenant();
    const [history, setHistory] = useState<CashRegisterLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tenant) {
            fetchHistory();
        }
    }, [isOpen, tenant]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cash_registers')
                .select('*')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'closed')
                .order('closed_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching cash history:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Cajas</h2>
                            <p className="text-xs text-gray-500">Auditoría de cierres y cuadres de caja</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <Search className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                            <p>No hay registros de cajas cerradas aún.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((log) => {
                                const diff = (log.closing_amount || 0) - (log.expected_amount || 0);
                                const isPerfect = Math.abs(diff) < 0.1;
                                const isShort = diff < -0.1;

                                return (
                                    <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-md transition-shadow">

                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isPerfect ? 'bg-emerald-100 text-emerald-600' : isShort ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {isPerfect ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {new Date(log.closed_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Apertura: {new Date(log.opened_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 uppercase font-bold">Sistema (Esperado)</p>
                                                <p className="font-mono font-medium text-slate-700 dark:text-slate-300">S/ {log.expected_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 uppercase font-bold">Real (En Caja)</p>
                                                <p className="font-mono font-bold text-gray-900 dark:text-white text-lg">S/ {log.closing_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className={`text-right px-3 py-1 rounded-lg ${isPerfect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                <p className="text-[10px] uppercase font-bold opacity-80">Diferencia</p>
                                                <p className="font-mono font-bold">
                                                    {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashHistoryModal;
