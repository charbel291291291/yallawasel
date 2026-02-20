import { useState, useEffect } from "react";
import { Product, HappyHour } from "../types";
import { supabase } from "../services/supabaseClient";

/** Maps a Supabase product row to the frontend Product shape */
function mapProduct(p: {
    id: string;
    name: string;
    name_ar?: string;
    description: string;
    description_ar?: string;
    price: number;
    cost: number;
    stock: number;
    category: string;
    image: string;
    tags?: string[];
    is_active?: boolean;
}): Product {
    return {
        id: p.id,
        name: p.name,
        nameAr: p.name_ar || p.name,
        description: p.description,
        descriptionAr: p.description_ar || p.description,
        price: Number(p.price),
        cost: Number(p.cost),
        stock: Number(p.stock),
        category: p.category as Product["category"],
        image: p.image,
        tags: p.tags || [],
        isActive: p.is_active,
    };
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [happyHours, setHappyHours] = useState<HappyHour[]>([]);
    const [happyHoursLoaded, setHappyHoursLoaded] = useState(false);

    // Initial fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: productsData, error: productsError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");

                if (productsError) {
                    if (productsError.code !== "20" && !productsError.message.includes("AbortError")) {
                        console.error("Error fetching products:", productsError);
                    }
                } else if (productsData && productsData.length > 0) {
                    setProducts(productsData.map(mapProduct));
                }

                const { data: happyHoursData } = await supabase
                    .from("happy_hours_schedule")
                    .select("*")
                    .eq("active", true)
                    .order("created_at", { ascending: false });

                setHappyHours(happyHoursData || []);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setHappyHoursLoaded(true);
            }
        };
        fetchData();
    }, []);

    // Real-time subscriptions
    useEffect(() => {
        const happyHoursChannel = supabase
            .channel("happy_hours_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "happy_hours_schedule" },
                () => {
                    supabase
                        .from("happy_hours_schedule")
                        .select("*")
                        .eq("active", true)
                        .order("created_at", { ascending: false })
                        .then(({ data }) => {
                            if (data) setHappyHours(data);
                        });
                }
            )
            .subscribe();

        const productsChannel = supabase
            .channel("products_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                () => {
                    supabase
                        .from("products")
                        .select("*")
                        .eq("is_active", true)
                        .order("name")
                        .then(({ data }) => {
                            if (data && data.length > 0) {
                                setProducts(data.map(mapProduct));
                            }
                        });
                }
            )
            .subscribe();

        return () => {
            try {
                if (happyHoursChannel) supabase.removeChannel(happyHoursChannel);
            } catch (_e) {
                /* channel already removed */
            }
            try {
                if (productsChannel) supabase.removeChannel(productsChannel);
            } catch (_e) {
                /* channel already removed */
            }
        };
    }, []);

    return { products, happyHours, happyHoursLoaded };
}
