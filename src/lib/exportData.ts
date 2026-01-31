

import JSZip from 'jszip';
import { obtenerProductos } from './supabaseProducts';
import { obtenerVentas } from './supabaseSales';
import { obtenerClientes } from './supabaseCustomers';
import { obtenerProveedores } from './supabaseSuppliers';
import { getExpenses } from './supabaseExpenses';
import { Sale, SaleItem } from '../types/index';

// Type for objects that can be converted to CSV
type CSVObject = Record<string, string | number | boolean | null | undefined | Date>;

// Helper function to format date for Excel (YYYY-MM-DD HH:mm:ss)
function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Helper function to remove accents and special characters
function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Helper function to convert any object to CSVObject
function toCSVObject<T extends Record<string, unknown>>(obj: T): CSVObject {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Normalize Key (Header)
      const cleanKey = normalizeString(key);

      if (value === null || value === undefined) {
        return [cleanKey, ''];
      }
      if (value instanceof Date) {
        return [cleanKey, formatDate(value)];
      }
      // Check if string is an ISO date
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return [cleanKey, formatDate(value)];
      }

      if (typeof value === 'object') {
        return [cleanKey, JSON.stringify(value)];
      }

      // Normalize String Value
      if (typeof value === 'string') {
        return [cleanKey, normalizeString(value)];
      }

      return [cleanKey, value as string | number | boolean];
    })
  ) as CSVObject;
}

function arrayToCSV(arr: CSVObject[]): string {
  if (!arr.length) return '';
  const keys = Object.keys(arr[0]);
  const header = keys.join(';');
  const rows = arr.map(obj =>
    keys.map(k => {
      const value = obj[k];
      return value !== null && value !== undefined
        ? String(value).replace(/\r?\n|\r/g, ' ').replace(/;/g, ',')
        : '';
    }).join(';')
  );
  return [header, ...rows].join('\r\n');
}

export async function exportAllDataToCSV(tenantId: string): Promise<Blob> {
  const zip = new JSZip();

  // Fetch all data in parallel
  const [productos, ventas, clientes, proveedores, egresos] = await Promise.all([
    obtenerProductos(tenantId, true), // Include archived
    obtenerVentas(tenantId),
    obtenerClientes(tenantId),
    obtenerProveedores(tenantId),
    getExpenses(tenantId)
  ]);

  // 1. Productos
  const productosCSV = productos.map(p => ({
    NOMBRE: p.name,
    CODIGO: p.code,
    CATEGORIA: p.category,
    SUBCATEGORIA: p.subcategory,
    PRECIO_VENTA: p.salePrice,
    PRECIO_COSTO: p.costPrice,
    COSTO_PROMEDIO: p.averageCost,
    STOCK_ACTUAL: p.stock,
    STOCK_MINIMO: p.minStock,
    UNIDAD: p.unit,
    TIPO_UNIDAD: p.unitType === 'kg' ? 'KG' : 'UNIDAD',
    PROVEEDOR: p.supplier,
    CODIGO_BARRAS: p.barcode,
    EXONERADO_IGV: p.isExemptIGV ? 'SI' : 'NO',
    ACTIVO: p.isActive ? 'SI' : 'NO'
  }));
  zip.file('productos.csv', arrayToCSV(productosCSV.map(i => toCSVObject(i))));

  // 2. Clientes
  const clientesCSV = clientes.map(c => ({
    NOMBRE: c.name,
    TELEFONO: c.phone,
    DIRECCION: c.address,
    EMAIL: c.email,
    COMPRAS_TOTALES: c.totalPurchases,
    DEUDA_ACTUAL: c.currentDebt,
    LIMITE_CREDITO: c.creditLimit,
    FECHA_REGISTRO: c.createdAt
  }));
  zip.file('clientes.csv', arrayToCSV(clientesCSV.map(i => toCSVObject(i))));

  // 3. Proveedores
  const proveedoresCSV = proveedores.map(p => ({
    NOMBRE: p.name,
    CONTACTO: p.contact,
    TELEFONO: p.phone,
    EMAIL: p.email,
    DIRECCION: p.address,
    RUC: p.ruc,
    DIAS_ENTREGA: Array.isArray(p.deliveryDays) ? p.deliveryDays.join(', ') : p.deliveryDays,
    CATEGORIA: p.category,
    NOTAS: p.notes
  }));
  zip.file('proveedores.csv', arrayToCSV(proveedoresCSV.map(i => toCSVObject(i))));

  // 4. Egresos
  const egresosCSV = egresos.map(e => ({
    FECHA: e.date,
    DESCRIPCION: e.description,
    CATEGORIA: e.category,
    MONTO: e.amount,
    USUARIO_ID: e.userId
  }));
  zip.file('egresos.csv', arrayToCSV(egresosCSV.map(i => toCSVObject(i))));

  // 5. Ventas Resumen
  const ventasResumenCSV = ventas.map((venta: Sale) => ({
    ID_VENTA: venta.id,
    NRO_RECIBO: venta.receiptNumber,
    FECHA: venta.createdAt,
    CAJERO: venta.cashierName,
    CLIENTE: venta.customerName || 'Publico General', // Sin tilde
    METODO_PAGO: venta.paymentMethod === 'cash' ? 'EFECTIVO' :
      venta.paymentMethod === 'yape' ? 'YAPE' :
        venta.paymentMethod === 'plin' ? 'PLIN' :
          venta.paymentMethod === 'card' ? 'TARJETA' :
            venta.paymentMethod === 'credit' ? 'CREDITO' : venta.paymentMethod.toUpperCase(),
    SUBTOTAL: venta.subtotal,
    DESCUENTO: venta.discount,
    IMPUESTO: venta.tax,
    TOTAL: venta.total,
    CANTIDAD_ITEMS: venta.items?.length || 0
  }));
  zip.file('ventas_resumen.csv', arrayToCSV(ventasResumenCSV.map(i => toCSVObject(i))));

  // 6. Ventas Detalle
  const ventasDetalleCSV: any[] = [];
  ventas.forEach((venta: Sale) => {
    if (venta.items && Array.isArray(venta.items)) {
      venta.items.forEach((item: SaleItem) => {
        ventasDetalleCSV.push({
          ID_VENTA: venta.id,
          NRO_RECIBO: venta.receiptNumber,
          FECHA: venta.createdAt,
          PRODUCTO_ID: item.productId,
          PRODUCTO: item.productName,
          CANTIDAD: item.quantity,
          PRECIO_UNITARIO: item.unitPrice,
          TOTAL_LINEA: item.total
        });
      });
    }
  });
  zip.file('ventas_detalle.csv', arrayToCSV(ventasDetalleCSV.map(i => toCSVObject(i))));

  return zip.generateAsync({ type: 'blob' });
}

export async function exportDataToCSV<T extends Record<string, unknown>>(data: T[], filename: string): Promise<Blob> {
  const zip = new JSZip();
  const csvData: CSVObject[] = data.map(item => toCSVObject(item));
  zip.file(`${filename}.csv`, arrayToCSV(csvData));
  return zip.generateAsync({ type: 'blob' });
}

