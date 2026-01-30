import React from 'react';
import Image from 'next/image';
import { Barcode } from 'lucide-react';
import { Product } from '../../types/inventory';
import { categoryData } from '@/lib/constants/categoryData';
import SubcategorySelect from './SubcategorySelect';
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
  'block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white';

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  setForm,
  onSubmit,
  saving,
  editProduct,
  onCancel,
  proveedores = [],
}) => {
  const { showToast } = useToast();
  // Importa categoryData

  const hasSubcategories = !!(form.category && categoryData[form.category as keyof typeof categoryData]?.subcategories?.length);
  const subcategoryRequired = !!hasSubcategories;
  const missingSubcategory = subcategoryRequired && (!form.subcategory || form.subcategory.trim() === '');

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
      showToast('No puedes dejar el campo "Nombre" vacío.', 'error');
      return;
    }
    try {
      const ok = await onSubmit(form);
      if (ok) onCancel(); // Solo cerrar si guardado fue exitoso
    } catch {
      // Error ya manejado por onSubmit
    }
  };

  // Lógica Avanzada de Exoneración de IGV (Perú)
  const checkIGVExemption = (category: string, subcategory: string = ''): boolean => {
    const cat = category.toLowerCase().trim();
    const sub = subcategory.toLowerCase().trim();

    // 1. Categorías enteramente exoneradas
    if (
      cat.includes('frutas y verduras') ||
      cat === 'frutas' ||
      cat === 'verduras' ||
      cat === 'tubérculos'
    ) return true;

    // 2. Lógica por Subcategoría
    // Huevos y Lácteos: Huevos/Leche Fresca -> Exonerado. Leche ind./Yogur/Queso -> Gravado
    if (cat.includes('huevos') || cat.includes('lácteos')) {
      if (sub.includes('huevo') || sub.includes('fresca') || sub.includes('cruda')) return true;
      return false;
    }

    // Carnes: Pollo, Res, Cerdo, Pescado (Frescos) -> Exonerado. Embutidos -> Gravado
    if (cat.includes('carnes') || cat.includes('embutidos')) {
      // Exonerados: Carnes frescas
      const exemptMeats = ['pollo', 'res', 'cerdo', 'pavo', 'pescado', 'marisco', 'cuy', 'pato', 'carne'];
      const isMeat = exemptMeats.some(m => sub.includes(m));
      // Gravados: Procesados/Embutidos
      const isProcessed = ['jamón', 'salchicha', 'chorizo', 'tocino', 'hamburguesa', 'nugget'].some(p => sub.includes(p));

      return isMeat && !isProcessed;
    }

    // Abarrotes: Menestras/Legumbres (Secas), Arroz, Azúcar -> Exonerado
    if (cat.includes('abarrotes')) {
      const exemptBasics = ['menestra', 'lenteja', 'frijol', 'allar', 'garbanzo', 'arroz', 'fideo']; // Fideos usualmente exonerados en canasta básica temporal
      return exemptBasics.some(b => sub.includes(b));
    }

    return false;
  };

  // State for custom category input (allow typing new categories)
  const [forceExempt, setForceExempt] = React.useState(false);
  const [customMode, setCustomMode] = React.useState(() => {
    return !!(form.category && !categoryData[form.category as keyof typeof categoryData]);
  });

  // Effect: Recalcular Exoneración cuando cambia Categoría O Subcategoría
  React.useEffect(() => {
    if (form.category) {
      const isExempt = checkIGVExemption(form.category, form.subcategory);
      setForceExempt(isExempt);

      // Solo sobrescribir si el usuario no lo ha cambiado manualmente (o forzar siempre si es política estricta)
      // Para UX: Si el sistema detecta exonerado, lo marca. Si no, lo deja como estaba o marca false.
      if (isExempt) {
        setForm({ ...form, isExemptIGV: true, isExonerated: true });
      } else {
        // Si deja de ser categoría exonerada, desmarcamos (opcional, pero ayuda a corregir)
        // Ojo: Si el usuario marcó manualmente algo fuera de la lógica, esto lo borraria. 
        // Mejor solo forzar TRUE. Para FALSE dejar libertad o solo sugerir.
        // En este caso, para limpiar "Huevos" -> "Leche", debemos poder desmarcar.
        setForm({ ...form, isExemptIGV: false, isExonerated: false });
      }
    } else {
      setForceExempt(false);
    }
    // eslint-disable-next-line
  }, [form.category, form.subcategory]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exonerado de IGV */}
        <div className="flex flex-col col-span-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              checked={!!form.isExemptIGV || !!form.isExonerated}
              onChange={e => setForm({ ...form, isExemptIGV: e.target.checked, isExonerated: e.target.checked })}
              disabled={forceExempt}
            />
            Exonerado de IGV (canasta básica)
            {forceExempt && (
              <span className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded ml-2">Automático por categoría</span>
            )}
          </label>
        </div>
        {/* Precio incluye IGV */}
        <div className="flex flex-col col-span-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              checked={form.igvIncluded !== false}
              onChange={e => setForm({ ...form, igvIncluded: e.target.checked })}
            />
            Precio incluye IGV (recomendado)
          </label>
        </div>
        {/* Imagen del producto */}
        <div className="flex flex-col col-span-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Imagen</label>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              <Image
                src={form.imageUrl}
                alt="Imagen del producto"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                width={96}
                height={96}
              />
            )}
            <input
              type="file"
              accept="image/*"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Subir a Cloudinary
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'BODEGAPP');

                try {
                  const res = await fetch('https://api.cloudinary.com/v1_1/dyhgwvz8b/image/upload', {
                    method: 'POST',
                    body: formData
                  });
                  const data = await res.json();
                  if (data.secure_url) {
                    setForm({ ...form, imageUrl: data.secure_url });
                  }
                } catch (error) {
                  console.error('Error uploading image:', error);
                }
              }}
            />
            <button
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Subir imagen
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input
            type="text"
            placeholder="Nombre del producto"
            className={inputClass}
            value={form.name || ''}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Código / Código de Barras
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Escanea o escribe el código"
              className={`${inputClass} !pl-10`}
              value={form.code || ''}
              onChange={e => setForm({ ...form, code: e.target.value })}
              required
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Barcode size={18} />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
          <select
            className={inputClass}
            value={customMode ? '__NEW__' : (form.category || '')}
            onChange={e => {
              const val = e.target.value;
              if (val === '__NEW__') {
                setCustomMode(true);
                setForm({ ...form, category: '', subcategory: '' });
              } else {
                setCustomMode(false);
                setForm({ ...form, category: val, subcategory: '' });
              }
            }}
            required
          >
            <option value="">Selecciona una categoría</option>
            {Object.keys(categoryData)
              .filter(cat => cat !== 'all')
              .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            <option value="__NEW__">➕ Crear nueva categoría...</option>
          </select>
          {customMode && (
            <input
              type="text"
              placeholder="Escribe el nombre de la nueva categoría"
              className={`${inputClass} mt-2 border-emerald-500 ring-1 ring-emerald-500`}
              autoFocus
              value={form.category || ''}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
          )}
        </div>
        {/* Subcategoría (dinámica según categoría) */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subcategoría</label>
          <SubcategorySelect
            category={form.category || ''}
            value={form.subcategory || ''}
            onChange={val => {
              let normalized = val;
              if (val === '__other__' && typeof form.subcategory === 'string') {
                normalized = form.subcategory.trim().replace(/\s+/g, ' ');
              }
              setForm({ ...form, subcategory: normalized });
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de producto</label>
          <select
            className={inputClass}
            value={form.ventaPorPeso ? 'kg' : 'unidad'}
            onChange={e => {
              const isKg = e.target.value === 'kg';
              setForm({
                ...form,
                unit: isKg ? 'kg' : 'unidad',
                unitType: isKg ? 'kg' : 'unidad',
                ventaPorPeso: isKg,
                // Resetear el stock al cambiar el tipo
                stock: 0,
                minStock: form.minStock || 0
              });
            }}
            required
          >
            <option value="unidad">Venta por unidad</option>
            <option value="kg">Venta por peso (kg)</option>
          </select>
        </div>
        {/* Stock inicial dinámico (único) */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Stock inicial {form.unitType === 'kg' ? '(kg)' : ''}
          </label>
          <input
            type="number"
            step={form.unitType === 'unidad' ? '1' : '0.001'}
            placeholder={form.unitType === 'kg' ? 'Ej: 5.000' : 'Ej: 10'}
            className={inputClass}
            value={form.stock ?? ''}
            onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
            min={0}
            required
            disabled={!!editProduct}
          />
          {form.unitType === 'kg' && <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">Ingresa el stock en kilogramos (ej: 2.500 para 2.5 kg).</span>}
          {form.unitType === 'unidad' && <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">Ingresa el stock en unidades.</span>}
          {editProduct && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">
              {'El stock solo se modifica mediante "Agregar ingreso" o "Ajustar stock".'}
            </span>
          )}
        </div>
        {/* Stock mínimo para alerta */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Stock mínimo para alerta
          </label>
          <input
            type="number"
            step={form.unitType === 'unidad' ? '1' : '0.001'}
            placeholder={form.unitType === 'kg' ? 'Ej: 1.000' : 'Ej: 2'}
            className={inputClass}
            value={form.minStock ?? ''}
            onChange={e => setForm({ ...form, minStock: Number(e.target.value) })}
            min={0}
            required
          />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">Cuando el stock sea menor o igual a este valor, el sistema mostrará alerta de bajo stock.</span>
        </div>
        {/* Precio de costo */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Precio de costo</label>
          <input
            type="number"
            step="0.01"
            placeholder="Ej: 2.50"
            className={inputClass}
            value={form.costPrice ?? ''}
            onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
            min={0}
            required
            disabled={!!editProduct}
          />
        </div>


        {/* Solo mostrar venta por peso si es tipo kg */}
        {form.unitType === 'kg' && (
          <div className="flex flex-col col-span-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                checked={!!form.ventaPorPeso}
                onChange={e => setForm({ ...form, ventaPorPeso: e.target.checked })}
              />
              ¿Se vende por peso? (ejemplo: jamón, queso, pollo, frutas)
            </label>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">Si está activo, al vender se pedirá el peso exacto (kg).</span>
          </div>
        )}



        {/* Precio de venta dinámico */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Precio de venta {form.unitType === 'kg' ? '(por kg)' : '(por unidad)'}
          </label>
          <input
            type="number"
            step="0.01"
            placeholder={form.unitType === 'kg' ? 'Precio por kg' : 'Precio por unidad'}
            className={inputClass}
            value={form.salePrice ?? ''}
            min={0.01}
            onChange={e => setForm({ ...form, salePrice: parseFloat(e.target.value) })}
            required
          />
        </div>

        {/* Unidad (única, según tipo) */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
          <select
            className={inputClass}
            value={form.unit ?? (form.unitType === 'kg' ? 'kg' : 'unidad')}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            required
          >
            {(form.unitType === 'unidad' || !form.unitType) && (
              <>
                <option value="unidad">Unidad</option>
                <option value="caja">Caja</option>
                <option value="paquete">Paquete</option>
                <option value="bolsa">Bolsa</option>
                <option value="docena">Docena</option>
                <option value="blister">Blister</option>
                <option value="frasco">Frasco</option>
                <option value="botella">Botella</option>
                <option value="sachet">Sachet</option>
              </>
            )}
            {form.unitType === 'kg' && (
              <option value="kg">Kilogramo (kg)</option>
            )}
          </select>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold italic">
            {form.unitType === 'kg' ? 'La unidad para venta por peso es siempre kilogramo (kg).' : 'Solo aparecen opciones lógicas para venta por unidad.'}
          </span>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
          {proveedores && proveedores.length > 0 ? (
            <>
              <input
                type="text"
                placeholder="Proveedor"
                className={inputClass}
                value={form.supplier || ''}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                list="proveedores-list"
                required
              />
              <datalist id="proveedores-list">
                {proveedores.map((prov: string) => (
                  <option value={prov} key={prov} />
                ))}
              </datalist>
            </>
          ) : (
            <input
              type="text"
              placeholder="Proveedor"
              className={inputClass}
              value={form.supplier || ''}
              onChange={e => setForm({ ...form, supplier: e.target.value })}
              required
            />
          )}
        </div>
        <div className="col-span-2 flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || (subcategoryRequired && !form.subcategory)}
            className={`px-8 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${saving || (subcategoryRequired && !form.subcategory)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
              }`}
          >
            {saving ? 'Guardando...' : editProduct ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
        {missingSubcategory && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-tight">Debes seleccionar una subcategoría para esta categoría.</div>
        )}
      </div>
    </form>
  );
};

export default ProductForm;

