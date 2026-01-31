import React, { useEffect, useState } from 'react';
import { InventoryMovement, Product } from '../../types/inventory';
import { obtenerMovimientosProducto } from '../../lib/supabaseInventory';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
  companyId: string;
}

const InventoryHistoryModal: React.FC<Props> = ({ isOpen, product, onClose, companyId }) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const movs = await obtenerMovimientosProducto(product.id, companyId);
        setMovements(movs.sort((a, b) => (b.date > a.date ? 1 : -1)));
      } catch {
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, [product.id]);

  // Exportar historial a Excel
  const handleExportExcel = () => {
    const data = movements.map(mov => ({
      Fecha: (() => {
        if (!mov.date) return '-';
        if (typeof mov.date === 'object' && mov.date !== null && 'seconds' in mov.date) {
          return new Date((mov.date as { seconds: number }).seconds * 1000).toLocaleString();
        }
        const d = new Date(mov.date);
        return isNaN(d.getTime()) ? '-' : d.toLocaleString();
      })(),
      'Tipo': mov.type === 'ingreso' ? 'INGRESO' : mov.type === 'egreso' ? 'SALIDA' : 'AJUSTE',
      'Motivo': mov.motivo || '-',
      'Stock Inicial': mov.initialStock,
      'Cantidad': mov.quantity,
      'Stock Final': mov.finalStock,
      'Costo Unit.': mov.costPrice,
      'Total': mov.quantity * mov.costPrice
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, `historial_${product.code || product.name}.xlsx`);
  };

  // Exportar historial a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[
        'Fecha', 'Tipo', 'Motivo', 'Inicial', 'Cant.', 'Final', 'Costo', 'Total'
      ]],
      body: movements.map(mov => [
        (() => {
          if (!mov.date) return '-';
          if (typeof mov.date === 'object' && mov.date !== null && 'seconds' in mov.date) {
            return new Date((mov.date as { seconds: number }).seconds * 1000).toLocaleString();
          }
          const d = new Date(mov.date);
          return isNaN(d.getTime()) ? '-' : d.toLocaleString();
        })(),
        mov.type.toUpperCase(),
        mov.motivo || '-',
        mov.initialStock !== undefined ? mov.initialStock : '-',
        mov.quantity,
        mov.finalStock !== undefined ? mov.finalStock : '-',
        mov.costPrice.toFixed(2),
        (mov.quantity * mov.costPrice).toFixed(2)
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { top: 20 }
    });
    doc.save(`historial_${product.code || product.name}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-800 relative max-h-[90vh] flex flex-col">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="mb-6 pr-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1">Kardex / Historial</h2>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wide">{product.name} (Stock Actual: {product.stock})</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all active:scale-95"
            onClick={handleExportExcel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
            Excel
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            onClick={handleExportPDF}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
            PDF
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-12 animate-pulse font-bold uppercase text-xs tracking-widest">Cargando movimientos...</div>
          ) : movements.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-600 py-12 italic">No hay ingresos registrados para este producto.</div>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                <tr className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest">
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Tipo / Motivo</th>
                  <th className="px-2 py-2 text-right">Inicial</th>
                  <th className="px-2 py-2 text-right">Cant.</th>
                  <th className="px-2 py-2 text-right">Final</th>
                  <th className="px-4 py-2 text-right">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {movements.map((mov) => {
                  // Determine colors based on type
                  const isIngreso = mov.type === 'ingreso' || (mov.type === 'ajuste' && mov.quantity > 0);
                  const isEgreso = mov.type === 'egreso' || (mov.type === 'ajuste' && mov.quantity < 0);

                  return (
                    <tr key={mov.id} className="bg-gray-50/50 dark:bg-slate-800/40 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                        {(() => {
                          if (!mov.date) return '-';
                          if (typeof mov.date === 'object' && mov.date !== null && 'seconds' in mov.date) {
                            return new Date((mov.date as { seconds: number }).seconds * 1000).toLocaleDateString() + ' ' + new Date((mov.date as { seconds: number }).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                          const d = new Date(mov.date);
                          return isNaN(d.getTime()) ? '-' : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold uppercase ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {mov.type}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{mov.motivo || '-'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right text-gray-400 text-xs">
                        {mov.initialStock}
                      </td>
                      <td className={`px-2 py-3 text-right font-black ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIngreso ? '+' : ''}{mov.quantity}
                      </td>
                      <td className="px-2 py-3 text-right font-bold text-gray-900 dark:text-white">
                        {mov.finalStock}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-500 text-xs">
                        S/ {typeof mov.costPrice === 'number' ? mov.costPrice.toFixed(2) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryModal;
