import { useState, useCallback } from "react";
import { startTransition } from "react";
import { CartItem, User, AppSettings } from "../types";
import { supabase } from "../services/supabaseClient";
import { OrderNotificationData } from "../services/whatsappNotification";

export function useCheckout(
    user: User | null,
    setUser: React.Dispatch<React.SetStateAction<User | null>>,
    cart: CartItem[],
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
    setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>,
    settings: AppSettings
) {
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
                    full_name: profile?.full_name || user.name || "Customer",
                    phone: profile?.phone || user.phone || "",
                    address: profile?.address || "",
                    total: total,
                    delivery_fee: deliveryFee,
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
                if (updatedProfile) {
                    setUser((prev) =>
                        prev ? { ...prev, points: updatedProfile.points } : null
                    );
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
