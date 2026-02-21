import React, { useState } from "react";
import { Product } from "../types";
import ProductCard from "../components/ProductCard";

import { useStore } from "../store/useStore";

const ShopPage: React.FC = () => {
    const { products, addToCart, lang } = useStore();
    const isRTL = lang === 'ar';

    const [filter] = useState("all");

    const filtered = React.useMemo(() =>
        filter === "all"
            ? products
            : products.filter((p: Product) => p.category === filter)
        , [filter, products]);

    return (
        <div className="flex flex-col gap-20 py-10 animate-entrance">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 block">
                    {isRTL ? 'المجموعة الكاملة' : 'THE FULL ARTIFACTS'}
                </span>
                <h1 className="font-luxury text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-none">
                    {isRTL ? 'المجموعة' : 'The Collection'}
                </h1>
                <p className="text-white/40 text-sm sm:text-lg leading-relaxed font-medium">
                    {isRTL
                        ? 'مجموعات مختارة بعناية لأرقى أنماط الحياة.'
                        : 'Meticulously crafted kits for the most discerning lifestyles.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filtered.map((p: Product, i: number) => (
                    <div
                        key={p.id}
                        className="animate-entrance"
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <ProductCard product={p} onAdd={addToCart} lang={lang} />
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-40">
                    <p className="text-white/20 font-black uppercase tracking-widest">
                        {isRTL ? 'لا توجد منتجات حالياً' : 'No Artifacts Found'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ShopPage;
