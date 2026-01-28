import React from 'react';
import Image from 'next/image';
import { Product } from '../../types/inventory';
import { Pencil, Trash2, Wrench, History, PlusCircle, FileSpreadsheet, FileText, Package, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onShowHistory?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
  onNewIngreso?: (product: Product) => void;
  onQuickPrice?: (product: Product) => void;
  loading?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ products, onEdit, onDelete, onShowHistory, onAdjustStock, onNewIngreso, onQuickPrice, loading }) => {
  // Exportar a Excel
  const handleExportExcel = () => {
    const data = products.map(p => ({
      Nombre: p.name,
      Código: p.code,
      Categoría: p.category,
      Proveedor: p.supplier,
      Stock: p.stock,
      'Costo Promedio': p.averageCost,
      'Precio Venta': p.salePrice
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'inventario.xlsx');
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[
        'Nombre', 'Código', 'Categoría', 'Proveedor', 'Stock', 'Costo Promedio', 'Precio Venta', 'Margen %'
      ]],
      body: products.map(p => {
        const margin = p.salePrice > 0 ? ((p.salePrice - (p.averageCost || 0)) / p.salePrice) * 100 : 0;
        return [
          p.name,
          p.code,
          p.category,
          p.supplier,
          p.stock,
          p.averageCost?.toFixed(2) ?? '0.00',
          typeof p.salePrice === 'number' ? p.salePrice.toFixed(2) : '-',
          margin.toFixed(2) + '%'
        ];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }, // emerald
      margin: { top: 20 }
    });
    doc.save('inventario.pdf');
  };

  return (
    <div className="glass-card rounded-2xl border border-white/40 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 bg-white/90 dark:bg-slate-900">
      {/* Header Actions */}
      <div className="flex justify-end gap-3 p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          onClick={handleExportExcel}
        >
          <FileSpreadsheet size={16} />
          <span>Excel</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          onClick={handleExportPDF}
        >
          <FileText size={16} />
          <span>PDF</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left align-middle">
          <thead className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur text-xs uppercase tracking-wider text-gray-500 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Proveedor</th>
              <th className="px-6 py-4 text-right">Stock</th>
              <th className="px-6 py-4 text-right">Precios</th>
              <th className="px-6 py-4 text-center">Margen</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white/40 dark:bg-slate-900/40">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500 animate-pulse">Cargando inventario...</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={48} strokeWidth={1} />
                    <p>No hay productos en el inventario.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map(product => {
                const isLowStock = product.minStock !== undefined && product.stock <= product.minStock;
                return (
                  <tr key={product.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full mt-1">
                              ⚠️ Stock Bajo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{product.code}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{product.supplier || '-'}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-bold text-base ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 block">{product.unit || 'unid'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">S/. {typeof product.salePrice === 'number' ? product.salePrice.toFixed(2) : '-'}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Costo: S/. {product.averageCost?.toFixed(2) ?? '0.00'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {(() => {
                        const margin = product.salePrice > 0 ? ((product.salePrice - (product.averageCost || 0)) / product.salePrice) * 100 : 0;
                        let colorClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
                        if (margin < 5) colorClass = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
                        else if (margin < 15) colorClass = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';

                        return (
                          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
                            {margin.toFixed(1)}%
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"
                          title="Editar"
                          onClick={() => onEdit(product)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                          title="Nuevo ingreso"
                          onClick={() => onNewIngreso && onNewIngreso(product)}
                        >
                          <PlusCircle size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                          title="Ajustar precio"
                          onClick={() => onQuickPrice && onQuickPrice(product)}
                        >
                          <Zap size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform"
                          title="Ajustar stock"
                          onClick={() => onAdjustStock && onAdjustStock(product)}
                        >
                          <Wrench size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:scale-110 transition-transform"
                          title="Historial"
                          onClick={() => onShowHistory && onShowHistory(product)}
                        >
                          <History size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                        <button
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 hover:scale-110 transition-transform"
                          title="Eliminar"
                          onClick={() => onDelete(product)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
