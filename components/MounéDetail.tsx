import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { MounéClass, MounéClassComponent } from "../types";
import { translations, Language } from "../translations";

interface MounéDetailProps {
  lang: Language;
  addToCart: (product: any) => void;
}

const MounéDetail: React.FC<MounéDetailProps> = ({ lang, addToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = translations[lang];

  const [mounéClass, setMounéClass] = useState<MounéClass | null>(null);
  const [components, setComponents] = useState<MounéClassComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [individualPrice, setIndividualPrice] = useState(0);

  useEffect(() => {
    const fetchMounéDetails = async () => {
      try {
        // Fetch the mouné class details
        const { data: classData, error: classError } = await supabase
          .from("moune_classes")
          .select("*")
          .eq("id", id)
          .single();

        if (classError) throw classError;

        if (classData) {
          setMounéClass(classData as unknown as MounéClass);

          // Fetch the components of this mouné class
          const { data: componentsData, error: componentsError } =
            await supabase
              .from("moune_class_components")
              .select("*")
              .eq("moune_class_id", id);

          if (componentsError) throw componentsError;

          setComponents(componentsData as unknown as MounéClassComponent[]);

          // Calculate the individual price if components exist
          if (componentsData && componentsData.length > 0) {
            let totalPrice = 0;
            for (const component of componentsData) {
              // In a real implementation, we would fetch the actual product prices
              // For now, we'll use a placeholder calculation
              totalPrice += component.quantity * 5; // Placeholder price per item
            }
            setIndividualPrice(totalPrice);
          }
        }
      } catch (error) {
        console.error("Error fetching mouné details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMounéDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-3d-entrance">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">
            {lang === "ar" ? "جارٍ تحميل التفاصيل..." : "Loading details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!mounéClass) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-3d-entrance">
        <div className="text-center">
          <p className="text-gray-500">
            {lang === "ar"
              ? "لم يتم العثور على فئة مونé"
              : "Mouné class not found"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-3d bg-primary text-white px-6 py-3 rounded-2xl font-bold mt-4"
          >
            {lang === "ar" ? "العودة للرئيسية" : "Go Home"}
          </button>
        </div>
      </div>
    );
  }

  // Calculate savings percentage
  const calculateSavings = () => {
    if (individualPrice > 0) {
      const savings =
        ((individualPrice - mounéClass.price) / individualPrice) * 100;
      return Math.round(savings);
    }
    return 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-3d-entrance">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
        {lang === "ar" ? "العودة" : "Back"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="depth-card rounded-[2.5rem] overflow-hidden">
          <img
            src={
              mounéClass.image ||
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
            }
            alt={lang === "ar" ? mounéClass.nameAr : mounéClass.name}
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="font-luxury text-4xl font-bold text-gray-900 mb-4">
              {lang === "ar" ? mounéClass.nameAr : mounéClass.name}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {lang === "ar"
                ? mounéClass.descriptionAr
                : mounéClass.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="depth-card rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">
                {lang === "ar" ? "إجمالي الوزن" : "Total Weight"}
              </p>
              <p className="font-bold text-lg">{mounéClass.totalWeight}</p>
            </div>
            <div className="depth-card rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">
                {lang === "ar" ? "عدد الوجبات" : "Meals Count"}
              </p>
              <p className="font-bold text-lg">{mounéClass.mealsCount}</p>
            </div>
            <div className="depth-card rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">
                {lang === "ar" ? "عدد القطع" : "Items Count"}
              </p>
              <p className="font-bold text-lg">{components.length}</p>
            </div>
            <div className="depth-card rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">
                {lang === "ar" ? "مدة الصلاحية" : "Shelf Life"}
              </p>
              <p className="font-bold text-lg">
                {lang === "ar" ? "6 أشهر" : "6 months"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-primary">
              ${mounéClass.price}
            </div>
            {individualPrice > 0 && (
              <div className="text-lg text-gray-400 line-through">
                ${individualPrice.toFixed(2)}
              </div>
            )}
          </div>

          {calculateSavings() > 0 && (
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-green-700 font-bold">
                {lang === "ar"
                  ? `توفير ${calculateSavings()}% مقارنة بالشراء الفردي`
                  : `You save ${calculateSavings()}% compared to buying individually`}
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <i className="fa-solid fa-truck-fast"></i>
              <span className="font-bold">
                {lang === "ar" ? "توصيل مجاني" : "Free Delivery"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              addToCart({
                id: mounéClass.id,
                name: lang === "ar" ? mounéClass.nameAr : mounéClass.name,
                nameAr: mounéClass.nameAr,
                description:
                  lang === "ar"
                    ? mounéClass.descriptionAr
                    : mounéClass.description,
                price: mounéClass.price,
                image: mounéClass.image,
                category: mounéClass.category,
                tags: ["moune", "lebanese", "meal-kit"],
                totalWeight: mounéClass.totalWeight,
                mealsCount: mounéClass.mealsCount,
                isBundle: true,
                components: components,
              });
            }}
            className="btn-3d w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            {lang === "ar" ? "إضافة للحقيبة" : "Add to Bag"}
          </button>
        </div>
      </div>

      {/* Components List */}
      <div className="depth-card rounded-[2.5rem] p-8">
        <h2 className="font-luxury text-2xl font-bold text-gray-900 mb-6">
          {lang === "ar" ? "قائمة المكونات" : "Component List"}
        </h2>

        <div className="space-y-4">
          {components.map((component, index) => (
            <div
              key={component.id}
              className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-100"
            >
              <div>
                <p className="font-bold text-gray-900">
                  {lang === "ar"
                    ? component.productNameAr
                    : component.productName}
                </p>
                <p className="text-sm text-gray-500">
                  {component.quantity} × {component.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {(component.quantity * 5).toFixed(2)}${" "}
                  {/* Placeholder price */}
                </p>
              </div>
            </div>
          ))}

          {components.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {lang === "ar"
                ? "لا توجد مكونات محددة بعد"
                : "No components specified yet"}
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="depth-card rounded-[2.5rem] p-8">
        <h2 className="font-luxury text-2xl font-bold text-gray-900 mb-6">
          {lang === "ar" ? "تحليل السعر" : "Price Breakdown"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {lang === "ar" ? "السعر الإجمالي للفئة" : "Class Total Price"}
              </span>
              <span className="font-bold">${mounéClass.price}</span>
            </div>

            {individualPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {lang === "ar"
                    ? "السعر عند الشراء الفردي"
                    : "Individual Purchase Price"}
                </span>
                <span className="font-bold text-red-500">
                  ${individualPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {individualPrice > 0 && (
              <div className="flex justify-between bg-green-50 p-4 rounded-xl border border-green-100">
                <span className="font-bold text-green-700">
                  {lang === "ar" ? "المدخرات" : "Savings"}
                </span>
                <span className="font-bold text-green-700">
                  -${(individualPrice - mounéClass.price).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="font-bold text-blue-700">
                {lang === "ar" ? "نسبة التوفير" : "Savings Percentage"}
              </span>
              <span className="font-bold text-blue-700">
                {calculateSavings()}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MounéDetail;
