
import React from 'react';
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
  const isRTL = lang === 'ar';
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
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-[#0B0E17] z-[101] shadow-[0_0_100px_rgba(0,0,0,1)] transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
        <div className="flex flex-col h-full bg-luxury-glow">

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 bg-[#0B0E17]/80 backdrop-blur-2xl">
            <h2 className="font-luxury text-2xl font-black text-white">{isRTL ? 'حقيبتك' : 'Your Bag'} <span className="text-primary/40 text-sm ml-2 font-sans-modern">{cart.length}</span></h2>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <i className="fa-solid fa-xmark text-white/40"></i>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30 animate-entrance">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                  <i className="fa-solid fa-bag-shopping text-3xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-luxury text-white mb-2">{isRTL ? 'حقيبتك فارغة' : 'Your bag is empty'}</h3>
                  <button onClick={onClose} className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Explore Collections</button>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-6 animate-entrance">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10 shadow-2xl">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-luxury text-lg font-black text-white leading-tight">{lang === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-xs text-primary/60 mt-1 font-bold tracking-widest uppercase">${item.price}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-1.5 px-3">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-white/40 hover:text-white transition-colors">-</button>
                        <span className="text-[10px] font-black w-4 text-center text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-white/40 hover:text-white transition-colors">+</button>
                      </div>
                      <span className="font-black text-white text-lg">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-8 bg-[#151821]/80 backdrop-blur-2xl border-t border-white/5 space-y-6 pb-safe">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium text-white/30 tracking-wider">
                  <span>{isRTL ? 'المجموع الفرعي' : 'SUBTOTAL'}</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-white/30 tracking-wider">
                  <span>{isRTL ? 'التوصيل' : 'DELIVERY'}</span>
                  <span className={deliveryFee === 0 ? 'text-primary font-black' : ''}>{deliveryFee === 0 ? (isRTL ? 'مجاني' : 'FREE') : `$${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-white pt-6 border-t border-white/5">
                  <span className="font-luxury">{isRTL ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">${total}</span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={onCheckout}
                  disabled={checkoutLoading}
                  className="btn-luxury btn-luxury-gold w-full"
                >
                  {checkoutLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-lock mr-2 text-[10px]"></i> {isRTL ? 'إتمام الطلب' : 'SECURE CHECKOUT'}</>}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={onClose}
                  className="btn-luxury btn-luxury-outline w-full"
                >
                  {isRTL ? 'سجل الدخول للمتابعة' : 'SIGN IN TO CHECKOUT'}
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
