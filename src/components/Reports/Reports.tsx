import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TicketVenta from '../POS/TicketVenta';
import ReportsMenu from './ReportsMenu';
import ReportsDashboard from './ReportsDashboard';
import { obtenerVentas } from '../../lib/supabaseSales';
import { obtenerProductos } from '../../lib/supabaseProducts';
import { getExpenses } from '../../lib/supabaseExpenses';
import { obtenerHistorialCajas, CashRegister } from '../../lib/supabaseCashRegister';
import { obtenerTodosMovimientosInventario } from '../../lib/supabaseInventory';
import { getStoreSettings, StoreSettings } from '../../lib/supabaseSettings';
import { useTenant } from '../../contexts/TenantContext';
import { Sale, Product, SaleItem, Expense } from '../../types/index';
import { InventoryMovement } from '../../types/inventory';
import { FileText, Download, Calendar, Printer, Search, ArrowLeft, ArrowRight, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
// import { useSubscription } from '../../contexts/SubscriptionContext'; // Removed Pro check

const Reports: React.FC = () => {
  const { tenant } = useTenant();
  // const { isPro } = useSubscription(); // Removed Pro check
  const [showTicketModal, setShowTicketModal] = React.useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Sale | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [reportType, setReportType] = useState<string>('dashboard');

  // Data States
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [cierres, setCierres] = useState<CashRegister[]>([]);
  const [movimientos, setMovimientos] = useState<InventoryMovement[]>([]);

  // Filters
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Reset page on tab change
  useEffect(() => {
    setPage(1);
  }, [reportType]);

  const loadData = React.useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      // Always fetch products for multiple reports
      const p = await obtenerProductos(tenant.id, true);
      setProductos(p);

      // Fetch Sales if needed (dashboard, ventas, ganancias, best sellers)
      if (['dashboard', 'ventas', 'ganancias', 'mas_vendidos'].includes(reportType)) {
        const [v, s] = await Promise.all([
          obtenerVentas(tenant.id),
          getStoreSettings(tenant.id)
        ]);
        setVentas(v);
        setStoreSettings(s);
      }

      // Expenses (dashboard, gastos)
      if (['dashboard', 'gastos'].includes(reportType)) {
        const g = await getExpenses(tenant.id);
        setGastos(g);
      }

      // Others
      if (reportType === 'cierre_caja') {
        const c = await obtenerHistorialCajas(tenant.id);
        setCierres(c);
      } else if (reportType === 'movimientos') {
        const m = await obtenerTodosMovimientosInventario(tenant.id);
        setMovimientos(m);
      }
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, reportType]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // --- HEADERS ---
  const ventasHeaders = [
    { key: 'receiptNumber', label: 'N° Boleta' },
    { key: 'createdAt', label: 'Fecha', format: (val: any) => new Date(val?.seconds ? val.seconds * 1000 : val).toLocaleDateString() },
    { key: 'cashierName', label: 'Cajero' },
    { key: 'customerName', label: 'Cliente' },
    { key: 'total', label: 'Total', format: (val: any) => `S/ ${Number(val).toFixed(2)}` },
    { key: 'paymentMethod', label: 'Método' },
  ];

  const inventarioHeaders = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Producto' },
    { key: 'stock', label: 'Stock' },
    { key: 'salePrice', label: 'Precio', format: (val: any) => `S/ ${Number(val).toFixed(2)}` },
    { key: 'averageCost', label: 'Costo', format: (val: any) => `S/ ${Number(val).toFixed(2)}` },
  ];

  const gastosHeaders = [
    { key: 'date', label: 'Fecha', format: (val: any) => new Date(val).toLocaleDateString() },
    { key: 'description', label: 'Descripción' },
    { key: 'category', label: 'Categoría' },
    { key: 'amount', label: 'Monto', format: (val: any) => `S/ ${Number(val).toFixed(2)}` },
  ];

  const cierresHeaders = [
    { key: 'opened_at', label: 'Apertura', format: (val: any) => new Date(val).toLocaleString() },
    { key: 'closed_at', label: 'Cierre', format: (val: any) => val ? new Date(val).toLocaleString() : '-' },
    { key: 'total_sales_cash', label: 'V. Efectivo', format: (val: any) => `S/ ${Number(val ?? 0).toFixed(2)}` },
    { key: 'total_sales_digital', label: 'V. Digital', format: (val: any) => `S/ ${Number(val ?? 0).toFixed(2)}` },
    { key: 'closing_amount', label: 'En Caja', format: (val: any) => `S/ ${Number(val ?? 0).toFixed(2)}` },
  ];

  const movimientosHeaders = [
    { key: 'date', label: 'Fecha', format: (val: any) => new Date(val).toLocaleString() },
    { key: 'productName', label: 'Producto' },
    { key: 'type', label: 'Tipo', format: (val: any) => String(val).toUpperCase() },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'motivo', label: 'Motivo / Justificación' },
    { key: 'cashierName', label: 'Usuario' },
  ];

  const gananciasHeaders = [
    { key: 'dateLabel', label: 'Fecha' },
    { key: 'ventas', label: 'Venta Total', format: (val: any) => `S/ ${val.toFixed(2)}` },
    { key: 'costo', label: 'Costo Mercadería', format: (val: any) => `S/ ${val.toFixed(2)}` },
    { key: 'ganancia', label: 'Ganancia Neta', format: (val: any) => `S/ ${val.toFixed(2)}` },
    { key: 'margen', label: 'Margen %', format: (val: any) => `${val}%` },
  ];

  const bestSellersHeaders = [
    { key: 'rank', label: '#' },
    { key: 'productName', label: 'Producto' },
    { key: 'quantity', label: 'Und. Vendidas' },
    { key: 'revenue', label: 'Ingresos Totales', format: (val: any) => `S/ ${val.toFixed(2)}` },
    { key: 'avgPrice', label: 'Precio Prom.', format: (val: any) => `S/ ${val.toFixed(2)}` },
  ];

  const sugerenciasHeaders = [
    { key: 'productName', label: 'Producto' },
    { key: 'stock', label: 'Stock Actual' },
    { key: 'minStock', label: 'Stock Mínimo' },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'status', label: 'Estado' },
  ];


  // --- PROCESSING LOGIC ---

  const getDailyProfits = () => {
    const dailyData: Record<string, { dateLabel: string, ventas: number, costo: number, ganancia: number }> = {};

    ventas.filter(filterByDate).forEach(sale => {
      const d = new Date(sale.createdAt as any);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString();

      if (!dailyData[key]) {
        dailyData[key] = { dateLabel: key, ventas: 0, costo: 0, ganancia: 0 };
      }

      const saleTotal = sale.total || 0;
      let saleCost = 0;

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          // Find product to get cost
          const product = productos.find(p => p.id === item.productId || p.name === item.productName);
          const unitCost = product?.averageCost || product?.costPrice || 0;
          saleCost += (item.quantity * unitCost);
        });
      }

      dailyData[key].ventas += saleTotal;
      dailyData[key].costo += saleCost;
      dailyData[key].ganancia += (saleTotal - saleCost);
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(b.dateLabel).getTime() - new Date(a.dateLabel).getTime()) // Sort desc
      .map(d => ({
        ...d,
        margen: d.ventas > 0 ? ((d.ganancia / d.ventas) * 100).toFixed(1) : '0.0'
      }));
  };

  const getBestSellers = () => {
    const productStats: Record<string, { productName: string, quantity: number, revenue: number }> = {};

    ventas.filter(filterByDate).forEach(v => {
      v.items?.forEach(i => {
        const name = i.productName || 'Desconocido';
        if (!productStats[name]) productStats[name] = { productName: name, quantity: 0, revenue: 0 };
        productStats[name].quantity += i.quantity;
        productStats[name].revenue += (i.total || (i.quantity * i.unitPrice));
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .map((p, idx) => ({
        rank: idx + 1,
        ...p,
        avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0
      }));
  };

  const getReorderSuggestions = () => {
    return productos
      .filter(p => p.stock <= (p.minStock || 0)) // Only low stock
      .map(p => ({
        productName: p.name,
        stock: p.stock,
        minStock: p.minStock || 0,
        supplier: p.supplier || 'General',
        status: p.stock === 0 ? 'AGOTADO' : 'BAJO STOCK'
      }))
      .sort((a, b) => a.stock - b.stock);
  };


  // --- EXPORT ---

  function toCSV(rows: any[], headers: any[]) {
    const list = [
      headers.map(h => h.label).join(';'),
      ...rows.map(r => headers.map(h => {
        let val = r[h.key];
        if (h.format) val = h.format(val, r);
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(';'))
    ].join('\n');
    return new Blob(["\uFEFF" + list], { type: 'text/csv' });
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    let data: any[] = [];
    let headers: any[] = [];
    let title = '';

    if (reportType === 'ventas') {
      data = ventas.filter(filterByDate);
      headers = ventasHeaders;
      title = 'Reporte de Ventas';
    } else if (reportType === 'inventario') {
      data = productos;
      headers = inventarioHeaders;
      title = 'Reporte de Inventario';
    } else if (reportType === 'gastos') {
      data = gastos.filter(filterByDate);
      headers = gastosHeaders;
      title = 'Reporte de Gastos';
    } else if (reportType === 'cierre_caja') {
      data = cierres;
      headers = cierresHeaders;
      title = 'Reporte de Cierres de Caja';
    } else if (reportType === 'movimientos') {
      data = movimientos.filter(filterByDate);
      headers = movimientosHeaders;
      title = 'Reporte de Movimientos';
    } else if (reportType === 'ganancias') {
      data = getDailyProfits();
      headers = gananciasHeaders;
      title = 'Reporte de Ganancias';
    } else if (reportType === 'mas_vendidos') {
      data = getBestSellers();
      headers = bestSellersHeaders;
      title = 'Ranking de Productos Más Vendidos';
    } else if (reportType === 'sugerencias') {
      data = getReorderSuggestions();
      headers = sugerenciasHeaders;
      title = 'Sugerencia de Compra (Stock Bajo)';
    }

    if (data.length === 0 && format !== 'dashboard') {
      alert("No hay datos para exportar.");
      return;
    }

    if (format === 'csv') {
      const blob = toCSV(data, headers);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}.csv`;
      a.click();
    } else {
      const doc = new jsPDF();
      doc.text(title, 14, 15);
      autoTable(doc, {
        head: [headers.map(h => h.label)],
        body: data.map(r => headers.map(h => {
          let val = r[h.key];
          if (h.format) val = h.format(val, r);
          return String(val);
        })),
        startY: 20,
        styles: { fontSize: 8 }
      });
      doc.save(`${reportType}.pdf`);
    }
  };

  const filterByDate = (item: any) => {
    if (!fechaInicio && !fechaFin) return true;
    const dateVal = item.createdAt || item.date || item.opened_at || (item.dateLabel ? new Date(item.dateLabel) : null);
    if (!dateVal) return false;

    let d = new Date(dateVal.seconds ? dateVal.seconds * 1000 : dateVal);
    if (isNaN(d.getTime())) return false;

    if (fechaInicio) {
      if (d < new Date(fechaInicio)) return false;
    }
    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59);
      if (d > end) return false;
    }
    return true;
  };

  // Pagination Helper
  const getPaginatedData = (data: any[]) => {
    // Logic split for pre-processed data like Profits vs raw data like Sales
    let filtered = data;
    // Ganancias, Best Sellers, and Sugerencias are derived/already filtered or shouldn't be filtered by date same way
    if (['ventas', 'gastos', 'movimientos', 'cierre_caja'].includes(reportType)) {
      filtered = data.filter(filterByDate);
    }

    const start = (page - 1) * ITEMS_PER_PAGE;
    return {
      data: filtered.slice(start, start + ITEMS_PER_PAGE),
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      totalItems: filtered.length
    };
  };

  // Render content based on current view
  const renderTableContent = () => {
    if (reportType === 'dashboard') {
      return <ReportsDashboard ventas={ventas} productos={productos} gastos={gastos} />;
    }

    if (reportType === 'ganancias') {
      const profits = getDailyProfits();
      const { data } = getPaginatedData(profits);
      return (
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 dark:bg-emerald-900/30">
            <tr>{gananciasHeaders.map(h => <th key={h.key} className="py-3 px-4 text-left font-semibold text-emerald-900 dark:text-emerald-400">{h.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="py-3 px-4 font-medium">{row.dateLabel}</td>
                <td className="py-3 px-4 font-semibold">S/ {row.ventas.toFixed(2)}</td>
                <td className="py-3 px-4 text-red-500">S/ {row.costo.toFixed(2)}</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">S/ {row.ganancia.toFixed(2)}</td>
                <td className="py-3 px-4 text-gray-500">{row.margen}%</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay datos en este rango.</td></tr>}
          </tbody>
        </table>
      );
    }

    // Generic Table setup
    let headers: any[] = [];
    let dataSrc: any[] = [];

    if (reportType === 'ventas') { headers = ventasHeaders; dataSrc = ventas; }
    else if (reportType === 'inventario') { headers = inventarioHeaders; dataSrc = productos; }
    else if (reportType === 'gastos') { headers = gastosHeaders; dataSrc = gastos; }
    else if (reportType === 'cierre_caja') { headers = cierresHeaders; dataSrc = cierres; }
    else if (reportType === 'movimientos') { headers = movimientosHeaders; dataSrc = movimientos; }
    else if (reportType === 'mas_vendidos') { headers = bestSellersHeaders; dataSrc = getBestSellers(); }
    else if (reportType === 'sugerencias') { headers = sugerenciasHeaders; dataSrc = getReorderSuggestions(); }

    const paginated = getPaginatedData(dataSrc);

    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            {headers.map(h => <th key={h.key} className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">{h.label}</th>)}
            {reportType === 'ventas' && <th className="py-3 px-4 text-center">Acción</th>}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          {paginated.data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800">
              {headers.map(h => {
                let val = row[h.key];
                if (h.key === 'motivo' && !val && row.type) val = row.type === 'ingreso' ? 'Compra' : 'Venta';

                // Special styling for restock
                if (h.key === 'status') {
                  return (
                    <td key={h.key} className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'AGOTADO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {val}
                      </span>
                    </td>
                  )
                }
                if (h.format) val = h.format(val, row);
                return <td key={h.key} className="py-3 px-4">{val}</td>
              })}
              {reportType === 'ventas' && (
                <td className="py-3 px-4 text-center">
                  <button onClick={() => { setVentaSeleccionada(row); setShowTicketModal(true); }} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full"><Printer size={16} /></button>
                </td>
              )}
            </tr>
          ))}
          {paginated.data.length === 0 && <tr><td colSpan={headers.length + 1} className="text-center py-8 text-gray-400">No hay datos para mostrar.</td></tr>}
        </tbody>
      </table>
    );
  };


  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-gray-800 dark:text-white">Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Visión completa de tu negocio</p>
        </div>

        {reportType !== 'dashboard' && (
          <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg">
              <FileText size={16} /> CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg">
              <Download size={16} /> PDF
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <ReportsMenu onSelect={setReportType} />

        {(['ventas', 'gastos', 'cierre_caja', 'movimientos', 'ganancias'].includes(reportType)) && (
          <div className="mt-4 flex items-center gap-2 border-t pt-4 border-gray-100 dark:border-gray-700 justify-end">
            <span className="text-sm text-gray-400">Filtrar por fecha:</span>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="p-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-gray-600" />
            <span className="text-gray-400">-</span>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="p-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-gray-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`rounded-2xl shadow-xl overflow-hidden min-h-[400px] ${reportType === 'dashboard' ? '' : 'glass-card bg-white/90 dark:bg-slate-900 border border-white/40 dark:border-gray-700'}`}>
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">Cargando datos...</div>
        ) : (
          <div className={reportType === 'dashboard' ? '' : 'overflow-x-auto'}>
            {renderTableContent()}
          </div>
        )}

        {/* Pagination Controls - Hide for Dashboard */}
        {!loading && reportType !== 'dashboard' && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 text-sm font-medium disabled:opacity-50">
              <ArrowLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 text-sm font-medium disabled:opacity-50">
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Ticket Modal Logic (Preserved) */}
      {showTicketModal && ventaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-lg text-gray-800">Ticket de Venta</span>
              <button onClick={() => setShowTicketModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="rotate-45" size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-gray-50 flex-1">
              <div className="bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
                <div ref={ticketRef} className="p-2">
                  <TicketVenta venta={{
                    receiptNumber: String(ventaSeleccionada.receiptNumber),
                    cashierName: ventaSeleccionada.cashierName || '-',
                    customerName: ventaSeleccionada.customerName || '',
                    paymentMethod: ventaSeleccionada.paymentMethod === 'cash' ? 'Efectivo' : ventaSeleccionada.paymentMethod,
                    date: new Date(ventaSeleccionada.createdAt as any).toLocaleDateString(),
                    items: ventaSeleccionada.items?.map(i => ({ productName: i.productName!, quantity: i.quantity!, unitPrice: i.unitPrice! })) || [],
                    subtotal: ventaSeleccionada.subtotal || 0,
                    discount: ventaSeleccionada.discount || 0,
                    igv: ventaSeleccionada.igv || 0,
                    total: ventaSeleccionada.total || 0
                  }} settings={storeSettings} />
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-2xl flex gap-3">
              <button
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                onClick={() => setShowTicketModal(false)}
              >
                Cerrar
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                onClick={() => {
                  if (ticketRef.current) {
                    const printContents = ticketRef.current.innerHTML;
                    const win = window.open('', '', 'width=400,height=600');
                    if (win) {
                      win.document.write('<html><head><title>Imprimir Ticket</title><style>body{margin:0;font-family:sans-serif;}@media print{body{background:transparent;}}</style></head><body>' + printContents + '</body></html>');
                      win.document.close();
                      win.focus();
                      setTimeout(() => {
                        win.print();
                        win.close();
                      }, 500);
                    }
                  }
                }}
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;