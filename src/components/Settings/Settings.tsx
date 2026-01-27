import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saveStoreInfo, getStoreInfo } from '../../lib/supabaseSettings';
import { useToast } from '../../contexts/ToastContext';
import HowToUseSystem from './HowToUseSystem';
import ExportDataButton from './ExportDataButton';
import styles from './Settings.module.css';
import { FiSave, FiInfo, FiHome, FiFileText, FiDollarSign, FiSettings, FiTool } from 'react-icons/fi';

// Tipo para los datos de la empresa/tienda
export interface StoreInfo {
  businessName: string;
  ruc: string;
  address: string;
}

// Utiliza localStorage por simplicidad (puedes migrar a Firestore si lo deseas)
const STORAGE_KEY = 'storeInfo';

const Settings: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    businessName: '',
    ruc: '',
    address: '',
  });
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Al montar, intenta cargar primero desde Firestore, luego localStorage
  useEffect(() => {
    const fetchData = async () => {
      if (user && user.uid) {
        try {
          const firestoreInfo = await getStoreInfo(user.uid);
          if (firestoreInfo) {
            setStoreInfo(firestoreInfo);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreInfo));
            setLoading(false);
            return;
          }
        } catch {
          // Si falla Firestore, sigue con localStorage
        }
      }
      // fallback localStorage
      const savedInfo = localStorage.getItem(STORAGE_KEY);
      if (savedInfo) {
        setStoreInfo(JSON.parse(savedInfo));
      }
      setLoading(false);
    };
    fetchData();

  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeInfo));
    let ok = true;
    if (user && user.uid) {
      try {
        await saveStoreInfo(user.uid, storeInfo);
        showToast('Datos guardados en la nube', 'success');
      } catch {

        showToast('Error al guardar en la nube', 'error');
        ok = false;
      }
    }
    setSaved(true);
    if (ok) showToast('¡Datos guardados!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Información de la Tienda */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden bg-white/90 dark:bg-slate-900 border border-white/40 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <FiSettings />
            </div>
            Configuración de la Tienda
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Personaliza la información de tu negocio para los tickets</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiHome className="text-emerald-500" />
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={storeInfo.businessName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  placeholder="Ej: Mi Bodega Pro"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiFileText className="text-emerald-500" />
                  RUC
                </label>
                <input
                  type="text"
                  name="ruc"
                  value={storeInfo.ruc}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  placeholder="11 dígitos"
                  required
                  pattern="[0-9]{11}"
                  title="El RUC debe tener 11 dígitos"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiInfo className="text-emerald-500" />
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={storeInfo.address}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  placeholder="Dirección del local"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              {saved && (
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mr-4 animate-in fade-in">
                  ¡Cambios guardados correctamente!
                </span>
              )}
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 dark:shadow-emerald-900/20 flex items-center gap-2 active:scale-95"
              >
                <FiSave />
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Herramientas */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden bg-white/90 dark:bg-slate-900 border border-white/40 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <FiTool />
            </div>
            Herramientas del Sistema
          </h2>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <FiDollarSign className="text-emerald-500" />
                Control de Datos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Exporta tu base de datos completa</p>
              <ExportDataButton />
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <FiInfo className="text-blue-500" />
                Ayuda y Documentación
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Aprende a usar el sistema correctamente</p>
              <HowToUseSystem />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
