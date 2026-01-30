/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { crearProducto, agregarIngresoProducto, obtenerProductosConStockYAverage } from '../../lib/supabaseInventory';
import { obtenerProveedores } from '../../lib/supabaseSuppliers';
import { getStoreSettings } from '../../lib/supabaseSettings';
import { actualizarProducto, eliminarProducto, archivarProducto } from '../../lib/supabaseProducts';
import { Plus, TrendingUp, Wallet, Activity, AlertTriangle, Archive } from 'lucide-react';
import { Product } from '../../types/inventory';
import { useToast } from '../../contexts/ToastContext';
import InventoryTable from './InventoryTable';
import InventoryHistoryModal from './InventoryHistoryModal';
import PasswordModal from './PasswordModal';
import { IngresoData } from './NewIngresoModal';
import NewIngresoModal from './NewIngresoModal';
import QuickPriceModal from './QuickPriceModal';
import ProductForm from './ProductForm';
import InventoryFilters from './InventoryFilters';
import Pagination from './Pagination';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Sparkles } from 'lucide-react'; // For the modal icon if needed
import Link from 'next/link';

// Definir el tipo Supplier localmente ya que no se encuentra en el módulo
interface Supplier {
  id: string;
  name: string;
  // Agregar más campos según sea necesario
}

// Definir el tipo de filtros que coincide con InventoryFilters
type FilterValues = {
  name: string;
  code: string;
  supplier: string;
  category: string;
  lowStock?: boolean; // Opcional para mantener compatibilidad
};

const Inventory: React.FC = () => {
  // Contexto y usuario
  const { showToast } = useToast();
  const { tenant } = useTenant();
  const companyId = tenant?.id || '';

  // Estados principales de inventario
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [productos, setProductos] = useState<Product[]>([]);
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [productToIngreso, setProductToIngreso] = useState<Product | null>(null);
  const [showNewIngresoModal, setShowNewIngresoModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [adjustStock_newStock, setAdjustStock_newStock] = useState<number>(0);
  const [adjustStock_motivo, setAdjustStock_motivo] = useState('');
  const [adjustStock_loading, setAdjustStock_loading] = useState(false);
  const [adjustStock_error, setAdjustStock_error] = useState<string | null>(null);
  const [loadingIngreso, setLoadingIngreso] = useState(false);
  const [showQuickPriceModal, setShowQuickPriceModal] = useState(false);
  const [productToQuickPrice, setProductToQuickPrice] = useState<Product | null>(null);
  const [quickPriceLoading, setQuickPriceLoading] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Estados para validación de PIN
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { checkFeatureAccess, getFeatureLimit } = useSubscription();
  const [pendingAction, setPendingAction] = useState<{ type: 'adjustPrice' | 'delete' | 'adjustStock' | 'editForm', data: any } | null>(null);

  // Estado para filtros y paginación
  const [filters, setFilters] = useState<FilterValues>({
    name: '',
    code: '',
    category: '',
    supplier: '',
    lowStock: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarProductos = useCallback(async (): Promise<void> => {
    if (!tenant?.id) return;
    setCargandoProductos(true);
    try {
      const [productosData, proveedoresData, settingsData] = await Promise.all([
        obtenerProductosConStockYAverage(tenant.id, showArchived),
        obtenerProveedores(tenant.id),
        getStoreSettings(tenant.id)
      ]);
      setProductos(productosData);
      setProveedores(proveedoresData);
      setStoreSettings(settingsData);
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Error al cargar los productos', 'error');
    } finally {
      setCargandoProductos(false);
    }
  }, [showToast, tenant?.id, showArchived]);

  // Cargar productos y proveedores al montar el componente
  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Manejar envío del formulario
  const handleSubmit = async (formData: Omit<Product, 'id' | 'stock' | 'averageCost' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!formData.name || !formData.category) {
      showToast('Por favor completa los campos obligatorios', 'error');
      return false;
    }

    setSaving(true);
    try {
      if (!tenant?.id) {
        showToast('Error: No se pudo identificar la bodega. Por favor recarga la página.', 'error');
        return false;
      }

      if (editProduct?.id) {
        await actualizarProducto(editProduct.id, formData as Product, tenant.id);
        showToast('Producto actualizado correctamente', 'success');
      } else {
        // Create a new product with the initial stock entry
        await crearProducto(
          formData,
          {
            quantity: Number(formData.stock) || 0,
            costPrice: Number(formData.costPrice) || 0,
            date: new Date().toISOString()
          },
          tenant.id
        );
        showToast('Producto creado correctamente', 'success');
      }

      setShowAddModal(false);
      setEditProduct(null);
      await cargarProductos();
      return true;
    } catch (err) {
      console.error('Error al guardar el producto (detalles):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      const errorMessage = (err as any)?.message || 'Error desconocido al guardar';
      showToast(`Error al guardar: ${errorMessage}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Filtrar productos
  const filteredProducts = productos.filter((product: Product) => {
    const matchesName = !filters?.name ||
      product.name.toLowerCase().includes(filters.name.toLowerCase());

    const matchesCode = !filters.code ||
      (product.code && product.code.toLowerCase().includes(filters.code.toLowerCase()));

    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesSupplier = !filters.supplier ||
      (product.supplier && product.supplier.toLowerCase().includes(filters.supplier.toLowerCase()));
    const matchesLowStock = !filters.lowStock || (product.stock || 0) <= (product.minStock || 0);

    return matchesName && matchesCode && matchesCategory && matchesSupplier && matchesLowStock;
  });

  // Cálculos de Inteligencia de Negocio
  const insights = productos.reduce((acc, p) => {
    const stock = Number(p.stock) || 0;
    const cost = Number(p.averageCost) || 0;
    const price = Number(p.salePrice) || 0;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

    acc.totalValue += stock * cost;
    acc.projectedProfit += stock * (price - cost);
    if (stock <= (p.minStock || 0)) acc.lowStockCount++;
    if (margin < 10 && price > 0) acc.lowMarginCount++;
    if (stock <= 0) acc.outOfStockCount++;

    return acc;
  }, { totalValue: 0, projectedProfit: 0, lowStockCount: 0, lowMarginCount: 0, outOfStockCount: 0 });

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Manejador de cambio de página
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Manejar filtrado
  const handleFilter = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Helper para verificar PIN antes de acciones críticas
  const verifyAdminAction = (type: any, data: any) => {
    if (storeSettings?.admin_password) {
      setPendingAction({ type, data });
      setShowSecurityModal(true);
    } else {
      // Si no hay PIN configurado, ejecutar acción directamente
      executeProtectedAction(type, data);
    }
  };

  const executeProtectedAction = (type: string, data: any) => {
    switch (type) {
      case 'editForm':
        setForm({ ...data });
        setEditProduct(data);
        setSuccess(false);
        setShowAddModal(true);
        break;
      case 'delete':
        setProductToDelete(data);
        setShowDeleteModal(true);
        break;
      case 'adjustStock':
        setProductToAdjust(data);
        setAdjustStock_newStock(data.stock || 0);
        setShowAdjustStockModal(true);
        break;
      case 'adjustPrice':
        setProductToQuickPrice(data);
        setShowQuickPriceModal(true);
        break;
    }
  };

  // Renderizado
  return (
    <div className="p-6 space-y-6 w-full max-w-full">
      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-2">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona tus productos y analiza tu rentabilidad</p>
        </div>
        <button
          onClick={() => {
            if (!checkFeatureAccess('inventory_limit')) {
              // Fallback check if simple boolean check passes but numeric doesn't
              // Actually checkFeatureAccess returns true for numeric limits effectively
            }

            const limit = getFeatureLimit('inventory_limit');
            if (productos.length >= limit) {
              setShowUpgradeModal(true);
              return;
            }

            setForm({ minStock: 5 });
            setEditProduct(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all font-bold active:scale-95"
        >
          <Plus size={20} /> Agregar producto
        </button>
      </div>

      {/* Insights Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 group hover:border-emerald-500/30 transition-colors">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">Valor a Costo</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">S/. {insights.totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 group hover:border-blue-500/30 transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">Ganancia Proyectada</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">S/. {insights.projectedProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 group hover:border-amber-500/30 transition-colors">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">Baja Rentabilidad</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{insights.lowMarginCount} Prod.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 group hover:border-red-500/30 transition-colors">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">Sin Stock</p>
            <p className="text-xl font-black text-red-600 dark:text-red-400">{insights.outOfStockCount} Agotados</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <InventoryFilters
          filters={filters}
          onFiltersChange={handleFilter}
          onBarcodeInputChange={(barcode) => setFilters({ ...filters, code: barcode })}
          onBarcodeSearch={() => { }}
          barcodeInput={filters.code}
          proveedores={proveedores.map(p => p.name)}
        />

      </div>

      <div className="flex justify-end mb-4 px-2">
        <label className="relative inline-flex items-center cursor-pointer group">
          <input type="checkbox" className="sr-only peer" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 transition-colors">Ver productos archivados</span>
        </label>
      </div>

      {/* Tabla de inventario */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden mb-6">
        <InventoryTable
          products={paginatedProducts}
          loading={cargandoProductos}
          onEdit={(product) => verifyAdminAction('editForm', product)}
          onDelete={(product) => verifyAdminAction('delete', product)}
          onAdjustStock={(product) => verifyAdminAction('adjustStock', product)}
          onShowHistory={(product) => {
            setHistoryProduct(product);
            setShowHistoryModal(true);
          }}
          onNewIngreso={(product) => {
            setProductToIngreso(product);
            setShowNewIngresoModal(true);
          }}
          onQuickPrice={(product) => verifyAdminAction('adjustPrice', product)}
        />

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredProducts.length}
        />
      </div>

      {/* Modales */}

      {/* Security Gate: Validación de PIN de Administrador */}
      {showSecurityModal && (
        <PasswordModal
          isOpen={showSecurityModal}
          title="Verificación de Administrador"
          message="Ingresa la clave de administrador para realizar esta acción crítica."
          actionLabel="Verificar"
          correctPassword={storeSettings?.admin_password}
          onClose={() => {
            setShowSecurityModal(false);
            setPendingAction(null);
          }}
          onConfirm={() => {
            setShowSecurityModal(false);
            if (pendingAction) {
              executeProtectedAction(pendingAction.type, pendingAction.data);
              setPendingAction(null);
            }
          }}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            <ProductForm
              form={form as Product}
              setForm={setForm}
              onSubmit={handleSubmit}
              saving={saving}
              editProduct={editProduct}
              onCancel={() => {
                setShowAddModal(false);
                setEditProduct(null);
                setForm({});
              }}
              proveedores={proveedores.map(p => p.name)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación (Ya verificado por PIN) */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Confirmar Eliminación</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              ¿Estás seguro de eliminar el producto <span className="font-bold text-gray-900 dark:text-white">{productToDelete.name}</span>? Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    if (productToDelete.id && tenant?.id) {
                      await eliminarProducto(productToDelete.id, tenant.id);
                      showToast('Producto eliminado correctamente', 'success');
                      await cargarProductos();
                    }
                  } catch (err) {
                    console.error('Error deleting product:', err);
                    const errorMessage = (err as any)?.message || 'Error desconocido al eliminar';

                    if (errorMessage.includes('ventas registradas')) {
                      setShowDeleteModal(false);
                      setProductToArchive(productToDelete);
                      setShowArchiveModal(true);
                      return;
                    }

                    showToast(`Error al eliminar: ${errorMessage}`, 'error');
                  } finally {
                    if (!showArchiveModal) {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg shadow-red-200 dark:shadow-none"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && historyProduct && (
        <InventoryHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          product={historyProduct}
          companyId={companyId}
        />
      )}

      {showNewIngresoModal && productToIngreso && (
        <NewIngresoModal
          isOpen={showNewIngresoModal}
          onClose={() => setShowNewIngresoModal(false)}
          product={productToIngreso}
          onSave={async (ingresoData: IngresoData) => {
            const handleNewIngreso = async (ingresoData: IngresoData): Promise<void> => {
              if (!productToIngreso?.id) return;

              setLoadingIngreso(true);
              try {
                await agregarIngresoProducto(
                  productToIngreso.id,
                  tenant!.id,
                  {
                    quantity: ingresoData.quantity,
                    costPrice: ingresoData.unitCost,
                    date: ingresoData.date,
                    type: 'ingreso',
                    motivo: 'Ingreso manual de inventario'
                  }
                );
                setSuccess(true);
                setShowNewIngresoModal(false);
                await cargarProductos();
              } catch (err) {
                console.error('Error al registrar ingreso:', err);
                showToast('Error al registrar el ingreso', 'error');
              } finally {
                setLoadingIngreso(false);
              }
            };
            handleNewIngreso(ingresoData);
          }}
          loading={loadingIngreso}
        />
      )}

      {showAdjustStockModal && productToAdjust && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Ajustar Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock actual: <span className="font-bold">{productToAdjust.stock} {productToAdjust.unit}</span>
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  value={adjustStock_newStock}
                  onChange={(e) => setAdjustStock_newStock(Number(e.target.value))}
                  min={0}
                  step={productToAdjust.unitType === 'kg' ? '0.001' : '1'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo del ajuste
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  value={adjustStock_motivo}
                  onChange={(e) => setAdjustStock_motivo(e.target.value)}
                  placeholder="Ej: Ajuste de inventario"
                  required
                />
              </div>
              {adjustStock_error && (
                <div className="text-red-600 text-sm">{adjustStock_error}</div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowAdjustStockModal(false);
                    setAdjustStock_error(null);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  disabled={adjustStock_loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!adjustStock_motivo.trim()) {
                      setAdjustStock_error('Por favor ingresa un motivo');
                      return;
                    }

                    setAdjustStock_loading(true);
                    setAdjustStock_error(null);

                    try {
                      if (productToAdjust.id) {
                        const difference = adjustStock_newStock - (productToAdjust.stock || 0);
                        const movementType = difference > 0 ? 'ingreso' : 'egreso';

                        await agregarIngresoProducto(
                          productToAdjust.id,
                          tenant!.id,
                          {
                            quantity: Math.abs(difference),
                            costPrice: productToAdjust.averageCost || 0,
                            date: new Date().toISOString(),
                            motivo: adjustStock_motivo,
                            type: movementType
                          }
                        );

                        showToast('Stock actualizado correctamente', 'success');
                        await cargarProductos();
                        setShowAdjustStockModal(false);
                      }
                    } catch (error) {
                      console.error('Error updating stock:', error);
                      setAdjustStock_error('Error al actualizar el stock');
                    } finally {
                      setAdjustStock_loading(false);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400"
                  disabled={adjustStock_loading}
                >
                  {adjustStock_loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md border border-emerald-500/30 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Sparkles size={32} />
              </div>

              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Límite Alcanzado</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Has alcanzado el límite de <span className="font-bold text-gray-900 dark:text-white">100 productos</span> del Plan Gratuito. Para agregar más productos ilimitados, actualiza a PRO.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Link
                  href="/settings?tab=subscription"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  Ver Planes y Precios
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickPriceModal && productToQuickPrice && (
        <QuickPriceModal
          isOpen={showQuickPriceModal}
          onClose={() => setShowQuickPriceModal(false)}
          product={productToQuickPrice}
          loading={quickPriceLoading}
          onSave={async (newPrice) => {
            if (!productToQuickPrice.id || !tenant?.id) return;
            setQuickPriceLoading(true);
            try {
              await actualizarProducto(productToQuickPrice.id, { ...productToQuickPrice, salePrice: newPrice }, tenant.id);
              showToast('Precio actualizado correctamente', 'success');
              setShowQuickPriceModal(false);
              await cargarProductos();
            } catch (err) {
              console.error('Error al actualizar precio:', err);
              showToast('Error al actualizar el precio', 'error');
            } finally {
              setQuickPriceLoading(false);
            }
          }}
        />
      )}

      {showArchiveModal && productToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Producto con Ventas</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              El producto <span className="font-bold text-gray-900 dark:text-white">{productToArchive.name}</span> tiene historial de ventas y no puede eliminarse.
              <br /><br />
              ¿Deseas <b>archivarlo</b>? Desaparecerá del POS pero mantendrá sus reportes históricos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setProductToArchive(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    if (productToArchive.id && tenant?.id) {
                      await archivarProducto(productToArchive.id, tenant.id);
                      showToast('Producto archivado correctamente', 'success');
                      await cargarProductos();
                    }
                  } catch (err) {
                    console.error('Error archiving product:', err);
                    showToast('Error al archivar el producto', 'error');
                  } finally {
                    setShowArchiveModal(false);
                    setProductToArchive(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-bold shadow-lg shadow-amber-200 dark:shadow-none"
              >
                Archivar
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && productToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Producto con Ventas</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              El producto <span className="font-bold text-gray-900 dark:text-white">{productToArchive.name}</span> tiene historial de ventas y no puede eliminarse.
              <br /><br />
              ¿Deseas <b>archivarlo</b>? Desaparecerá del POS pero mantendrá sus reportes históricos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setProductToArchive(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    if (productToArchive.id && tenant?.id) {
                      await archivarProducto(productToArchive.id, tenant.id);
                      showToast('Producto archivado correctamente', 'success');
                      await cargarProductos();
                    }
                  } catch (err) {
                    console.error('Error archiving product:', err);
                    showToast('Error al archivar el producto', 'error');
                  } finally {
                    setShowArchiveModal(false);
                    setProductToArchive(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-bold shadow-lg shadow-amber-200 dark:shadow-none"
              >
                Archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
