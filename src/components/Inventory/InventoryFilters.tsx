import React from 'react';

interface InventoryFiltersProps {
  filters: {
    name: string;
    code: string;
    supplier: string;
    category: string;
  };
  barcodeInput: string;
  onFiltersChange: (filters: { name: string; code: string; supplier: string; category: string }) => void;
  onBarcodeInputChange: (barcode: string) => void;
  onBarcodeSearch: () => void;
  proveedores?: string[];
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  filters,
  barcodeInput,
  onFiltersChange,
  onBarcodeInputChange,
  onBarcodeSearch,
  proveedores = [],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm mb-6 border border-transparent dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input
            type="text"
            className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
            placeholder="Buscar por nombre"
            value={filters.name}
            onChange={e => onFiltersChange({ ...filters, name: e.target.value })}
            aria-label="Filtrar por nombre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código/SKU</label>
          <input
            type="text"
            className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
            placeholder="Código o SKU"
            value={filters.code}
            onChange={e => onFiltersChange({ ...filters, code: e.target.value })}
            aria-label="Filtrar por código"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
          {proveedores && proveedores.length > 0 ? (
            <>
              <input
                type="text"
                className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                placeholder="Filtrar por proveedor"
                value={filters.supplier}
                onChange={e => onFiltersChange({ ...filters, supplier: e.target.value })}
                aria-label="Filtrar por proveedor"
                list="proveedores-list-filtros"
              />
              <datalist id="proveedores-list-filtros">
                {proveedores.map((prov: string) => (
                  <option value={prov} key={prov} />
                ))}
              </datalist>
            </>
          ) : (
            <input
              type="text"
              className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
              placeholder="Filtrar por proveedor"
              value={filters.supplier}
              onChange={e => onFiltersChange({ ...filters, supplier: e.target.value })}
              aria-label="Filtrar por proveedor"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
          <select
            className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
            value={filters.category}
            onChange={e => onFiltersChange({ ...filters, category: e.target.value })}
            aria-label="Filtrar por categoría"
          >
            <option value="all">Todas</option>
            <option value="Abarrotes">Abarrotes</option>
            <option value="Huevos y Lácteos">Huevos y Lácteos</option>
            <option value="Carnes y Embutidos">Carnes y Embutidos</option>
            <option value="Frutas y Verduras">Frutas y Verduras</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Snacks y Golosinas">Snacks y Golosinas</option>
            <option value="Helados">Helados</option>
            <option value="Limpieza del Hogar">Limpieza del Hogar</option>
            <option value="Higiene Personal">Higiene Personal</option>
            <option value="Productos para Mascotas">Productos para Mascotas</option>
            <option value="Descartables">Descartables</option>
            <option value="Panadería">Panadería</option>
            <option value="Repostería">Repostería</option>
            <option value="Congelados">Congelados</option>
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center w-full md:w-auto">
          <input
            type="text"
            className="border dark:border-gray-600 rounded-l-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 flex-1 md:flex-none"
            placeholder="Escanear código de barras"
            value={barcodeInput}
            onChange={e => onBarcodeInputChange(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && onBarcodeSearch()}
            aria-label="Buscar por código de barras"
          />
          <button
            className="bg-emerald-600 text-white px-3 py-2 rounded-r-md hover:bg-emerald-700 transition-colors"
            onClick={onBarcodeSearch}
            type="button"
            aria-label="Buscar código de barras"
          >
            Escanear
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
