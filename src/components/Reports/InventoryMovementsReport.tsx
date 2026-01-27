import React, { useEffect, useState } from 'react';
import { obtenerTodosMovimientosInventario } from '../../lib/supabaseInventory';
import { useTenant } from '../../contexts/TenantContext';
import { InventoryMovement } from '../../types/inventory';


const colorForQuantity = (qty: number) =>
  qty < 0 ? 'text-red-600 font-bold' : qty > 0 ? 'text-green-600 font-bold' : '';

const MOVEMENTS_PER_PAGE = 10;

const InventoryMovementsReport: React.FC = () => {
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoMensaje, setMotivoMensaje] = useState<string | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const { tenant } = useTenant();

  useEffect(() => {
    const fetchMovements = async () => {
      if (!tenant?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await obtenerTodosMovimientosInventario(tenant.id);
        setMovements(data);
      } catch (error) {
        console.error("Error fetching inventory movements:", error);
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, [tenant?.id]);

  // Paginación
  const totalPages = Math.ceil(movements.length / MOVEMENTS_PER_PAGE);
  const paginatedMovements = movements.slice((page - 1) * MOVEMENTS_PER_PAGE, page * MOVEMENTS_PER_PAGE);
  const startNumber = movements.length - (page - 1) * MOVEMENTS_PER_PAGE;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-400">Movimientos de inventario</h2>
      {!loading && (
        <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 text-center">Movimientos cargados: {movements.length}</div>
      )}
      {loading ? (
        <div className="py-10 text-center text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">Cargando movimientos...</div>
      ) : movements.length === 0 ? (
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">No hay movimientos registrados.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-sm text-sm text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400">
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-center">#</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50">Fecha y hora</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50">Cajero</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50">Detalle</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-center">Movimiento</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-right">Stock inicial</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-right">Cantidad</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-right">Stock final</th>
                  <th className="py-3 px-4 border-b dark:border-emerald-900/50 text-center">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {paginatedMovements.map((mov, idx) => {
                  let dateStr = '';
                  if (mov.date) {
                    let d: Date;
                    if (typeof mov.date === 'object' && mov.date !== null && 'seconds' in mov.date) {
                      d = new Date((mov.date as { seconds: number }).seconds * 1000);
                    } else {
                      d = new Date(mov.date as string | number);
                    }
                    dateStr = d.toLocaleString('es-PE');
                  }
                  return (
                    <tr key={mov.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      <td className="py-2 px-4 border-b dark:border-slate-800 text-center font-semibold">{startNumber - idx}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 whitespace-nowrap">{dateStr}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 whitespace-nowrap">{mov.cashierName || '-'}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 whitespace-nowrap font-medium text-gray-900 dark:text-white">{mov.productName || mov.productId}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 text-center capitalize">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${mov.type === 'ingreso' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            mov.type === 'egreso' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {mov.type || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 text-right">{mov.initialStock !== undefined ? mov.initialStock : '-'}</td>
                      <td className={`py-2 px-4 border-b dark:border-slate-800 text-right ${colorForQuantity(mov.quantity)}`}>{mov.quantity > 0 ? '+' : ''}{mov.quantity}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 text-right font-bold">{mov.finalStock !== undefined ? mov.finalStock : '-'}</td>
                      <td className="py-2 px-4 border-b dark:border-slate-800 text-center">
                        {mov.type === 'ajuste' && mov.motivo ? (
                          <button
                            className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                            onClick={() => { setMotivoMensaje(mov.motivo!); setShowMotivoModal(true); }}
                          >Motivo</button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Página {page} de {totalPages}</span>
            <div className="space-x-2">
              <button
                className="px-3 py-1 rounded border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >Anterior</button>
              <button
                className="px-3 py-1 rounded border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >Siguiente</button>
            </div>
          </div>
        </>
      )}
      {/* Modal Motivo Ajuste */}
      {showMotivoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-2 text-emerald-700 dark:text-emerald-400">Motivo del ajuste</h3>
            <div className="mb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{motivoMensaje}</div>
            <button
              className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 w-full font-medium"
              onClick={() => setShowMotivoModal(false)}
            >Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryMovementsReport;
