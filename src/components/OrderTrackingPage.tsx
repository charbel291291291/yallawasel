import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { translations, Language } from "../translations";

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
  payment_method: string;
  delivery_zone: string;
  notes: string;
}

const statusSteps = [
  { key: "pending", label: "Pending", icon: "fa-clock" },
  { key: "approved", label: "Approved", icon: "fa-check-circle" },
  { key: "preparing", label: "Preparing", icon: "fa-box" },
  { key: "out_for_delivery", label: "On the Way", icon: "fa-truck" },
  { key: "delivered", label: "Delivered", icon: "fa-home" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  approved: "bg-blue-500",
  preparing: "bg-purple-500",
  out_for_delivery: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

interface OrderTrackingPageProps {
  lang: Language;
}

const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ lang }) => {
  const { id } = useParams<{ id: string }>();
  const t = translations[lang];
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          setOrder(orderData);

          // Fetch order status history
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

    // Real-time subscription for order updates
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    // Also subscribe to status history changes
    const historyChannel = supabase
      .channel(`order-history-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_status_history",
          filter: `order_id=eq.${id}`,
        },
        (payload) => {
          setHistory((prev) => [...prev, payload.new as OrderStatusHistory]);
        }
      )
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
    return new Date(dateStr).toLocaleString(lang === "ar" ? "ar-PS" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            {error || "We couldn't find this order"}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <i className="fas fa-arrow-left text-gray-500"></i>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Order Tracking</h1>
          <p className="text-gray-500 mt-1">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Status Progress */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
            <div
              className="absolute top-5 left-0 h-1 bg-primary transition-all duration-500 -z-10"
              style={{
                width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
              }}
            ></div>

            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${index <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-400"
                    }`}
                >
                  <i className={`fas ${step.icon} text-sm`}></i>
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${index <= currentStep ? "text-primary" : "text-gray-400"
                    }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Current Status Badge */}
          <div className="mt-6 text-center">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusColors[order.status]
                  ? statusColors[order.status] + " text-white"
                  : "bg-gray-500 text-white"
                }`}
            >
              <i
                className={`fas ${statusSteps[currentStep]?.icon || "fa-info-circle"
                  }`}
              ></i>
              {statusSteps[currentStep]?.label || order.status}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {formatDate(order.created_at)}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium">{order.full_name}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Phone</span>
              <a
                href={`tel:${order.phone}`}
                className="font-medium text-primary"
              >
                {order.phone}
              </a>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Payment</span>
              <span className="font-medium capitalize">
                {order.payment_method || "Cash"}
              </span>
            </div>

            {order.address && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right max-w-[200px]">
                  {order.address}
                </span>
              </div>
            )}

            <div className="flex justify-between py-3">
              <span className="text-gray-900 font-bold">Total</span>
              <span className="text-primary font-black text-xl">
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Items</h3>

            <div className="space-y-3">
              {order.items.map((item: OrderItem, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-shopping-bag text-gray-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.quantity}x{" "}
                        {item.name || item.productName || "Item"}
                      </p>
                      {item.price && (
                        <p className="text-sm text-gray-500">
                          ${Number(item.price).toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold">
                    ${Number(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {history.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Timeline</h3>

            <div className="space-y-4">
              {history.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${statusColors[event.status] || "bg-gray-400"
                        }`}
                    ></div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900 capitalize">
                      {event.status.replace(/_/g, " ")}
                    </p>
                    {event.note && (
                      <p className="text-sm text-gray-500">{event.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-4">Need help? Contact us</p>
          <a
            href="tel:+970126177"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold"
          >
            <i className="fas fa-phone"></i>
            +970 126 177
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
