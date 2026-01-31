import React from 'react';
import { Product } from '../../types/inventory';
import { categoryData } from '@/lib/constants/categoryData';
import { useToast } from '../../contexts/ToastContext';

interface ProductFormProps {
  form: Product;
  setForm: (form: Product) => void;
  onSubmit: (form: Product) => Promise<boolean>;
  saving: boolean;
  editProduct: Product | null;
  onCancel: () => void;
  proveedores: string[];
}

const inputClass =
  'block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm';

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  setForm,
  onSubmit,
  saving,
  editProduct,
  onCancel,
}) => {
  const { showToast } = useToast();

  const hasSubcategories = !!(form.category && categoryData[form.category as keyof typeof categoryData]?.subcategories?.length);
  const subcategoryRequired = !!hasSubcategories;
  const missingSubcategory = subcategoryRequired && (!form.subcategory || form.subcategory.trim() === '');

  // Categorías exoneradas de IGV
  const exemptCategories = [
    'frutas', 'verduras', 'frutas y verduras', 'legumbres', 'tubérculos', 'leche cruda', 'pescados', 'mariscos', 'huevos', 'carne de ave', 'huevos y lácteos'
  ];

  // Validación centralizada
  const isValid = (): boolean => {
    const requiredFields: (keyof Product)[] = ['name', 'category', 'salePrice', 'costPrice'];
    return requiredFields.every(field => {
      const value = form[field];
      if (field === 'salePrice' || field === 'costPrice') {
        return typeof value === 'number' && value > 0;
      }
      return typeof value === 'string' && value.trim() !== '';
    }) && !missingSubcategory;
  };

  // Submit controlado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) {
      showToast('Por favor completa todos los campos requeridos.', 'error');
      return;
    }
    try {
      const ok = await onSubmit(form);
      if (ok) onCancel();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      showToast('Error al guardar el producto. Por favor intenta de nuevo.', 'error');
    }
  };

  // Inicializa isExemptIGV/isExonerated automáticamente según la categoría
  React.useEffect(() => {
    if (form.category) {
      const isExempt = exemptCategories.some(cat => form.category.toLowerCase().includes(cat));
      if (form.isExemptIGV !== isExempt || form.isExonerated !== isExempt) {
        setForm({ ...form, isExemptIGV: isExempt, isExonerated: isExempt });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  // Manejar cambio en el tipo de producto (unidad/kg)
  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const isKg = e.target.value === 'kg';
    setForm({
      ...form,
      unit: isKg ? 'kg' : 'unidad',
      unitType: isKg ? 'kg' : 'unidad',
      ventaPorPeso: isKg,
      // Resetear valores de stock al cambiar el tipo
      stock: 0,
      minStock: form.minStock || 0
    });
  };

  // Manejar cambio en el stock
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = form.ventaPorPeso
      ? parseFloat(value) || 0
      : Math.max(0, Math.floor(parseFloat(value)) || 0);

    setForm({ ...form, stock: numValue });
  };

  // Manejar cambio en el stock mínimo
  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = form.ventaPorPeso
      ? parseFloat(value) || 0
      : Math.max(0, Math.floor(parseFloat(value)) || 0);

    setForm({ ...form, minStock: numValue });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Secciones del formulario existentes... */}

        {/* Sección de tipo de producto */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">Tipo de producto</label>
          <select
            className={inputClass}
            value={form.ventaPorPeso ? 'kg' : 'unidad'}
            onChange={handleUnitTypeChange}
            required
            disabled={!!editProduct}
          >
            <option value="unidad">Venta por unidad</option>
            <option value="kg">Venta por peso (kg)</option>
          </select>
        </div>

        {/* Stock inicial */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">
            Stock inicial {form.ventaPorPeso ? '(kg)' : ''}
          </label>
          <input
            type="number"
            step={form.ventaPorPeso ? '0.001' : '1'}
            min="0"
            placeholder={form.ventaPorPeso ? 'Ej: 2.500' : 'Ej: 10'}
            className={inputClass}
            value={form.stock ?? ''}
            onChange={handleStockChange}
            required
            disabled={!!editProduct}
          />
          {form.ventaPorPeso ? (
            <span className="text-xs text-gray-500 mt-1">
              Ingresa el stock en kilogramos (ej: 2.500 para 2.5 kg).
            </span>
          ) : (
            <span className="text-xs text-gray-500 mt-1">
              Ingresa el stock en unidades.
            </span>
          )}
          {editProduct && (
            <span className="text-xs text-gray-500 mt-1">
              El stock solo se modifica mediante &quot;Agregar ingreso&quot; o &quot;Ajustar stock&quot;.
            </span>
          )}
        </div>

        {/* Stock mínimo para alerta */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">
            Stock mínimo para alerta {form.ventaPorPeso ? '(kg)' : ''}
          </label>
          <input
            type="number"
            step={form.ventaPorPeso ? '0.001' : '1'}
            min="0"
            placeholder={form.ventaPorPeso ? 'Ej: 1.000' : 'Ej: 2'}
            className={inputClass}
            value={form.minStock ?? ''}
            onChange={handleMinStockChange}
            required
          />
          <span className="text-xs text-gray-500 mt-1">
            Cuando el stock sea menor o igual a este valor, el sistema mostrará alerta de bajo stock.
          </span>
        </div>

        {/* Resto del formulario... */}

      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
