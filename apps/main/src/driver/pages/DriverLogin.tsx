import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";

const DriverLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            if (!data.user) throw new Error("No user returned");

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", data.user.id)
                .single();

            if (profileError) throw new Error("Could not verify your account role.");

            if (profile?.role !== "driver" && profile?.role !== "admin") {
                await supabase.auth.signOut();
                throw new Error("Access denied: Not a driver account.");
            }

            navigate("/dashboard");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
            <div className="absolute -bottom-32 left-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <i className="fa-solid fa-truck-fast text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Driver Login</h1>
                    <p className="text-blue-200 text-sm font-medium">Access your delivery dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm mb-6 text-center">
                        <i className="fa-solid fa-circle-exclamation mr-2" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative group">
                        <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="email"
                            required
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="driver@yallawasel.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="password"
                            required
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <i className="fa-solid fa-circle-notch fa-spin" />
                        ) : (
                            <>
                                <span>Sign In</span>
                                <i className="fa-solid fa-arrow-right" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Forgot Password?</a>
                </div>
            </div>

            <div className="absolute bottom-6 text-center w-full z-10">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Yalla Wasel Logistics v2.1</p>
            </div>
        </div>
    );
};

export default DriverLogin;
