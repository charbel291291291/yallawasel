import React from "react";
import { Link } from "react-router-dom";
import { Product, AppSettings } from "../types";
import { translations, Language } from "../translations";
import ProductCard from "../components/ProductCard";

interface HomePageProps {
    products: Product[];
    addToCart: (p: Product) => void;
    lang: Language;
    settings: AppSettings;
}

const HomePage: React.FC<HomePageProps> = ({ products, addToCart, lang }) => {
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
        </div>
    );
};

export default HomePage;
