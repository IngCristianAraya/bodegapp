import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Calendar, Search, ArrowLeft, CheckCircle } from 'lucide-react';

interface ExpiringProduct {
    id: string;
    name: string;
    code: string;
    expiration_date: string;
    stock: number;
    category: string;
    supplier: string;
}

export default function ExpirationPage({ onBack }: { onBack?: () => void }) {
    const { tenant } = useTenant();
    const [products, setProducts] = useState<ExpiringProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, expired, warning, healthy
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            if (!tenant?.id) return;

            const { data, error } = await supabase
                .from('products')
                .select('id, name, code, expiration_date, stock, category, supplier')
                .eq('tenant_id', tenant.id)
                .not('expiration_date', 'is', null)
                .gt('stock', 0)
                .order('expiration_date', { ascending: true });

            if (!error && data) {
                setProducts(data);
            }
            setLoading(false);
        };
        fetchProducts();
    }, [tenant]);

    const getStatus = (dateStr: string) => {
        const diffTime = new Date(dateStr).getTime() - new Date().getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: 'VENCIDO', color: 'red', days };
        if (days <= 30) return { label: 'POR VENCER', color: 'amber', days };
        return { label: 'OK', color: 'emerald', days };
    };

    const filteredProducts = products.filter(p => {
        const status = getStatus(p.expiration_date);
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'expired') return status.color === 'red';
        if (filter === 'warning') return status.color === 'amber';
        if (filter === 'healthy') return status.color === 'emerald';
        return true;
    });

    const stats = {
        expired: products.filter(p => getStatus(p.expiration_date).color === 'red').length,
        warning: products.filter(p => getStatus(p.expiration_date).color === 'amber').length,
        healthy: products.filter(p => getStatus(p.expiration_date).color === 'emerald').length,
    };

    return (
        <div className="p-6 w-full max-w-7xl mx-auto animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Calendar className="text-emerald-600" size={32} />
                        Control de Vencimientos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Gestiona la calidad y frescura de tu inventario.
                    </p>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Volver al Inventario
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div
                    onClick={() => setFilter('expired')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${filter === 'expired' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Vencidos</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.expired}</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setFilter('warning')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${filter === 'warning' ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Por Vencer (30d)</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.warning}</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setFilter('healthy')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${filter === 'healthy' ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Buen Estado</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.healthy}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all'
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400'
                            }`}
                    >
                        Todos
                    </button>
                    {/* Add more filter tabs if needed */}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-xs uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4 text-center">Stock</th>
                                <th className="px-6 py-4">Fecha Vencimiento</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400 animate-pulse">Cargando datos...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No se encontraron productos con los filtros actuales.</td></tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const status = getStatus(product.expiration_date);
                                    return (
                                        <tr key={product.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-bold">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.supplier || '-'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">{product.stock}</td>
                                            <td className="px-6 py-4 font-medium">
                                                {new Date(product.expiration_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex flex-col items-center justify-center px-3 py-1 rounded-lg text-xs font-bold w-full max-w-[100px] ${status.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    status.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    <span>{status.label}</span>
                                                    <span className="text-[10px] opacity-75">{status.days} días</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
