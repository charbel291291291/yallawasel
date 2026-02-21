import React, { useState } from "react";
import { Product, AppSettings } from "../types";
import { translations, Language } from "../translations";
import ProductCard from "../components/ProductCard";

import { useStore } from "../store/useStore";

const ShopPage: React.FC = () => {
    const { products, addToCart, lang } = useStore();

    const [filter] = useState("all");
    const t = translations[lang];

    const filtered = React.useMemo(() =>
        filter === "all"
            ? products
            : products.filter((p: Product) => p.category === filter)
        , [filter, products]);
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

export default ShopPage;
