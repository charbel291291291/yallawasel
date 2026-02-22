import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Product } from "@/types";
import { uploadImage } from "./utils";

const ProductsView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({
        category: "essential",
    });
    const [uploading, setUploading] = useState(false);

    const fetchProducts = async () => {
        const { data } = await supabase.from("products").select("*").order("name");
        setProducts(data || []);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this kit?")) return;
        await supabase.from("products").delete().eq("id", id);
        fetchProducts();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { id, ...data } = formData;
            let error;

            // Map frontend camelCase to backend snake_case
            const dbData = {
                category: data.category,
                cost: data.cost,
                description: data.description,
                description_ar: data.descriptionAr,
                image: data.image,
                is_active: data.isActive,
                name: data.name,
                name_ar: data.nameAr,
                price: data.price,
                stock: data.stock,
            };

            if (id) {
                const result = await supabase.from("products").update(dbData).eq("id", id);
                error = result.error;
            } else {
                const result = await supabase.from("products").insert(dbData);
                error = result.error;
            }

            if (error) {
                console.error("Error saving kit:", error);
                alert(`Failed to save kit: ${error.message}`);
                return;
            }

            setIsModalOpen(false);
            await fetchProducts();
            setFormData({ category: "essential" });
            alert("Saved successfully");
        } catch (err: unknown) {
            console.error("Unexpected error in handleSave:", err);
            const message = err instanceof Error ? err.message : String(err);
            alert(`An unexpected error occurred: ${message}`);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const publicUrl = await uploadImage(file);
            setFormData({ ...formData, image: publicUrl });
        } catch (error) {
            alert("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    const openEdit = (p: Product) => {
        setFormData(p);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setFormData({ category: "essential" });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="font-luxury text-2xl font-bold">Luxury Kit Inventory</h3>
                <button
                    onClick={openNew}
                    className="btn-3d px-8 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                >
                    <i className="fa-solid fa-plus mr-2"></i> Create New Kit
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((p) => (
                    <div
                        key={p.id}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex gap-6 hover:shadow-xl transition-all group"
                    >
                        <img
                            src={p.image || "https://via.placeholder.com/150"}
                            className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
                            alt={p.name}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                            <p className="text-primary font-black text-xl mt-1">${p.price}</p>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => openEdit(p)}
                                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-primary transition-colors border border-gray-100"
                                >
                                    <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 transition-colors border border-gray-100"
                                >
                                    <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">
                            {formData.id ? "Edit Kit" : "New Luxury Kit"}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <input
                                required
                                placeholder="Kit Name"
                                value={formData.name || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                            />
                            <input
                                required
                                placeholder="Arabic Name"
                                value={formData.nameAr || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, nameAr: e.target.value })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-right"
                            />

                            <input
                                type="number"
                                required
                                placeholder="Price ($)"
                                value={formData.price || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: Number(e.target.value) })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                            />

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Product Image
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.image && (
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <label
                                            className={`flex items-center justify-center w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""
                                                }`}
                                        >
                                            <span className="text-sm text-gray-500 font-bold">
                                                {uploading ? (
                                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-cloud-arrow-up mr-2"></i>{" "}
                                                        Upload Image
                                                    </>
                                                )}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                        </label>
                                        <input
                                            placeholder="Or enter URL manually"
                                            value={formData.image || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, image: e.target.value })
                                            }
                                            className="w-full mt-2 p-2 text-xs bg-transparent border-b border-gray-200 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <textarea
                                placeholder="Description"
                                value={formData.description || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 h-24"
                            />

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg"
                                >
                                    Save Kit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsView;
