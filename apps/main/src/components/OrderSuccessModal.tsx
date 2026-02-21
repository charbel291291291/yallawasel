import React from "react";
import { Language } from "../translations";
import { getWhatsAppUrl, OrderNotificationData } from "../services/whatsappNotification";

interface OrderSuccessModalProps {
    lastOrder: OrderNotificationData;
    lang: Language;
    onClose: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ lastOrder, lang, onClose }) => {
    const isRTL = lang === 'ar';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="luxury-card max-w-sm w-full p-10 bg-luxury-glow relative overflow-hidden animate-entrance">
                {/* Decorative particles / glow */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="text-center relative z-10">
                    <div className="w-24 h-24 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(200,169,81,0.3)] animate-pulse">
                        <i className="fa-solid fa-crown text-black text-4xl"></i>
                    </div>

                    <h2 className="font-luxury text-3xl font-black text-white mb-3 italic tracking-tight">
                        {isRTL ? "تم استلام طلبك!" : "Order Commenced"}
                    </h2>

                    <p className="text-white/40 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest italic">
                        {isRTL
                            ? `طلبك #${lastOrder.order_id.slice(0, 8).toUpperCase()} في عهدتنا`
                            : `Order #${lastOrder.order_id.slice(0, 8).toUpperCase()} is now being curated`}
                    </p>

                    <div className="space-y-4">
                        {/* WhatsApp Button - Subtle green tint but luxury styled */}
                        <a
                            href={getWhatsAppUrl(lastOrder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-5 bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-black rounded-2xl transition-all hover:bg-[#25D366]/30 uppercase text-[10px] tracking-[0.2em]"
                        >
                            <i className="fa-brands fa-whatsapp text-lg"></i>
                            {isRTL ? "إشعار واتساب" : "Notify Concierge"}
                        </a>

                        <button
                            onClick={onClose}
                            className="luxury-button w-full py-5 uppercase text-[10px] tracking-[0.2em]"
                        >
                            {isRTL ? "إغلاق" : "Continue Journey"}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                            {isRTL ? "القيمة الإجمالية" : "VALUATION"}
                        </p>
                        <p className="text-2xl font-black text-white mt-1 tracking-tighter">
                            ${Number(lastOrder.total).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
