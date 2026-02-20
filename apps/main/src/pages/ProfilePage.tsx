import React, { useState, useEffect } from "react";
import { User, Order } from "../types";
import { translations, Language } from "../translations";
import { supabase } from "../services/supabaseClient";
import WalletCard from "../components/WalletCard";

interface ProfilePageProps {
    user: User;
    lang: Language;
    onLogout: () => void;
}

const PrivilegeItem = ({ icon, color, label, desc }: { icon: string; color: string; label: string; desc: string }) => (
    <div className="flex items-center gap-5 group">
        <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${color} group-hover:scale-110 transition-transform`}
        >
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
            <p className="text-base font-bold text-gray-900">{label}</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, lang, onLogout }) => {
    const t = translations[lang];
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
        <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-3d-entrance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="px-2">
                        <h1 className="font-luxury text-4xl font-bold text-gray-900">
                            {t.profile}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Manage your luxury membership and privileges.
                        </p>
                    </div>
                    <WalletCard user={user} lang={lang} />

                    {/* Real Order History */}
                    <div className="depth-card rounded-[2.5rem] p-6">
                        <h3 className="font-bold text-gray-900 mb-4 px-2">{t.history}</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {orders.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-4">
                                    No orders yet.
                                </p>
                            ) : (
                                orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center text-sm border border-gray-100"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800">
                                                Order #{order.id.slice(0, 8)}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(
                                                    order.date || order.created_at
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-primary">${order.total}</p>
                                            <p className="text-[9px] uppercase tracking-widest text-gray-500">
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={onLogout}
                                className="btn-3d flex items-center justify-center gap-4 w-full p-4 rounded-2xl bg-red-50 text-red-600 font-black hover:bg-red-100 transition-all shadow-md"
                            >
                                <i className="fa-solid fa-power-off"></i>
                                <span className="text-sm uppercase tracking-widest">
                                    {t.logout}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="depth-card rounded-[2.5rem] p-10 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">
                            {t.pointsBalance}
                        </h3>
                        <div className="flex items-baseline gap-3 mb-10">
                            <span className="text-7xl font-black text-primary drop-shadow-sm">
                                {user.points.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-gray-400">{t.pts}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <span>{user.tier} TIER</span>
                                <span>NEXT LEVEL</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5 border border-white/50">
                                <div
                                    className="h-full bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000"
                                    style={{ width: "45%" }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="depth-card rounded-[2.5rem] p-10">
                        <h3 className="font-luxury text-2xl font-bold mb-8">
                            {t.memberPrivileges}
                        </h3>
                        <div className="space-y-6">
                            <PrivilegeItem
                                icon="fa-headset"
                                color="bg-blue-50 text-blue-600"
                                label={t.eliteSupport}
                                desc="Direct priority access to Emil."
                            />
                            <PrivilegeItem
                                icon="fa-truck-fast"
                                color="bg-green-50 text-green-600"
                                label={t.priorityDelivery}
                                desc="Immediate processing for your orders."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
