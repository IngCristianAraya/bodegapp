
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Shield, Lock, RefreshCw, CheckCircle, XCircle, Power, Banknote, Bell } from 'lucide-react';

interface TenantRow {
    id: string;
    name: string;
    subdomain: string;
    status: 'active' | 'suspended' | 'cancelled';
    created_at: string;
    subscription_end_date?: string;
}

export default function SuperAdminTenants() {
    const [key, setKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [tenants, setTenants] = useState<TenantRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<Record<string, { products: number, sales: number, total: number }>>({});

    // Initial check from URL param
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlKey = urlParams.get('key');
        if (urlKey) {
            setKey(urlKey);
            // Auto login attempt
            verifyKey(urlKey);
        }
    }, []);

    const verifyKey = async (secret: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Tenants
            const { data: tenantsData, error: tenantsError } = await supabase.rpc('admin_get_tenants', { secret_key: secret });
            if (tenantsError) throw tenantsError;
            setTenants(tenantsData || []);

            // 2. Fetch Analytics (Parallel)
            const { data: analyticsData, error: analyticsError } = await supabase.rpc('admin_get_analytics', { p_admin_secret: secret });
            if (!analyticsError && analyticsData) {
                const map: Record<string, { products: number, sales: number, total: number }> = {};
                analyticsData.forEach((row: { tenant_id: string, product_count: number, monthly_sales_count: number, monthly_sales_total: number }) => {
                    map[row.tenant_id] = {
                        products: row.product_count,
                        sales: row.monthly_sales_count,
                        total: row.monthly_sales_total
                    };
                });
                setAnalytics(map);
            }

            setIsAuthenticated(true);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Clave inválida o error de conexión';
            setError(message);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        verifyKey(key);
    };

    const toggleStatus = async (tenantId: string, currentStatus: string) => {
        if (!confirm(`¿Cambiar estado de ${currentStatus} a ${currentStatus === 'active' ? 'suspended' : 'active'}?`)) return;

        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            const { error } = await supabase.rpc('admin_update_tenant_status', {
                target_tenant_id: tenantId,
                secret_key: key,
                new_status: newStatus
            });

            if (error) throw error;

            // Update local state
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: newStatus as 'active' | 'suspended' | 'cancelled' } : t));

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert('Error actualizando estado: ' + message);
        }
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentPeriod, setPaymentPeriod] = useState(30); // days
    const [processingPayment, setProcessingPayment] = useState(false);

    const openPaymentModal = (tenant: TenantRow) => {
        setSelectedTenant(tenant);
        setPaymentAmount('');
        setPaymentPeriod(30);
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant || !paymentAmount) return;

        setProcessingPayment(true);
        try {
            const { data, error } = await supabase.rpc('admin_record_payment', {
                p_tenant_id: selectedTenant.id,
                p_amount: parseFloat(paymentAmount),
                p_days_to_add: paymentPeriod,
                p_payment_method: 'Manual/Transferencia',
                p_reference: 'Super Admin UI',
                p_notes: 'Registrado desde panel',
                p_admin_secret: key
            });

            if (error) throw error;

            alert(`Pago registrado correctamente. Nueva fecha: ${new Date(data.new_expiry).toLocaleDateString()}`);

            // Refresh list
            verifyKey(key);
            setShowPaymentModal(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert('Error registrando pago: ' + message);
        } finally {
            setProcessingPayment(false);
        }
    };

    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState({ title: '', message: '', type: 'info' });
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingBroadcast(true);
        try {
            const { error } = await supabase.rpc('admin_create_announcement', {
                p_title: broadcastMessage.title,
                p_message: broadcastMessage.message,
                p_type: broadcastMessage.type,
                p_days_active: 7, // Default 1 week
                p_admin_secret: key
            });

            if (error) throw error;
            alert('Mensaje enviado a todas las bodegas exitosamente.');
            setShowBroadcastModal(false);
            setBroadcastMessage({ title: '', message: '', type: 'info' });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert('Error enviando mensaje: ' + message);
        } finally {
            setSendingBroadcast(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
                {/* ... existing login UI ... */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-center mb-8 relative z-10">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            <Shield size={40} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">Super Admin</h1>
                    <p className="text-slate-400 text-center mb-8">Acceso restringido al núcleo del sistema</p>

                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest ml-1">Clave de Mando</label>
                            <div className="relative mt-2">
                                <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                    placeholder="••••••••••••••"
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/10 border border-red-900/20 p-3 rounded-lg">
                                <XCircle size={14} /> {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex justify-center shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : 'Desbloquear Panel'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                            <Shield className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                                Control de Tenants
                            </h1>
                            <p className="text-slate-400 text-sm font-medium">Gestión global de suscripciones</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowBroadcastModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20"
                        >
                            <Bell size={18} />
                            <span>Mensaje Global</span>
                        </button>
                        <button
                            onClick={() => verifyKey(key)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
                            title="Recargar datos"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                <div className="bg-slate-900/80 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-6">Negocio</th>
                                    <th className="p-6">Métricas (Mes)</th>
                                    <th className="p-6">Alta / Vence</th>
                                    <th className="p-6 text-center">Estado Actual</th>
                                    <th className="p-6 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {tenants.map(tenant => {
                                    const stats = analytics[tenant.id] || { products: 0, sales: 0, total: 0 };
                                    return (
                                        <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-6">
                                                <div className="font-bold text-white text-lg">{tenant.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-1">{tenant.subdomain}.bodegapp.site</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-medium text-slate-300">
                                                        <span className="text-emerald-400 font-bold">{stats.sales}</span> Ventas (S/ {stats.total.toFixed(2)})
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {stats.products} Productos
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm text-slate-400">Alta: {new Date(tenant.created_at).toLocaleDateString()}</div>
                                                {tenant.subscription_end_date && (
                                                    <div className="text-sm font-bold text-emerald-400 mt-1">
                                                        Vence: {new Date(tenant.subscription_end_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${tenant.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : tenant.status === 'suspended'
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : 'bg-slate-700 text-slate-300 border-slate-600'
                                                    }`}>
                                                    {tenant.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    {tenant.status?.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openPaymentModal(tenant)}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                                                    title="Registrar Pago"
                                                >
                                                    <Banknote size={16} className="text-emerald-400" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(tenant.id, tenant.status)}
                                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${tenant.status === 'active'
                                                        ? 'bg-gradient-to-r from-red-900/80 to-red-800/80 text-red-200 border border-red-700/50 hover:border-red-500 hover:from-red-900 hover:to-red-800'
                                                        : 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 text-emerald-200 border border-emerald-700/50 hover:border-emerald-500 hover:from-emerald-900 hover:to-emerald-800'
                                                        }`}
                                                >
                                                    <Power size={16} />
                                                    {tenant.status === 'active' ? 'SUSPENDER' : 'REACTIVAR'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Bell className="text-indigo-400" /> Nuevo Mensaje Global
                            </h3>
                            <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={broadcastMessage.title}
                                    onChange={e => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                                    placeholder="Ej: Mantenimiento Programado"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Mensaje</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                    value={broadcastMessage.message}
                                    onChange={e => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                                    placeholder="Escribe el contenido del mensaje..."
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Tipo</label>
                                <div className="flex gap-2">
                                    {['info', 'warning', 'success'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setBroadcastMessage({ ...broadcastMessage, type: t })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize border ${broadcastMessage.type === t
                                                ? 'bg-indigo-600 text-white border-indigo-500'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sendingBroadcast}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all mt-4"
                            >
                                {sendingBroadcast ? <RefreshCw className="animate-spin mx-auto" /> : 'Enviar a TODOS'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Registrar Pago</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                            <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">Tenant</p>
                            <p className="text-white font-bold text-lg">{selectedTenant.name}</p>
                            <p className="text-emerald-400/70 text-xs font-mono">{selectedTenant.subdomain}</p>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Monto (S/)</label>
                                <input
                                    type="number"
                                    step="0.10"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Extender Suscripción</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { l: '1 Mes', v: 30 },
                                        { l: '3 Meses', v: 90 },
                                        { l: '1 Año', v: 365 }
                                    ].map(opt => (
                                        <button
                                            key={opt.v}
                                            type="button"
                                            onClick={() => setPaymentPeriod(opt.v)}
                                            className={`py-3 px-2 rounded-xl text-sm font-bold border transition ${paymentPeriod === opt.v
                                                ? 'bg-emerald-600 text-white border-emerald-500'
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processingPayment}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
                            >
                                {processingPayment ? <RefreshCw className="animate-spin mx-auto" /> : 'Confirmar Pago y Activar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
