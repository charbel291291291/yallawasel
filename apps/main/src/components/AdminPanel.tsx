import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ADMIN_PASSWORD } from "../constants";
import { AdminTab } from "../admin/types";
import SmartKitBuilder from "./smart-kit-builder/SmartKitBuilder";
import ConfirmModal from "./ConfirmModal";

// Modular Views
import DashboardView from "../admin/DashboardView";
import OrdersView from "../admin/OrdersView";
import ProductsView from "../admin/ProductsView";
import CustomersView from "../admin/CustomersView";
import RewardsView from "../admin/RewardsView";
import HappyHourView from "../admin/HappyHourView";
import ImpactView from "../admin/ImpactView";
import ChartSettingsView from "../admin/ChartSettingsView";
import SettingsView from "../admin/SettingsView";
import DriverVerificationView from "../admin/DriverVerificationView";

type Tab = AdminTab;

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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Redirect handled by specific logout/login actions
  /* 
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  */

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
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${i < pin.length
                      ? "bg-red-500 shadow-[0_0_10px_#ef4444] scale-110"
                      : "bg-slate-900 shadow-inner scale-90"
                      }`}
                  ></div>
                ))}
              </div>
              <div
                className={`absolute bottom-2 left-0 right-0 text-center text-[9px] font-black uppercase tracking-widest transition-opacity duration-300 ${error
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
      case "kit_builder":
        return <SmartKitBuilder />;
      case "customers":
        return <CustomersView />;
      case "rewards":
        return <RewardsView />;
      case "happyhour":
        return <HappyHourView />;
      case "impact":
        return <ImpactView />;
      case "chart_settings":
        return <ChartSettingsView />;
      case "verification":
        return <DriverVerificationView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  /* Sidebar Drag Logic */
  const [sidebarPos, setSidebarPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFloating, setIsFloating] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloating) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - sidebarPos.x,
      y: e.clientY - sidebarPos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setSidebarPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleFloat = () => {
    if (!isFloating) {
      setSidebarPos({ x: 20, y: 80 });
      setIsFloating(true);
      setSidebarOpen(true);
    } else {
      setIsFloating(false);
      setSidebarPos({ x: 0, y: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] font-sans text-[var(--admin-text)] pb-20 md:pb-0 relative overflow-hidden flex">
      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-between px-2 items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {[
          { id: "dashboard", icon: "fa-chart-pie", label: "Home" },
          { id: "orders", icon: "fa-shopping-cart", label: "Orders" },
          { id: "products", icon: "fa-box", label: "Kits" },
          { id: "customers", icon: "fa-users", label: "Users" },
          { id: "settings", icon: "fa-bars", label: "Menu" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === tab.id
              ? "text-[var(--admin-primary)]"
              : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <i
              className={`fa-solid ${tab.icon} text-xl transition-transform ${activeTab === tab.id ? "scale-110" : ""
                }`}
            ></i>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <aside
        className={`hidden md:flex flex-col z-50 transition-all duration-300 bg-[var(--admin-primary)] text-white shadow-2xl relative
          ${isSidebarOpen ? "w-64" : "w-20"}
          ${isFloating
            ? "fixed rounded-2xl m-4 h-[calc(100vh-2rem)]"
            : "sticky top-0 h-screen"
          }
        `}
        style={
          isFloating ? { left: sidebarPos.x, top: sidebarPos.y, zIndex: 100 } : {}
        }
      >
        <div
          onMouseDown={handleMouseDown}
          className={`h-20 flex items-center justify-center border-b border-white/10 flex-shrink-0 relative ${isFloating ? "cursor-move" : ""
            }`}
        >
          <div className="flex items-center gap-3 font-bold text-xl pointer-events-none select-none">
            <div className="w-10 h-10 bg-white text-[var(--admin-primary)] rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-black text-xl">A</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight">Adonis</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-tight">
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <SidebarGroup label="Overview" isOpen={isSidebarOpen}>
            <SidebarItem
              icon="fa-chart-pie"
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              isOpen={isSidebarOpen}
            />
          </SidebarGroup>

          <SidebarGroup label="Management" isOpen={isSidebarOpen}>
            <SidebarItem
              icon="fa-shopping-cart"
              label="Orders"
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
              isOpen={isSidebarOpen}
            />
            <SidebarItem
              icon="fa-box-open"
              label="Kits & Products"
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
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
              icon="fa-id-card-clip"
              label="Driver Verification"
              active={activeTab === "verification"}
              onClick={() => setActiveTab("verification")}
              isOpen={isSidebarOpen}
            />
          </SidebarGroup>

          <SidebarGroup label="Features" isOpen={isSidebarOpen}>
            <SidebarItem
              icon="fa-wand-magic-sparkles"
              label="Smart Kit AI"
              active={activeTab === "kit_builder"}
              onClick={() => setActiveTab("kit_builder")}
              isOpen={isSidebarOpen}
            />
            <SidebarItem
              icon="fa-gift"
              label="Rewards Program"
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
              label="Our Impact"
              active={activeTab === "impact"}
              onClick={() => setActiveTab("impact")}
              isOpen={isSidebarOpen}
            />
            <SidebarItem
              icon="fa-arrow-trend-up"
              label="Live Chart"
              active={activeTab === "chart_settings"}
              onClick={() => setActiveTab("chart_settings")}
              isOpen={isSidebarOpen}
            />
          </SidebarGroup>

          <div className="my-4 border-t border-white/10"></div>

          <SidebarItem
            icon="fa-sliders"
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <ConfirmModal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            onConfirm={() => {
              sessionStorage.removeItem("admin_auth");
              localStorage.removeItem("isAdmin");
              setIsAuthenticated(false);
              navigate("/");
            }}
            title="Secure Logout"
            message="Are you sure you want to exit the admin terminal?"
            confirmText="Logout"
            variant="danger"
          />
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`flex items-center gap-3 w-full p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${!isSidebarOpen && "justify-center"
              }`}
          >
            <i className="fa-solid fa-power-off"></i>
            {isSidebarOpen && (
              <span className="font-bold text-xs uppercase tracking-wider">
                Logout
              </span>
            )}
          </button>
        </div>

        {!isFloating && (
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-24 w-6 h-6 bg-white text-[var(--admin-primary)] rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50 border border-gray-200"
          >
            <i
              className={`fa-solid fa-chevron-${isSidebarOpen ? "left" : "right"
                } text-xs`}
            ></i>
          </button>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-[var(--admin-border)] flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 capitalize">
              {activeTab.replace("_", " ")}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
              v2.0.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFloat}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isFloating
                ? "bg-primary/10 text-primary"
                : "hover:bg-gray-100 text-gray-400"
                }`}
              title="Toggle Floating Sidebar"
            >
              <i className="fa-solid fa-layer-group"></i>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <Link to="/" className="btn-admin btn-admin-secondary text-xs py-2 px-3">
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Visit Site
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[var(--admin-bg)] p-8 text-slate-900">
          <div
            className={`mx-auto animate-fadeIn ${!isFloating && isSidebarOpen ? "max-w-7xl" : "max-w-[1600px]"
              }`}
          >
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

/* Sidebar Components */
const SidebarGroup = ({
  label,
  children,
  isOpen,
}: {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
}) => (
  <div className="mb-4">
    {isOpen && (
      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
        {label}
      </div>
    )}
    <div className="space-y-1">{children}</div>
  </div>
);

const SidebarItem = ({
  icon,
  label,
  active,
  onClick,
  isOpen,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  isOpen: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
      ${active
        ? "bg-white/10 text-white shadow-sm"
        : "text-gray-400 hover:text-white hover:bg-white/5"
      }
      ${!isOpen ? "justify-center" : ""}
    `}
  >
    <i
      className={`fa-solid ${icon} w-5 text-center text-sm ${active ? "text-white" : "text-gray-500 group-hover:text-white"
        } transition-colors`}
    ></i>
    {isOpen && <span className="font-medium text-sm tracking-tight">{label}</span>}
    {!isOpen && (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </button>
);

export default AdminPanel;
