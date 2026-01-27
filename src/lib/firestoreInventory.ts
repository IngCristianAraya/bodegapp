import { collection, addDoc, getDocs, Timestamp, doc, updateDoc, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Product, InventoryMovement } from '../types/inventory';

const PRODUCTS_COLLECTION = 'products';
const MOVEMENTS_COLLECTION = 'inventory_movements';

// Crear producto principal
export async function crearProducto(producto: Omit<Product, 'id' | 'stock' | 'averageCost' | 'createdAt' | 'updatedAt'>, primerIngreso: { quantity: number; costPrice: number; date?: string }) {
  // El producto se crea con stock = cantidad del primer ingreso y averageCost = costPrice del primer ingreso
  const now = Timestamp.now();
  // Logs de depuración
  try {
    const { auth } = await import('./firebase');
    console.log('DEBUG crearProducto (inventory) - usuario:', auth.currentUser);
  } catch {

    console.warn('No se pudo importar auth para log de usuario');
  }
  console.log('DEBUG crearProducto (inventory) - producto:', {
    ...producto,
    stock: primerIngreso.quantity,
    averageCost: primerIngreso.costPrice,
    createdAt: now,
    updatedAt: now,
  });
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...producto,
    stock: primerIngreso.quantity,
    averageCost: primerIngreso.costPrice,
    createdAt: now,
    updatedAt: now,
  });
  // Registrar el primer movimiento de ingreso
  // Obtener el usuario autenticado
  let cashierEmail = '';
  try {
    const { auth } = await import('./firebase');
    cashierEmail = auth.currentUser?.email || '';
  } catch {}
  await addDoc(collection(db, MOVEMENTS_COLLECTION), {
    productId: docRef.id,
    quantity: primerIngreso.quantity,
    costPrice: primerIngreso.costPrice,
    date: primerIngreso.date || now,
    type: 'ingreso',
    cashierEmail,
  });
  return docRef.id;
}

// Agregar ingreso de stock a un producto existente
export async function agregarIngresoProducto(productId: string, ingreso: { quantity: number; costPrice: number; date?: string; type?: string; motivo?: string }) {
  if (!ingreso.quantity || ingreso.quantity === 0) {
    // No registrar movimientos nulos
    return;
  }
  const now = Timestamp.now();
  // Registrar movimiento
  // Obtener el usuario autenticado
  let cashierEmail = '';
  try {
    const { auth } = await import('./firebase');
    cashierEmail = auth.currentUser?.email || '';
  } catch {}
  await addDoc(collection(db, MOVEMENTS_COLLECTION), {
    productId,
    quantity: ingreso.quantity,
    costPrice: ingreso.costPrice,
    date: ingreso.date || now,
    type: ingreso.type || 'ingreso',
    cashierEmail,
    ...(ingreso.motivo ? { motivo: ingreso.motivo } : {})
  });
  // Recalcular stock y averageCost
  await recalcularStockYAverageCost(productId);
}

// Obtener movimientos de un producto
export async function obtenerMovimientosProducto(productId: string): Promise<InventoryMovement[]> {
  const snapshot = await getDocs(collection(db, MOVEMENTS_COLLECTION));
  return snapshot.docs
    .map(doc => {
      const mov = { id: doc.id, ...doc.data() } as Record<string, unknown>;
      return {
        id: String(mov.id ?? ''),
        productId: typeof mov.productId === 'string' ? mov.productId : '',
        quantity: typeof mov.quantity === 'number' ? mov.quantity : 0,
        costPrice: typeof mov.costPrice === 'number' ? mov.costPrice : 0,
        date: typeof mov.date === 'string'
          ? mov.date
          : (mov.date && typeof (mov.date as { toDate?: () => Date }).toDate === 'function'
              ? (mov.date as { toDate: () => Date }).toDate().toISOString()
              : null),
        type: typeof mov.type === 'string' ? (mov.type as 'ingreso' | 'egreso' | 'ajuste') : 'ingreso',
        cashierEmail: typeof mov.cashierEmail === 'string' ? mov.cashierEmail : '',
        motivo: typeof mov.motivo === 'string' ? mov.motivo : undefined,
      } as InventoryMovement;
    })
    .filter((mov: InventoryMovement) => mov.productId === productId);
}

// Recalcular stock y averageCost de un producto tras un ingreso
export async function recalcularStockYAverageCost(productId: string) {
  const movimientos = await obtenerMovimientosProducto(productId);
  const ingresos = movimientos.filter(m => m.type === 'ingreso');
  const totalCantidad = ingresos.reduce((sum, m) => sum + m.quantity, 0);
  const totalCosto = ingresos.reduce((sum, m) => sum + m.quantity * m.costPrice, 0);
  const averageCost = totalCantidad > 0 ? totalCosto / totalCantidad : 0;
  // Actualizar producto principal
  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    stock: totalCantidad,
    averageCost,
    updatedAt: Timestamp.now(),
  });
}

// Obtener todos los productos con averageCost y stock actualizados
export async function obtenerProductosConStockYAverage(): Promise<Product[]> {
  const snapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
}

// Obtener todos los movimientos de inventario (para reportes)
export async function obtenerTodosMovimientosInventario(): Promise<InventoryMovement[]> {
  const snapshot = await getDocs(collection(db, MOVEMENTS_COLLECTION));
  // Obtener productos para enriquecer el reporte
  const productosSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const productos: Product[] = productosSnap.docs.map((doc: DocumentData) => ({
    id: doc.id,
    ...doc.data()
  } as Product));
  
  // Type for date fields that can come in different formats from Firestore
  type FirestoreDate = string | { toDate: () => Date } | Date | null | undefined;
  
  // Raw movement type from Firestore
  type RawMovement = {
    id: string;
    productId: string;
    quantity: number;
    costPrice: number;
    date: FirestoreDate;
    type?: string;
    cashierEmail?: string;
    motivo?: string;
  };
  // Helper function to safely convert Firestore date to timestamp
  const getDateValue = (date: FirestoreDate): number => {
    if (!date) return 0;
    
    if (typeof date === 'object' && date !== null) {
      if ('toDate' in date && typeof date.toDate === 'function') {
        return date.toDate().getTime();
      }
      if (date instanceof Date) {
        return date.getTime();
      }
    }
    
    if (typeof date === 'string') {
      return new Date(date).getTime();
    }
    
    return 0;
  };
  
  // Helper function to convert Firestore date to ISO string
  const dateToISOString = (date: FirestoreDate): string | null => {
    if (!date) return null;
    
    if (typeof date === 'object' && date !== null) {
      if ('toDate' in date && typeof date.toDate === 'function') {
        return date.toDate().toISOString();
      }
      if (date instanceof Date) {
        return date.toISOString();
      }
    }
    
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    
    return null;
  };
  
  // Group movements by product
  const movimientosPorProducto: Record<string, RawMovement[]> = {};
  
  snapshot.docs.forEach((doc: DocumentSnapshot<DocumentData>) => {
    const mov = { id: doc.id, ...doc.data() } as RawMovement;
    if (!mov.productId) return; // Skip if no productId
    
    if (!movimientosPorProducto[mov.productId]) {
      movimientosPorProducto[mov.productId] = [];
    }
    movimientosPorProducto[mov.productId].push(mov);
  });
  
  // For each product, sort movements by date ASC and calculate accumulated stock
  const movimientosEnriquecidos: InventoryMovement[] = [];
  
  Object.values(movimientosPorProducto).forEach((movimientos) => {
    // Sort by date ASC
    movimientos.sort((a, b) => {
      const dateA = getDateValue(a.date);
      const dateB = getDateValue(b.date);
      return dateA - dateB;
    });
    
    // Calculate stock for each movement
    let stock = 0;
    
    for (const mov of movimientos) {
      const initialStock = stock;
      stock += typeof mov.quantity === 'number' ? mov.quantity : 0;
      const finalStock = stock;
      
      const product = productos.find((p) => p.id === mov.productId);
      
      movimientosEnriquecidos.push({
        id: mov.id,
        productId: mov.productId || '',
        quantity: typeof mov.quantity === 'number' ? mov.quantity : 0,
        costPrice: typeof mov.costPrice === 'number' ? mov.costPrice : 0,
        date: dateToISOString(mov.date) || new Date().toISOString(),
        type: (mov.type as InventoryMovement['type']) || 'ingreso',
        cashierEmail: mov.cashierEmail || '',
        motivo: mov.motivo,
        productName: product?.name || mov.productId || '',
        initialStock,
        finalStock
      });
    }
  });
  
  // Sort all enriched movements by date DESC
  movimientosEnriquecidos.sort((a, b) => {
    return getDateValue(b.date) - getDateValue(a.date);
  });
  return movimientosEnriquecidos.sort((a, b) => {
    const dateA = getDateValue(a.date);
    const dateB = getDateValue(b.date);
    return dateB - dateA;
  });
}
