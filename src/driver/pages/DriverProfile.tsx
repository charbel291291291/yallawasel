import { useContext, useState } from "react";
import DriverAuthContext from "../context/DriverAuthContext";
import { supabase } from "@/services/supabaseClient";

const DriverProfile = () => {
    const { session, updateStatus, logout } = useContext(DriverAuthContext);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [vehicleType, setVehicleType] = useState(session?.profile?.vehicle_type || "car");
    const [vehiclePlate, setVehiclePlate] = useState(session?.profile?.vehicle_plate || "");

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);

        const { error } = await supabase
            .from("profiles")
            .update({ vehicle_type: vehicleType, vehicle_plate: vehiclePlate })
            .eq("id", session?.user.id);

        setSaving(false);

        if (error) {
            setFeedback({ type: "error", message: "Error saving profile. Please try again." });
        } else {
            setFeedback({ type: "success", message: "Profile updated successfully!" });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm p-4 text-center">
                <h1 className="font-bold text-gray-800">My Profile</h1>
            </header>

            <div className="p-4 space-y-6">
                {/* Feedback Banner */}
                {feedback && (
                    <div className={`p-3 rounded-xl text-sm font-medium text-center ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {feedback.message}
                    </div>
                )}

                {/* Avatar Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        {session?.profile?.avatar_url ? (
                            <img src={session.profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 bg-gray-100">
                                {session?.profile?.full_name?.[0] || "D"}
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold">{session?.profile?.full_name}</h2>
                    <p className="text-gray-500 text-sm">{session?.user.email}</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                            {session?.profile?.rating || 5.0} ★
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                            {session?.profile?.total_deliveries || 0} Deliveries
                        </span>
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-700">Vehicle Information</h3>
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase">Type</label>
                        <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                        >
                            <option value="bike">Motorbike</option>
                            <option value="car">Car</option>
                            <option value="van">Van</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase">Plate Number</label>
                        <input
                            type="text"
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                            placeholder="ABC-123"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Update Details"}
                    </button>
                </div>

                {/* Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-700">Settings</h3>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Online Status</span>
                        <select
                            value={session?.profile?.driver_status || "offline"}
                            onChange={(e) => updateStatus(e.target.value as "online" | "busy" | "offline")}
                            className="text-sm border-none bg-transparent font-bold text-right outline-none cursor-pointer"
                        >
                            <option value="online">Online</option>
                            <option value="busy">Busy</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriverProfile;
