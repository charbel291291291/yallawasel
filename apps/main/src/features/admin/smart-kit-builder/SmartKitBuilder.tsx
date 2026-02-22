import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Product } from "@/types";
import { generateSmartKits } from "./KitGenerationEngine";
import { GeneratedKit, BusinessGoal } from "./types";

// Steps
type WizardStep = "SELECT_PRODUCTS" | "SET_GOALS" | "AI_ANALYSIS" | "REVIEW_KITS" | "PUBLISH_SUCCESS";

const SmartKitBuilder: React.FC = () => {
    const [step, setStep] = useState<WizardStep>("SELECT_PRODUCTS");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [_publishError, setPublishError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Business Goals
    const [goal, setGoal] = useState<BusinessGoal>({
        minMargin: 20,
        strategy: 'GROWTH',
        competitorPrice: 0
    });

    // Generated Kits
    const [generatedKits, setGeneratedKits] = useState<GeneratedKit[]>([]);
    const [selectedKit, setSelectedKit] = useState<GeneratedKit | null>(null);

    // AI Simulation State
    const [aiStatus, setAiStatus] = useState("Initializing Neural Engine...");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data: _fetchData, error: _fetchError } = await supabase.from("products").select("*").eq("is_active", true);
        if (_fetchData) setProducts(_fetchData);
        setLoading(false);
    };

    const toggleProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setStep("AI_ANALYSIS");
        setProgress(0);

        // Simulate AI Processing Steps
        const steps = [
            "Analyzing product complementarity...",
            "Fetching global pricing data...",
            "Calculating demand elasticity...",
            "Simulating 1,000 sales scenarios...",
            "Optimizing for maximum profit..."
        ];

        for (let i = 0; i < steps.length; i++) {
            setAiStatus(steps[i]);
            setProgress(((i + 1) / steps.length) * 100);
            await new Promise(r => setTimeout(r, 800)); // Simulate delay
        }

        // Run Logic
        try {
            const selectedProductsData = products
                .filter(p => selectedProductIds.includes(p.id))
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    cost: p.cost || (p.price * 0.6), // Fallback cost
                    price: p.price,
                    stock: p.stock || 100
                }));

            const kits = generateSmartKits(selectedProductsData, goal);
            setGeneratedKits(kits);
            setSelectedKit(kits[1]); // Default to Balanced
            setStep("REVIEW_KITS");
        } catch (err) {
            alert("Error generating kits: " + err);
            setStep("SELECT_PRODUCTS");
        }
    };

    const handlePublish = async () => {
        if (!selectedKit) return;
        setLoading(true);

        try {
            const { error: publishError } = await supabase.from("products").insert({
                name: selectedKit.name,
                description: selectedKit.aiExplanation,
                price: selectedKit.bundlePrice,
                category: 'kits', // Ensure 'kits' fits your category enum or use string
                image: "https://placehold.co/600x400/8a1c1c/FFF?text=Smart+Kit", // Placeholder
                stock: 50, // Default stock for kit
                is_active: true,
                tags: ['ai-generated', selectedKit.strategy.toLowerCase()]
            }).select().single();

            if (publishError) throw publishError;
            setStep("PUBLISH_SUCCESS");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to publish";
            setPublishError(message);
        } finally {
            setLoading(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- RENDER HELPERS ---

    const renderProgressBar = () => {
        const steps = ["Select", "Goals", "AI", "Review", "Done"];
        const currentIdx = ["SELECT_PRODUCTS", "SET_GOALS", "AI_ANALYSIS", "REVIEW_KITS", "PUBLISH_SUCCESS"].indexOf(step);

        return (
            <div className="flex items-center justify-between mb-8 px-4 md:px-12 relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0 mx-8 md:mx-20"></div>

                {steps.map((label, idx) => {
                    const isActive = idx <= currentIdx;
                    const isCompleted = idx < currentIdx;

                    return (
                        <div key={label} className={`flex flex-col items-center flex-1 relative z-10 ${isActive ? "text-slate-900" : "text-gray-300"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-xs font-bold transition-all duration-300 shadow-sm
                                ${isCompleted ? "bg-red-600 text-white" :
                                    isActive ? "border-2 border-red-600 text-red-600 bg-white scale-110 shadow-lg" :
                                        "bg-gray-100 text-gray-400 border-2 border-white"}`}>
                                {isCompleted ? <i className="fa-solid fa-check"></i> : idx + 1}
                            </div>
                            <span className="hidden md:block text-[10px] uppercase font-black tracking-widest">{label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- VIEWS ---

    if (step === "SELECT_PRODUCTS") {
        return (
            <div className="max-w-5xl mx-auto pb-20">
                {renderProgressBar()}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-luxury font-bold text-slate-900 leading-tight">Build a <span className="text-red-600">Smart Kit</span></h2>
                            <p className="text-gray-500 mt-2">Select products to bundle. Our AI analyzes margins & compatibility.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-100 placeholder-gray-400 font-medium text-sm transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                        {loading && <div className="col-span-full py-10 text-center text-gray-400">Loading inventory...</div>}
                        {!loading && filteredProducts.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">No products found.</div>}

                        {filteredProducts.map(product => (
                            <div key={product.id}
                                onClick={() => toggleProduct(product.id)}
                                className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 active:scale-95
                                ${selectedProductIds.includes(product.id)
                                        ? "border-red-500 bg-red-50/20 shadow-lg shadow-red-500/10"
                                        : "border-gray-50 hover:border-gray-200 hover:shadow-md bg-white"}`}>

                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                                    ${selectedProductIds.includes(product.id) ? "bg-red-600 text-white scale-110" : "bg-gray-100 text-gray-300 group-hover:bg-gray-200"}`}>
                                    <i className="fa-solid fa-check text-xs"></i>
                                </div>

                                <div className="flex items-center gap-4">
                                    <img src={product.image || "https://via.placeholder.com/100"} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm bg-gray-100" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                                        <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                                        <p className="font-bold text-slate-900">${product.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-100 pt-6 mt-6 gap-4">
                        <div className="text-sm font-bold text-slate-500 bg-gray-50 px-4 py-2 rounded-lg">
                            {selectedProductIds.length} items selected
                        </div>
                        <button
                            disabled={selectedProductIds.length < 2}
                            onClick={() => setStep("SET_GOALS")}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider
                                ${selectedProductIds.length >= 2
                                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:translate-y-[-2px] shadow-slate-900/20"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                            Configure AI <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "SET_GOALS") {
        return (
            <div className="max-w-2xl mx-auto pt-8">
                {renderProgressBar()}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-gray-100 animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

                    <h2 className="text-3xl font-luxury font-bold text-slate-900 mb-2 relative z-10">Define Goals</h2>
                    <p className="text-gray-500 mb-10 relative z-10">Tell the AI what you want to achieve with this bundle.</p>

                    <div className="space-y-10 relative z-10">
                        {/* Strategy Selection */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Focus Strategy</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['GROWTH', 'PROFIT', 'CLEARANCE'].map((s) => (
                                    <button key={s}
                                        onClick={() => setGoal({ ...goal, strategy: s as any })}
                                        className={`py-4 px-2 rounded-2xl text-xs font-bold border-2 transition-all duration-300 flex flex-col items-center gap-2
                                        ${goal.strategy === s
                                                ? "border-red-500 text-red-600 bg-red-50/50 shadow-lg shadow-red-500/10 scale-105"
                                                : "border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50"}`}>
                                        <i className={`text-xl fa-solid 
                                            ${s === 'GROWTH' ? 'fa-arrow-trend-up' : s === 'PROFIT' ? 'fa-piggy-bank' : 'fa-tags'}`}></i>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drag Slider */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Minimum Margin</label>
                                <span className="text-3xl font-luxury font-bold text-slate-900">{goal.minMargin}%</span>
                            </div>
                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-200"
                                    style={{ width: `${(goal.minMargin / 50) * 100}%` }}></div>
                                <input
                                    type="range" min="5" max="50" step="5"
                                    value={goal.minMargin}
                                    onChange={(e) => setGoal({ ...goal, minMargin: Number(e.target.value) })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mt-2">
                                <span>Aggressive (5%)</span>
                                <span>Conservative (50%)</span>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900 mb-1">AI Optimization Engine</h4>
                                <p className="text-xs text-blue-700/80 leading-relaxed">
                                    Our engine will simulate thousands of permutations to find the sweet spot between sales velocity and your {goal.minMargin}% margin floor.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100 relative z-10">
                        <button onClick={() => setStep("SELECT_PRODUCTS")} className="text-gray-400 hover:text-slate-900 font-bold text-sm transition-colors">Back</button>
                        <button
                            onClick={handleGenerate}
                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:scale-[1.02] hover:bg-slate-800 transition-all flex items-center gap-3 text-sm uppercase tracking-wider">
                            <i className="fa-solid fa-bolt"></i> Generate Kits
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "AI_ANALYSIS") {
        return (
            <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                        {/* Abstract animated rings */}
                        <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-8 border-t-red-600 border-r-red-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-4 border-4 border-slate-900/10 rounded-full animate-reverse-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fa-solid fa-brain text-4xl text-slate-800 animate-pulse"></i>
                        </div>
                    </div>

                    <h2 className="text-3xl font-luxury font-bold text-slate-900 mb-4 animate-pulse">Processing Data</h2>

                    {/* Progress Text */}
                    <div className="h-8 overflow-hidden relative mb-8">
                        <p className="text-gray-500 font-medium animate-slideUp key-{aiStatus}">{aiStatus}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-slate-900 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-300">{Math.round(progress)}% Complete</p>
                </div>
            </div>
        );
    }

    if (step === "REVIEW_KITS") {
        return (
            <div className="max-w-[1400px] mx-auto pb-20">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-luxury font-bold text-slate-900">AI Proposals</h2>
                        <p className="text-gray-400 mt-2">We found 3 viable strategies for your selected products.</p>
                    </div>
                    <button onClick={() => setStep("SET_GOALS")} className="text-sm text-gray-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-gray-100 rounded-lg transition-all">
                        <i className="fa-solid fa-rotate-left mr-2"></i> Restart Analysis
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {generatedKits.map((kit) => (
                        <div key={kit.id}
                            onClick={() => setSelectedKit(kit)}
                            className={`group relative bg-white rounded-[2rem] p-8 border-2 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl
                            ${selectedKit?.id === kit.id
                                    ? "border-red-600 shadow-xl shadow-red-600/10 z-10 scale-105"
                                    : "border-transparent shadow-lg text-gray-500 opacity-90 hover:opacity-100"}`}>

                            {/* Strategy Badge */}
                            <div className="absolute top-6 right-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                                    ${kit.strategy === 'HIGH_VOLUME' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        kit.strategy === 'PREMIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {kit.strategy.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mt-8 mb-8 text-center">
                                <h3 className={`font-bold text-lg mb-2 leading-tight ${selectedKit?.id === kit.id ? "text-slate-900" : "text-gray-700"}`}>
                                    {kit.name}
                                </h3>
                                <div className="flex items-center justify-center gap-3">
                                    <span className={`text-4xl font-luxury font-bold ${selectedKit?.id === kit.id ? "text-slate-900" : "text-gray-400"}`}>
                                        ${kit.bundlePrice}
                                    </span>
                                    <span className="text-sm text-gray-300 line-through decoration-red-400 decoration-2">${kit.originalPrice}</span>
                                </div>
                                <div className="text-xs text-green-600 font-bold mt-2 bg-green-50 inline-block px-3 py-1 rounded-full">
                                    Save {kit.discountPercentage}%
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 bg-gray-50/50 p-6 rounded-2xl">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Net Profit</span>
                                    <span className="font-bold text-slate-800">${kit.merchantProfit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Margin</span>
                                    <span className={`font-bold ${kit.merchantMargin < goal.minMargin ? "text-red-500" : "text-green-600"}`}>
                                        {kit.merchantMargin.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">AI Confidence</span>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${kit.conversionScore > 80 ? "bg-green-100 text-green-700" : kit.conversionScore > 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                        {kit.conversionScore > 80 ? "HIGH" : kit.conversionScore > 60 ? "MED" : "LOW"} ({kit.conversionScore}%)
                                    </span>
                                </div>
                            </div>

                            {kit.risks.length > 0 && (
                                <div className="space-y-2 mb-6 text-center">
                                    {kit.risks.map((risk: string, i: number) => (
                                        <div key={i} className="inline-flex items-center gap-2 text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                            <span>{risk}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-gray-500 italic text-center leading-relaxed">
                                "{kit.aiExplanation}"
                            </p>

                            {/* Selection Indicator */}
                            {selectedKit?.id === kit.id && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Details Section */}
                {selectedKit && (
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl animate-fadeIn">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg shadow-slate-900/30">
                                        <i className="fa-solid fa-file-invoice-dollar"></i>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Financial Breakdown</h3>
                                </div>

                                <div className="space-y-5 bg-gray-50 p-8 rounded-[2rem]">
                                    <Row label="Revenue (Suggested Price)" value={`$${selectedKit.bundlePrice.toFixed(2)}`} />
                                    <Row label="Cost of Goods" value={`-$${selectedKit.merchantCost.toFixed(2)}`} color="text-red-400" />
                                    <Row label={`Platform Commission (${selectedKit.yalaCommissionRate}%)`} value={`-$${selectedKit.yalaCommission.toFixed(2)}`} color="text-red-400" />
                                    <Row label="Delivery Subsidization" value={`-$${selectedKit.deliveryCost.toFixed(2)}`} color="text-red-400" />
                                    <div className="h-px bg-gray-200 my-2"></div>
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span className="text-slate-900">Net Profit</span>
                                        <span className="text-green-600">+${selectedKit.netProfitAfterAll.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center mt-2 uppercase tracking-wide">
                                        * Calculated based on standard delivery zones
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg shadow-slate-900/30">
                                            <i className="fa-solid fa-layer-group"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Included In Kit</h3>
                                    </div>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedKit.items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <i className="fa-solid fa-box text-gray-400"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-slate-900">{item.product.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Single Unit Cost: ${item.product.cost}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-900">x{item.quantity}</div>
                                                    <div className="text-xs text-slate-400 line-through">${item.product.price * item.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <button
                                        onClick={handlePublish}
                                        disabled={loading}
                                        className="w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-wider relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                                        {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rocket"></i>}
                                        Launch Kit to Store
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* Success View */
    if (step === "PUBLISH_SUCCESS") {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl mb-8 animate-bounce">
                    <i className="fa-solid fa-check"></i>
                </div>
                <h2 className="text-4xl font-luxury font-bold text-slate-900 mb-4">Deployment Successful</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
                    Your smart kit is live. Our predictive engine will now monitor performance and suggest iterations in 7 days.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => setStep("SELECT_PRODUCTS")} className="px-8 py-4 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                        Create Another
                    </button>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                        Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <div>Error State</div>;
};

const Row = ({ label, value, color = "text-slate-700" }: { label: string; value: string | number; color?: string }) => (
    <div className="flex justify-between text-base items-center">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{value}</span>
    </div>
);

export default SmartKitBuilder;
