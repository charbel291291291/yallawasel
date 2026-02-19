import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { processOrderImpact } from "../services/impactService";
import {
    AdminOrder,
    OrderStatusHistoryEntry,
} from "./types";

const OrdersView: React.FC = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderStatusHistoryEntry[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        let query = supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
            query = query.eq("status", statusFilter);
        }

        const { data: ordersData, error: ordersError } = await query;

        if (ordersError) {
            console.error("Error fetching orders:", ordersError);
            setOrders([]);
            setLoading(false);
            return;
        }

        setOrders(ordersData || []);
        setLoading(false);
    };

    const fetchOrderHistory = async (orderId: string) => {
        const { data } = await supabase
            .from("order_status_history")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });
        setOrderHistory(data || []);
    };

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel("orders-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    fetchOrders();
                    if (
                        selectedOrder &&
                        payload.new &&
                        (payload.new as Record<string, unknown>).id === selectedOrder.id
                    ) {
                        setSelectedOrder(payload.new as unknown as AdminOrder);
                        fetchOrderHistory(
                            (payload.new as Record<string, unknown>).id as string
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [statusFilter]);

    useEffect(() => {
        if (selectedOrder) {
            fetchOrderHistory(selectedOrder.id);
        }
    }, [selectedOrder]);

    const updateStatus = async (id: string, newStatus: string) => {
        const { data: order } = await supabase
            .from("orders")
            .select("user_id, total, status")
            .eq("id", id)
            .single();

        await supabase
            .from("orders")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id);

        await supabase.from("order_status_history").insert({
            order_id: id,
            status: newStatus,
            note: adminNote || `Status changed to ${newStatus}`,
        });

        if (newStatus === "delivered" && order && order.user_id) {
            const orderTotal = order.total || 0;
            if (orderTotal > 0) {
                await processOrderImpact(id, order.user_id, orderTotal);
            }
        }

        setAdminNote("");
        fetchOrders();
    };

    const cancelOrder = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        await updateStatus(id, "cancelled");
    };

    const addAdminNote = async (id: string) => {
        if (!adminNote.trim()) return;
        await supabase
            .from("orders")
            .update({ admin_notes: adminNote })
            .eq("id", id);
        await supabase.from("order_status_history").insert({
            order_id: id,
            status: selectedOrder?.status || "pending",
            note: `Admin note: ${adminNote}`,
        });
        setAdminNote("");
        fetchOrders();
        if (selectedOrder?.id === id) {
            setSelectedOrder({ ...selectedOrder, admin_notes: adminNote });
        }
    };

    const filteredOrders = orders.filter((o) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            o.full_name?.toLowerCase().includes(query) ||
            o.phone?.includes(query) ||
            o.id.toLowerCase().includes(query) ||
            o.profiles?.full_name?.toLowerCase().includes(query)
        );
    });

    const statusOptions = [
        { value: "pending", label: "Pending", badge: "badge-warning" },
        { value: "approved", label: "Approved", badge: "badge-primary" },
        { value: "preparing", label: "Preparing", badge: "badge-primary" },
        {
            value: "out_for_delivery",
            label: "Out for Delivery",
            badge: "badge-warning",
        },
        { value: "delivered", label: "Delivered", badge: "badge-success" },
        { value: "cancelled", label: "Cancelled", badge: "badge-danger" },
    ];

    const getStatusBadge = (status: string) => {
        return (
            statusOptions.find((s) => s.value === status)?.badge || "badge-neutral"
        );
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="admin-card p-4 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-input pl-10"
                    />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="admin-input admin-select pr-10 cursor-pointer min-w-[160px]"
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button onClick={fetchOrders} className="btn-admin btn-admin-secondary">
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="admin-card p-20 text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500 font-medium">Loading orders...</p>
                </div>
            ) : (
                <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((o) => (
                                    <tr
                                        key={o.id}
                                        className="group transition-colors hover:bg-slate-50"
                                    >
                                        <td className="font-mono text-xs font-bold text-slate-600">
                                            #{o.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="font-semibold text-slate-800">
                                            {o.full_name || o.profiles?.full_name || "Guest User"}
                                        </td>
                                        <td className="text-slate-500 text-xs">
                                            {o.phone || o.profiles?.phone || "-"}
                                        </td>
                                        <td className="text-slate-500 text-xs">
                                            {o.items ? `${o.items.length} items` : "0 items"}
                                        </td>
                                        <td className="font-bold text-slate-800">
                                            ${Number(o.total).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(o.status)}`}>
                                                {statusOptions.find((s) => s.value === o.status)
                                                    ?.label || o.status}
                                            </span>
                                        </td>
                                        <td className="text-slate-400 text-xs">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setSelectedOrder(o)}
                                                className="btn-admin btn-admin-secondary py-1 px-3 text-xs"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-12 text-center text-slate-400 font-medium"
                                        >
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Order Details Modal - Updated UI */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Placed on{" "}
                                    {new Date(selectedOrder.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            {/* Status Bar */}
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Current Status
                                    </label>
                                    <span
                                        className={`badge ${getStatusBadge(
                                            selectedOrder.status
                                        )} text-sm`}
                                    >
                                        {statusOptions.find((s) => s.value === selectedOrder.status)
                                            ?.label || selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) =>
                                            updateStatus(selectedOrder.id, e.target.value)
                                        }
                                        className="admin-input text-sm py-2 pl-3 pr-8 min-w-[140px]"
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                Mark as {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Customer & Delivery Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 border-b border-gray-100 pb-2">
                                        Customer Details
                                    </h4>

                                    <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                                        <span className="text-slate-500">Name:</span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedOrder.full_name ||
                                                selectedOrder.profiles?.full_name ||
                                                "Guest"}
                                        </span>

                                        <span className="text-slate-500">Phone:</span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedOrder.phone ||
                                                selectedOrder.profiles?.phone ||
                                                "N/A"}
                                        </span>

                                        <span className="text-slate-500">Address:</span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedOrder.address || "Standard Delivery"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 border-b border-gray-100 pb-2">
                                        Order Info
                                    </h4>

                                    <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                                        <span className="text-slate-500">Payment:</span>
                                        <span className="font-semibold text-slate-800 capitalize">
                                            {selectedOrder.payment_method || "Cash"}
                                        </span>

                                        <span className="text-slate-500">Total:</span>
                                        <span className="font-bold text-emerald-600 text-lg">
                                            ${Number(selectedOrder.total).toFixed(2)}
                                        </span>
                                    </div>

                                    {selectedOrder.notes && (
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                            <p className="text-xs font-bold text-amber-700 mb-1">
                                                Customer Note:
                                            </p>
                                            <p className="text-xs text-amber-900 italic">
                                                {selectedOrder.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 border-b border-gray-100 pb-2 mb-4">
                                    Items ({selectedOrder.items?.length || 0})
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map(
                                        (
                                            item: {
                                                image?: string;
                                                name?: string;
                                                price?: number;
                                                quantity?: number;
                                            },
                                            idx: number
                                        ) => (
                                            <div
                                                key={idx}
                                                className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            className="w-full h-full object-cover"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <i className="fa-solid fa-box"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        ${item.price} x {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-slate-900">
                                                    $
                                                    {(
                                                        (item.price || 0) * (item.quantity || 0)
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Admin Notes Section */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Internal Notes
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a private note regarding this order..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        className="admin-input text-sm"
                                    />
                                    <button
                                        onClick={() => addAdminNote(selectedOrder.id)}
                                        className="btn-admin btn-admin-primary whitespace-nowrap"
                                    >
                                        Add Note
                                    </button>
                                </div>
                                {selectedOrder.admin_notes && (
                                    <div className="mt-3 text-sm text-slate-600 pl-3 border-l-2 border-slate-300">
                                        {selectedOrder.admin_notes}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            {selectedOrder.status !== "cancelled" && (
                                <button
                                    onClick={() => cancelOrder(selectedOrder.id)}
                                    className="btn-admin btn-admin-danger"
                                >
                                    Cancel Order
                                </button>
                            )}
                            {selectedOrder.phone && (
                                <a
                                    href={`https://wa.me/${selectedOrder.phone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-admin btn-admin-secondary text-green-600 border-green-200 hover:bg-green-50"
                                >
                                    <i className="fab fa-whatsapp"></i> Chat
                                </a>
                            )}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn-admin btn-admin-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersView;
