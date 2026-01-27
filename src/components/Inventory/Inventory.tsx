'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { crearProducto, agregarIngresoProducto, obtenerProductosConStockYAverage } from '../../lib/supabaseInventory';
import { obtenerProveedores } from '../../lib/supabaseSuppliers';
import { actualizarProducto, eliminarProducto, obtenerProductos } from '../../lib/supabaseProducts';
import { Plus } from 'lucide-react';
import { Product } from '../../types/inventory';
import { useToast } from '../../contexts/ToastContext';
import InventoryTable from './InventoryTable';
import InventoryHistoryModal from './InventoryHistoryModal';
import PasswordModal from './PasswordModal';
import { IngresoData } from './NewIngresoModal';
import NewIngresoModal from './NewIngresoModal';
import ProductForm from './ProductForm';
import InventoryFilters from './InventoryFilters';
import Pagination from './Pagination';

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
  const { user } = useAuth();
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
      const [productosData, proveedoresData] = await Promise.all([
        obtenerProductosConStockYAverage(tenant.id),
        obtenerProveedores(tenant.id)
      ]);
      setProductos(productosData);
      setProveedores(proveedoresData);
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Error al cargar los productos', 'error');
    } finally {
      setCargandoProductos(false);
    }
  }, [showToast]);

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
      if (editProduct?.id && tenant?.id) {
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
          tenant!.id
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
    const matchesSupplier = !filters.supplier || product.supplier === filters.supplier;
    const matchesLowStock = !filters.lowStock || (product.stock || 0) <= (product.minStock || 0);

    return matchesName && matchesCode && matchesCategory && matchesSupplier && matchesLowStock;
  });

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

  // Renderizado
  return (
    <div className="p-6 space-y-6 w-full max-w-full">
      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-2">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario</h1>
        <button
          onClick={() => {
            setForm({ minStock: 5 });
            setEditProduct(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} /> Agregar producto
        </button>
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

      {/* Tabla de inventario */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden mb-6">
        <InventoryTable
          products={paginatedProducts}
          loading={cargandoProductos}
          onEdit={(product) => {
            setForm({ ...product });
            setEditProduct(product);
            setSuccess(false);
            setShowAddModal(true);
          }}
          onDelete={(product) => {
            setProductToDelete(product);
            setShowDeleteModal(true);
          }}
          onAdjustStock={(product) => {
            setProductToAdjust(product);
            setAdjustStock_newStock(product.stock || 0);
            setShowAdjustStockModal(true);
          }}
          onShowHistory={(product) => {
            setHistoryProduct(product);
            setShowHistoryModal(true);
          }}
          onNewIngreso={(product) => {
            setProductToIngreso(product);
            setShowNewIngresoModal(true);
          }}
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && productToDelete && (
        <PasswordModal
          isOpen={showDeleteModal}
          actionLabel="Eliminar"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            try {
              if (productToDelete.id && tenant?.id) {
                await eliminarProducto(productToDelete.id, tenant.id);
                showToast('Producto eliminado correctamente', 'success');
                await cargarProductos();
              }
            } catch (err) {
              console.error('Error deleting product:', err);
              showToast('Error al eliminar el producto', 'error');
            } finally {
              setShowDeleteModal(false);
              setProductToDelete(null);
            }
          }}
          title="Confirmar eliminación"
          message={`¿Estás seguro de eliminar el producto ${productToDelete.name}?`}
        />
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
                        // Calculate the difference in stock
                        const difference = adjustStock_newStock - (productToAdjust.stock || 0);
                        const movementType = difference > 0 ? 'ingreso' : 'salida';

                        // Add the stock movement
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
    </div>
  );
};

export default Inventory;
