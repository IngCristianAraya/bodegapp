import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  actionLabel: string;
  onConfirm: (password: string) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
  children?: React.ReactNode;
  title?: string;
  message?: string;
  correctPassword?: string; // Nuevo: Clave esperada (ej: de store_settings)
}

const CONFIG_PATH = '/config.json';

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  actionLabel = 'Confirmar',
  onConfirm,
  onClose,
  loading = false,
  children,
  title,
  message,
  correctPassword
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  if (!isOpen) return null;

  const handlePasswordCheck = async () => {
    setValidating(true);
    setError(null);
    try {
      // Si se provee una clave específica (multi-tenant), la comparamos directamente
      if (typeof correctPassword === 'string' && correctPassword.length > 0) {
        if (password === correctPassword) {
          await onConfirm(password);
        } else {
          setError('Contraseña incorrecta');
        }
        return;
      }

      // Fallback a clave maestra de config.json (legacy)
      const res = await fetch(CONFIG_PATH);
      const config = await res.json();
      if (password === config.adminPassword) {
        await onConfirm(password);
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error validating password:', error);
      setError('No se pudo validar la contraseña');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-200">
        {title && <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>}
        {message && <p className="mb-4 text-gray-500 dark:text-gray-400 text-sm font-medium">{message}</p>}
        {children}
        <input
          type="password"
          className="mt-4 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          placeholder="Ingrese clave secreta"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={validating || loading}
        />
        {error && <p className="text-red-500 mt-2 text-xs font-bold">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={validating || loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePasswordCheck}
            disabled={!password || validating || loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
          >
            {validating ? 'Validando...' : loading ? 'Cargando...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
