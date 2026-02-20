import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { uploadImage } from "./utils";

const SettingsView: React.FC = () => {
    const { settings: globalSettings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(globalSettings);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        await updateSettings(localSettings);
        alert("Global configurations synchronized.");
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const publicUrl = await uploadImage(file);
            setLocalSettings({ ...localSettings, logo_url: publicUrl });
        } catch (error) {
            alert("Error uploading logo");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-luxury text-2xl font-bold mb-8">
                    Terminal Configurations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Platform Name
                            </label>
                            <input
                                type="text"
                                value={localSettings.store_name}
                                onChange={(e) =>
                                    setLocalSettings({
                                        ...localSettings,
                                        store_name: e.target.value,
                                    })
                                }
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/5 outline-none font-bold text-sm transition-all"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Store Logo
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                                    {localSettings.logo_url ? (
                                        <img
                                            src={localSettings.logo_url}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-300 text-2xl font-bold">L</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label
                                        className={`btn-3d px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-2 ${uploading ? "opacity-50 pointer-events-none" : ""
                                            }`}
                                    >
                                        {uploading ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fa-solid fa-upload"></i>
                                        )}
                                        Upload Logo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                    <p className="text-[9px] text-gray-400 mt-2">
                                        Recommended size: 512x512px (PNG/JPG)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-700">
                                    Maintenance Mode
                                </span>
                                <button
                                    onClick={() =>
                                        setLocalSettings({
                                            ...localSettings,
                                            maintenance_mode: !localSettings.maintenance_mode,
                                        })
                                    }
                                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.maintenance_mode ? "bg-red-500" : "bg-gray-300"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.maintenance_mode ? "right-1" : "left-1"
                                            }`}
                                    ></div>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">
                                When active, users will see a "Service Upgrading" message
                                instead of the shop.
                            </p>
                        </div>

                        {/* Ticker Speed Control */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Breaking Offer Scroll Speed
                            </label>
                            <div className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-2xl">
                                <i className="fa-solid fa-gauge-high text-gray-400 px-2"></i>
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={localSettings.ticker_speed || 40}
                                    onChange={(e) =>
                                        setLocalSettings({
                                            ...localSettings,
                                            ticker_speed: Number(e.target.value),
                                        })
                                    }
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <span className="font-bold font-mono text-primary w-12 text-right">
                                    {localSettings.ticker_speed || 40}s
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 px-1">
                                Higher values = Slower scrolling. Lower values = Faster.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-5 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
                        <div className="relative z-10">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <i className="fa-solid fa-heart"></i> Kit For Good Program
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                        Auto-Contribution
                                    </span>
                                    <button className="w-10 h-5 bg-green-500 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        Donation Ratio
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            defaultValue={5}
                                            className="w-16 p-2 bg-white border border-gray-100 rounded-lg text-center font-black text-primary"
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 italic">
                                            Kits sold per 1 Kit donated
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-10 border-t border-gray-50 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="btn-3d px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                    >
                        Commit Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
