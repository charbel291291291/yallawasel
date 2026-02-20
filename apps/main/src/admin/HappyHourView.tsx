import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { AdminHappyHour } from "./types";

const HappyHourView: React.FC = () => {
    const [happyHours, setHappyHours] = useState<AdminHappyHour[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHappyHour, setEditingHappyHour] = useState<AdminHappyHour | null>(
        null
    );
    const [formData, setFormData] = useState({
        name: "",
        start_time: "",
        end_time: "",
        days_of_week: [] as number[],
        multiplier: 1,
        bonus_points: 0,
    });

    const fetchHappyHours = async () => {
        const { data } = await supabase
            .from("happy_hours_schedule")
            .select("*")
            .order("created_at", { ascending: false });
        setHappyHours(data || []);
    };

    useEffect(() => {
        fetchHappyHours();
    }, []);

    const handleCreateHappyHour = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await supabase.from("happy_hours_schedule").insert({
                ...formData,
            });

            await fetchHappyHours();

            setIsCreateModalOpen(false);
            setFormData({
                name: "",
                start_time: "",
                end_time: "",
                days_of_week: [],
                multiplier: 1,
                bonus_points: 0,
            });
            alert("Happy hour created successfully!");
        } catch (error) {
            console.error("Error creating happy hour:", error);
            alert("Error creating happy hour");
        }
    };

    const handleEditHappyHour = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHappyHour) return;
        try {
            await supabase
                .from("happy_hours_schedule")
                .update({
                    ...formData,
                })
                .eq("id", editingHappyHour.id);

            await fetchHappyHours();

            setIsEditModalOpen(false);
            setEditingHappyHour(null);
            alert("Happy hour updated successfully!");
        } catch (error) {
            console.error("Error updating happy hour:", error);
            alert("Error updating happy hour");
        }
    };

    const handleDeleteHappyHour = async (id: string) => {
        if (!confirm("Are you sure you want to delete this happy hour?")) return;
        try {
            await supabase.from("happy_hours_schedule").delete().eq("id", id);
            setHappyHours(happyHours.filter((hh) => hh.id !== id));
            alert("Happy hour deleted successfully!");
        } catch (error) {
            console.error("Error deleting happy hour:", error);
            alert("Error deleting happy hour");
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await supabase
                .from("happy_hours_schedule")
                .update({ active: !currentStatus })
                .eq("id", id);
            setHappyHours(
                happyHours.map((hh) =>
                    hh.id === id ? { ...hh, active: !currentStatus } : hh
                )
            );
        } catch (error) {
            console.error("Error updating happy hour status:", error);
        }
    };

    const openEditModal = (happyHour: AdminHappyHour) => {
        setEditingHappyHour(happyHour);
        setFormData({
            name: happyHour.name,
            start_time: happyHour.start_time,
            end_time: happyHour.end_time,
            days_of_week: happyHour.days_of_week || [],
            multiplier: happyHour.multiplier || 1,
            bonus_points: happyHour.bonus_points || 0,
        });
        setIsEditModalOpen(true);
    };

    const toggleDay = (day: number) => {
        setFormData((prev) => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter((d) => d !== day)
                : [...prev.days_of_week, day],
        }));
    };

    const getDayName = (day: number) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[day];
    };

    const getActiveStatus = (happyHour: AdminHappyHour) => {
        if (!happyHour.active)
            return { text: "Inactive", color: "bg-gray-100 text-gray-600" };

        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().substring(0, 5);

        const isActiveDay = happyHour.days_of_week?.includes(currentDay);
        const isWithinTime =
            currentTime >= happyHour.start_time && currentTime <= happyHour.end_time;

        if (isActiveDay && isWithinTime) {
            return { text: "Active Now", color: "bg-green-100 text-green-700" };
        }

        return { text: "Scheduled", color: "bg-yellow-100 text-yellow-700" };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl">Automated Promotion Engine</h3>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Create Happy Hour
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h4 className="font-bold text-lg">Scheduled Happy Hours</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Days</th>
                                    <th className="p-4">Multiplier</th>
                                    <th className="p-4">Bonus Points</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {happyHours.map((happyHour) => {
                                    const status = getActiveStatus(happyHour);
                                    return (
                                        <tr
                                            key={happyHour.id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="p-4 font-bold">{happyHour.name}</td>
                                            <td className="p-4">
                                                <span className="font-mono">
                                                    {happyHour.start_time} - {happyHour.end_time}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {happyHour.days_of_week?.map((day: number) => (
                                                        <span
                                                            key={day}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                                        >
                                                            {getDayName(day)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-primary">
                                                    {happyHour.multiplier}x
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-green-600">
                                                    +{happyHour.bonus_points}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() =>
                                                        handleToggleActive(happyHour.id, happyHour.active)
                                                    }
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                                                >
                                                    {status.text}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditModal(happyHour)}
                                                        className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteHappyHour(happyHour.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {happyHours.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400">
                                            No happy hours scheduled yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-4">How It Works</h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h5 className="font-bold">Create Schedule</h5>
                                <p className="text-sm text-gray-600">
                                    Set specific times and days for promotions
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h5 className="font-bold">Set Multipliers</h5>
                                <p className="text-sm text-gray-600">
                                    Configure 2x, 3x points or bonus points
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <h5 className="font-bold">Automatic Application</h5>
                                <p className="text-sm text-gray-600">
                                    System applies promotions during checkout
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-4">Best Practices</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                            <span>Schedule during low-traffic periods</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                            <span>Use 2x multiplier for regular promotions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                            <span>Add bonus points for special events</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                            <span>Test different time slots</span>
                        </li>
                    </ul>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6">Create Happy Hour</h3>
                        <form onSubmit={handleCreateHappyHour} className="space-y-4">
                            <input
                                required
                                placeholder="Happy Hour Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="time"
                                    required
                                    placeholder="Start Time"
                                    value={formData.start_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start_time: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                                <input
                                    type="time"
                                    required
                                    placeholder="End Time"
                                    value={formData.end_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, end_time: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Days of Week
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`p-2 rounded-lg text-sm font-bold ${formData.days_of_week.includes(day)
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {getDayName(day)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">
                                        Points Multiplier
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        value={formData.multiplier}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                multiplier: Number(e.target.value),
                                            })
                                        }
                                        className="w-full p-3 border border-gray-200 rounded-xl"
                                        placeholder="e.g., 2 for 2x points"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">
                                        Bonus Points
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.bonus_points}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                bonus_points: Number(e.target.value),
                                            })
                                        }
                                        className="w-full p-3 border border-gray-200 rounded-xl"
                                        placeholder="Additional points"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                                >
                                    Create Happy Hour
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingHappyHour && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6">Edit Happy Hour</h3>
                        <form onSubmit={handleEditHappyHour} className="space-y-4">
                            <input
                                required
                                placeholder="Happy Hour Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="time"
                                    required
                                    placeholder="Start Time"
                                    value={formData.start_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start_time: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                                <input
                                    type="time"
                                    required
                                    placeholder="End Time"
                                    value={formData.end_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, end_time: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Days of Week
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`p-2 rounded-lg text-sm font-bold ${formData.days_of_week.includes(day)
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {getDayName(day)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">
                                        Points Multiplier
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        value={formData.multiplier}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                multiplier: Number(e.target.value),
                                            })
                                        }
                                        className="w-full p-3 border border-gray-200 rounded-xl"
                                        placeholder="e.g., 2 for 2x points"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">
                                        Bonus Points
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.bonus_points}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                bonus_points: Number(e.target.value),
                                            })
                                        }
                                        className="w-full p-3 border border-gray-200 rounded-xl"
                                        placeholder="Additional points"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                                >
                                    Update Happy Hour
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HappyHourView;
