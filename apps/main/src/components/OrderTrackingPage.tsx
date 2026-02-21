import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Language } from "../translations";

interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  note: string;
  created_at: string;
}

interface OrderItem {
  id?: string;
  name?: string;
  productName?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  search_started_at?: string;
  payment_method: string;
  delivery_zone: string;
  notes: string;
}

const statusSteps = [
  { key: "pending", label: "Pending", icon: "fa-clock" },
  { key: "assigned", label: "Driver Found", icon: "fa-user-check" },
  { key: "approved", label: "Approved", icon: "fa-check-circle" },
  { key: "preparing", label: "Preparing", icon: "fa-box" },
  { key: "picked_up", label: "Picked Up", icon: "fa-dolly" },
  { key: "out_for_delivery", label: "On the Way", icon: "fa-truck" },
  { key: "delivered", label: "Delivered", icon: "fa-home" },
];



interface OrderTrackingPageProps {
  lang: Language;
}

const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ lang }) => {
  const isRTL = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(ticker);
  }, []);

  const getNarrative = () => {
    if (!order) return "";
    if (order.status !== "pending") {
      if (order.status === "assigned") return isRTL ? "سائقنا في طريقه لاستلام طلبك!" : "Our driver is on the way to pick up your order!";
      if (order.status === "preparing") return isRTL ? "المطبخ يجهز اختيارك..." : "The kitchen is preparing your selection...";
      if (order.status === "out_for_delivery") return isRTL ? "اقتربنا! التوصيل قريب منك." : "Almost there! Your delivery is nearby.";
      return statusSteps.find(s => s.key === order.status)?.label || "In progress";
    }

    const start = order.search_started_at ? new Date(order.search_started_at).getTime() : new Date(order.created_at).getTime();
    const elapsed = (currentTime - start) / 1000;

    if (elapsed < 45) return isRTL ? "نبحث عن السائق المثالي لك..." : "Finding your perfect driver...";
    if (elapsed < 90) return isRTL ? "نوسع نطاق البحث لنصل إليك أسرع..." : "Expanding our search zone to get you moving faster...";
    if (elapsed < 180) return isRTL ? "نقوم بترقية طلبك لضمان سائق فوراً." : "Applying priority boost to secure a driver for you.";
    return isRTL ? "نبحث في كل مكان. نقدر صبرك!" : "Searching far and wide. We appreciate your patience!";
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          setOrder(orderData);
          const { data: historyData, error: historyError } = await supabase
            .from("order_status_history")
            .select("*")
            .eq("order_id", id)
            .order("created_at", { ascending: true });

          if (!historyError && historyData) {
            setHistory(historyData);
          }
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Order not found");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        if (payload.new) setOrder(payload.new as Order);
      })
      .subscribe();

    const historyChannel = supabase
      .channel(`order-history-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_status_history", filter: `order_id=eq.${id}` }, (payload) => {
        setHistory((prev) => [...prev, payload.new as OrderStatusHistory]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(historyChannel);
    };
  }, [id]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusSteps.findIndex((s) => s.key === order.status);
    return index >= 0 ? index : 0;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isRTL ? "ar-PS" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) return null;

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm luxury-card p-10 bg-luxury-glow">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500 animate-pulse"></i>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{isRTL ? 'الطلب غير موجود' : 'Identity Not Found'}</h2>
          <p className="text-white/40 mb-8 text-sm font-medium">{error || (isRTL ? "تعذر العثور على هذا الطلب" : "We couldn't find this artifact.")}</p>
          <Link to="/" className="luxury-button w-full inline-block py-4">{isRTL ? 'العودة للرئيسية' : 'Return to Base'}</Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="flex flex-col gap-12 pb-32 pt-6 px-4 max-w-2xl mx-auto animate-entrance">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/profile" className="w-10 h-10 luxury-card flex items-center justify-center text-white/40 hover:text-primary transition-colors">
          <i className={`fas ${isRTL ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
        </Link>
        <div className="text-center">
          <h1 className="font-luxury text-2xl font-black text-white italic">{isRTL ? 'تتبع الطلب' : 'Artifact Tracking'}</h1>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">
            ID: {order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Narrative Card */}
      <div className="luxury-card p-6 bg-luxury-glow relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <i className={`fas ${statusSteps[currentStep]?.icon || "fa-satellite"} text-6xl`}></i>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <p className="text-primary text-sm font-black uppercase tracking-widest leading-relaxed">
            {getNarrative()}
          </p>
        </div>
      </div>

      {/* Progress Tracker - Modern Vertical for Mobile */}
      <div className="luxury-card p-8">
        <div className="relative flex flex-col gap-8">
          {/* Connecting Line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-white/5"></div>
          <div
            className="absolute left-[19px] top-6 w-[2px] bg-gold-gradient shadow-[0_0_10px_rgba(200,169,81,0.5)] transition-all duration-1000"
            style={{ height: `${(currentStep / (statusSteps.length - 1)) * 90}%` }}
          ></div>

          {statusSteps.map((step, index) => (
            <div key={step.key} className={`flex items-center gap-6 transition-all duration-500 ${index > currentStep ? 'opacity-20 translate-x-1' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 border transition-all duration-500 ${index <= currentStep ? 'bg-gold-gradient text-black border-primary shadow-lg' : 'bg-[#0B0E17] text-white/20 border-white/5'
                }`}>
                <i className={`fas ${step.icon} text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className={`text-xs font-black uppercase tracking-widest ${index <= currentStep ? 'text-white' : 'text-white/20'}`}>
                  {step.label}
                </p>
                {index === currentStep && (
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 animate-pulse">
                    {isRTL ? 'الحالة الحالية' : 'ACTIVE STATUS'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Intelligence */}
      <div className="grid gap-6">
        <div className="luxury-card p-8">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">{isRTL ? 'تفاصيلArtifact ' : 'ARTIFACT INTELLIGENCE'}</h3>

          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? 'التاريخ' : 'ACQUISITION DATE'}</span>
              <span className="text-sm font-black text-white">{formatDate(order.created_at)}</span>
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? 'العميل' : 'RECIPIENT'}</span>
              <span className="text-sm font-black text-white uppercase tracking-wider">{order.full_name}</span>
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? 'طريقة الدفع' : 'EXCHANGE METHOD'}</span>
              <span className="text-sm font-black text-primary uppercase tracking-widest">{order.payment_method || "CASH ON ENTRY"}</span>
            </div>

            {order.address && (
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">{isRTL ? 'العنوان' : 'COORDINATES'}</span>
                <span className="text-xs font-black text-white/80 text-right max-w-[200px] leading-relaxed italic">{order.address}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">{isRTL ? 'المجموع' : 'TOTAL VALUE'}</span>
              <span className="text-3xl font-black text-white tracking-tighter">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Manifest (Items) */}
        {order.items && order.items.length > 0 && (
          <div className="luxury-card p-8">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">{isRTL ? 'البيان' : 'CARGO MANIFEST'}</h3>
            <div className="space-y-4">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-luxury-glow rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <i className="fas fa-cube text-xs"></i>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">
                        {item.quantity}x {item.name || item.productName || "ITEM"}
                      </p>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
                        {item.price ? `$${Number(item.price).toFixed(2)} UNIT` : 'PREMIUM'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white tracking-tighter">
                    ${Number(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Timeline Log */}
        {history.length > 0 && (
          <div className="luxury-card p-8">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">{isRTL ? 'الجدول الزمني' : 'ACQUISITION TIMELINE'}</h3>
            <div className="space-y-6">
              {[...history].reverse().map((event) => (
                <div key={event.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(200,169,81,0.5)]"></div>
                    <div className="w-[1px] h-full bg-white/5 mt-2 group-last:bg-transparent"></div>
                  </div>
                  <div className="pb-2">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      {event.status.replace(/_/g, " ")}
                    </p>
                    {event.note && (
                      <p className="text-[9px] text-white/40 italic mt-1 font-medium">{event.note}</p>
                    )}
                    <p className="text-[8px] text-white/20 font-black mt-1 uppercase tracking-tighter">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Support Terminal */}
        <div className="text-center pt-10">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-6">{isRTL ? 'تحتاج مساعدة؟' : 'SUPPORT TERMINAL'}</p>
          <a href="tel:+970126177" className="luxury-button inline-flex items-center gap-3 px-10 py-4 group">
            <i className="fas fa-phone-volume text-xs group-hover:animate-bounce"></i>
            <span className="text-xs font-black tracking-widest">+970 126 177</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
