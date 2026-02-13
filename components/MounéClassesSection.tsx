import React from "react";
import { Link } from "react-router-dom";
import { translations, Language } from "../translations";

interface MounéClass {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  totalWeight: string;
  mealsCount: number;
  price: number;
  image: string;
  color: string;
  isBestValue?: boolean;
}

interface MounéClassesSectionProps {
  lang: Language;
  addToCart: (product: any) => void;
}

const MounéClassesSection: React.FC<MounéClassesSectionProps> = ({
  lang,
  addToCart,
}) => {
  const t = translations[lang];

  const mounéClasses: MounéClass[] = [
    {
      id: "mini-moune",
      name: "Mini Mouné (Budget Smart)",
      nameAr: "موني ميني (حل ذكي للميزانية)",
      description:
        "Compact essentials for small households. Perfect starter pack with basic pantry items.",
      descriptionAr:
        " essentials المدمجة للمنازل الصغيرة. حزمة البداية المثالية مع عناصر المطبخ الأساسية.",
      totalWeight: "2.5 kg",
      mealsCount: 8,
      price: 45,
      image:
        "https://images.unsplash.com/photo-1603569283847-aa795f0eafc3?auto=format&fit=crop&w=600&q=80",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      id: "classic-moune",
      name: "Classic Mouné (Best Value)",
      nameAr: "موني كلاسيك (أفضل قيمة)",
      description:
        "Complete Lebanese meal experience. Best balance of quality and affordability.",
      descriptionAr:
        "تجربة وجبة لبنانية كاملة. أفضل توازن بين الجودة والسعر المعقول.",
      totalWeight: "5 kg",
      mealsCount: 16,
      price: 85,
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
      color: "bg-primary text-white border-primary",
      isBestValue: true,
    },
    {
      id: "premium-village",
      name: "Premium Village (Authentic Experience)",
      nameAr: "القرية المميزة (تجربة أصيلة)",
      description:
        "Authentic village ingredients sourced directly from local farms. Premium quality.",
      descriptionAr:
        "مكونات قرية أصلية تم جمعها مباشرة من المزارع المحلية. جودة متميزة.",
      totalWeight: "8 kg",
      mealsCount: 24,
      price: 145,
      image:
        "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80",
      color:
        "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-900 border-amber-300",
    },
  ];

  return (
    <section className="mt-16">
      <div className="text-center mb-12">
        <h2 className="font-luxury text-4xl font-bold text-gray-900 mb-4">
          {lang === "ar" ? "اختر فئة مونك" : "Choose Your Mouné Class"}
        </h2>
        <div className="w-24 h-1 bg-primary rounded-full mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mounéClasses.map((mounéClass) => (
          <div
            key={mounéClass.id}
            className="depth-card rounded-[2.5rem] overflow-hidden group border border-gray-100/50 hover:border-primary/30 transition-all duration-300"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={mounéClass.image}
                alt={lang === "ar" ? mounéClass.nameAr : mounéClass.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

              {mounéClass.isBestValue && (
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {t.bestValue}
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 text-xl">
                  {lang === "ar" ? mounéClass.nameAr : mounéClass.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${mounéClass.color}`}
                >
                  {mounéClass.totalWeight}
                </span>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {lang === "ar"
                  ? mounéClass.descriptionAr
                  : mounéClass.description}
              </p>

              <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
                <div>
                  <span className="font-bold text-gray-900">
                    {mounéClass.mealsCount}
                  </span>{" "}
                  {t.meals}
                </div>
                <div>
                  <span className="font-bold text-gray-900">
                    ${mounéClass.price}
                  </span>
                </div>
              </div>

              <Link
                to={`/moune/${mounéClass.id}`}
                className="btn-3d w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all block text-center"
              >
                {t.orderNow}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MounéClassesSection;
