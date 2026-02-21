import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";
import ProductCard from "../components/ProductCard";

import { useStore } from "../store/useStore";

const HomePage: React.FC = () => {
    const { products, addToCart, lang, user } = useStore();
    const isRTL = lang === 'ar';

    const heroProducts = React.useMemo(() => products.slice(0, 3), [products]);

    return (
        <div className="flex flex-col gap-24 pb-20 overflow-hidden">
            {/* Minimal Luxury Hero */}
            <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-10 animate-entrance">
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full animate-pulse-slow"></div>
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 block">
                        Yalla Wasel Exclusive
                    </span>
                </div>

                <h1 className="font-luxury text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] max-w-4xl">
                    {isRTL ? 'حياة فاخرة، تُسلّم إليك.' : 'Luxury Living, Delivered.'}
                </h1>

                <p className="text-white/40 text-sm sm:text-lg max-w-lg mb-12 leading-relaxed font-medium">
                    {isRTL
                        ? 'مجموعات مختارة للحالات الطارئة، والأساسيات اليومية، واللحظات الخاصة.'
                        : 'Curated kits for emergencies, daily essentials, and special moments.'}
                </p>

                <div className="flex flex-col gap-6 w-full max-w-xs">
                    <Link
                        to="/shop"
                        className="btn-luxury btn-luxury-gold"
                    >
                        {isRTL ? 'استكشف المجموعة' : 'Explore Collection'}
                    </Link>

                    {!user && (
                        <Link
                            to="/login"
                            className="text-white/20 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                        >
                            {isRTL ? 'تسجيل الدخول' : 'Sign In To Account'}
                        </Link>
                    )}
                </div>
            </section>

            {/* Curated Grid - Refactored for Mobile (Single Column) */}
            <section className="w-full max-w-4xl mx-auto px-4">
                <div className="flex flex-col items-center mb-16 text-center">
                    <h2 className="font-luxury text-3xl font-black text-white mb-4">
                        {isRTL ? 'مختارات لك' : 'Curated For You'}
                    </h2>
                    <div className="w-12 h-[1px] bg-primary/30"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {heroProducts.map((p: Product, i: number) => (
                        <div
                            key={p.id}
                            className="animate-entrance"
                            style={{ animationDelay: `${0.2 + (i * 0.1)}s` }}
                        >
                            <ProductCard product={p} onAdd={addToCart} lang={lang} />
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-center">
                    <Link to="/shop" className="text-primary hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest">
                        {isRTL ? 'عرض الكل' : 'View All Artifacts'} →
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
