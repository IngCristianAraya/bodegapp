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
  message
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  
  if (!isOpen) return null;

  const handlePasswordCheck = async () => {
    setValidating(true);
    setError(null);
    try {
      // Usa localStorage para evitar pedir la clave repetidamente
      const sessionOk = localStorage.getItem('adminPasswordOk');
      if (sessionOk === 'true') {
        await onConfirm(password);
        return;
      }
      // Carga la clave maestra desde config.json
      const res = await fetch(CONFIG_PATH);
      const config = await res.json();
      if (password === config.adminPassword) {
        localStorage.setItem('adminPasswordOk', 'true');
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center">
        {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
        {message && <p className="mb-4 text-gray-600">{message}</p>}
        {children}
        <input
          type="password"
          className="mt-4 px-4 py-2 border rounded w-full text-center"
          placeholder="Ingrese contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={validating || loading}
        />
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={validating || loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePasswordCheck}
            disabled={!password || validating || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {validating ? 'Validando...' : loading ? 'Cargando...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
