import React from "react";
import { Product } from "../types";
import { Language } from "../translations";
import Image from "./Image";

interface ProductCardProps {
    product: Product;
    onAdd: (p: Product) => void;
    lang: Language;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAdd, lang }) => {
    const isRTL = lang === "ar";

    return (
        <div className="luxury-card flex flex-col h-full group animate-entrance">
            <div className="relative h-72 overflow-hidden">
                <Image
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    width="100%"
                    height="100%"
                />
                {/* Subtle Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B0E17] to-transparent"></div>

                <div
                    className={`absolute top-6 ${isRTL ? "left-6" : "right-6"} bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-xl text-[9px] font-black text-white/40 uppercase tracking-[0.2em] shadow-2xl`}
                >
                    {product.category}
                </div>
            </div>

            <div className="p-8 flex flex-col flex-1 relative -mt-4 bg-luxury-card rounded-t-[2rem] z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <h3 className="font-luxury text-2xl font-black text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                    {isRTL ? product.nameAr : product.name}
                </h3>

                <p className="text-xs text-white/30 line-clamp-2 mb-10 leading-relaxed font-medium">
                    {isRTL ? product.descriptionAr : product.description}
                </p>

                <div className="mt-auto flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-primary tracking-tighter">
                            ${product.price}
                        </span>
                        <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">
                            +{Math.floor(product.price * 10)} REWARD PTS
                        </span>
                    </div>

                    <button
                        onClick={() => onAdd(product)}
                        className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-xl"
                    >
                        <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
