export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  subcategory?: string; // Nuevo campo opcional para subcategoría
  unit: string;
  stock: number;
  minStock: number;
  salePrice: number;
  averageCost: number;
  costPrice: number;
  supplier: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  barcode?: string;
  isExemptIGV: boolean; // Nuevo campo: ¿exonerado de IGV?
  isExonerated: boolean; // Exonerado de IGV (para lógica de venta)
  igvIncluded: boolean; // Precio incluye IGV (por defecto true)
  unitType: 'unidad' | 'kg'; // 'unidad' para unitario, 'kg' para peso
  ventaPorPeso: boolean; // true si se vende por peso
  expirationDate?: Date | string; // Fecha de vencimiento opcional
  [key: string]: unknown;
}

export interface InventoryMovement {
  motivo?: string; // Motivo del ajuste (solo para tipo 'ajuste')
  id: string; // Firestore id
  productId: string;
  quantity: number;
  costPrice: number;
  date: string; // ISO string o Timestamp
  type: 'ingreso' | 'egreso' | 'ajuste';
  cashierEmail?: string;
  cashierName?: string;
  productName?: string;
  initialStock?: number;
  finalStock?: number;
}
