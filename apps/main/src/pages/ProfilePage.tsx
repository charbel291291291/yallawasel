import React, { useState, useEffect } from "react";
import { Order } from "@/types";
import { supabase } from "@/services/supabaseClient";
import WalletCard from "@/components/WalletCard";

import { useStore } from "@/store/useStore";
import { useAuth } from "@/app/contexts/AuthContext";


const PrivilegeItem = ({ icon, label, desc }: { icon: string; label: string; desc: string }) => (
    <div className="flex items-center gap-6 group">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-2xl">
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
            <p className="text-sm font-black text-white uppercase tracking-widest">{label}</p>
            <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed font-medium">{desc}</p>
        </div>
    </div>
);

const ProfilePage: React.FC = () => {
    const { lang, user } = useStore();
    const { handleLogout } = useAuth();
    const isRTL = lang === 'ar';

    if (!user) return null;

    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from("orders")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (data) setOrders(data);
        };
        fetchOrders();
    }, [user.id]);

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-16 pb-32 animate-entrance">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 block">
                        {isRTL ? 'حساب العضوية' : 'MEMBERSHIP PORTAL'}
                    </span>
                    <h1 className="font-luxury text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-none">
                        {isRTL ? 'الملف الشخصي' : 'The Studio'}
                    </h1>
                    <p className="text-white/40 text-sm sm:text-lg max-w-lg leading-relaxed font-medium">
                        {isRTL
                            ? 'إدارة عضويتك الفاخرة وامتيازاتك الحصرية.'
                            : 'Manage your elite membership status and exclusive artifacts.'}
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn-luxury btn-luxury-outline px-10 h-14"
                >
                    <i className="fa-solid fa-power-off mr-3 text-[10px]"></i>
                    {isRTL ? 'تسجيل الخروج' : 'SIGN OUT'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column - Stats & History */}
                <div className="lg:col-span-12 space-y-10">
                    <WalletCard user={user} lang={lang} />
                </div>

                {/* Main Content Grid */}
                <div className="lg:col-span-7 space-y-10">
                    {/* Order History */}
                    <div className="luxury-card p-10 bg-luxury-glow pt-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-luxury text-2xl font-black text-white">{isRTL ? 'السجل' : 'Collection History'}</h3>
                            <div className="w-12 h-[1px] bg-primary/20"></div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {orders.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <p className="text-xs font-black uppercase tracking-[0.3em]">No Previous Selections</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-6 bg-white/5 border border-white/5 rounded-3xl flex justify-between items-center transition-all hover:border-primary/20 hover:bg-white/10 group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                                                <i className="fa-solid fa-box-open"></i>
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-xs uppercase tracking-widest leading-none mb-2">
                                                    Selection #{order.id.slice(0, 8)}
                                                </p>
                                                <p className="text-[10px] text-white/20 font-medium">
                                                    {new Date(order.date || order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-primary mb-1 tracking-tighter">${order.total}</p>
                                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${order.status === 'delivered' ? 'border-green-500/20 text-green-500' : 'border-primary/20 text-primary'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Loyalty & Privileges */}
                <div className="lg:col-span-5 space-y-10 flex flex-col">
                    {/* Points Card */}
                    <div className="luxury-card p-10 bg-[#C8A951]/5 border-[#C8A951]/20 flex flex-col justify-between flex-1 min-h-[350px]">
                        <div>
                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-8 block">Artifact Rewards</span>
                            <div className="flex items-baseline gap-4 mb-4">
                                <span className="font-luxury text-8xl font-black text-white tracking-tighter animate-pulse text-shadow-glow">
                                    {user.points.toLocaleString()}
                                </span>
                                <span className="text-sm font-black text-primary uppercase tracking-widest">PTS</span>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium leading-relaxed max-w-[200px]">
                                Your contribution to the luxury ecosystem has earned you exclusive status.
                            </p>
                        </div>

                        <div className="space-y-5 mt-12">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                <span>{user.tier} TIER</span>
                                <span className="text-primary">45% TO NEXT STATUS</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold-gradient rounded-full shadow-[0_0_20px_rgba(200,169,81,0.5)] transition-all duration-1000"
                                    style={{ width: "45%" }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Privileges Card */}
                    <div className="luxury-card p-10 border-white/5 bg-luxury-glow">
                        <h3 className="font-luxury text-2xl font-black text-white mb-10">{isRTL ? 'المزايا' : 'Elite Access'}</h3>
                        <div className="space-y-8 text-left">
                            <PrivilegeItem
                                icon="fa-headset"
                                label={isRTL ? 'دعم النخبة' : 'Conciege Access'}
                                desc="Direct priority terminal to our curators."
                            />
                            <PrivilegeItem
                                icon="fa-truck-fast"
                                label={isRTL ? 'توصيل الأولوية' : 'Express Logistics'}
                                desc="Dedicated couriers for your selections."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
