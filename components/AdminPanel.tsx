import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useSettings } from "../contexts/SettingsContext";
import { ADMIN_PASSWORD } from "../constants";
import { Product, Order, UserTier, OrderStatus, CartItem } from "../types";
import MounéClassesView from "./MounéClassesView";

type Tab =
  | "dashboard"
  | "orders"
  | "products"
  | "moune"
  | "customers"
  | "rewards"
  | "happyhour"
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

/* Orders View with Details */
const OrdersView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      setOrders(data || []);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-bold text-lg">Active Orders Pipeline</h3>
          <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">
            Refresh Feed
          </button>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="p-6">Reference</th>
              <th className="p-6">Client</th>
              <th className="p-6">Items</th>
              <th className="p-6">Amount</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-mono text-[11px] text-primary font-bold">
                  #{o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="p-6 font-bold">
                  {o.profiles?.full_name || "Guest User"}
                </td>
                <td className="p-6 text-xs text-gray-500">
                  {o.items ? `${o.items.length} items` : "No items data"}
                </td>
                <td className="p-6 font-black">
                  ${Number(o.total).toFixed(2)}
                </td>
                <td className="p-6">
                  <div className="flex justify-center">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 cursor-pointer ${
                        o.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : o.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="delivering">Delivering</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest"
                >
                  No orders found in ledger.
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
            className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                  selectedOrder.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {selectedOrder.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Customer
                </p>
                <p className="font-bold">{selectedOrder.profiles?.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Delivery Zone
                </p>
                <p className="font-bold">
                  {selectedOrder.delivery_zone || "Standard"}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
              <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Order Items
              </p>
              {selectedOrder.items?.map((item: CartItem, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <img
                    src={item.image}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">${item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <span className="text-gray-500 font-bold">Total Amount</span>
              <span className="text-2xl font-black text-primary">
                ${selectedOrder.total}
              </span>
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

/* Customers View - Replaces placeholder */
const CustomersView = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setCustomers(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50 bg-gray-50/30">
        <h3 className="font-bold text-lg">Elite Members Registry</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
          <tr>
            <th className="p-6">Name</th>
            <th className="p-6">Tier</th>
            <th className="p-6">Points</th>
            <th className="p-6">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="p-6 font-bold">{c.full_name || "Anonymous"}</td>
              <td className="p-6">
                <span className="px-3 py-1 bg-gold/10 text-yellow-700 rounded-full text-xs font-bold uppercase">
                  {c.tier || "Bronze"}
                </span>
              </td>
              <td className="p-6 font-mono font-bold text-gray-500">
                {c.points.toLocaleString()}
              </td>
              <td className="p-6 text-gray-400 text-xs">
                {new Date(c.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RewardsView = () => (
  <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 text-3xl mx-auto mb-6">
      <i className="fa-solid fa-gift"></i>
    </div>
    <h3 className="text-gray-900 font-bold text-xl mb-2">
      Points & Rewards Engine
    </h3>
    <p className="text-gray-400 max-w-sm mx-auto">
      Configure how many points users earn per dollar and what luxury items they
      can redeem.
    </p>
  </div>
);

const HappyHourView = () => (
  <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 text-3xl mx-auto mb-6">
      <i className="fa-solid fa-clock"></i>
    </div>
    <h3 className="text-gray-900 font-bold text-xl mb-2">
      Flash Sales & Happy Hours
    </h3>
    <p className="text-gray-400 max-w-sm mx-auto">
      Schedule time-limited discounts on specific kits to drive volume during
      low-traffic periods.
    </p>
  </div>
);

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
