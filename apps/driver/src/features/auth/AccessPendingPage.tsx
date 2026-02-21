import React from 'react';
import { ShellLayout } from '../../layouts/ShellLayout';
import { useAuth } from '../auth/useAuth';

export const AccessPendingPage: React.FC = () => {
    const { profile, signOut } = useAuth();

    const isRejected = profile?.status === 'rejected';

    return (
        <ShellLayout>
            <div className="w-full max-w-[450px] bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-12 text-center animate-3d-entrance">
                <div className="mb-8">
                    <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${isRejected ? 'bg-red-500/10' : 'bg-yellow-500/10'
                        }`}>
                        <i className={`fas ${isRejected ? 'fa-user-times text-red-500' : 'fa-hourglass-half text-yellow-500'} text-3xl`}></i>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
                        {isRejected ? 'Access Denied' : 'Verification Required'}
                    </h1>
                    <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">
                        Security Clearance: {profile?.status || 'Unknown'}
                    </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-10 text-left">
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                        {isRejected
                            ? "Your terminal access has been rejected or suspended by the administrative board. If you believe this is an error, please contact the station manager."
                            : "Your driver account is currently pending administrative approval. Our security protocols require manual validation of all field operators."}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <div className={`w-2 h-2 rounded-full ${isRejected ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        System Status: {isRejected ? 'Terminal Locked' : 'Gate Verification In Progress'}
                    </div>
                </div>

                <button
                    onClick={signOut}
                    className="w-full py-4 bg-white/5 hover:bg-white text-white/40 hover:text-black font-black rounded-2xl transition-all uppercase tracking-widest text-[11px]"
                >
                    Return to Login
                </button>
            </div>
        </ShellLayout>
    );
};
