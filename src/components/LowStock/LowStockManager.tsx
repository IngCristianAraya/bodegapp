import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { obtenerProductos } from '../../lib/supabaseProducts';
import { useTenant } from '../../contexts/TenantContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Product } from '../../types/inventory';

const LowStockManager: React.FC = () => {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tenant } = useTenant();

  const fetchProductos = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerProductos(tenant.id);
      // Filtra sólo los productos que tienen los campos mínimos requeridos para evitar errores de tipo
      setProductos(
        (data as Product[]).filter(p => typeof p.name === 'string' && typeof p.stock === 'number' && typeof p.minStock === 'number')
      );
    } catch {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const productosBajoStock = productos.filter(
    p => typeof p.stock === 'number' && typeof p.minStock === 'number' && p.stock <= p.minStock
  );

  return (
    <div className="p-4 md:p-8 w-full min-h-screen bg-gray-50 dark:bg-slate-900 ml-0 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <AlertTriangle className="text-amber-600 dark:text-amber-500" size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Productos Bajo Stock</h2>
        <button
          className="ml-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-semibold shadow-sm transition-all active:scale-95"
          onClick={fetchProductos}
          title="Recargar"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-16 text-gray-500 dark:text-gray-400">
          <span className="animate-spin mr-2"><RefreshCw size={20} /></span>
          Cargando productos...
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-10 font-medium">{error}</div>
      ) : productosBajoStock.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-lg">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-green-500" size={32} />
          </div>
          ¡Todos tus productos están por encima del stock mínimo!
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Producto</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Stock actual</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Stock mínimo</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Categoría</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {productosBajoStock.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors group">
                    <td className="py-3 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        {p.imageUrl && (
                          <Image
                            src={p.imageUrl}
                            alt={p.name || 'Producto'}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        )}
                      </div>
                      {p.name}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center font-medium text-gray-600 dark:text-gray-400">{p.minStock}</td>
                    <td className="py-3 px-6 text-center">
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                        {p.category || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center text-gray-500 dark:text-gray-400">{p.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockManager;
