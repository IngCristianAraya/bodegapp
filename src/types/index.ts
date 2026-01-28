export type Product = import("./inventory").Product;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  createdAt: Date;
  totalPurchases: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address: string;
  ruc?: string;
  deliveryDays?: string[];
  rating?: number;
  notes?: string;
  category?: string;
  products: string[];
  createdAt: Date;
}

export interface Sale extends Record<string, unknown> {
  id?: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
  createdAt: Date;
  cashierId: string;
  cashierName: string;
  receiptNumber: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BusinessConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  ruc?: string;
  logo?: string;
  paymentMethods: string[];
  currency: string;
  taxRate: number;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  monthSales: number;
  lowStockCount: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
}