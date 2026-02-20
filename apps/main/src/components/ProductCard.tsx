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
    return (
        <div className="depth-card rounded-[2.5rem] overflow-hidden flex flex-col h-full group contain-layout">
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
                    className={`absolute top-6 ${lang === "ar" ? "right-6" : "left-6"
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
});

export default ProductCard;
