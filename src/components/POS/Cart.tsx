/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, X, ChevronRight } from 'lucide-react';
import type { CartItem } from '../../types/index';
import { motion, AnimatePresence } from 'framer-motion';
import CashPaymentModal from './CashPaymentModal';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  setDiscount: (discount: number) => void;
  onCheckout: (paymentMethod: string, paymentDetails?: { amountPaid: number; change: number }) => void;
  clearCart: () => void;
}

export default function Cart({ cart, removeFromCart, updateQuantity, total, subtotal, tax, discount, setDiscount, onCheckout, clearCart }: CartProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null); // Unused
  const [discountInput, setDiscountInput] = useState(discount > 0 ? discount.toString() : '');

  React.useEffect(() => {
    setDiscountInput(discount > 0 ? discount.toString() : '');
  }, [discount]);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setDiscountInput(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setDiscount(num);
    } else {
      setDiscount(0);
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: '💵', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'card', name: 'Tarjeta', icon: '💳', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'yape', name: 'Yape', icon: '📱', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'plin', name: 'Plin', icon: '📲', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { id: 'credit', name: 'Crédito', icon: '📒', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  const handlePayment = (method: string) => {
    // setSelectedPaymentMethod(method);
    setShowPaymentMethods(false);
    setTimeout(() => {
      if (method === 'cash') {
        setShowCashModal(true);
      } else {
        onCheckout(method);
      }
    }, 250);
  };

  return (
    <div className="glass-card rounded-2xl shadow-lg border border-white/40 dark:border-gray-700 flex flex-col h-[calc(100vh-140px)] sticky top-24 bg-white/90 dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-100/50 dark:border-gray-700 flex items-center justify-between bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-t-2xl">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg mr-3 text-emerald-600 dark:text-emerald-400">
            <ShoppingCart size={20} />
          </div>
          Carrito de Compra
        </h2>
        <span className="bg-gray-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {cart.length} items
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-full mb-4">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-medium text-gray-500 dark:text-gray-400">Tu carrito está vacío</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Agrega productos del inventario</p>
          </div>
        ) : (
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-600 shadow-sm transition-all"
              >
                {/* Image thumb if available, else letter */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-400 dark:text-gray-300 font-bold text-lg overflow-hidden relative">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : item.product.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{item.product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">S/. {item.product.salePrice} x {item.product.unit}</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900 rounded-lg p-1">
                  {!item.product.ventaPorPeso && (
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-md shadow-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                  <span className={`text-xs font-bold text-center text-gray-800 dark:text-white ${item.product.ventaPorPeso ? 'px-2 w-auto' : 'w-4'}`}>
                    {item.product.ventaPorPeso ? `${item.quantity.toFixed(3)} kg` : item.quantity}
                  </span>
                  {!item.product.ventaPorPeso && (
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-md shadow-sm text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">S/. {((item.product.salePrice ?? 0) * item.quantity).toFixed(2)}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer / Checkout */}
      <div className="p-5 bg-white/50 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100/50 dark:border-gray-700 rounded-b-2xl">
        <div className="space-y-3 mb-4">
          {/* Descuento Input */}
          <div className="flex items-center justify-between group bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900 transition-all">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descuento</span>
            <div className="flex items-center">
              <span className="text-gray-400 dark:text-gray-500 text-sm mr-1">S/.</span>
              <input
                type="text"
                value={discountInput}
                onChange={handleDiscountChange}
                placeholder="0.00"
                className="w-16 text-right text-sm font-semibold text-gray-800 dark:text-white focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-1">
            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
              <span>Subtotal</span>
              <span>S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
              <span>IGV (18%)</span>
              <span>S/. {tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                <span>Descuento</span>
                <span>- S/. {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                S/. {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => handlePayment(pm.id)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-700 transition-all active:scale-95"
              title={pm.name}
            >
              <span className="text-xl mb-1 filter grayscale-[0.2]">{pm.icon}</span>
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{pm.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title="Limpiar"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setShowPaymentMethods(true)}
            disabled={cart.length === 0}
            className="flex-1 bg-gray-900 dark:bg-white dark:text-slate-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            <span>Pagar S/. {total.toFixed(2)}</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Payment Modal Override (Simple Overlay) */}
      {showPaymentMethods && (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-50 rounded-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <button
            onClick={() => setShowPaymentMethods(false)}
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-200"
          >
            <X size={20} />
          </button>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Confirmar Método de Pago</h3>
          <div className="grid grid-cols-2 gap-4 w-full">
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                onClick={() => handlePayment(pm.id)}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${pm.color} dark:bg-transparent dark:border-gray-700 dark:hover:border-emerald-500`}
              >
                <span className="text-4xl mb-2">{pm.icon}</span>
                <span className="font-bold dark:text-white">{pm.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cash Change Modal */}
      {showCashModal && (
        <CashPaymentModal
          total={total}
          onConfirm={(amountPaid, change) => {
            setShowCashModal(false);
            onCheckout('cash', { amountPaid, change });
          }}
          onClose={() => setShowCashModal(false)}
        />
      )}
    </div>
  );
};
