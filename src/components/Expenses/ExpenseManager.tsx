'use client';
import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { createExpense, getExpenses, deleteExpense } from '../../lib/supabaseExpenses';
import { obtenerCajaActiva, registrarMovimiento } from '../../lib/supabaseCashRegister';
import { Expense } from '../../types/index';
import { Plus, Trash2, Calendar, DollarSign, Wallet, TrendingDown, Store } from 'lucide-react';

import AdminAuthModal from '../common/AdminAuthModal';

const categories = [
    'Alquiler', 'Servicios (Luz/Agua)', 'Insumos', 'Sueldos', 'Mantenimiento', 'Transporte', 'Impuestos', 'Otros'
];

export default function ExpenseManager() {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    // Security State
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Cash Register Link State
    const [isCashOpen, setIsCashOpen] = useState(false);
    const [activeCashId, setActiveCashId] = useState<string | null>(null);
    const [payFromCash, setPayFromCash] = useState(false);

    // Form Stats
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'Insumos',
    });

    const fetchExpenses = React.useCallback(async () => {
        if (!tenant?.id) return;
        setLoading(true);
        try {
            const data = await getExpenses(tenant.id);
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [tenant?.id]);

    // Check Cash Register Status when modal opens or tenant changes
    useEffect(() => {
        const checkCash = async () => {
            if (tenant?.id) {
                const caja = await obtenerCajaActiva(tenant.id);
                if (caja) {
                    setIsCashOpen(true);
                    setActiveCashId(caja.id);
                } else {
                    setIsCashOpen(false);
                    setActiveCashId(null);
                    setPayFromCash(false);
                }
            }
        };
        checkCash();
    }, [tenant, modalOpen]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant?.id) return;

        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Monto inválido');
            return;
        }

        try {
            setLoading(true);

            // 1. Create Expense Record
            await createExpense({
                description: form.description,
                amount,
                category: form.category,
                date: new Date(),
                tenantId: tenant.id,
                userId: user?.id,
                paidFromCash: payFromCash // Save preference to DB
            });

            // 2. If "Pay from Cash" is checked, create Cash Movement (Egreso)
            if (payFromCash && isCashOpen && activeCashId) {
                await registrarMovimiento(
                    tenant.id,
                    activeCashId,
                    'egreso',
                    amount,
                    `Gasto: ${form.description} (${form.category})`
                );
            }

            setModalOpen(false);
            setForm({ description: '', amount: '', category: 'Insumos' });
            setPayFromCash(false);
            fetchExpenses();
        } catch (error) {
            alert('Error al guardar gasto');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro de eliminar este gasto?')) return;
        if (!tenant?.id) return;
        try {
            await deleteExpense(id, tenant.id);
            setExpenses(expenses.filter(e => e.id !== id));
        } catch (e) {
            console.error(e);
            alert('Error al eliminar');
        }
    };

    const totalToday = expenses
        .filter(e => new Date(e.date).toDateString() === new Date().toDateString())
        .reduce((sum, e) => sum + e.amount, 0);

    const totalMonth = expenses
        .filter(e => new Date(e.date).getMonth() === new Date().getMonth() && new Date(e.date).getFullYear() === new Date().getFullYear())
        .reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gastos</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Registra y controla las salidas de dinero</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 font-semibold transition-all transform hover:scale-105"
                >
                    <Plus size={20} />
                    Registrar Gasto
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Gastos de Hoy</p>
                        <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">S/ {totalToday.toFixed(2)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 relative z-10">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Gastos del Mes</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">S/ {totalMonth.toFixed(2)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 relative z-10">
                        <Calendar size={24} />
                    </div>
                </div>
            </div>

            {/* Recent Expenses List */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <TrendingDown size={20} className="text-rose-500" />
                    <h3 className="font-bold text-gray-800 dark:text-white">Movimientos Recientes</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50">
                                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Descripción</th>
                                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Categoría</th>
                                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Fecha</th>
                                <th className="py-4 px-6 text-right font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Monto</th>
                                <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {expenses.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{item.description}</td>
                                    <td className="py-4 px-6 flex items-center gap-2">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold">
                                            {item.category}
                                        </span>
                                        {item.paidFromCash ? (
                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                                CAJA
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-md text-[10px] font-bold border border-gray-200 dark:border-gray-700">
                                                EXT
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(item.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-rose-600 dark:text-rose-400">
                                        - S/ {item.amount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Wallet size={48} className="mb-3 opacity-50" />
                                            <p>No hay gastos registrados aún</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add Expense */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Gasto</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Monto (S/)</label>
                                <input
                                    autoFocus
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-2xl font-bold text-gray-900 dark:text-white focus:ring-0 focus:border-rose-500 outline-none transition-all placeholder-gray-300"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <input
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all"
                                    placeholder="Ej. Pago de luz del local"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setForm({ ...form, category: cat })}
                                            className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${form.category === cat
                                                ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                                                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-rose-300 dark:hover:border-rose-700'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Check Box for Cash Payment */}
                            <div className="pt-2">
                                <label className={`flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-all ${!isCashOpen ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                    }`}>
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={payFromCash}
                                            onChange={(e) => setPayFromCash(e.target.checked)}
                                            disabled={!isCashOpen}
                                            className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Store size={18} className="text-gray-500" />
                                            Pagar con dinero en Caja
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {!isCashOpen
                                                ? "La caja está cerrada. No se puede retirar dinero."
                                                : "Se registrará automáticamente como un 'Egreso de Caja'."
                                            }
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all transform hover:scale-[1.02]"
                                >
                                    {loading ? 'Guardando...' : 'Guardar Gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Security Verification */}
            <AdminAuthModal
                isOpen={!isAuthorized}
                onAuthorized={() => setIsAuthorized(true)}
                title="Acceso Restringido"
                description="Ingrese su PIN de Administrador para gestionar los gastos."
                onCancel={() => window.location.href = '/'}
            />
        </div>
    );
}
