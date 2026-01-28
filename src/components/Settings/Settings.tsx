import React, { useState } from 'react';
import { FiTool, FiSettings, FiDollarSign, FiInfo } from 'react-icons/fi';
import SettingsPanel from './SettingsPanel';
import HowToUseSystem from './HowToUseSystem';
import ExportDataButton from './ExportDataButton';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branding' | 'tools'>('branding');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'branding'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <FiSettings />
          Personalización
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'tools'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <FiTool />
          Herramientas del Sistema
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'branding' ? (
          <SettingsPanel />
        ) : (
          <div className="space-y-8">
            <div className="glass-card rounded-[2rem] shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-2xl text-blue-600 dark:text-blue-400">
                    <FiTool />
                  </div>
                  Gestión de Datos y Ayuda
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Herramientas avanzadas para el mantenimiento de tu negocio.</p>
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div className="bg-white/80 dark:bg-slate-800/80 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                    <FiDollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Exportación Completa</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Descarga toda tu base de datos de productos, ventas y clientes en formato Excel/CSV para tu contabilidad local.
                  </p>
                  <ExportDataButton />
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <FiInfo className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Guía de Usuario</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    ¿Tienes dudas sobre cómo usar el sistema? Accede a nuestra documentación interactiva para aprender a dominar BodegApp.
                  </p>
                  <HowToUseSystem />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
