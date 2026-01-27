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
  const subcategories = subcategoriasPorCategoria[category] || [];

  return (
    <>
      <select
        className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!category}
      >
        <option value="">Selecciona una subcategoría</option>
        {subcategories.map((subcat: string) => (
          <option key={subcat} value={subcat}>{subcat}</option>
        ))}
        <option value="__other__">Otra...</option>
      </select>
      {/* Si elige "Otra...", mostrar input libre */}
      {value === '__other__' && (
        <input
          type="text"
          className="mt-2 block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          placeholder="Escribe la subcategoría"
          autoFocus
          onChange={e => onChange(e.target.value)}
        />
      )}
    </>
  );
};

export default SubcategorySelect;
