import React from 'react';
import Image from 'next/image';
import { Plus, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Product } from '../../types/inventory';
import { motion, AnimatePresence } from 'framer-motion';

import ModalPeso from './ModalPeso';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, peso?: number) => void;
  getAvailableStock?: (productId: string) => number;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, getAvailableStock }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = React.useState<Product | null>(null);

  const handleAddToCart = (product: Product) => {
    if (product.ventaPorPeso && product.unitType === 'kg') {
      setProductoSeleccionado(product);
      setModalOpen(true);
    } else {
      onAddToCart(product);
    }
  };

  const handleConfirmPeso = (peso: number) => {
    if (productoSeleccionado) {
      onAddToCart(productoSeleccionado, peso);
      setProductoSeleccionado(null);
      setModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <AnimatePresence>
          {products.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={product.id}
              className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              {(() => {
                const availableStock = getAvailableStock ? getAvailableStock(product.id) : product.stock;
                const isOutOfStock = availableStock <= 0;

                return (
                  <>
                    {/* Image Container with Interactive Overlay */}
                    <div
                      className={`aspect-square relative overflow-hidden bg-gray-50 dark:bg-slate-800 transition-colors ${!isOutOfStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                    >
                      {/* Modern Hover Overlay - More compact */}
                      <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center justify-center">
                        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold text-[10px] shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1.5">
                          <Plus size={14} strokeWidth={3} />
                          Agregar
                        </div>
                      </div>

                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name || 'Producto'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 15vw"
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-slate-800/50">
                          <Package size={32} strokeWidth={1} />
                        </div>
                      )}

                      {/* Status Badges - Compact */}
                      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                        {availableStock <= (product.minStock || 5) && availableStock > 0 && (
                          <div className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                            <AlertTriangle size={8} /> STOCK
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">
                            AGOTADO
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2 z-20">
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm backdrop-blur-md border ${isOutOfStock
                          ? 'bg-red-100/90 text-red-700 border-red-200'
                          : 'bg-white/90 dark:bg-slate-900/90 text-gray-800 dark:text-white border-white/20'
                          }`}>
                          {availableStock} {product.unitType === 'kg' ? 'kg' : 'un.'}
                        </div>
                      </div>
                    </div>

                    {/* Product Info Section - Shrunk padding and gap */}
                    <div className="p-2.5 flex flex-col flex-1">
                      <div className="mb-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black">
                          {product.category || 'General'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-white text-xs leading-tight line-clamp-2 h-8 mb-2 group-hover:text-emerald-600 transition-colors" title={product.name}>
                        {product.name}
                      </h3>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter scale-90 origin-left">Precio</span>
                          <span className="text-sm font-black text-gray-800 dark:text-white flex items-baseline leading-none">
                            <span className="text-[9px] font-bold mr-0.5">S/.</span>
                            {(product.salePrice ?? 0).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={isOutOfStock}
                          className={`nav-button-premium w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${!isOutOfStock
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            }`}
                        >
                          {!isOutOfStock ? <Plus size={16} strokeWidth={3} /> : <ShoppingBag size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ModalPeso
        open={modalOpen}
        stockDisponible={productoSeleccionado?.stock ?? 0}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPeso}
      />
    </>
  );
};

export default ProductGrid;