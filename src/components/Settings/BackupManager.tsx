import React, { useState } from 'react';
import { Download, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { generateFullBackup } from '../../lib/backupService';

export default function BackupManager() {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(false);

    const handleDownloadBackup = async () => {
        if (!tenant) return;
        setLoading(true);
        try {
            const data = await generateFullBackup(tenant.id);

            // Create Blob and download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_bodegapp_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error(error);
            alert('Error al generar la copia de seguridad. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Copia de Seguridad y Seguridad</h3>
                    <p className="text-sm text-gray-500">Mantén tus datos seguros y bajo tu control.</p>
                </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex gap-3 text-sm text-orange-800 dark:text-orange-200">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>
                    Recuerda que tú eres el único responsable de la información de tu negocio.
                    Recomendamos realizar una copia de seguridad semanal.
                </p>
            </div>

            <button
                onClick={handleDownloadBackup}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                {loading ? 'Generando archivo...' : 'Descargar Backup Completo (JSON)'}
            </button>

            <p className="text-xs text-gray-400 text-center sm:text-left">
                Formato del archivo: .json (Compatible con futuras importaciones)
            </p>
        </div>
    );
}
