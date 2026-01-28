import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TicketVenta from '../POS/TicketVenta';
import ReportsMenu from './ReportsMenu';
import { obtenerVentas } from '../../lib/supabaseSales';
import { obtenerProductos } from '../../lib/supabaseProducts';
import { getStoreSettings, StoreSettings } from '../../lib/supabaseSettings';
import { useTenant } from '../../contexts/TenantContext';
import { Sale, Product, SaleItem } from '../../types/index';
import { FileText, Download, Calendar, Printer, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradeAlert from '../common/UpgradeAlert';


const Reports: React.FC = () => {
  const { tenant } = useTenant();
  const { isPro } = useSubscription();
  const [showTicketModal, setShowTicketModal] = React.useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Sale | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<'ventas' | 'inventario' | 'ganancias' | 'movimientos'>('ventas');
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [productos, setProductos] = useState<Product[]>([]);
  const [ventasPage, setVentasPage] = useState(1);
  const [inventarioPage, setInventarioPage] = useState(1);
  const VENTAS_POR_PAGINA = 10;
  const INVENTARIO_POR_PAGINA = 10;
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const cargarVentasYProductos = React.useCallback(async (): Promise<void> => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [ventasData, productosData, settingsData] = await Promise.all([
        obtenerVentas(tenant.id),
        obtenerProductos(tenant.id, true), // Include archived products for reports
        getStoreSettings(tenant.id)
      ]);
      setVentas(ventasData);
      setProductos(productosData);
      setStoreSettings(settingsData);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  const cargarProductos = React.useCallback(async (): Promise<void> => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const productosData = await obtenerProductos(tenant.id, true); // Include archived products
      setProductos(productosData);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    setLoading(true);
    if (reportType === 'ventas' || reportType === 'ganancias') {
      cargarVentasYProductos();
    } else if (reportType === 'inventario') {
      cargarProductos();
    }
  }, [reportType, cargarVentasYProductos, cargarProductos]);

  useEffect(() => {
    setVentasPage(1);
    setInventarioPage(1);
  }, [reportType]);

  // Re-cargar configuración cuando se abre el modal del ticket
  useEffect(() => {
    if (showTicketModal && tenant?.id) {
      getStoreSettings(tenant.id).then(setStoreSettings);
    }
  }, [showTicketModal, tenant?.id]);

  function toCSV<T extends Record<string, unknown>>(rows: T[], headers: { key: string, label: string, format?: (val: unknown, row: T) => string }[]): string {
    const headerRow = headers.map(h => h.label).join(';');
    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    return [
      headerRow,
      ...rows.map(row => headers.map(h => {
        let value = row[h.key];
        if (h.format) value = h.format(value, row);
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) value = '';
        return escape(value);
      }).join(';'))
    ].join('\n');
  }

  function exportPDF<T extends Record<string, unknown>>({
    rows,
    headers,
    title = '',
    filename = 'reporte.pdf',
  }: {
    rows: T[],
    headers: { key: string, label: string, format?: (val: unknown, row: T) => string }[],
    title?: string,
    filename?: string,
  }): void {
    const doc = new jsPDF();
    if (title) {
      doc.setFontSize(15);
      doc.text(title, 14, 16);
    }
    autoTable(doc, {
      head: [headers.map(h => h.label)],
      body: rows.map(row => headers.map(h => {
        let value = row[h.key];
        if (h.format) value = h.format(value, row);
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) value = '';
        return String(value);
      })),
      startY: title ? 22 : 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 10, right: 10 },
    });
    doc.save(filename);
  }

  const ventasHeaders: { key: string, label: string, format?: (val: unknown, row: Record<string, unknown>) => string }[] = [
    { key: 'receiptNumber', label: 'N° Boleta' },
    {
      key: 'createdAt', label: 'Fecha', format: (val: unknown) => {
        if (!val) return '-';
        if (typeof val === 'object' && val !== null && 'seconds' in val) {
          const d = new Date((val as { seconds: number }).seconds * 1000);
          return d.toLocaleDateString();
        }
        if (val instanceof Date) return val.toLocaleDateString();
        return String(val);
      }
    },
    { key: 'cashierName', label: 'Cajero' },
    { key: 'customerName', label: 'Cliente' },
    { key: 'total', label: 'Total', format: (val: unknown) => `S/ ${typeof val === 'number' ? val.toFixed(2) : '0.00'}` },
    { key: 'paymentMethod', label: 'Método de Pago', format: (val: unknown) => val === 'cash' ? 'Efectivo' : String(val) },
    {
      key: 'items', label: 'Detalle', format: (_: unknown, row: Record<string, unknown>) => {
        const arr = Array.isArray(row.items) ? row.items as SaleItem[] : [];
        return arr.map((i: SaleItem) => {
          const nombre = i.productName;
          const cantidad = i.quantity;
          const precio = i.unitPrice;
          const subtotal = typeof precio === 'number' && typeof cantidad === 'number' ? precio * cantidad : 0;
          return `${nombre} x${cantidad} S/ ${subtotal.toFixed(2)}`;
        }).join(', ');
      }
    },
  ];

  const inventarioHeaders = [
    { key: 'name', label: 'Producto' },
    { key: 'code', label: 'Código' },
    { key: 'category', label: 'Categoría' },
    { key: 'unit', label: 'Unidad' },
    { key: 'stock', label: 'Stock' },
    { key: 'salePrice', label: 'Precio Venta', format: (val: unknown) => `S/ ${Number(val).toFixed(2)}` },
    { key: 'averageCost', label: 'Costo Promedio', format: (val: unknown) => `S/ ${Number(val).toFixed(2)}` },
    { key: 'supplier', label: 'Proveedor' },
  ];

  const exportReportCSV = (): void => {
    let csv = '';
    let filename = '';
    if (reportType === 'ventas') {
      const ventasFiltradas = ventas.filter(filterVentas);
      csv = toCSV(ventasFiltradas, ventasHeaders);
      filename = 'ventas.csv';
    } else if (reportType === 'inventario') {
      csv = toCSV(productos, inventarioHeaders);
      filename = 'inventario.csv';
    } else {
      alert('Descarga CSV solo disponible para ventas e inventario');
      return;
    }
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReportPDF = () => {
    let filename = '';
    let headers: { key: string; label: string; format?: (val: unknown, row: Record<string, unknown>) => string }[] = [];
    let rows: Record<string, unknown>[] = [];
    let title = '';
    if (reportType === 'ventas') {
      filename = 'ventas.pdf';
      headers = ventasHeaders;
      rows = ventas.filter(filterVentas);
      title = 'Reporte de Ventas';
    } else if (reportType === 'inventario') {
      filename = 'inventario.pdf';
      headers = inventarioHeaders;
      rows = productos;
      title = 'Reporte de Inventario';
    } else {
      alert('Descarga PDF solo disponible para ventas e inventario');
      return;
    }
    exportPDF({ rows, headers, title, filename });
  };

  const handlePageChange = (type: 'ventas' | 'inventario', page: number) => {
    if (type === 'ventas') {
      setVentasPage(page);
    } else {
      setInventarioPage(page);
    }
  };

  const filterVentas = (v: Sale) => {
    if (!fechaInicio && !fechaFin) return true;
    let fecha = null;
    if (v.createdAt instanceof Date) fecha = v.createdAt;
    else if (v.createdAt && typeof v.createdAt === 'object' && v.createdAt !== null && 'seconds' in v.createdAt && typeof (v.createdAt as { seconds: number }).seconds === 'number') fecha = new Date((v.createdAt as { seconds: number }).seconds * 1000);
    else if (typeof v.createdAt === 'string') fecha = new Date(v.createdAt);
    if (!fecha || isNaN(fecha.getTime())) return false;
    if (fechaInicio && fecha < new Date(fechaInicio + 'T00:00:00')) return false;
    if (fechaFin && fecha > new Date(fechaFin + 'T23:59:59')) return false;
    return true;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-gray-800 dark:text-white">
            Reportes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Visualiza y exporta el rendimiento de tu negocio</p>
        </div>

        {(reportType === 'ventas' || reportType === 'inventario') && (
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-1 gap-2">
            <button
              onClick={exportReportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
            >
              <FileText size={16} />
              CSV
            </button>
            <button
              onClick={exportReportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Tabs / Menu */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <ReportsMenu onSelect={t => setReportType(t as 'ventas' | 'inventario' | 'ganancias' | 'movimientos')} />

        {/* Date Filter Inline */}
        {(reportType === 'ventas' || reportType === 'inventario') && (
          <div className="flex items-center gap-2 ml-auto pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/40 dark:border-gray-700 bg-white/90 dark:bg-slate-900">

        {!isPro && (reportType === 'ganancias' || reportType === 'movimientos') ? (
          <div className="p-8 flex justify-center items-center min-h-[400px]">
            <UpgradeAlert
              title="Reportes Avanzados"
              message="El análisis de ganancias y movimientos de inventario detallados solo está disponible en el Plan PRO."
              className="max-w-2xl w-full"
            />
          </div>
        ) : (
          <>
            {reportType === 'ventas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="py-4 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">N° Boleta</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Cajero</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Detalle</th>
                      <th className="py-4 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">Total</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Método</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {ventas
                      .filter(filterVentas)
                      .sort((a, b) => {
                        const nA = Number(a.receiptNumber);
                        const nB = Number(b.receiptNumber);
                        if (!isNaN(nA) && !isNaN(nB)) return nB - nA;
                        return String(b.receiptNumber).localeCompare(String(a.receiptNumber));
                      })
                      .slice((ventasPage - 1) * VENTAS_POR_PAGINA, ventasPage * VENTAS_POR_PAGINA)
                      .map((v, idx) => {
                        const arr = Array.isArray(v.items) && v.items.length > 0 ? v.items : [];
                        return (
                          <tr key={v.id || idx} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="py-3 px-6 font-mono text-gray-500 dark:text-gray-400">{v.receiptNumber || '-'}</td>
                            <td className="py-3 px-6 text-center">
                              <span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                                {v.createdAt
                                  ? (typeof v.createdAt === 'object' && v.createdAt !== null && 'seconds' in v.createdAt && typeof (v.createdAt as { seconds: number }).seconds === 'number'
                                    ? new Date((v.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString()
                                    : new Date(v.createdAt as string | number | Date).toLocaleDateString())
                                  : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-center text-gray-600 dark:text-gray-300">{v.cashierName || '-'}</td>
                            <td className="py-3 px-6 text-xs text-gray-500 dark:text-gray-400">
                              {arr.slice(0, 2).map((i, k) => (
                                <div key={k} className="text-gray-600 dark:text-gray-300">{i.productName} (x{i.quantity})</div>
                              ))}
                              {arr.length > 2 && <div className="text-gray-400 dark:text-gray-500 italic">+{arr.length - 2} más...</div>}
                            </td>
                            <td className="py-3 px-6 text-right font-bold text-gray-800 dark:text-white">S/ {v.total?.toFixed(2)}</td>
                            <td className="py-3 px-6 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${v.paymentMethod === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                {v.paymentMethod === 'cash' ? 'Efectivo' : v.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-center">
                              <button
                                className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-full transition-all"
                                onClick={() => {
                                  setVentaSeleccionada(v);
                                  setShowTicketModal(true);
                                }}
                                title="Ver Ticket"
                              >
                                <Printer size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-slate-800/30">
                  <button
                    onClick={() => handlePageChange('ventas', ventasPage - 1)}
                    disabled={ventasPage === 1}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} /> Anterior
                  </button>
                  <span className="text-sm text-gray-400 dark:text-gray-500">Página {ventasPage} de {Math.ceil(ventas.filter(filterVentas).length / VENTAS_POR_PAGINA)}</span>
                  <button
                    onClick={() => handlePageChange('ventas', ventasPage + 1)}
                    disabled={ventasPage === Math.ceil(ventas.filter(filterVentas).length / VENTAS_POR_PAGINA)}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                  >
                    Siguiente <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {reportType === 'inventario' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="py-4 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Código</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Producto</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Stock</th>
                      <th className="py-4 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">Precio Venta</th>
                      <th className="py-4 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">Costo Promedio</th>
                      <th className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-gray-300">Proveedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {productos.slice((inventarioPage - 1) * INVENTARIO_POR_PAGINA, inventarioPage * INVENTARIO_POR_PAGINA).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-6 font-mono text-gray-500 dark:text-gray-400 text-xs">{p.code}</td>
                        <td className="py-3 px-6 font-bold text-gray-800 dark:text-white">{p.name}</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${p.stock <= (p.minStock ?? 0) ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-gray-900 dark:text-white">S/ {p.salePrice?.toFixed(2)}</td>
                        <td className="py-3 px-6 text-right text-gray-500 dark:text-gray-400">S/ {p.averageCost?.toFixed(2)}</td>
                        <td className="py-3 px-6 text-center text-xs text-gray-500 dark:text-gray-400">{p.supplier || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-slate-800/30">
                  <button
                    onClick={() => handlePageChange('inventario', inventarioPage - 1)}
                    disabled={inventarioPage === 1}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} /> Anterior
                  </button>
                  <span className="text-sm text-gray-400 dark:text-gray-500">Página {inventarioPage} de {Math.ceil(productos.length / INVENTARIO_POR_PAGINA)}</span>
                  <button
                    onClick={() => handlePageChange('inventario', inventarioPage + 1)}
                    disabled={inventarioPage === Math.ceil(productos.length / INVENTARIO_POR_PAGINA)}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                  >
                    Siguiente <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {reportType === 'ganancias' && !loading && ventas.length > 0 && (
              <div className="p-6">
                <table className="w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-sm mb-4 bg-white dark:bg-slate-900">
                  <thead>
                    <tr className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400 text-sm">
                      <th className="py-3 px-4 text-center font-semibold">Fecha</th>
                      <th className="py-3 px-4 text-right font-semibold">Ventas Totales</th>
                      <th className="py-3 px-4 text-right font-semibold">Costo Total</th>
                      <th className="py-3 px-4 text-right font-semibold">Ganancia Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const resumen: { [fecha: string]: { label: string, ventas: number, costo: number, ganancia: number } } = {};
                      ventas.filter(filterVentas).forEach(v => {
                        let fecha = null;
                        if (v.createdAt instanceof Date) fecha = v.createdAt;
                        else if (v.createdAt && typeof v.createdAt === 'object' && v.createdAt !== null && 'seconds' in v.createdAt && typeof (v.createdAt as { seconds: number }).seconds === 'number') fecha = new Date((v.createdAt as { seconds: number }).seconds * 1000);
                        else if (typeof v.createdAt === 'string') fecha = new Date(v.createdAt);
                        if (!fecha || isNaN(fecha.getTime())) return;

                        const year = fecha.getFullYear();
                        const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
                        const day = fecha.getDate().toString().padStart(2, '0');
                        const key = `${year}-${month}-${day}`;
                        const label = `${dias[fecha.getDay()]} ${day}/${month}`;
                        if (!resumen[key]) resumen[key] = { label, ventas: 0, costo: 0, ganancia: 0 };
                        resumen[key].ventas += v.total || 0;

                        let costoVenta = 0;
                        let gananciaVenta = 0;
                        (Array.isArray(v.items) && v.items.length > 0 ? v.items : []).forEach((item: SaleItem) => {
                          const cantidad = item.quantity || 1;
                          const precio = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                          const producto = productos.find((p: Product) => p.id === item.productId);
                          const costoUnit = producto?.costPrice ?? producto?.averageCost ?? 0;
                          const costo = cantidad * costoUnit;
                          const subtotal = cantidad * precio;
                          costoVenta += costo;
                          gananciaVenta += subtotal - costo;
                        });
                        resumen[key].costo += costoVenta;
                        resumen[key].ganancia += gananciaVenta;
                      });
                      return Object.entries(resumen)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([key, data]) => (
                          <tr key={key} className="border-b last:border-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-center font-medium text-gray-700 dark:text-gray-300">{data.label}</td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-semibold">S/ {data.ventas.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-red-500 dark:text-red-400">S/ {data.costo.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">S/ {data.ganancia.toFixed(2)}</td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Ticket Modal */}
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
                    <TicketVenta venta={mapVentaToTicket(ventaSeleccionada)} settings={storeSettings} />
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
                    if (!ticketRef.current) return;
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

      // Adapta la venta seleccionada a la estructura esperada por TicketVenta
      function mapVentaToTicket(venta: Sale) {
  const items = (Array.isArray(venta.items) ? venta.items : []).map((i: SaleItem) => ({
        productName: i.productName || '',
      quantity: i.quantity || 1,
      unitPrice: typeof i.unitPrice === 'number' ? i.unitPrice : 0,
  }));
      return {
        receiptNumber: String(venta.receiptNumber ?? '-'),
      cashierName: String(venta.cashierName ?? '-'),
      customerName: String(venta.customerName ?? ''),
      paymentMethod: String(venta.paymentMethod === 'cash' ? 'Efectivo' : (venta.paymentMethod ?? '-')),
      date: venta.createdAt
      ? (typeof venta.createdAt === 'object' && venta.createdAt !== null && 'seconds' in venta.createdAt && typeof (venta.createdAt as {seconds ?: unknown}).seconds === 'number'
      ? new Date((venta.createdAt as {seconds: number }).seconds * 1000).toLocaleDateString()
      : new Date(venta.createdAt as string | Date).toLocaleDateString())
      : '-',
      items,
      subtotal: typeof venta.subtotal === 'number' ? venta.subtotal : (typeof venta.total === 'number' && typeof venta.igv === 'number' ? venta.total - (venta.igv || 0) + (venta.discount || 0) : 0),
      discount: typeof venta.discount === 'number' ? venta.discount : 0,
      igv: typeof venta.igv === 'number' ? venta.igv : 0,
      total: typeof venta.total === 'number' ? venta.total : 0,
  };
}

      export default Reports;