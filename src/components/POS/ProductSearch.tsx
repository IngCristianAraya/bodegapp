import React, { useState } from 'react';
import { Search, Barcode } from 'lucide-react';

interface ProductSearchProps {
  onSearch: (query: string) => void;
  onBarcodeSearch: (barcode: string) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onSearch, onBarcodeSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeMode, setBarcodeMode] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Detectar si parece un código de barras (numérico y longitud mínima razonable)
    const looksLikeBarcode = /^\d+$/.test(searchQuery) && searchQuery.length >= 8;

    if (barcodeMode || looksLikeBarcode) {
      onBarcodeSearch(searchQuery);
      setSearchQuery(''); // Limpiar para el siguiente escaneo
    } else {
      onSearch(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={barcodeMode ? "Escanear código de barras..." : "Buscar producto..."}
            className="w-72 max-w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <button
          type="button"
          onClick={() => setBarcodeMode(!barcodeMode)}
          className={`p-3 rounded-lg border transition-colors ${barcodeMode
            ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          title={barcodeMode ? "Modo búsqueda por nombre" : "Modo escaneo de código"}
        >
          <Barcode size={20} />
        </button>
      </div>
    </form>
  );
};

export default ProductSearch;