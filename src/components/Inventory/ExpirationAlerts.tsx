import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

interface ExpiringProduct {
    id: string;
    name: string;
    expiration_date: string;
    stock: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ExpirationAlerts({ refreshTrigger }: { refreshTrigger?: any }) {
    const { tenant } = useTenant();
    const [expiring, setExpiring] = useState<ExpiringProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpiration = async () => {
            if (!tenant?.id) return;
            // Fetch products expiring in next 30 days
            const today = new Date();
            const future = new Date();
            future.setDate(today.getDate() + 30);

            // Format future date as YYYY-MM-DD to match DB DATE column type safely
            const futureDateStr = future.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('products')
                .select('id, name, expiration_date, stock')
                .eq('tenant_id', tenant.id)
                .not('expiration_date', 'is', null)
                .lte('expiration_date', futureDateStr)
                .gt('stock', 0) // Only alerts for items in stock
                .order('expiration_date', { ascending: true })
                .limit(5);

            if (!error && data) {
                setExpiring(data);
            }
            setLoading(false);
        };
        fetchExpiration();
    }, [tenant, refreshTrigger]);

    if (loading) return null;

    if (expiring.length === 0) {
        return (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 shadow-sm border border-emerald-100 dark:border-emerald-800/30 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-800/30 rounded-full text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Inventario Saludable</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">No hay productos próximos a vencer en los siguientes 30 días.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Alertas de Vencimiento
            </h3>
            <div className="space-y-3">
                {expiring.map(p => {
                    const days = Math.ceil((new Date(p.expiration_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    const isExpired = days < 0;

                    return (
                        <div key={p.id} className={`flex items-start justify-between p-3 rounded-xl border ${isExpired
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
                            }`}>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{p.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Vence: {new Date(p.expiration_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${isExpired
                                ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200'
                                : 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
                                }`}>
                                {isExpired ? 'VENCIDO' : `${days} días`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
