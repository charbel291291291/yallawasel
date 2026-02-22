import { useState, useCallback } from "react";
import { startTransition } from "react";
import { AppSettings } from "@/types";
import { supabase } from "@/services/supabaseClient";
import { OrderNotificationData } from "@/services/whatsappNotification";


import { useStore } from "@/store/useStore";

export function useCheckout(
    setIsCartOpen: (open: boolean) => void,
    settings: AppSettings
) {
    const { user, cart, setUser, setCart } = useStore();
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const [lastOrder, setLastOrder] = useState<OrderNotificationData | null>(null);
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const handleCheckout = useCallback(async () => {
        if (!user) return;
        setCheckoutLoading(true);
        try {
            const subtotal = cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
            const deliveryFee = subtotal > 50 ? 0 : 5;
            const total = subtotal + deliveryFee;

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, phone, address")
                .eq("id", user.id)
                .single();

            const { data, error } = await supabase
                .from("orders")
                .insert({
                    user_id: user.id,
                    customer_id: user.id, // Real-time lifecycle field
                    full_name: profile?.full_name || user.name || "Customer",
                    phone: profile?.phone || user.phone || "",
                    address: profile?.address || "",
                    pickup_address: "Main Branch (Shop)", // For driver preview
                    dropoff_address: profile?.address || "", // For driver preview
                    pickup_lat: 33.8938, // Central Beirut / Shop Coord
                    pickup_lng: 35.5018,
                    total: total,
                    price: total, // Real-time lifecycle field
                    delivery_fee: deliveryFee,
                    payout_base: deliveryFee > 0 ? deliveryFee * 0.8 : 5.0, // Guaranteed base payout
                    search_started_at: new Date().toISOString(),
                    status: "pending",
                    payment_method: "cash",
                    delivery_zone: "Adonis",
                    items: cart,
                })
                .select()
                .single();

            if (error) {
                console.error("Order insert error:", error);
                throw error;
            }

            if (data) {
                await supabase.from("order_status_history").insert({
                    order_id: data.id,
                    status: "pending",
                    note: "Order placed by customer",
                    created_by: user.id,
                });

                const orderData: OrderNotificationData = {
                    full_name: data.full_name,
                    phone: data.phone,
                    address: data.address,
                    total: data.total,
                    items: data.items,
                    order_id: data.id,
                    adminPhone: settings?.contact_phone,
                };
                setLastOrder(orderData);
                setShowOrderSuccess(true);
            }

            const pointsEarned = Math.floor(total * 10);
            await supabase.rpc("increment_points", {
                user_id: user.id,
                amount: pointsEarned,
            });

            const { data: updatedProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            startTransition(() => {
                if (updatedProfile && user) {
                    setUser({ ...user, points: updatedProfile.points });
                }
                setCart([]);
                setIsCartOpen(false);
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Checkout failed";
            setCheckoutError(message);
        } finally {
            setCheckoutLoading(false);
        }
    }, [user, cart, settings, setUser, setCart, setIsCartOpen]);


    const closeOrderSuccess = useCallback(() => {
        setShowOrderSuccess(false);
        setLastOrder(null);
    }, []);

    return {
        checkoutLoading,
        lastOrder,
        showOrderSuccess,
        checkoutError,
        handleCheckout,
        closeOrderSuccess,
    };
}
