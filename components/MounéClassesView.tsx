import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl;
};

const MounéClassesView = () => {
  const [mounéClasses, setMounéClasses] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [componentFormData, setComponentFormData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchMounéClasses = async () => {
    try {
      const { data } = await supabase
        .from("moune_classes")
        .select("*")
        .order("name");
      setMounéClasses(data || []);
    } catch (error) {
      console.error("Error fetching mouné classes:", error);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  };

  const fetchComponents = async (classId: string) => {
    try {
      const { data } = await supabase
        .from("moune_class_components")
        .select("*")
        .eq("moune_class_id", classId)
        .order("created_at");
      setComponents(data || []);
    } catch (error) {
      console.error("Error fetching components:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchMounéClasses(), fetchProducts()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = formData;
      if (id) {
        await supabase.from("moune_classes").update(data).eq("id", id);
      } else {
        await supabase.from("moune_classes").insert(data);
      }
      setIsModalOpen(false);
      fetchMounéClasses();
      setFormData({});
    } catch (error) {
      alert("Error saving mouné class");
    }
  };

  const handleComponentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = componentFormData;
      if (id) {
        await supabase.from("moune_class_components").update(data).eq("id", id);
      } else {
        await supabase.from("moune_class_components").insert(data);
      }
      setIsComponentModalOpen(false);
      if (selectedClass) {
        fetchComponents(selectedClass.id);
      }
      setComponentFormData({});
    } catch (error) {
      alert("Error saving component");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mouné class?")) return;
    try {
      await supabase.from("moune_classes").delete().eq("id", id);
      fetchMounéClasses();
    } catch (error) {
      alert("Error deleting mouné class");
    }
  };

  const handleComponentDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return;
    try {
      await supabase.from("moune_class_components").delete().eq("id", id);
      if (selectedClass) {
        fetchComponents(selectedClass.id);
      }
    } catch (error) {
      alert("Error deleting component");
    }
  };

  const openEdit = (mounéClass: any) => {
    setFormData(mounéClass);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setFormData({});
    setIsModalOpen(true);
  };

  const openComponentEdit = (component: any) => {
    setComponentFormData(component);
    setIsComponentModalOpen(true);
  };

  const openNewComponent = () => {
    setComponentFormData({ moune_class_id: selectedClass?.id });
    setIsComponentModalOpen(true);
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

  const calculateProfit = (mounéClass: any) => {
    if (mounéClass.cost && mounéClass.price) {
      return ((mounéClass.price - mounéClass.cost) / mounéClass.price) * 100;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 text-3xl mx-auto mb-6">
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
        <h3 className="text-gray-900 font-bold text-xl mb-2">
          Loading Mouné Classes
        </h3>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => setSelectedClass(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4"
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Classes
            </button>
            <h3 className="font-luxury text-2xl font-bold">
              {selectedClass.name} - Components
            </h3>
          </div>
          <button
            onClick={openNewComponent}
            className="btn-3d px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
          >
            <i className="fa-solid fa-plus mr-2"></i> Add Component
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h4 className="font-bold text-lg">Class Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-bold">${selectedClass.price}</p>
              </div>
              <div>
                <p className="text-gray-500">Cost</p>
                <p className="font-bold">${selectedClass.cost || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Profit Margin</p>
                <p className="font-bold text-green-600">
                  {calculateProfit(selectedClass).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">Meals</p>
                <p className="font-bold">{selectedClass.meals_count}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className="font-bold text-lg mb-4">Components</h4>
            <div className="space-y-3">
              {components.map((component) => (
                <div
                  key={component.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="font-bold">{component.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {component.quantity} × {component.unit}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openComponentEdit(component)}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:text-primary transition-colors"
                    >
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button
                      onClick={() => handleComponentDelete(component.id)}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}

              {components.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No components added yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Component Modal */}
        {isComponentModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">
                {componentFormData.id ? "Edit Component" : "Add Component"}
              </h2>
              <form onSubmit={handleComponentSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={componentFormData.product_id || ""}
                    onChange={(e) => {
                      const product = products.find(
                        (p) => p.id === e.target.value
                      );
                      setComponentFormData({
                        ...componentFormData,
                        product_id: e.target.value,
                        product_name: product?.name || "",
                        product_name_ar: product?.name_ar || "",
                        unit: "piece",
                      });
                    }}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={componentFormData.quantity || 1}
                      onChange={(e) =>
                        setComponentFormData({
                          ...componentFormData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={componentFormData.unit || "piece"}
                      onChange={(e) =>
                        setComponentFormData({
                          ...componentFormData,
                          unit: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsComponentModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg"
                  >
                    Save Component
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-luxury text-2xl font-bold">
          Mouné Classes Management
        </h3>
        <button
          onClick={openNew}
          className="btn-3d px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
        >
          <i className="fa-solid fa-plus mr-2"></i> Create New Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mounéClasses.map((mounéClass) => (
          <div
            key={mounéClass.id}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-gray-900">{mounéClass.name}</h4>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {mounéClass.class_type}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {mounéClass.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-500">Price</p>
                <p className="font-bold">${mounéClass.price}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-500">Cost</p>
                <p className="font-bold">${mounéClass.cost || 0}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="text-green-500">Margin</p>
                <p className="font-bold text-green-600">
                  {calculateProfit(mounéClass).toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="text-blue-500">Meals</p>
                <p className="font-bold text-blue-600">
                  {mounéClass.meals_count}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClass(mounéClass)}
                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
              >
                Manage Components
              </button>
              <button
                onClick={() => openEdit(mounéClass)}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-colors"
              >
                <i className="fa-solid fa-pen text-xs"></i>
              </button>
              <button
                onClick={() => handleDelete(mounéClass.id)}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {mounéClasses.length === 0 && (
        <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 text-3xl mx-auto mb-6">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <h3 className="text-gray-900 font-bold text-xl mb-2">
            No Mouné Classes
          </h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            Create your first Mouné class to get started with Lebanese meal
            kits.
          </p>
        </div>
      )}

      {/* Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">
              {formData.id ? "Edit Mouné Class" : "Create New Mouné Class"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                required
                placeholder="Class Name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
              />
              <input
                required
                placeholder="Arabic Name"
                value={formData.name_ar || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-right"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder="Price ($)"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                />
                <input
                  type="number"
                  placeholder="Cost ($)"
                  value={formData.cost || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder="Meals Count"
                  value={formData.meals_count || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meals_count: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                />
                <select
                  value={formData.class_type || "classic"}
                  onChange={(e) =>
                    setFormData({ ...formData, class_type: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <option value="mini">Mini</option>
                  <option value="classic">Classic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <input
                placeholder="Total Weight (e.g., 5 kg)"
                value={formData.total_weight || ""}
                onChange={(e) =>
                  setFormData({ ...formData, total_weight: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <textarea
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 h-24"
              />

              <textarea
                placeholder="Arabic Description"
                value={formData.description_ar || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description_ar: e.target.value })
                }
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 h-24 text-right"
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Class Image
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
                      className={`flex items-center justify-center w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors ${
                        uploading ? "opacity-50 pointer-events-none" : ""
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
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MounéClassesView;
