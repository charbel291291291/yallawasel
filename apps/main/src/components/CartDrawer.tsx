
import React from 'react';
import { translations } from '../translations';
import { Link } from 'react-router-dom';

import { useStore } from '../store/useStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  checkoutLoading: boolean;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen, onClose, onCheckout, checkoutLoading
}) => {
  const { cart, lang, user, updateCartQuantity } = useStore();
  const t = translations[lang];
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 50 ? 0 : 5; // Simple rule: Free over $50
  const total = subtotal + deliveryFee;

  const updateQuantity = (id: string, delta: number) => {
    updateCartQuantity(id, delta);
  };


  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-white z-[101] shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="font-luxury text-2xl font-bold">{t.yourBag} ({cart.length})</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <i className="fa-solid fa-bag-shopping text-6xl text-gray-300"></i>
                <p className="text-xl font-bold text-gray-900">{t.emptyBag}</p>
                <button onClick={onClose} className="text-primary font-bold hover:underline">Start Shopping</button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 animate-fadeIn">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{lang === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">${item.price}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-md transition-all shadow-sm">-</button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-md transition-all shadow-sm">+</button>
                      </div>
                      <span className="font-black text-gray-900">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 safe-bottom">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{t.subtotal}</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t.delivery}</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>{deliveryFee === 0 ? t.free : `$${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t border-gray-200">
                  <span>{t.total}</span>
                  <span>${total}</span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={onCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-lock"></i> {t.checkoutWallet}</>}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  {t.loginCheckout}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
