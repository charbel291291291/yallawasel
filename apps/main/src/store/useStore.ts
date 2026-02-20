import { create } from 'zustand';
import { Product, HappyHour } from '../types';
import { supabase } from '../services/supabaseClient';

interface AppState {
    products: Product[];
    happyHours: HappyHour[];
    isLoading: boolean;
    setProducts: (products: Product[]) => void;
    setHappyHours: (happyHours: HappyHour[]) => void;
    fetchInitialData: () => Promise<void>;
}

/** Maps a Supabase product row to the frontend Product shape */
function mapProduct(p: any): Product {
    return {
        id: p.id,
        name: p.name,
        nameAr: p.name_ar || p.name,
        description: p.description,
        descriptionAr: p.description_ar || p.description,
        price: Number(p.price),
        cost: Number(p.cost),
        stock: Number(p.stock),
        category: p.category,
        image: p.image,
        tags: p.tags || [],
        isActive: p.is_active,
    };
}

export const useStore = create<AppState>((set) => ({
    products: [],
    happyHours: [],
    isLoading: false,
    setProducts: (products) => set({ products }),
    setHappyHours: (happyHours) => set({ happyHours }),
    fetchInitialData: async () => {
        set({ isLoading: true });
        try {
            const { data: pData } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("name");

            const { data: hData } = await supabase
                .from("happy_hours_schedule")
                .select("*")
                .eq("active", true)
                .order("created_at", { ascending: false });

            set({
                products: (pData || []).map(mapProduct),
                happyHours: hData || [],
                isLoading: false
            });
        } catch (err) {
            console.error("Store init error:", err);
            set({ isLoading: false });
        }
    }
}));

// Real-time listener setup (to be called once in App)
export const setupRealtimeListeners = () => {
    const productsChannel = supabase
        .channel("products_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
            const { data } = await supabase.from("products").select("*").eq("is_active", true).order("name");
            if (data) useStore.getState().setProducts(data.map(mapProduct));
        })
        .subscribe();

    const happyHoursChannel = supabase
        .channel("happy_hours_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "happy_hours_schedule" }, async () => {
            const { data } = await supabase.from("happy_hours_schedule").select("*").eq("active", true).order("created_at", { ascending: false });
            if (data) useStore.getState().setHappyHours(data);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(happyHoursChannel);
    };
};
