import React, { useState } from 'react';

interface ModalPesoProps {
  open: boolean;
  stockDisponible: number;
  onClose: () => void;
  onConfirm: (peso: number) => void;
}

const ModalPeso: React.FC<ModalPesoProps> = ({ open, stockDisponible, onClose, onConfirm }) => {
  const [peso, setPeso] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setPeso('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    const value = parseFloat(peso.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      setError('Ingrese un peso válido (> 0)');
      return;
    }
    if (value > stockDisponible) {
      setError('No hay suficiente stock disponible');
      return;
    }
    setError('');
    onConfirm(Number(value.toFixed(3)));
    setPeso('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && peso && !error) {
      handleConfirm();
    }
  };

  if (!open) return null;

  const isLowStock = stockDisponible > 0 && stockDisponible < 0.05;
  const isAgregarDisabled = !peso || !!error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Ingrese el peso</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Especifica la cantidad en kilogramos</p>

        <div className="relative flex items-center mb-3">
          <input
            type="number"
            step="0.001"
            min="0.001"
            max={stockDisponible}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium transition-all outline-none"
            placeholder="Ej: 0.250"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
          <span className="absolute right-4 text-gray-500 dark:text-gray-400 select-none font-bold">kg</span>
        </div>

        <div className="flex items-center justify-between text-xs mb-3 px-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Stock disponible:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stockDisponible.toFixed(3)} kg</span>
        </div>

        {isLowStock && (
          <div className="text-xs text-orange-600 dark:text-orange-400 mb-3 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 font-medium">
            ⚠️ Stock muy bajo
          </div>
        )}

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm mb-3 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 font-bold">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 font-bold transition-colors"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
            type="button"
            disabled={isAgregarDisabled}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPeso;
