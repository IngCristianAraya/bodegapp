import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { getStoreSettings } from '../../lib/supabaseSettings';

interface AdminAuthModalProps {
    isOpen: boolean;
    onAuthorized: () => void;
    onCancel?: () => void; // Optional cancel, e.g., to redirect back
    title?: string;
    description?: string;
}

export default function AdminAuthModal({
    isOpen,
    onAuthorized,
    onCancel,
    title = "Acceso Restringido",
    description = "Se requiere autorización de administrador para acceder a este módulo."
}: AdminAuthModalProps) {
    const { tenant } = useTenant();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [adminPin, setAdminPin] = useState<string | null>(null);

    // Fetch Settings on Mount
    useEffect(() => {
        const checkSecurity = async () => {
            if (!tenant?.id) return;
            try {
                setLoading(true);
                const settings = await getStoreSettings(tenant.id);

                // If no PIN is set, auto-authorize (or you could prompt to set one, but here we assume open access)
                if (!settings?.admin_pin) {
                    onAuthorized();
                    return;
                }

                setAdminPin(settings.admin_pin);
            } catch (err) {
                console.error("Error fetching admin settings:", err);
                setError("Error al verificar seguridad.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            checkSecurity();
        }
    }, [tenant, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setVerifying(true);

        // Simple imitation of async verify text
        setTimeout(() => {
            if (pin === adminPin) {
                onAuthorized();
            } else {
                setError('PIN Incorrecto');
                setPin('');
            }
            setVerifying(false);
        }, 300);
    };

    if (!isOpen) return null;

    // Loading State
    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // Since we auto-authorize if adminPin is null, if we are here, adminPin EXISTS.
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
                <div className="p-6 text-center space-y-6">

                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto ring-4 ring-rose-50 dark:ring-rose-900/10">
                        <Lock className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                autoFocus
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                placeholder="Ingrese PIN (4 dígitos)"
                                className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 pr-4 pl-8 rounded-xl bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 focus:border-rose-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-base placeholder:text-gray-400 text-gray-900 dark:text-white"
                                value={pin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    if (val.length <= 4) setPin(val);
                                }}
                            />
                            <Shield className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {error && (
                            <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg animate-in shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Salir
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={pin.length < 4 || verifying}
                                className={`px-4 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all ${onCancel ? '' : 'col-span-2'
                                    } ${pin.length < 4 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-rose-700'
                                    }`}
                            >
                                {verifying ? 'Verificando...' : 'Desbloquear'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
