import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[Terminal Error]:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-[#0E0E11] flex items-center justify-center p-8 text-center z-[1000]">
                    <div className="max-w-xs animate-entrance">
                        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/20">
                            <i className="fas fa-triangle-exclamation text-red-600 text-3xl animate-pulse"></i>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Critical System Fault</h2>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] leading-relaxed mb-10">
                            Terminal environment has encountered a fatal exception. Satellite link severed.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all"
                        >
                            Re-initialize Terminal
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
