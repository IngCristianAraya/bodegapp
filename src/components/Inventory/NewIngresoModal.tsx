import React, { useState } from 'react';

export interface IngresoData {
  quantity: number;
  unitCost: number;
  date: string; // Siempre usar string en formato ISO
}

interface NewIngresoModalProps {
  isOpen: boolean;
  product: { name: string };
  onSave: (ingresoData: IngresoData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const NewIngresoModal: React.FC<NewIngresoModalProps> = ({ isOpen, product, onSave, onClose, loading }) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (costPrice < 0) {
      setError('El precio de costo no puede ser negativo.');
      return;
    }
    onSave({
      quantity,
      unitCost: costPrice,
      date: new Date().toISOString() // Asegurar que sea string ISO
    });
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 ${!isOpen ? 'hidden' : ''}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 transform transition-all">
        <h2 className="text-xl font-bold mb-4 text-emerald-700 dark:text-emerald-400">Nuevo ingreso de producto</h2>
        <div className="mb-4 text-gray-700 dark:text-gray-300">
          <span className="font-extrabold text-sm uppercase tracking-tight">Producto:</span>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{product.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Cantidad a ingresar</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Precio de costo (unidad)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              min={0}
              step={0.01}
              value={costPrice}
              onChange={e => setCostPrice(Number(e.target.value))}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="text-red-500 text-xs font-bold uppercase py-1">{error}</div>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-6 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-gray-200 dark:hover:bg-slate-700"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 disabled:bg-emerald-400"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Confirmar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIngresoModal as React.FC<NewIngresoModalProps>;
