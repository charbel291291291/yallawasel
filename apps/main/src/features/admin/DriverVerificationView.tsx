import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { AdminCustomer } from "./types";

const DriverVerificationView: React.FC = () => {
    const [drivers, setDrivers] = useState<AdminCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchDrivers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "driver")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching drivers:", error);
        } else {
            setDrivers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDrivers();

        // Real-time subscription for instant updates
        const channel = supabase
            .channel('driver-verification-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'role=eq.driver'
            }, () => {
                fetchDrivers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateDriverStatus = async (id: string, verified: boolean, status: 'approved' | 'rejected' | 'pending') => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ verified, status })
                .eq("id", id);

            if (error) throw error;
            // The local state will be updated by real-time subscription or manual fetch
        } catch (error: any) {
            console.error("Error updating driver:", error);
            alert("Error: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStyles = (status?: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-2xl text-gray-800">Driver Verification Terminal</h3>
                    <p className="text-gray-500 text-sm">Review and manage field operator access credentials.</p>
                </div>
                <button
                    onClick={fetchDrivers}
                    className="p-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
                    Refresh Fleet
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-gray-100">
                        <tr>
                            <th className="p-6">Operator Identity</th>
                            <th className="p-6">Contact</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Verified</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {drivers.map((driver) => (
                            <tr key={driver.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400">
                                            {driver.full_name?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 leading-none mb-1">{driver.full_name || 'Unidentified'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">ID: {driver.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <p className="text-gray-600 font-medium">{driver.phone || 'No Phone'}</p>
                                    <p className="text-gray-400 text-xs">{driver.email || 'No Email'}</p>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(driver.status)}`}>
                                        {driver.status || 'Pending'}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${driver.verified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                        <i className={`fas ${driver.verified ? 'fa-check' : 'fa-clock'} text-[10px]`}></i>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {driver.status !== 'approved' && (
                                            <button
                                                disabled={updatingId === driver.id}
                                                onClick={() => updateDriverStatus(driver.id, true, 'approved')}
                                                className="h-9 px-4 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {driver.status !== 'rejected' && (
                                            <button
                                                disabled={updatingId === driver.id}
                                                onClick={() => updateDriverStatus(driver.id, false, 'rejected')}
                                                className="h-9 px-4 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                            >
                                                Reject
                                            </button>
                                        )}
                                        {driver.status !== 'pending' && (
                                            <button
                                                disabled={updatingId === driver.id}
                                                onClick={() => updateDriverStatus(driver.id, false, 'pending')}
                                                className="h-9 px-4 bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-300 transition-colors"
                                            >
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {drivers.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <i className="fas fa-users-slash text-5xl text-gray-100"></i>
                                        <p className="text-gray-400 font-medium uppercase tracking-[0.3em] text-xs">No drivers in terminal system</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DriverVerificationView;
