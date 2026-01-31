/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { obtenerProductos } from '../../lib/supabaseProducts';
import { useTenant } from '../../contexts/TenantContext';
import { useLowStock } from '../../contexts/LowStockContext';
import { AlertTriangle, RefreshCw, Search, Download, FileText, Package, Phone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Product } from '../../types/inventory';

const LowStockManager: React.FC = () => {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'critical' | 'alphabetical' | 'supplier'>('critical');

  const { tenant } = useTenant();
  const { refreshLowStock } = useLowStock();

  const fetchProductos = React.useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerProductos(tenant.id);
      setProductos(
        (data as Product[]).filter(p => typeof p.name === 'string' && typeof p.stock === 'number' && typeof p.minStock === 'number')
      );
      await refreshLowStock();
    } catch {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, refreshLowStock]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const productosBajoStock = productos.filter(
    p => typeof p.stock === 'number' && typeof p.minStock === 'number' && p.stock <= p.minStock
  );

  // Get unique categories
  const categories = Array.from(new Set(productosBajoStock.map(p => p.category).filter(Boolean)));

  // Filter and sort products
  const filteredProducts = productosBajoStock
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'critical') {
        const aCritical = a.stock / (a.minStock || 1);
        const bCritical = b.stock / (b.minStock || 1);
        return aCritical - bCritical;
      } else if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else {
        return (a.supplier || '').localeCompare(b.supplier || '');
      }
    });

  const exportShoppingList = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Lista de Compras - Productos Bajo Stock', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 14, 28);

    const tableData = filteredProducts.map(p => {
      const needed = Math.max(0, (p.minStock || 0) * 2 - (p.stock || 0));
      return [
        p.name,
        p.code || '-',
        `${p.stock}`,
        `${p.minStock}`,
        `${needed.toFixed(1)}`,
        p.supplier || '-'
      ];
    });

    autoTable(doc, {
      head: [['Producto', 'Código', 'Stock Actual', 'Stock Mín', 'Cantidad Sugerida', 'Proveedor']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 10, right: 10 },
    });

    doc.save(`lista-compras-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Producto', 'Código', 'Stock Actual', 'Stock Mínimo', 'Cantidad Sugerida', 'Categoría', 'Proveedor'];
    const rows = filteredProducts.map(p => {
      const needed = Math.max(0, (p.minStock || 0) * 2 - (p.stock || 0));
      return [
        p.name,
        p.code || '-',
        p.stock,
        p.minStock,
        needed.toFixed(1),
        p.category || '-',
        p.supplier || '-'
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bajo-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 w-full min-h-screen bg-gray-50 dark:bg-slate-900 ml-0 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="text-amber-600 dark:text-amber-500" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Productos Bajo Stock</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredProducts.length} productos requieren atención
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-semibold shadow-sm transition-all active:scale-95"
            onClick={fetchProductos}
            title="Recargar"
          >
            <RefreshCw size={16} /> Recargar
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 text-sm font-semibold shadow-lg transition-all active:scale-95"
            onClick={exportShoppingList}
            title="Exportar Lista PDF"
          >
            <Download size={16} /> Lista PDF
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm font-semibold shadow-lg transition-all active:scale-95"
            onClick={exportCSV}
            title="Exportar CSV"
          >
            <FileText size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
          >
            <option value="critical">Más crítico primero</option>
            <option value="alphabetical">Alfabético</option>
            <option value="supplier">Por proveedor</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16 text-gray-500 dark:text-gray-400">
          <span className="animate-spin mr-2"><RefreshCw size={20} /></span>
          Cargando productos...
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-10 font-medium">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-lg">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Package className="text-green-500" size={32} />
          </div>
          {searchTerm || filterCategory !== 'all'
            ? 'No se encontraron productos con los filtros aplicados'
            : '¡Todos tus productos están por encima del stock mínimo!'}
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
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Cantidad Sugerida</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Categoría</th>
                  <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-xs">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const isCritical = p.stock === 0 || p.stock <= (p.minStock || 0) / 2;
                  const neededQuantity = Math.max(0, (p.minStock || 0) * 2 - (p.stock || 0));

                  return (
                    <tr key={p.id} className={`hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors group ${isCritical ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
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
                        <div>
                          <div className="flex items-center gap-2">
                            {p.name}
                            {isCritical && (
                              <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
                                CRÍTICO
                              </span>
                            )}
                          </div>
                          {p.code && <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.code}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${isCritical
                          ? 'bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                          : 'bg-orange-100/80 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50'
                          }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-medium text-gray-600 dark:text-gray-400">{p.minStock}</td>
                      <td className="py-3 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                          {neededQuantity.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                          {p.category || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">{p.supplier || '-'}</span>
                          {p.supplier && (
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full"
                              title="Contactar proveedor"
                            >
                              <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockManager;
