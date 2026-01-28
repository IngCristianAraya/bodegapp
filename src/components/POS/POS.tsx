'use client';
import React, { useState, useRef, useEffect } from 'react';

import ProductSearch from "@/components/POS/ProductSearch";
import ProductGrid from "@/components/POS/ProductGrid";
import Cart from "@/components/POS/Cart";
import ModalPeso from "@/components/POS/ModalPeso";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import CategoryBadge from "@/components/common/CategoryBadge";

import { crearVenta, descontarStockProductos, obtenerVentas } from "@/lib/supabaseSales";
import { getStoreSettings, StoreSettings } from "@/lib/supabaseSettings";
import SuccessToast from "@/components/common/SuccessToast";
import TicketVenta from "./TicketVenta";
import { useReactToPrint } from 'react-to-print';
import { Product } from '../../types/inventory';
import { CartItem } from '../../types/index';
import { categoryData, CategoryKey } from '@/lib/constants/categoryData';

const POS: React.FC = () => {
  const [showTicket, setShowTicket] = useState(false);
  const [ventaTicket, setVentaTicket] = useState<{
    receiptNumber: string;
    cashierName: string;
    customerName?: string;
    paymentMethod: string;
    date: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    discount: number;
    igv: number;
    total: number;
  } | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  // Definir el tipo extendido que incluye la propiedad 'content'
  type PrintConfig = {
    content: () => HTMLDivElement | null;
    documentTitle?: string;
    // Otras propiedades opcionales que puedas necesitar
  };

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: ventaTicket?.receiptNumber ? `Boleta_${ventaTicket.receiptNumber}` : 'Boleta',
  } as unknown as PrintConfig);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { products, loading } = useProducts(tenant?.id);

  const { state, addItem, clearCart } = useCart();
  const { user } = useAuth();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Cargar configuración de la tienda
  useEffect(() => {
    if (tenant?.id) {
      getStoreSettings(tenant.id).then(settings => {
        console.log('POS: Settings loaded:', settings);
        setStoreSettings(settings);
      });
    }
  }, [tenant?.id]);

  // Estados para Modal de Peso
  const [showPesoModal, setShowPesoModal] = useState(false);
  const [productForPeso, setProductForPeso] = useState<Product | null>(null);

  // Resetear subcategoría al cambiar categoría
  useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedCategory]);

  // Re-cargar configuración cuando se abre el ticket (refresco de datos)
  useEffect(() => {
    if (showTicket && tenant?.id) {
      getStoreSettings(tenant.id).then(settings => {
        console.log('POS: Refreshing settings for ticket...', settings);
        setStoreSettings(settings);
      });
    }
  }, [showTicket, tenant?.id]);

  // Extraer categorías y subcategorías desde categoryData
  const categoryList = (Object.keys(categoryData).filter(cat => cat !== 'all') as CategoryKey[]);

  // --- Restaurar lógica de paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  // Calcular productos de la página actual
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);
  // --- Fin restauración ---

  useEffect(() => {
    // Siempre usar productos reales de Firestore
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((product: Product) =>
        product.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }
    if (selectedSubcategory) {
      filtered = filtered.filter((product: Product) =>
        (product.subcategory || '').trim().toLowerCase() === selectedSubcategory.trim().toLowerCase()
      );
    }
    if (searchQuery) {
      filtered = filtered.filter((product: Product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleBarcodeSearch = (barcode: string) => {
    // Buscar producto por código de barras (o por el campo code si se usa como código de barras)
    const product = products.find((p: Product) =>
      (p.barcode === barcode) || (p.code === barcode)
    );
    if (product) {
      handleAddToCart(product);
      showToast(`Añadido: ${product.name}`, 'success');
    } else {
      showToast('Producto no encontrado por código', 'error');
    }
  };

  // Oyente Global para Escáner de Código de Barras
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();

      // Los lectores suelen disparar las teclas muy rápido (menos de 30ms entre teclas)
      if (currentTime - lastKeyTime > 50) {
        buffer = ''; // Resetear buffer si ha pasado mucho tiempo (fue el usuario escribiendo)
      }

      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) { // Longitud mínima razonable para un código
          handleBarcodeSearch(buffer);
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleAddToCart = (product: Product, peso?: number) => {
    if (product.ventaPorPeso && product.unitType === 'kg' && !peso) {
      setProductForPeso(product);
      setShowPesoModal(true);
      return;
    }

    if (peso && product.ventaPorPeso && product.unitType === 'kg') {
      addItem({ ...product }, peso);
    } else {
      addItem(product);
    }
  };

  const handleCheckout = async (paymentMethod: string) => {
    // VALIDACIONES ROBUSTAS
    if (!state.items || state.items.length === 0) {
      setSuccessMsg('No hay productos en el carrito.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }
    if (!paymentMethod) {
      setSuccessMsg('Selecciona un método de pago.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }
    // Validar stock suficiente para cada producto (incluyendo ventas por peso)
    const productosSinStock = state.items.filter((item: CartItem) => {
      // Venta por peso: permitir decimales
      if (item.product.ventaPorPeso && item.product.unitType === 'kg') {
        return item.quantity > item.product.stock;
      }
      // Venta por unidad: solo enteros
      return item.quantity > item.product.stock;
    });
    if (productosSinStock.length > 0) {
      const nombres = productosSinStock.map(i => i.product.name).join(', ');
      setSuccessMsg(`Stock insuficiente para: ${nombres}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      return;
    }
    if (!tenant?.id) {
      setSuccessMsg('Error: No se identificó la tienda.');
      setShowSuccess(true);
      return;
    }

    try {
      // Obtener items del carrito y datos de usuario/empresa
      const cartItems = state.items;
      // Crear la venta en Firestore
      // Obtener último número de boleta de ventas existentes (simple: contar ventas + 1)
      let receiptNumber = '';
      try {
        const ventasSnapshot = await obtenerVentas(tenant.id);
        receiptNumber = (ventasSnapshot.length + 1).toString().padStart(6, '0');
      } catch {
        receiptNumber = (Math.floor(Math.random() * 900000) + 100000).toString();
      }
      // Asegurar que cada producto vendido tenga los campos isExonerated e igvIncluded
      const venta = {
        id: receiptNumber,
        items: cartItems.map((item: { product: Product; quantity: number }) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.salePrice ?? 0,
          total: (item.product.salePrice ?? 0) * item.quantity
        })),

        total: state.total,
        subtotal: state.subtotal ?? 0,
        discount: state.discount ?? 0,
        tax: state.tax ?? 0,
        paymentMethod,
        customerId: '', // Por ahora vacío
        customerName: '', // Futuro: seleccionar cliente
        createdAt: new Date(),
        cashierId: user?.id || '',
        cashierName: user?.user_metadata?.full_name || user?.email || '',
        receiptNumber,
      };

      await crearVenta(venta, tenant.id);
      setSuccessMsg(`¡Venta procesada exitosamente con ${paymentMethod === 'cash' ? 'efectivo' : paymentMethod === 'card' ? 'tarjeta' : paymentMethod === 'yape' ? 'Yape' : paymentMethod === 'plin' ? 'Plin' : paymentMethod}!`);
      setShowSuccess(true);
      setVentaTicket({
        receiptNumber: venta.receiptNumber,
        cashierName: venta.cashierName,
        customerName: venta.customerName,
        paymentMethod: venta.paymentMethod,
        date: new Date().toLocaleString('es-PE'),
        items: venta.items,
        subtotal: venta.subtotal,
        discount: venta.discount,
        igv: venta.tax,
        total: venta.total,
      });
      setShowTicket(true);
      setTimeout(() => setShowSuccess(false), 3000);
      clearCart();
      clearCart();
    } catch (error: any) {
      console.error('Error detallado al procesar la venta:', error);
      let msg = 'Error al procesar la venta';

      if (error?.message) {
        msg += `: ${error.message}`;
      } else if (typeof error === 'string') {
        msg += `: ${error}`;
      } else {
        msg += ': Error desconocido en la base de datos o red.';
      }

      if (error?.code) {
        msg += ` (Código: ${error.code})`;
      }

      setSuccessMsg(msg);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Punto de Venta</h1>
        <ProductSearch onSearch={handleSearch} onBarcodeSearch={handleBarcodeSearch} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Products Section */}
        <div className="xl:col-span-3 space-y-6">

          {/* Modern Category/Subcategory Filter Bar */}
          <div className="flex flex-col gap-4 py-2">

            {/* Categories Level - Flexible Wrapping Grid */}
            <div className="flex flex-wrap items-center gap-3 pb-4 px-1">
              {/* All / Back Button */}
              {selectedCategory !== null ? (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 shrink-0"
                >
                  <span className="text-lg">←</span>
                  <span className="text-sm">Categorías</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all border-2 shrink-0 ${selectedCategory === null
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:border-emerald-200'
                    }`}
                >
                  <CategoryBadge category="all" />
                </button>
              )}

              {selectedCategory === null && categoryList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory(null);
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all border-2 shrink-0 ${selectedCategory === cat
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:border-emerald-200'
                    }`}
                >
                  <CategoryBadge category={cat} />
                </button>
              ))}

              {/* Subcategories (Visible only when a category is selected) */}
              {selectedCategory !== null && (categoryData[selectedCategory as CategoryKey]?.subcategories || []).map((subcat) => {
                const iconMap: Record<string, string> = {
                  'menestras': '🫘', 'pastas': '🍝', 'arroz': '🍚', 'salsas': '🥫', 'aceites': '🛢️',
                  'condimentos': '🧂', 'conservas': '🥫', 'otro': '📦', 'huevos': '🥚', 'leche': '🥛',
                  'yogur': '🥣', 'queso': '🧀', 'mantequilla': '🧈', 'otros': '📦', 'pollo': '🍗',
                  'res': '🥩', 'salchichas': '🌭', 'jamón': '🍖', 'frutas': '🍎', 'verduras': '🥦',
                  'tubérculos': '🥔', 'gaseosas': '🥤', 'jugos': '🧃', 'aguas': '💧', 'energéticas': '⚡',
                  'chocolates': '🍫', 'papas': '🍟', 'galletas': '🍪', 'caramelos': '🍬',
                  'cremoladas': '🍧', 'paletas': '🍡', 'conos': '🍦', 'lavavajillas': '🧽',
                  'detergentes': '🧴', 'multiusos': '🧹', 'jabones': '🧼', 'shampoo': '🧴',
                  'desodorantes': '🧴', 'papel higiénico': '🧻', 'alimento perro': '🐶',
                  'alimento gato': '🐱', 'accesorios': '🎾', 'vasos': '🥤', 'platos': '🍽️',
                  'cubiertos': '🍴', 'bolsas': '🛍️', 'pan': '🥖', 'pan especial': '🥯',
                };
                const emoji = iconMap[subcat.trim().toLowerCase()] || '🍽️';
                return (
                  <button
                    key={subcat}
                    onClick={() => setSelectedSubcategory(subcat)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all border-2 shrink-0 ${selectedSubcategory === subcat
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg'
                      : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:border-emerald-200'
                      }`}
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                    <span className="text-sm capitalize">{subcat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              <ProductGrid products={paginatedProducts} onAddToCart={handleAddToCart} />
              {/* Paginación */}
              <div className="mt-4 flex justify-center space-x-2">
                {Array.from({ length: Math.ceil(filteredProducts.length / productsPerPage) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${currentPage === index + 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart Section */}
        <div className="xl:col-span-1">
          <Cart onCheckout={handleCheckout} />
        </div>
      </div>
      {showSuccess && (
        <SuccessToast message={successMsg} onClose={() => setShowSuccess(false)} />
      )}
      {/* Modal de ticket/boleta tras venta exitosa */}
      {showTicket && ventaTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-auto border border-gray-200 shadow-2xl flex flex-col items-center">
            <TicketVenta ref={ticketRef} venta={ventaTicket} settings={storeSettings} />
            <div className="flex justify-center gap-4 mt-8 w-full">
              <button
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 font-semibold transition-all duration-150"
                title="Imprimir ticket (Ctrl+P)"
                onClick={async () => {
                  try {
                    await handlePrint?.();
                  } catch {
                    alert('No se pudo abrir el diálogo de impresión. Verifica permisos del navegador o prueba otro navegador.');
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7m-6 13v-4m0 4H6a2 2 0 01-2-2v-5a2 2 0 012-2h12a2 2 0 012 2v5a2 2 0 01-2 2h-6z" /></svg>
                Imprimir ticket
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 font-semibold transition-all duration-150 border border-gray-300"
                title="Cerrar ticket"
                onClick={() => setShowTicket(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ingresar Peso (kg) */}
      {showPesoModal && productForPeso && (
        <ModalPeso
          open={showPesoModal}
          stockDisponible={productForPeso.stock || 0}
          onClose={() => {
            setShowPesoModal(false);
            setProductForPeso(null);
          }}
          onConfirm={(peso) => {
            handleAddToCart(productForPeso, peso);
            setShowPesoModal(false);
            setProductForPeso(null);
            showToast(`Añadido: ${peso}kg de ${productForPeso.name}`, 'success');
          }}
        />
      )}
    </div>
  );
};
export default POS;