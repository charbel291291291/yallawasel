import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import {
  CartItem,
  Product,
  User,
  UserTier,
  ViewState,
  Service,
  Reward,
  HappyHour,
  AppSettings,
  Order,
  MounéClass,
} from "./types";
import { MOCK_PRODUCTS, MOCK_SERVICES } from "./constants";
import WalletCard from "./components/WalletCard";
import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import AIChat from "./components/AIChat";
import CartDrawer from "./components/CartDrawer";
import HiddenAdminAccess from "./components/HiddenAdminAccess";
import { translations, Language } from "./translations";
import { supabase } from "./services/supabaseClient";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import MounéClassesSection from "./components/MounéClassesSection";
import OrderTrackingPage from "./components/OrderTrackingPage";
import {
  sendWhatsAppNotification,
  getWhatsAppUrl,
  OrderNotificationData,
} from "./services/whatsappNotification";
import MounéDetail from "./components/MounéDetail";
import Image from "./components/Image";
import OfflineIndicator from "./components/OfflineIndicator";
import AnimatedSplash from "./components/AnimatedSplash";
import InstallGate from "./components/InstallGate";
import InstallLanding from "./components/InstallLanding";
import BreakingNewsTicker from "./components/BreakingNewsTicker";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  // Check if mobile and standalone on mount
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Show landing only on mobile browser (not installed)
    setShowLanding(isMobile && !isStandalone);
  }, []);

  const handleSplashComplete = () => {
    setSplashComplete(true);
  };

  // While checking, show nothing (prevent flash)
  if (showLanding === null) {
    return null;
  }

  return (
    <SettingsProvider>
      <HashRouter>
        <>
          {!splashComplete && (
            <AnimatedSplash onComplete={handleSplashComplete} />
          )}
          {splashComplete && (
            <>
              {showLanding ? (
                <InstallLanding />
              ) : (
                <InstallGate>
                  <AppShell />
                </InstallGate>
              )}
            </>
          )}
        </>
      </HashRouter>
    </SettingsProvider>
  );
}

const AppShell = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mounéClasses, setMounéClasses] = useState<MounéClass[]>([]);
  const [lang, setLang] = useState<Language>("en");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [happyHours, setHappyHours] = useState<HappyHour[]>([]);
  const [happyHoursLoaded, setHappyHoursLoaded] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderNotificationData | null>(
    null
  );
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const { settings, loading: settingsLoading, isReady } = useSettings();
  const location = useLocation();
  const t = translations[lang];

  useEffect(() => {
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else if (productsData && productsData.length > 0) {
          setProducts(
            productsData.map((p: any) => ({
              id: p.id,
              name: p.name,
              nameAr: p.name_ar || p.name,
              description: p.description,
              descriptionAr: p.description_ar || p.description,
              price: Number(p.price),
              cost: Number(p.cost),
              stock: Number(p.stock),
              category: p.category,
              image: p.image,
              tags: p.tags || [],
              isActive: p.is_active,
            }))
          );
        }
        // Only use MOCK_PRODUCTS if no products in database

        // Fetch Mouné classes
        const { data: mounéData } = await supabase
          .from("moune_classes")
          .select("*")
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (mounéData && mounéData.length > 0) {
          setMounéClasses(
            mounéData.map((m: any) => ({
              id: m.id,
              name: m.name,
              nameAr: m.name_ar || m.name,
              description: m.description,
              descriptionAr: m.description_ar || m.description,
              totalWeight: m.total_weight || "",
              mealsCount: m.meals_count || 0,
              price: Number(m.price),
              cost: Number(m.cost) || 0,
              image: m.image,
              category: m.category || "",
              classType: m.class_type || "classic",
              isActive: m.is_active,
            }))
          );
        } else {
          // Set empty array so component shows its default classes
          setMounéClasses([]);
        }

        // Fetch active happy hours
        const { data: happyHoursData } = await supabase
          .from("happy_hours_schedule")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false });

        // Always set happy hours (empty array if none found)
        setHappyHours(happyHoursData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        // Products will remain empty, happy hours will remain empty
      } finally {
        setHappyHoursLoaded(true);
      }
    };
    fetchData();
  }, []);

  // Real-time subscription for database changes
  useEffect(() => {
    const happyHoursChannel = supabase
      .channel("happy_hours_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "happy_hours_schedule" },
        () => {
          // Refetch happy hours when database changes
          supabase
            .from("happy_hours_schedule")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) setHappyHours(data);
            });
        }
      )
      .subscribe();

    const productsChannel = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // Refetch products when database changes
          supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("name")
            .then(({ data }) => {
              if (data && data.length > 0) {
                setProducts(
                  data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    nameAr: p.name_ar || p.name,
                    description: p.description,
                    descriptionAr: p.description_ar || p.description,
                    price: Number(p.price),
                    cost: Number(p.cost),
                    stock: Number(p.stock),
                    category: p.category,
                    image: p.image,
                    tags: p.tags || [],
                    isActive: p.is_active,
                  }))
                );
              }
            });
        }
      )
      .subscribe();

    const mouneChannel = supabase
      .channel("moune_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moune_classes" },
        () => {
          // Refetch Mouné classes when database changes
          supabase
            .from("moune_classes")
            .select("*")
            .eq("is_active", true)
            .order("price", { ascending: true })
            .then(({ data }) => {
              if (data && data.length > 0) {
                setMounéClasses(
                  data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    nameAr: m.name_ar || m.name,
                    description: m.description,
                    descriptionAr: m.description_ar || m.description,
                    totalWeight: m.total_weight || "",
                    mealsCount: m.meals_count || 0,
                    price: Number(m.price),
                    cost: Number(m.cost) || 0,
                    image: m.image,
                    category: m.category || "",
                    classType: m.class_type || "classic",
                    isActive: m.is_active,
                  }))
                );
              }
            });
        }
      )
      .subscribe();

    return () => {
      // Safely remove channels with error handling
      try {
        if (happyHoursChannel) supabase.removeChannel(happyHoursChannel);
      } catch (e) {
        /* channel already removed */
      }
      try {
        if (productsChannel) supabase.removeChannel(productsChannel);
      } catch (e) {
        /* channel already removed */
      }
      try {
        if (mouneChannel) supabase.removeChannel(mouneChannel);
      } catch (e) {
        /* channel already removed */
      }
    };
  }, []);

  // Auth State Listener
  useEffect(() => {
    let mounted = true;

    const fetchUserProfile = async (userId: string, email: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (mounted && data) {
          setUser({
            id: data.id,
            name: data.full_name || "Valued Member",
            email,
            phone: data.phone || "",
            address: data.address || "",
            walletBalance: data.wallet_balance || 0,
            points: data.points || 0,
            tier: (data.tier as UserTier) || UserTier.BRONZE,
            isAdmin: data.is_admin || false,
            joinDate: data.created_at,
            status: "active",
          });
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session) {
          fetchUserProfile(session.user.id, session.user.email!);
        } else {
          setAuthLoading(false);
        }
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) {
          fetchUserProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setAuthLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    startTransition(() => {
      setUser(null);
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    startTransition(() => {
      setLang((prev) => (prev === "en" ? "ar" : "en"));
    });
  }, []);

  const addToCart = useCallback((product: Product) => {
    startTransition(() => {
      setCart((prev) => {
        const existing = prev.find((p) => p.id === product.id);
        if (existing)
          return prev.map((p) =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          );
        return [...prev, { ...product, quantity: 1 }];
      });
    });
    // Defer opening cart to avoid blocking
    setTimeout(() => setIsCartOpen(true), 0);
  }, []);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const deliveryFee = subtotal > 50 ? 0 : 5;
      const total = subtotal + deliveryFee;

      // Get user profile data for order details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("id", user.id)
        .single();

      // Create Order with all details
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          full_name: profile?.full_name || user.name || "Customer",
          phone: profile?.phone || user.phone || "",
          address: profile?.address || "",
          total: total,
          delivery_fee: deliveryFee,
          status: "pending",
          payment_method: "cash",
          delivery_zone: "Adonis",
          items: cart,
        })
        .select()
        .single();

      if (error) {
        console.error("Order insert error:", error);
        throw error;
      }

      console.log("Order created successfully:", data);

      // Create initial status history entry
      if (data) {
        await supabase.from("order_status_history").insert({
          order_id: data.id,
          status: "pending",
          note: "Order placed by customer",
          created_by: user.id,
        });

        // Store order data for WhatsApp notification (show modal instead of auto-open)
        const orderData: OrderNotificationData = {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          total: data.total,
          items: data.items,
          order_id: data.id,
          adminPhone: settings?.contact_phone,
        };
        setLastOrder(orderData);
        setShowOrderSuccess(true);
      }

      // Update User Points (10 points per dollar)
      const pointsEarned = Math.floor(total * 10);
      await supabase.rpc("increment_points", {
        user_id: user.id,
        amount: pointsEarned,
      });
      // If RPC doesn't exist, we can fall back to manual update:
      // await supabase.from('profiles').update({ points: user.points + pointsEarned }).eq('id', user.id);

      // Refresh User Profile to get new points
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Use startTransition for UI updates after async work
      startTransition(() => {
        if (updatedProfile) {
          setUser((prev) =>
            prev ? { ...prev, points: updatedProfile.points } : null
          );
        }

        setCart([]);
        setIsCartOpen(false);
      });

      // Show success modal instead of alert
      // (showOrderSuccess is already set above)
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    window.location.hash.includes("admin");
  const isLoginPage = location.pathname === "/login";

  if (authLoading && !isAdminRoute) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pb-24 sm:pb-0 ${
        isAdminRoute ? "" : "pt-24"
      }`}
    >
      {!isAdminRoute && (
        <ErrorBoundary>
          <HiddenAdminAccess>
            <Navbar
              user={user}
              settings={settings}
              cartCount={cart.length}
              lang={lang}
              toggleLanguage={toggleLanguage}
              onLogout={handleLogout}
              onOpenCart={() => setIsCartOpen(true)}
              mounéClasses={mounéClasses}
            />
            <BreakingNewsTicker happyHours={happyHours} lang={lang} />
          </HiddenAdminAccess>
        </ErrorBoundary>
      )}

      <div
        className={isAdminRoute ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <HomePage
                  products={products}
                  addToCart={addToCart}
                  lang={lang}
                  settings={settings}
                />
              </ErrorBoundary>
            }
          />
          <Route
            path="/shop"
            element={
              <ErrorBoundary>
                <ShopPage
                  products={products}
                  addToCart={addToCart}
                  lang={lang}
                  settings={settings}
                />
              </ErrorBoundary>
            }
          />
          <Route
            path="/impact"
            element={
              <ErrorBoundary>
                <ImpactPage lang={lang} settings={settings} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/services"
            element={
              <ErrorBoundary>
                <ServicesPage lang={lang} user={user} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/moune"
            element={
              <ErrorBoundary>
                <MounéClassesSection lang={lang} addToCart={addToCart} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/moune/:id"
            element={
              <ErrorBoundary>
                <MounéDetail lang={lang} addToCart={addToCart} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                {user ? (
                  <ProfilePage
                    user={user}
                    lang={lang}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/login" />
                )}
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <AdminPanel />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                {user ? <Navigate to="/profile" /> : <LoginPage lang={lang} />}
              </ErrorBoundary>
            }
          />
          <Route
            path="/order/:id"
            element={
              <ErrorBoundary>
                <OrderTrackingPage lang={lang} />
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        lang={lang}
        user={user}
        onCheckout={handleCheckout}
        checkoutLoading={checkoutLoading}
      />

      {/* Order Success Modal */}
      {showOrderSuccess && lastOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-bounce-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {lang === "ar" ? "تم استلام طلبك!" : "Order Received!"}
              </h2>
              <p className="text-gray-600 mb-4">
                {lang === "ar"
                  ? `طلبك #${lastOrder.order_id
                      .slice(0, 8)
                      .toUpperCase()} قيد التجهيز`
                  : `Order #${lastOrder.order_id
                      .slice(0, 8)
                      .toUpperCase()} is being prepared`}
              </p>

              {/* WhatsApp Button */}
              <a
                href={getWhatsAppUrl(lastOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors mb-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {lang === "ar"
                  ? "إرسال إشعار واتساب"
                  : "Send WhatsApp Notification"}
              </a>

              <button
                onClick={() => {
                  setShowOrderSuccess(false);
                  setLastOrder(null);
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                {lang === "ar"
                  ? `الإجمالي: $${Number(lastOrder.total).toFixed(2)}`
                  : `Total: $${Number(lastOrder.total).toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isAdminRoute && (
        <MobileTabBar
          lang={lang}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={cart.length}
        />
      )}
      {!isAdminRoute && !isLoginPage && (
        <ErrorBoundary>
          <AIChat lang={lang} />
        </ErrorBoundary>
      )}
      <OfflineIndicator />
    </div>
  );
};

// ... Rest of component code unchanged (HomePage, ShopPage, etc) ...

const HomePage = ({ products, addToCart, lang, settings }: any) => {
  const t = translations[lang];
  return (
    <div className="space-y-12 pb-12">
      <section className="relative h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl group animate-3d-entrance">
        <img
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 sm:p-16">
          <div className="text-white max-w-xl">
            <span className="bg-gold text-black text-[10px] font-black px-3 py-1.5 rounded-full mb-6 inline-block uppercase tracking-[0.2em] animate-pulse">
              Adonis Exclusive
            </span>
            <h1 className="font-luxury text-4xl sm:text-6xl font-bold mb-6 leading-[1.1]">
              {t.heroTitle}
            </h1>
            <p className="text-gray-300 mb-10 text-lg leading-relaxed">
              {t.heroSubtitle}
            </p>
            <Link
              to="/shop"
              className="btn-3d inline-flex items-center gap-3 bg-primary px-10 py-5 rounded-2xl font-bold text-lg"
            >
              {t.exploreCollection} <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h2 className="font-luxury text-3xl font-bold text-gray-900">
              {t.curatedForYou}
            </h2>
            <div className="w-12 h-1 bg-primary rounded-full mt-2"></div>
          </div>
          <Link
            to="/shop"
            className="text-primary font-black text-sm hover:translate-x-1 transition-transform"
          >
            {t.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.slice(0, 3).map((p: Product, i: number) => (
            <div
              key={p.id}
              className="animate-3d-entrance"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <ProductCard product={p} onAdd={addToCart} lang={lang} />
            </div>
          ))}
        </div>
      </section>

      <MounéClassesSection lang={lang} addToCart={addToCart} />
    </div>
  );
};

const ShopPage = ({ products, addToCart, lang }: any) => {
  const [filter, setFilter] = useState("all");
  const t = translations[lang];
  const filtered =
    filter === "all"
      ? products
      : products.filter((p: Product) => p.category === filter);
  return (
    <div className="space-y-12 py-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="font-luxury text-5xl font-bold mb-4 tracking-tight">
          {t.theCollection}
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          {t.collectionDesc}
        </p>
      </div>
      <div className="flex justify-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {["all", "essential", "themed", "emergency", "moune"].map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`btn-3d px-8 py-4 rounded-2xl text-sm font-bold whitespace-nowrap border ${
              filter === id
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-white text-gray-500 border-gray-100"
            }`}
          >
            {t[id as keyof typeof t] || id}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filtered.map((p: Product, i: number) => (
          <div
            key={p.id}
            className="animate-3d-entrance"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <ProductCard product={p} onAdd={addToCart} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAdd, lang }: any) => {
  const t = translations[lang];
  return (
    <div className="depth-card rounded-[2.5rem] overflow-hidden flex flex-col h-full group">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          width="100%"
          height="100%"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div
          className={`absolute top-6 ${
            lang === "ar" ? "right-6" : "left-6"
          } glass-panel px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-white/50 shadow-sm`}
        >
          {product.category}
        </div>
      </div>
      <div className="p-8 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-xl mb-3 group-hover:text-primary transition-colors">
          {lang === "ar" ? product.nameAr : product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-8 leading-relaxed">
          {lang === "ar" ? product.descriptionAr : product.description}
        </p>
        <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-100/50">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900">
              ${product.price}
            </span>
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">
              +{Math.floor(product.price * 10)} pts
            </span>
          </div>
          <button
            onClick={() => onAdd(product)}
            className="btn-3d w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-lg shadow-slate-200"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

const ServicesPage = ({ lang, user }: any) => {
  const t = translations[lang];
  const [notified, setNotified] = useState(false);

  const handleNotify = async () => {
    if (!user) {
      alert(lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    await supabase.from("leads").insert({
      user_id: user.id,
      service_type: "general_interest",
    });
    setNotified(true);
  };

  return (
    <div className="text-center py-24 animate-3d-entrance max-w-2xl mx-auto">
      <div className="depth-card w-32 h-32 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 text-5xl shadow-2xl animate-float">
        <i className="fa-solid fa-screwdriver-wrench"></i>
      </div>
      <h1 className="font-luxury text-5xl font-bold mb-6 text-gray-900 tracking-tight">
        {t.servicesComing}
      </h1>
      <p className="text-gray-500 text-xl leading-relaxed mb-12">
        {t.servicesDesc}
      </p>
      {notified ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-100 inline-block animate-fadeIn">
          <i className="fa-solid fa-check mr-2"></i>{" "}
          {lang === "ar" ? "تم تسجيل اهتمامك!" : "You are on the list!"}
        </div>
      ) : (
        <button
          onClick={handleNotify}
          className="btn-3d bg-primary text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {t.notifyMe}
        </button>
      )}
    </div>
  );
};

const ProfilePage = ({ user, lang, onLogout }: any) => {
  const t = translations[lang];
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();
  }, [user.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-3d-entrance">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="px-2">
            <h1 className="font-luxury text-4xl font-bold text-gray-900">
              {t.profile}
            </h1>
            <p className="text-gray-500 mt-2">
              Manage your luxury membership and privileges.
            </p>
          </div>
          <WalletCard user={user} lang={lang} />

          {/* Real Order History */}
          <div className="depth-card rounded-[2.5rem] p-6">
            <h3 className="font-bold text-gray-900 mb-4 px-2">{t.history}</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No orders yet.
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center text-sm border border-gray-100"
                  >
                    <div>
                      <p className="font-bold text-gray-800">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(
                          order.date || order.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">${order.total}</p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={onLogout}
                className="btn-3d flex items-center justify-center gap-4 w-full p-4 rounded-2xl bg-red-50 text-red-600 font-black hover:bg-red-100 transition-all shadow-md"
              >
                <i className="fa-solid fa-power-off"></i>
                <span className="text-sm uppercase tracking-widest">
                  {t.logout}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="depth-card rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">
              {t.pointsBalance}
            </h3>
            <div className="flex items-baseline gap-3 mb-10">
              <span className="text-7xl font-black text-primary drop-shadow-sm">
                {user.points.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-gray-400">{t.pts}</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>{user.tier} TIER</span>
                <span>NEXT LEVEL</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5 border border-white/50">
                <div
                  className="h-full bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="depth-card rounded-[2.5rem] p-10">
            <h3 className="font-luxury text-2xl font-bold mb-8">
              {t.memberPrivileges}
            </h3>
            <div className="space-y-6">
              <PrivilegeItem
                icon="fa-headset"
                color="bg-blue-50 text-blue-600"
                label={t.eliteSupport}
                desc="Direct priority access to Emil."
              />
              <PrivilegeItem
                icon="fa-truck-fast"
                color="bg-green-50 text-green-600"
                label={t.priorityDelivery}
                desc="Immediate processing for your orders."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactPage = ({ lang, settings, user }: any) => {
  const t = translations[lang];
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch active campaigns
      const { data: campaignData } = await supabase
        .from("impact_campaigns")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_impact_page", true)
        .order("created_at", { ascending: false });
      setCampaigns(campaignData || []);

      // Fetch user stats if logged in
      if (user?.id) {
        const { data: contributions } = await supabase
          .from("user_impact")
          .select("*")
          .eq("user_id", user.id);

        if (contributions && contributions.length > 0) {
          const totalContributed = contributions.reduce(
            (sum: number, c: any) => sum + (c.contribution_amount || 0),
            0
          );
          const totalImpact = contributions.reduce(
            (sum: number, c: any) => sum + (c.impact_units || 0),
            0
          );

          let badgeLevel = "supporter";
          if (totalImpact >= 200) badgeLevel = "hero";
          else if (totalImpact >= 50) badgeLevel = "changemaker";

          setUserStats({
            totalContributed,
            totalImpact,
            badgeLevel,
            contributions: contributions.length,
          });
        }
      }

      // Fetch leaderboard
      const { data: contributions } = await supabase
        .from("user_impact")
        .select("user_id, impact_units")
        .order("impact_units", { ascending: false });

      if (contributions) {
        const userTotals: Record<string, number> = {};
        contributions.forEach((item) => {
          if (!userTotals[item.user_id]) userTotals[item.user_id] = 0;
          userTotals[item.user_id] += item.impact_units || 0;
        });

        const sorted = Object.entries(userTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const userIds = sorted.map(([id]) => id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const nameMap = new Map(
          profiles?.map((p) => [p.id, p.full_name]) || []
        );

        setLeaderboard(
          sorted.map(([userId, impact], index) => ({
            rank: index + 1,
            name: nameMap.get(userId) || "Anonymous",
            impact: Math.floor(impact),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching impact data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("impact-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "impact_campaigns",
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_impact",
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getBadgeDetails = (level: string) => {
    const badges: Record<string, any> = {
      supporter: {
        name: "Supporter",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        icon: "fa-hand-holding-heart",
        message: "Thank you for your support!",
      },
      changemaker: {
        name: "Changemaker",
        color: "text-gray-400",
        bgColor: "bg-gray-200",
        icon: "fa-star",
        message: "You're making a real difference!",
      },
      hero: {
        name: "Impact Hero",
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        icon: "fa-crown",
        message: "You're an Impact Hero!",
      },
    };
    return badges[level] || badges.supporter;
  };

  const getImpactIcon = (type: string) => {
    const icons: Record<string, string> = {
      trees: "fa-tree",
      meals: "fa-utensils",
      donations: "fa-heart",
      water: "fa-tint",
      books: "fa-book",
      medicine: "fa-pills",
    };
    return icons[type] || "fa-hands-helping";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 animate-3d-entrance px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-5xl shadow-2xl animate-float">
          <i className="fa-solid fa-globe-americas"></i>
        </div>
        <h1 className="font-luxury text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          {t.impact || "Our Impact"}
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
          {t.impactDesc ||
            "See how your orders are making a difference in the community."}
        </p>
      </div>

      {/* User Stats (if logged in) */}
      {user && userStats && (
        <div className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-[2rem] p-8 border border-green-100">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-14 h-14 rounded-full ${
                getBadgeDetails(userStats.badgeLevel).bgColor
              } flex items-center justify-center`}
            >
              <i
                className={`fas ${getBadgeDetails(userStats.badgeLevel).icon} ${
                  getBadgeDetails(userStats.badgeLevel).color
                } text-xl`}
              ></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Impact Level</p>
              <p
                className={`text-xl font-bold ${
                  getBadgeDetails(userStats.badgeLevel).color
                }`}
              >
                {getBadgeDetails(userStats.badgeLevel).name}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-gray-900">
                ${userStats.totalContributed.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Contributed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">
                {Math.floor(userStats.totalImpact)}
              </p>
              <p className="text-sm text-gray-500">Impact Units</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-900">
                {userStats.contributions}
              </p>
              <p className="text-sm text-gray-500">Contributions</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Next Badge</p>
              <p className="text-lg font-bold text-green-600">
                {userStats.badgeLevel === "supporter"
                  ? "50 → Changemaker"
                  : userStats.badgeLevel === "changemaker"
                  ? "150 → Hero"
                  : "Max Level!"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Cards */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="depth-card rounded-[2rem] overflow-hidden"
              >
                {campaign.image_url && (
                  <div className="h-48 bg-gray-100">
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <i
                        className={`fas ${getImpactIcon(
                          campaign.goal_type
                        )} text-green-600`}
                      ></i>
                    </div>
                    <h3 className="font-bold text-xl">{campaign.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">
                        ${campaign.current_amount || 0} raised
                      </span>
                      <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Goal: ${campaign.goal_amount} ·{" "}
                      {campaign.impact_per_dollar} {campaign.goal_type} per $
                    </p>
                  </div>

                  {!user && (
                    <Link
                      to="/login"
                      className="block w-full py-3 bg-green-600 text-white text-center rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                      Login to Track Your Impact
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {campaigns.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <i className="fas fa-globe-americas text-5xl mb-4"></i>
              <p className="text-lg">No active campaigns at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-[2rem] p-8 border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-trophy text-yellow-600 text-xl"></i>
            </div>
            <h3 className="font-bold text-xl">Top Contributors</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
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
                  <p className="font-black text-green-600 text-lg">
                    {entry.impact}
                  </p>
                  <p className="text-xs text-gray-400">impact units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ... Helper components Navbar, NavLink, MobileTabBar, etc ...

const Navbar = ({
  user,
  settings,
  cartCount,
  lang,
  toggleLanguage,
  onLogout,
  onOpenCart,
  onLogoClick,
  mounéClasses = [],
}: any) => {
  const t = translations[lang];
  const location = useLocation();

  // Build dropdown items from database classes
  const mounéDropdownItems = mounéClasses.map((m: any) => ({
    to: `/moune/${m.id}`,
    label: lang === "ar" ? m.nameAr : m.name,
  }));

  return (
    <header className="absolute top-4 left-4 right-4 z-40 glass-panel rounded-2xl border border-white/40 shadow-2xl py-2 px-4 sm:px-6 animate-3d-entrance">
      <div className="flex justify-between items-center max-w-7xl mx-auto h-14">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={onLogoClick || undefined}
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                Y
              </div>
            )}
            <h1 className="font-luxury text-lg sm:text-xl font-bold text-gray-900 hidden lg:block tracking-tight">
              {settings.store_name || "YALLA WASEL"}
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100/30 p-1 rounded-xl border border-gray-200/50 shadow-inner">
            <NavLink
              to="/"
              label={t.home}
              isActive={location.pathname === "/"}
            />
            <NavLink
              to="/shop"
              label={t.kits}
              isActive={location.pathname === "/shop"}
            />
            <NavDropdown
              label="Mouné Classes"
              isActive={
                location.pathname === "/moune" ||
                location.pathname.startsWith("/moune/")
              }
              items={
                mounéDropdownItems.length > 0
                  ? mounéDropdownItems
                  : [
                      {
                        to: "/moune/mini-moune",
                        label: "Mini Mouné (Budget Smart)",
                      },
                      {
                        to: "/moune/classic-moune",
                        label: "Classic Mouné (Best Value)",
                      },
                      {
                        to: "/moune/premium-village",
                        label: "Premium Village",
                      },
                    ]
              }
            />
            <NavLink
              to="/impact"
              label={t.impact}
              isActive={location.pathname === "/impact"}
            />
            <NavLink
              to="/services"
              label={t.services}
              isActive={location.pathname === "/services"}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleLanguage}
            className="hidden sm:flex items-center justify-center h-10 px-3 text-[10px] font-black text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-white hover:shadow-sm"
          >
            {lang === "en" ? "عربي" : "ENGLISH"}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-800 hover:text-primary transition-colors shadow-sm hover:shadow-md"
          >
            <i className="fa-solid fa-bag-shopping"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-md group ${
                  location.pathname === "/profile"
                    ? "bg-primary text-white scale-110"
                    : "bg-primary/5 text-primary hover:bg-white"
                }`}
              >
                <span className="group-hover:scale-110 transition-transform">
                  {user.name.charAt(0)}
                </span>
              </Link>
              <button
                onClick={onLogout}
                className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <i className="fa-solid fa-power-off text-sm"></i>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-3d bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg hidden sm:block uppercase tracking-widest"
            >
              {t.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const NavLink = ({
  to,
  label,
  isActive,
}: {
  to: string;
  label: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all duration-300 uppercase tracking-wider ${
      isActive
        ? "bg-white text-primary shadow-sm scale-[1.02] border border-gray-100"
        : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
    }`}
  >
    {label}
  </Link>
);

const NavDropdown = ({
  label,
  items,
  isActive,
}: {
  label: string;
  items: Array<{ to: string; label: string }>;
  isActive: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use onMouseLeave instead of click-outside for better performance
  const handleMouseLeave = () => setIsOpen(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all duration-300 uppercase tracking-wider flex items-center gap-1 ${
          isActive || isOpen
            ? "bg-white text-primary shadow-sm scale-[1.02] border border-gray-100"
            : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
        }`}
      >
        {label}
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[8px]`}
        ></i>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
          <Link
            to="/moune"
            className="block px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            All Classes
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileTabBar = ({ lang, onOpenCart, cartCount }: any) => {
  const t = translations[lang];
  const location = useLocation();
  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border-t border-gray-100/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center h-[70px] px-2 max-w-lg mx-auto">
        <MobileTab
          to="/"
          icon="fa-house"
          iconOutline="fa-house"
          label={t.home}
          isActive={location.pathname === "/"}
        />
        <MobileTab
          to="/shop"
          icon="fa-box-open"
          iconOutline="fa-box"
          label={t.kits}
          isActive={location.pathname === "/shop"}
        />
        <MobileTab
          to="/moune"
          icon="fa-utensils"
          iconOutline="fa-utensils"
          label={lang === "ar" ? "موني" : "Mouné"}
          isActive={
            location.pathname === "/moune" ||
            location.pathname.startsWith("/moune/")
          }
        />
        <MobileTab
          to="/impact"
          icon="fa-hand-holding-heart"
          iconOutline="fa-heart"
          label={t.impact}
          isActive={location.pathname === "/impact"}
        />

        {/* Cart Tab */}
        <button
          onClick={onOpenCart}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all relative ${
            location.pathname === "/cart" || cartCount > 0
              ? "text-red-600 scale-105"
              : "text-gray-400"
          }`}
        >
          <div className="relative">
            <i className="fa-regular fa-bag-shopping text-xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">{t.bag}</span>
        </button>

        <MobileTab
          to="/profile"
          icon="fa-user-circle"
          iconOutline="fa-user"
          label={t.wallet}
          isActive={location.pathname === "/profile"}
        />
      </div>
    </div>
  );
};

const MobileTab = ({ to, icon, iconOutline, label, isActive }: any) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
      isActive ? "text-red-600 scale-105" : "text-gray-400 hover:text-gray-600"
    }`}
  >
    <i
      className={`${isActive ? "fa-solid" : "fa-regular"} ${
        isActive ? icon : iconOutline || icon
      } text-xl`}
    ></i>
    <span
      className={`text-[10px] font-medium mt-1 ${
        isActive ? "text-red-600" : "text-gray-400"
      }`}
    >
      {label}
    </span>
  </Link>
);

const PrivilegeItem = ({ icon, color, label, desc }: any) => (
  <div className="flex items-center gap-5 group">
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${color} group-hover:scale-110 transition-transform`}
    >
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
      <p className="text-base font-bold text-gray-900">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ProfileLink = ({ icon, label, to }: any) => (
  <Link
    to={to}
    className="flex items-center gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-lg transition-colors border border-transparent hover:border-white group shadow-sm"
  >
    <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-inner">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">
      {label}
    </span>
    <i className="fa-solid fa-chevron-right ml-auto text-gray-200 group-hover:translate-x-1 transition-transform"></i>
  </Link>
);

export default App;
