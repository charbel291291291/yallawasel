import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useSettings } from "../contexts/SettingsContext";
import { ADMIN_PASSWORD } from "../constants";
import { Product, Order, UserTier, OrderStatus, CartItem } from "../types";
import MounéClassesView from "./MounéClassesView";
import { processOrderImpact } from "../services/impactService";

type Tab =
  | "dashboard"
  | "orders"
  | "products"
  | "moune"
  | "customers"
  | "rewards"
  | "happyhour"
  | "impact"
  | "settings";

// Helper to upload images to Supabase Storage
const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl;
};

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem("isAdmin") === "true" ||
      sessionStorage.getItem("admin_auth") === "true"
    );
  });
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Keypad Handlers
  const handleNumClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const submitPin = () => {
    if (pin === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      localStorage.setItem("isAdmin", "true");
      setError("");
    } else {
      setError("ACCESS DENIED");
      setTimeout(() => setPin(""), 600);
    }
  };

  // Support physical keyboard
  useEffect(() => {
    if (isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleNumClick(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        submitPin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative z-[200]">
        <div className="w-full max-w-sm relative">
          <div className="bg-[#1a1c23] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none"></div>
            <div className="relative z-10 text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-700">
                <i className="fa-solid fa-user-shield text-2xl text-slate-400"></i>
              </div>
              <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                Security Clearance
              </h2>
              <h1 className="text-white font-luxury text-xl">Admin Terminal</h1>
            </div>
            <div className="relative z-10 bg-black rounded-xl p-6 mb-8 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] border-b border-white/10">
              <div className="flex justify-center gap-3 h-6 items-center">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i < pin.length
                        ? "bg-red-500 shadow-[0_0_10px_#ef4444] scale-110"
                        : "bg-slate-900 shadow-inner scale-90"
                    }`}
                  ></div>
                ))}
              </div>
              <div
                className={`absolute bottom-2 left-0 right-0 text-center text-[9px] font-black uppercase tracking-widest transition-opacity duration-300 ${
                  error
                    ? "text-red-500 opacity-100 animate-pulse"
                    : "text-slate-700 opacity-0"
                }`}
              >
                {error || "Locked"}
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-16 rounded-2xl bg-[#252830] text-slate-300 font-bold text-xl font-mono shadow-[0_5px_0_#14161b,0_5px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px] active:bg-[#1f2229] transition-all border-t border-white/5 hover:text-white"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-[#2a1a1a] text-red-400 font-bold text-lg shadow-[0_5px_0_#1a0f0f,0_5px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px] transition-all border-t border-white/5 hover:text-red-300"
              >
                <i className="fa-solid fa-delete-left"></i>
              </button>
              <button
                onClick={() => handleNumClick("0")}
                className="h-16 rounded-2xl bg-[#252830] text-slate-300 font-bold text-xl font-mono shadow-[0_5px_0_#14161b,0_5px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px] active:bg-[#1f2229] transition-all border-t border-white/5 hover:text-white"
              >
                0
              </button>
              <button
                onClick={submitPin}
                className="h-16 rounded-2xl bg-[#8a1c1c] text-white font-bold text-lg shadow-[0_5px_0_#5c0f0f,0_5px_10px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px] active:bg-[#701515] transition-all border-t border-white/20 hover:brightness-110"
              >
                <i className="fa-solid fa-unlock"></i>
              </button>
            </div>
            <div className="relative z-10 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-400 text-[10px] font-bold uppercase tracking-widest transition-colors py-2 px-4 rounded-full hover:bg-white/5"
              >
                <i className="fa-solid fa-power-off"></i> Exit System
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "orders":
        return <OrdersView />;
      case "products":
        return <ProductsView />;
      case "moune":
        return <MounéClassesView />;
      case "customers":
        return <CustomersView />;
      case "rewards":
        return <RewardsView />;
      case "happyhour":
        return <HappyHourView />;
      case "impact":
        return <ImpactView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans text-gray-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } overflow-hidden shadow-2xl flex flex-col`}
      >
        <div className="h-20 flex items-center justify-center border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 font-bold text-xl">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              Y
            </div>
            {isSidebarOpen && (
              <span className="font-luxury tracking-widest text-sm">
                ADMIN OPS
              </span>
            )}
          </div>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <SidebarItem
            icon="fa-chart-pie"
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-shopping-cart"
            label="Orders"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-box-open"
            label="Kits (Products)"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-utensils"
            label="Mouné Classes"
            active={activeTab === "moune"}
            onClick={() => setActiveTab("moune")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-users"
            label="Customers"
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-gift"
            label="Rewards"
            active={activeTab === "rewards"}
            onClick={() => setActiveTab("rewards")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-clock"
            label="Happy Hours"
            active={activeTab === "happyhour"}
            onClick={() => setActiveTab("happyhour")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon="fa-globe"
            label="Impact"
            active={activeTab === "impact"}
            onClick={() => setActiveTab("impact")}
            isOpen={isSidebarOpen}
          />
          <div className="border-t border-slate-800 my-4 pt-4"></div>
          <SidebarItem
            icon="fa-sliders"
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            isOpen={isSidebarOpen}
          />
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              localStorage.removeItem("isAdmin");
              setIsAuthenticated(false);
              navigate("/");
            }}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors w-full ${
              !isSidebarOpen ? "justify-center" : ""
            }`}
          >
            <i className="fa-solid fa-lock text-lg"></i>
            {isSidebarOpen && (
              <span className="font-bold text-xs uppercase tracking-widest">
                Logout Admin
              </span>
            )}
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="h-20 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-8 sticky top-0 z-40 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-slate-900 transition-colors border border-gray-100"
            >
              <i className="fa-solid fa-bars-staggered"></i>
            </button>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              {activeTab} Terminal
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                Live System
              </span>
            </div>
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <i className="fa-solid fa-earth-americas"></i>
            </Link>
          </div>
        </header>
        <div className="p-8 max-w-[1400px] mx-auto animate-fadeIn">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, isOpen }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
      active
        ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] border-b-4 border-primary-dark translate-y-[-1px]"
        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
    } ${!isOpen ? "justify-center" : ""}`}
  >
    <i className={`fa-solid ${icon} w-6 text-center text-lg`}></i>
    {isOpen && (
      <span className="font-bold text-sm tracking-tight">{label}</span>
    )}
  </button>
);

/* Dashboard View */
const DashboardView = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    orders: 0,
    kits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: cCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      const { data: oData } = await supabase
        .from("orders")
        .select("total, status");
      const { count: pCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      const orders = oData || [];
      const revenue = orders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + (Number(o.total) || 0), 0);
      setStats({
        revenue,
        customers: cCount || 0,
        orders: orders.length,
        kits: pCount || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-200"></i>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Completed Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon="fa-sack-dollar"
          color="bg-green-500"
        />
        <StatCard
          label="Elite Customers"
          value={stats.customers}
          icon="fa-users"
          color="bg-blue-500"
        />
        <StatCard
          label="Total Orders"
          value={stats.orders}
          icon="fa-box-open"
          color="bg-purple-500"
        />
        <StatCard
          label="Active Kits"
          value={stats.kits}
          icon="fa-boxes-stacked"
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-96 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 text-4xl mb-6">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            Revenue Trend
          </p>
          <p className="text-gray-300 text-sm mt-2">
            Data visualization pending next cycle.
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-96 overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-list-ul text-primary"></i> System Logs
          </h3>
          <div className="space-y-4">
            <LogItem
              label="Price updated for 'Adonis Survival Kit'"
              time="2 mins ago"
              type="update"
            />
            <LogItem
              label="New order #ORD-7782 received"
              time="15 mins ago"
              type="order"
            />
            <LogItem
              label="Happy Hour started: 'Sunday BBQ'"
              time="1 hour ago"
              type="alert"
            />
            <LogItem
              label="Database backup successful"
              time="3 hours ago"
              type="system"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
      >
        <i className={`fa-solid ${icon}`}></i>
      </div>
    </div>
    <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
      {label}
    </p>
  </div>
);

const LogItem = ({ label, time, type }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
    <div className="w-2 h-2 rounded-full bg-primary/40"></div>
    <div className="flex-1">
      <p className="text-sm font-bold text-gray-800">{label}</p>
      <p className="text-[10px] text-gray-400 mt-1">{time}</p>
    </div>
  </div>
);

/* Orders View with Details - Enhanced with Real-time & Filters */
const OrdersView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setOrders(data || []);
  };

  const fetchOrderHistory = async (orderId: string) => {
    const { data } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setOrderHistory(data || []);
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscription for new orders
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          // Refresh orders on any change
          fetchOrders();

          // If selected order was updated, refresh it
          if (
            selectedOrder &&
            payload.new &&
            (payload.new as any).id === selectedOrder.id
          ) {
            setSelectedOrder(payload.new as any);
            fetchOrderHistory((payload.new as any).id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderHistory(selectedOrder.id);
    }
  }, [selectedOrder]);

  const updateStatus = async (id: string, newStatus: string) => {
    // Get order details before updating
    const { data: order } = await supabase
      .from("orders")
      .select("user_id, total, status")
      .eq("id", id)
      .single();

    // Update order status
    await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    // Add to status history
    await supabase.from("order_status_history").insert({
      order_id: id,
      status: newStatus,
      note: adminNote || `Status changed to ${newStatus}`,
    });

    // Process impact when order is delivered
    if (newStatus === "delivered" && order && order.user_id) {
      const orderTotal = order.total || 0;
      if (orderTotal > 0) {
        await processOrderImpact(id, order.user_id, orderTotal);
      }
    }

    setAdminNote("");
    fetchOrders();
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    await updateStatus(id, "cancelled");
  };

  const addAdminNote = async (id: string) => {
    if (!adminNote.trim()) return;
    await supabase
      .from("orders")
      .update({ admin_notes: adminNote })
      .eq("id", id);
    await supabase.from("order_status_history").insert({
      order_id: id,
      status: selectedOrder?.status || "pending",
      note: `Admin note: ${adminNote}`,
    });
    setAdminNote("");
    fetchOrders();
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, admin_notes: adminNote });
    }
  };

  // Filter orders by search query
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      o.full_name?.toLowerCase().includes(query) ||
      o.phone?.includes(query) ||
      o.id.toLowerCase().includes(query) ||
      o.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-amber-100 text-amber-700",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "preparing",
      label: "Preparing",
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "out_for_delivery",
      label: "Out for Delivery",
      color: "bg-orange-100 text-orange-700",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-700",
    },
  ];

  const getStatusColor = (status: string) => {
    return (
      statusOptions.find((s) => s.value === status)?.color ||
      "bg-gray-100 text-gray-700"
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Status</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Items</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Date</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-mono text-[11px] text-primary font-bold">
                  #{o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="p-4 font-bold">
                  {o.full_name || o.profiles?.full_name || "Guest User"}
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {o.phone || o.profiles?.phone || "-"}
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {o.items ? `${o.items.length} items` : "No items"}
                </td>
                <td className="p-4 font-black">
                  ${Number(o.total).toFixed(2)}
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 cursor-pointer ${getStatusColor(
                        o.status
                      )}`}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-4 text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="text-gray-400 hover:text-primary transition-colors p-2"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 w-full max-w-3xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Customer
                </p>
                <p className="font-bold">
                  {selectedOrder.full_name ||
                    selectedOrder.profiles?.full_name ||
                    "Guest"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Phone
                </p>
                <a
                  href={`tel:${
                    selectedOrder.phone || selectedOrder.profiles?.phone
                  }`}
                  className="font-bold text-primary"
                >
                  {selectedOrder.phone ||
                    selectedOrder.profiles?.phone ||
                    "N/A"}
                </a>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Address
                </p>
                <p className="font-bold">
                  {selectedOrder.address ||
                    selectedOrder.delivery_zone ||
                    "Standard Delivery"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Payment
                </p>
                <p className="font-bold capitalize">
                  {selectedOrder.payment_method || "Cash"}
                </p>
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Customer Notes
                  </p>
                  <p className="font-medium text-gray-600">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Order Items
              </p>
              {selectedOrder.items?.map((item: CartItem, idx: number) => (
                <div
                  key={idx}
                  className="flex gap-4 items-center p-3 bg-gray-50 rounded-xl"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      alt=""
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">
                    ${Number(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              {!selectedOrder.items && (
                <p className="text-gray-400 text-sm">No items data</p>
              )}
            </div>

            {/* Admin Notes */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Admin Notes
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm"
                />
                <button
                  onClick={() => addAdminNote(selectedOrder.id)}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold"
                >
                  Add Note
                </button>
              </div>
              {selectedOrder.admin_notes && (
                <p className="mt-2 text-sm text-gray-600 bg-yellow-50 p-2 rounded-lg">
                  <i className="fas fa-sticky-note text-yellow-500 mr-2"></i>
                  {selectedOrder.admin_notes}
                </p>
              )}
            </div>

            {/* Timeline / Status History */}
            {orderHistory.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-900 mb-3">Timeline</p>
                <div className="space-y-3">
                  {orderHistory.map((event) => (
                    <div key={event.id} className="flex gap-3 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(
                          event.status
                        )}`}
                      ></div>
                      <div>
                        <p className="font-medium capitalize">
                          {event.status.replace(/_/g, " ")}
                        </p>
                        {event.note && (
                          <p className="text-gray-500 text-xs">{event.note}</p>
                        )}
                        <p className="text-gray-400 text-xs">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total & Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <span className="text-gray-900 font-bold text-lg">Total</span>
              <span className="text-3xl font-black text-primary">
                ${Number(selectedOrder.total).toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {selectedOrder.status !== "delivered" &&
                selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, "delivered")}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Mark Delivered
                  </button>
                )}
              {selectedOrder.status !== "cancelled" && (
                <button
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
              )}
              {selectedOrder.phone || selectedOrder.profiles?.phone ? (
                <a
                  href={`https://wa.me/${(
                    selectedOrder.phone || selectedOrder.profiles?.phone
                  )?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                  <i className="fab fa-whatsapp mr-2"></i>
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Products/Kits View */
const ProductsView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    category: "essential",
  });
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this kit?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...data } = formData;
    if (id) {
      await supabase.from("products").update(data).eq("id", id);
    } else {
      await supabase.from("products").insert(data);
    }
    setIsModalOpen(false);
    fetchProducts();
    setFormData({ category: "essential" });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadImage(file);
      setFormData({ ...formData, image: publicUrl });
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (p: Product) => {
    setFormData(p);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setFormData({ category: "essential" });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-luxury text-2xl font-bold">Luxury Kit Inventory</h3>
        <button
          onClick={openNew}
          className="btn-3d px-8 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest"
        >
          <i className="fa-solid fa-plus mr-2"></i> Create New Kit
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex gap-6 hover:shadow-xl transition-all group"
          >
            <img
              src={p.image || "https://via.placeholder.com/150"}
              className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
              <p className="text-primary font-black text-xl mt-1">${p.price}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEdit(p)}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-primary transition-colors border border-gray-100"
                >
                  <i className="fa-solid fa-pen text-[10px]"></i>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 transition-colors border border-gray-100"
                >
                  <i className="fa-solid fa-trash text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">
              {formData.id ? "Edit Kit" : "New Luxury Kit"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                required
                placeholder="Kit Name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
              />
              <input
                required
                placeholder="Arabic Name"
                value={formData.nameAr || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-right"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder="Price ($)"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                />
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <option value="essential">Essential</option>
                  <option value="themed">Themed</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <label
                      className={`flex items-center justify-center w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors ${
                        uploading ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <span className="text-sm text-gray-500 font-bold">
                        {uploading ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up mr-2"></i>{" "}
                            Upload Image
                          </>
                        )}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <input
                      placeholder="Or enter URL manually"
                      value={formData.image || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      className="w-full mt-2 p-2 text-xs bg-transparent border-b border-gray-200 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <textarea
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 h-24"
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg"
                >
                  Save Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Customers View - Full CRM System */
const CustomersView = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setCustomers(data || []);
    };

    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("customer_transactions")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      setTransactions(data || []);
    };

    fetchCustomers();
    fetchTransactions();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const matchesTier = filterTier === "all" || customer.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const handleAdjustPoints = async () => {
    if (!selectedCustomer || adjustPoints === 0) return;

    try {
      // Add transaction record
      await supabase.from("customer_transactions").insert({
        customer_id: selectedCustomer.id,
        type: "adjust",
        points: adjustPoints,
        note: adjustNote || "Manual adjustment",
      });

      // Update customer points
      await supabase.rpc("increment_points", {
        user_id: selectedCustomer.id,
        amount: adjustPoints,
      });

      // Refresh data
      const { data: updatedCustomers } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setCustomers(updatedCustomers || []);

      // Refresh transactions
      const { data: updatedTransactions } = await supabase
        .from("customer_transactions")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      setTransactions(updatedTransactions || []);

      setIsAdjustModalOpen(false);
      setAdjustPoints(0);
      setAdjustNote("");
      alert("Points adjusted successfully!");
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert("Error adjusting points");
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "vip":
        return "bg-purple-500 text-white";
      case "gold":
        return "bg-yellow-500 text-yellow-900";
      case "silver":
        return "bg-gray-400 text-gray-900";
      default:
        return "bg-amber-800 text-amber-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="font-bold text-xl">Customer Relationship Management</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-64"
          />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="all">All Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h4 className="font-bold text-lg">Customer Database</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Visits</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold">
                      {customer.full_name || "Anonymous"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getTierColor(
                          customer.tier
                        )}`}
                      >
                        {customer.tier || "Bronze"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-700">
                      {customer.points?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 font-bold">
                      ${customer.total_spent?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {customer.visits_count || 0}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-primary hover:text-primary-dark font-bold text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h4 className="font-bold text-lg mb-4">Recent Activity</h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-gray-100 pb-3 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">
                      {transaction.profiles?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      transaction.points >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.points >= 0 ? "+" : ""}
                    {transaction.points}
                  </span>
                </div>
                {transaction.note && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {transaction.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {selectedCustomer.full_name}
                </h3>
                <p className="text-gray-500">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Current Tier
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(
                    selectedCustomer.tier
                  )}`}
                >
                  {selectedCustomer.tier || "Bronze"}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Points
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedCustomer.points?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Spent
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ${selectedCustomer.total_spent?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Visits
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedCustomer.visits_count || 0}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="font-bold text-lg mb-4">Points History</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {transactions
                  .filter((t) => t.customer_id === selectedCustomer.id)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-bold text-sm capitalize">
                          {transaction.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.note}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`font-bold text-lg ${
                          transaction.points >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.points >= 0 ? "+" : ""}
                        {transaction.points}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
            >
              Adjust Points
            </button>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Adjust Points</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Points Adjustment
                </label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  placeholder="Enter points (positive or negative)"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl h-24"
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustPoints}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Rewards View - Full Loyalty Engine */
const RewardsView = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"rewards" | "redemptions">(
    "rewards"
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points_required: 0,
    reward_type: "discount",
    value: 0,
    stock_limit: null,
    expires_at: "",
  });

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      setRewards(data || []);
    };

    const fetchRedemptions = async () => {
      const { data } = await supabase
        .from("reward_redemptions")
        .select("*, profiles(full_name), rewards(title)")
        .order("created_at", { ascending: false });
      setRedemptions(data || []);
    };

    fetchRewards();
    fetchRedemptions();
  }, []);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from("rewards").insert({
        ...formData,
        stock_limit: formData.stock_limit || null,
        expires_at: formData.expires_at || null,
      });

      const { data } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      setRewards(data || []);

      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        points_required: 0,
        reward_type: "discount",
        value: 0,
        stock_limit: null,
        expires_at: "",
      });
      alert("Reward created successfully!");
    } catch (error) {
      console.error("Error creating reward:", error);
      alert("Error creating reward");
    }
  };

  const handleEditReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase
        .from("rewards")
        .update({
          ...formData,
          stock_limit: formData.stock_limit || null,
          expires_at: formData.expires_at || null,
        })
        .eq("id", editingReward.id);

      const { data } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      setRewards(data || []);

      setIsEditModalOpen(false);
      setEditingReward(null);
      alert("Reward updated successfully!");
    } catch (error) {
      console.error("Error updating reward:", error);
      alert("Error updating reward");
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    try {
      await supabase.from("rewards").delete().eq("id", id);
      setRewards(rewards.filter((r) => r.id !== id));
      alert("Reward deleted successfully!");
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Error deleting reward");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("rewards")
        .update({ active: !currentStatus })
        .eq("id", id);
      setRewards(
        rewards.map((r) => (r.id === id ? { ...r, active: !currentStatus } : r))
      );
    } catch (error) {
      console.error("Error updating reward status:", error);
    }
  };

  const handleApproveRedemption = async (id: string) => {
    try {
      const redemption = redemptions.find((r) => r.id === id);
      if (!redemption) return;

      // Update redemption status
      await supabase
        .from("reward_redemptions")
        .update({
          status: "approved",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", id);

      // Deduct points from customer
      await supabase.rpc("increment_points", {
        user_id: redemption.customer_id,
        amount: -redemption.rewards.points_required,
      });

      // Refresh data
      const { data } = await supabase
        .from("reward_redemptions")
        .select("*, profiles(full_name), rewards(title)")
        .order("created_at", { ascending: false });
      setRedemptions(data || []);

      alert("Redemption approved successfully!");
    } catch (error) {
      console.error("Error approving redemption:", error);
      alert("Error approving redemption");
    }
  };

  const handleRejectRedemption = async (id: string) => {
    try {
      await supabase
        .from("reward_redemptions")
        .update({ status: "rejected" })
        .eq("id", id);

      const { data } = await supabase
        .from("reward_redemptions")
        .select("*, profiles(full_name), rewards(title)")
        .order("created_at", { ascending: false });
      setRedemptions(data || []);

      alert("Redemption rejected!");
    } catch (error) {
      console.error("Error rejecting redemption:", error);
      alert("Error rejecting redemption");
    }
  };

  const openEditModal = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || "",
      points_required: reward.points_required,
      reward_type: reward.reward_type,
      value: reward.value || 0,
      stock_limit: reward.stock_limit,
      expires_at: reward.expires_at ? reward.expires_at.split("T")[0] : "",
    });
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "used":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">Loyalty Rewards Engine</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-6 py-2 rounded-xl font-bold text-sm ${
              activeTab === "rewards"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`px-6 py-2 rounded-xl font-bold text-sm ${
              activeTab === "redemptions"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Redemptions
          </button>
          {activeTab === "rewards" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i> Create Reward
            </button>
          )}
        </div>
      </div>

      {activeTab === "rewards" ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h4 className="font-bold text-lg">Available Rewards</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Reward</th>
                  <th className="p-4">Points Required</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rewards.map((reward) => (
                  <tr
                    key={reward.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold">{reward.title}</p>
                        <p className="text-xs text-gray-500">
                          {reward.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {reward.points_required.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                        {reward.reward_type}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      ${reward.value?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4">
                      {reward.stock_limit ? (
                        <span className="text-sm">
                          {reward.stock_limit} remaining
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Unlimited</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          handleToggleActive(reward.id, reward.active)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          reward.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {reward.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(reward)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rewards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      No rewards created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h4 className="font-bold text-lg">Reward Redemptions</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Reward</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {redemptions.map((redemption) => (
                  <tr
                    key={redemption.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold">
                      {redemption.profiles?.full_name || "Unknown"}
                    </td>
                    <td className="p-4">
                      {redemption.rewards?.title || "Unknown"}
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {redemption.rewards?.points_required?.toLocaleString() ||
                        0}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                          redemption.status
                        )}`}
                      >
                        {redemption.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(redemption.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {redemption.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleApproveRedemption(redemption.id)
                            }
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleRejectRedemption(redemption.id)
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {redemptions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      No redemptions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Reward Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Create New Reward</h3>
            <form onSubmit={handleCreateReward} className="space-y-4">
              <input
                required
                placeholder="Reward Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl h-24"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder="Points Required"
                  value={formData.points_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points_required: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
                <select
                  value={formData.reward_type}
                  onChange={(e) =>
                    setFormData({ ...formData, reward_type: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                >
                  <option value="discount">Discount</option>
                  <option value="free_item">Free Item</option>
                  <option value="cashback">Cashback</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Value ($)"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="number"
                placeholder="Stock Limit (optional)"
                value={formData.stock_limit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="date"
                placeholder="Expiry Date (optional)"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {isEditModalOpen && editingReward && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Edit Reward</h3>
            <form onSubmit={handleEditReward} className="space-y-4">
              <input
                required
                placeholder="Reward Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl h-24"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder="Points Required"
                  value={formData.points_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points_required: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
                <select
                  value={formData.reward_type}
                  onChange={(e) =>
                    setFormData({ ...formData, reward_type: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                >
                  <option value="discount">Discount</option>
                  <option value="free_item">Free Item</option>
                  <option value="cashback">Cashback</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Value ($)"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="number"
                placeholder="Stock Limit (optional)"
                value={formData.stock_limit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="date"
                placeholder="Expiry Date (optional)"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Update Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Happy Hours View - Automated Promotion Engine */
const HappyHourView = () => {
  const [happyHours, setHappyHours] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHappyHour, setEditingHappyHour] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    days_of_week: [] as number[],
    multiplier: 1,
    bonus_points: 0,
  });

  useEffect(() => {
    const fetchHappyHours = async () => {
      const { data } = await supabase
        .from("happy_hours_schedule")
        .select("*")
        .order("created_at", { ascending: false });
      setHappyHours(data || []);
    };
    fetchHappyHours();
  }, []);

  const handleCreateHappyHour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from("happy_hours_schedule").insert({
        ...formData,
        days_of_week: formData.days_of_week,
      });

      const { data } = await supabase
        .from("happy_hours_schedule")
        .select("*")
        .order("created_at", { ascending: false });
      setHappyHours(data || []);

      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        start_time: "",
        end_time: "",
        days_of_week: [],
        multiplier: 1,
        bonus_points: 0,
      });
      alert("Happy hour created successfully!");
    } catch (error) {
      console.error("Error creating happy hour:", error);
      alert("Error creating happy hour");
    }
  };

  const handleEditHappyHour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase
        .from("happy_hours_schedule")
        .update({
          ...formData,
          days_of_week: formData.days_of_week,
        })
        .eq("id", editingHappyHour.id);

      const { data } = await supabase
        .from("happy_hours_schedule")
        .select("*")
        .order("created_at", { ascending: false });
      setHappyHours(data || []);

      setIsEditModalOpen(false);
      setEditingHappyHour(null);
      alert("Happy hour updated successfully!");
    } catch (error) {
      console.error("Error updating happy hour:", error);
      alert("Error updating happy hour");
    }
  };

  const handleDeleteHappyHour = async (id: string) => {
    if (!confirm("Are you sure you want to delete this happy hour?")) return;
    try {
      await supabase.from("happy_hours_schedule").delete().eq("id", id);
      setHappyHours(happyHours.filter((hh) => hh.id !== id));
      alert("Happy hour deleted successfully!");
    } catch (error) {
      console.error("Error deleting happy hour:", error);
      alert("Error deleting happy hour");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("happy_hours_schedule")
        .update({ active: !currentStatus })
        .eq("id", id);
      setHappyHours(
        happyHours.map((hh) =>
          hh.id === id ? { ...hh, active: !currentStatus } : hh
        )
      );
    } catch (error) {
      console.error("Error updating happy hour status:", error);
    }
  };

  const openEditModal = (happyHour: any) => {
    setEditingHappyHour(happyHour);
    setFormData({
      name: happyHour.name,
      start_time: happyHour.start_time,
      end_time: happyHour.end_time,
      days_of_week: happyHour.days_of_week || [],
      multiplier: happyHour.multiplier || 1,
      bonus_points: happyHour.bonus_points || 0,
    });
    setIsEditModalOpen(true);
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const getDayName = (day: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[day];
  };

  const getActiveStatus = (happyHour: any) => {
    if (!happyHour.active)
      return { text: "Inactive", color: "bg-gray-100 text-gray-600" };

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().substring(0, 5);

    const isActiveDay = happyHour.days_of_week?.includes(currentDay);
    const isWithinTime =
      currentTime >= happyHour.start_time && currentTime <= happyHour.end_time;

    if (isActiveDay && isWithinTime) {
      return { text: "Active Now", color: "bg-green-100 text-green-700" };
    }

    return { text: "Scheduled", color: "bg-yellow-100 text-yellow-700" };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">Automated Promotion Engine</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Create Happy Hour
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h4 className="font-bold text-lg">Scheduled Happy Hours</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Multiplier</th>
                  <th className="p-4">Bonus Points</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {happyHours.map((happyHour) => {
                  const status = getActiveStatus(happyHour);
                  return (
                    <tr
                      key={happyHour.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 font-bold">{happyHour.name}</td>
                      <td className="p-4">
                        <span className="font-mono">
                          {happyHour.start_time} - {happyHour.end_time}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {happyHour.days_of_week?.map((day: number) => (
                            <span
                              key={day}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {getDayName(day)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-primary">
                          {happyHour.multiplier}x
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-green-600">
                          +{happyHour.bonus_points}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() =>
                            handleToggleActive(happyHour.id, happyHour.active)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                        >
                          {status.text}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(happyHour)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHappyHour(happyHour.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {happyHours.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      No happy hours scheduled yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h4 className="font-bold text-lg mb-4">How It Works</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h5 className="font-bold">Create Schedule</h5>
                <p className="text-sm text-gray-600">
                  Set specific times and days for promotions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h5 className="font-bold">Set Multipliers</h5>
                <p className="text-sm text-gray-600">
                  Configure 2x, 3x points or bonus points
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h5 className="font-bold">Automatic Application</h5>
                <p className="text-sm text-gray-600">
                  System applies promotions during checkout
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h4 className="font-bold text-lg mb-4">Best Practices</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-500 mt-1"></i>
              <span>Schedule during low-traffic periods</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-500 mt-1"></i>
              <span>Use 2x multiplier for regular promotions</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-500 mt-1"></i>
              <span>Add bonus points for special events</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check text-green-500 mt-1"></i>
              <span>Test different time slots</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Create Happy Hour Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Create Happy Hour</h3>
            <form onSubmit={handleCreateHappyHour} className="space-y-4">
              <input
                required
                placeholder="Happy Hour Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  required
                  placeholder="Start Time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="time"
                  required
                  placeholder="End Time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  Days of Week
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-lg text-sm font-bold ${
                        formData.days_of_week.includes(day)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getDayName(day)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Points Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        multiplier: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    placeholder="e.g., 2 for 2x points"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Bonus Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonus_points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bonus_points: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    placeholder="Additional points"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Create Happy Hour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Happy Hour Modal */}
      {isEditModalOpen && editingHappyHour && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Edit Happy Hour</h3>
            <form onSubmit={handleEditHappyHour} className="space-y-4">
              <input
                required
                placeholder="Happy Hour Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  required
                  placeholder="Start Time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="time"
                  required
                  placeholder="End Time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  Days of Week
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-lg text-sm font-bold ${
                        formData.days_of_week.includes(day)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getDayName(day)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Points Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        multiplier: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    placeholder="e.g., 2 for 2x points"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Bonus Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonus_points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bonus_points: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    placeholder="Additional points"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Update Happy Hour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Impact Campaigns View - Admin */
const ImpactView = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    image_url: "",
    goal_amount: 0,
    goal_type: "trees",
    impact_per_dollar: 1,
    is_active: true,
    show_on_impact_page: true,
  });

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from("impact_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  const fetchLeaderboard = async () => {
    const { data: contributions } = await supabase
      .from("user_impact")
      .select("user_id, impact_units, created_at")
      .order("impact_units", { ascending: false });

    if (!contributions) return;

    // Aggregate by user
    const userTotals: Record<string, number> = {};
    contributions.forEach((item) => {
      if (!userTotals[item.user_id]) userTotals[item.user_id] = 0;
      userTotals[item.user_id] += item.impact_units || 0;
    });

    const sorted = Object.entries(userTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Get names
    const userIds = sorted.map(([id]) => id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    setLeaderboard(
      sorted.map(([userId, impact], index) => ({
        rank: index + 1,
        name: nameMap.get(userId) || "Anonymous",
        impact: Math.floor(impact),
      }))
    );
  };

  useEffect(() => {
    fetchCampaigns();
    fetchLeaderboard();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("impact_campaigns").insert(formData);
    setIsModalOpen(false);
    setFormData({
      title: "",
      description: "",
      image_url: "",
      goal_amount: 0,
      goal_type: "trees",
      impact_per_dollar: 1,
      is_active: true,
      show_on_impact_page: true,
    });
    fetchCampaigns();
  };

  const toggleCampaign = async (id: string, isActive: boolean) => {
    await supabase
      .from("impact_campaigns")
      .update({ is_active: !isActive })
      .eq("id", id);
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("impact_campaigns").delete().eq("id", id);
    fetchCampaigns();
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      trees: "Trees",
      meals: "Meals",
      donations: "Donations",
      water: "Water (L)",
      books: "Books",
      medicine: "Medicine Kits",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">Impact Campaigns</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl"
        >
          <i className="fas fa-plus mr-2"></i>
          New Campaign
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const progress =
            campaign.goal_amount > 0
              ? Math.min(
                  (campaign.current_amount / campaign.goal_amount) * 100,
                  100
                )
              : 0;

          return (
            <div
              key={campaign.id}
              className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden ${
                !campaign.is_active ? "opacity-60" : ""
              }`}
            >
              {campaign.image_url && (
                <div className="h-40 bg-gray-100">
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{campaign.title}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      campaign.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {campaign.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-bold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${campaign.current_amount || 0} raised of $
                    {campaign.goal_amount} goal
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleCampaign(campaign.id, campaign.is_active)
                    }
                    className={`flex-1 py-2 rounded-xl text-sm font-bold ${
                      campaign.is_active
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {campaign.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <i className="fas fa-globe text-4xl mb-4"></i>
            <p>No campaigns yet. Create your first impact campaign!</p>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-[2rem] p-6 border shadow-sm">
        <h4 className="font-bold text-lg mb-4">Top Contributors</h4>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  entry.rank === 1
                    ? "bg-yellow-400 text-yellow-900"
                    : entry.rank === 2
                    ? "bg-gray-300 text-gray-700"
                    : entry.rank === 3
                    ? "bg-amber-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {entry.rank}
              </div>
              <div className="flex-1">
                <p className="font-bold">{entry.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{entry.impact}</p>
                <p className="text-xs text-gray-500">impact units</p>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-center text-gray-400 py-4">
              No contributors yet
            </p>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6">New Impact Campaign</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                  placeholder="e.g., Plant Trees for Gaza"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Goal Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.goal_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goal_amount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Impact Type
                  </label>
                  <select
                    value={formData.goal_type}
                    onChange={(e) =>
                      setFormData({ ...formData, goal_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-xl"
                  >
                    <option value="trees">Trees</option>
                    <option value="meals">Meals</option>
                    <option value="donations">Donations</option>
                    <option value="water">Water (Liters)</option>
                    <option value="books">Books</option>
                    <option value="medicine">Medicine Kits</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Impact per Dollar
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.impact_per_dollar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impact_per_dollar: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                  placeholder="e.g., 0.1 = 1 tree per $10"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView = () => {
  const { settings: globalSettings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(globalSettings);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    await updateSettings(localSettings);
    alert("Global configurations synchronized.");
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadImage(file);
      setLocalSettings({ ...localSettings, logo_url: publicUrl });
    } catch (error) {
      alert("Error uploading logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="font-luxury text-2xl font-bold mb-8">
          Terminal Configurations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={localSettings.store_name}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    store_name: e.target.value,
                  })
                }
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/5 outline-none font-bold text-sm transition-all"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Store Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                  {localSettings.logo_url ? (
                    <img
                      src={localSettings.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-2xl font-bold">L</span>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    className={`btn-3d px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-2 ${
                      uploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {uploading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fa-solid fa-upload"></i>
                    )}
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-[9px] text-gray-400 mt-2">
                    Recommended size: 512x512px (PNG/JPG)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">
                  Maintenance Mode
                </span>
                <button
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      maintenance_mode: !localSettings.maintenance_mode,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    localSettings.maintenance_mode
                      ? "bg-red-500"
                      : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      localSettings.maintenance_mode ? "right-1" : "left-1"
                    }`}
                  ></div>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                When active, users will see a "Service Upgrading" message
                instead of the shop.
              </p>
            </div>
          </div>

          <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-5 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                <i className="fa-solid fa-heart"></i> Kit For Good Program
              </h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Auto-Contribution
                  </span>
                  <button className="w-10 h-5 bg-green-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </button>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Donation Ratio
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      defaultValue={5}
                      className="w-16 p-2 bg-white border border-gray-100 rounded-lg text-center font-black text-primary"
                    />
                    <span className="text-[10px] font-bold text-gray-400 italic">
                      Kits sold per 1 Kit donated
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-gray-50 flex justify-end">
          <button
            onClick={handleSave}
            className="btn-3d px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
          >
            Commit Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
