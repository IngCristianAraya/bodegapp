interface Props {
  category: string;
  value: string;
  onChange: (val: string) => void;
}

import { categoryData } from '@/lib/constants/categoryData';

// Extrae las subcategorías directamente de categoryData para mantener sincronía
const subcategoriasPorCategoria: Record<string, string[]> = Object.fromEntries(
  Object.entries(categoryData)
    .filter(([, info]) => info.subcategories && info.subcategories.length > 0)
    .map(([category, info]) => [category, info.subcategories!])
);


const SubcategorySelect: React.FC<Props> = ({ category, value, onChange }) => {
  const isCustomCategory = category && !categoryData[category as keyof typeof categoryData];
  const subcategories = subcategoriasPorCategoria[category] || [];

  // Si es categoría custom, forzamos siempre el modo libre (input de texto)
  if (isCustomCategory) {
    return (
      <input
        type="text"
        className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        placeholder="Escribe la subcategoría (ej: Artesanales, Clásicas...)"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  return (
    <>
      <select
        className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        value={subcategories.includes(value) ? value : '__other__'}
        onChange={e => {
          const val = e.target.value;
          if (val === '__other__') {
            onChange(''); // Limpiar para que el usuario escriba
          } else {
            onChange(val);
          }
        }}
        disabled={!category}
      >
        <option value="">Selecciona una subcategoría</option>
        {subcategories.map((subcat: string) => (
          <option key={subcat} value={subcat}>{subcat}</option>
        ))}
        <option value="__other__">Otra / Nueva...</option>
      </select>

      {/* Si el valor actual NO está en la lista predefinida (porque eligió "Otra" o escribió algo custom), mostrar input */}
      {(!subcategories.includes(value) && category) && (
        <input
          type="text"
          className="mt-2 block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all animate-in fade-in slide-in-from-top-1"
          placeholder="Escribe la subcategoría específica..."
          value={value}
          autoFocus={value === ''} // Solo enfocar si está vacío (recién seleccionado)
          onChange={e => onChange(e.target.value)}
        />
      )}
    </>
  );
};

export default SubcategorySelect;
