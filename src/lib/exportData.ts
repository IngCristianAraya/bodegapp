

import JSZip from 'jszip';
import { obtenerProductos } from './firestoreProducts';
import { obtenerVentas } from './firestoreSales';
import { obtenerClientes } from './firestoreCustomers';
import { obtenerProveedores } from './firestoreSuppliers';

// Type for objects that can be converted to CSV
type CSVObject = Record<string, string | number | boolean | null | undefined | Date>;

// Helper function to convert any object to CSVObject
function toCSVObject<T extends Record<string, unknown>>(obj: T): CSVObject {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (value === null || value === undefined) {
        return [key, ''];
      }
      if (typeof value === 'object' && !(value instanceof Date)) {
        return [key, JSON.stringify(value)];
      }
      return [key, value as string | number | boolean | Date];
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
        ? String(value).replace(/\r?\n|\r/g, ' ')
        : '';
    }).join(';')
  );
  return [header, ...rows].join('\r\n');
}

export async function exportDataToCSV<T extends Record<string, unknown>>(data: T[], filename: string): Promise<Blob> {
  const zip = new JSZip();
  // Convert each item to CSVObject
  const csvData: CSVObject[] = data.map(item => toCSVObject(item));
  
  zip.file(`${filename}.csv`, arrayToCSV(csvData));
  return zip.generateAsync({ type: 'blob' });
}

export async function exportAllDataToCSV(): Promise<Blob> {
  const zip = new JSZip();
  
  // Fetch all data in parallel
  const [productos, ventas, clientes, proveedores] = await Promise.all([
    obtenerProductos(),
    obtenerVentas(),
    obtenerClientes(),
    obtenerProveedores()
  ]);

  // Process and add each data type to the ZIP
  const addDataToZip = async (
    data: unknown[], 
    filename: string
  ) => {
    // Convert each item to a plain object with string values
    const csvData = data.map(item => {
      if (item && typeof item === 'object') {
        return toCSVObject(item as Record<string, unknown>);
      }
      return {} as CSVObject;
    });
    zip.file(`${filename}.csv`, arrayToCSV(csvData));
  };

  // Add all data to the ZIP
  await Promise.all([
    addDataToZip(productos, 'productos'),
    addDataToZip(ventas, 'ventas'),
    addDataToZip(clientes, 'clientes'),
    addDataToZip(proveedores, 'proveedores')
  ]);

  return zip.generateAsync({ type: 'blob' });
}

