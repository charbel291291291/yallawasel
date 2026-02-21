import React from 'react';

interface Props {
    children: React.ReactNode;
}

export const ShellLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-[#0E0E11] flex items-center justify-center font-sans overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed inset-0 pointer-events-none scanline opacity-[0.05] z-10"></div>
            <main className="relative z-20 w-full flex items-center justify-center p-6 lg:p-12">
                {children}
            </main>
        </div>
    );
};
