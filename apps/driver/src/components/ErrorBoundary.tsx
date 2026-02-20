import React from "react";

// 🛡 STEP 4 — PREVENT BLANK PAGE CRASH
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    padding: 40,
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '48px',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        maxWidth: '500px'
                    }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px', color: '#ff4b4b' }}>Configuration Error</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '18px' }}>
                            The application encountered a critical startup error. This is likely due to missing environment variables.
                        </p>
                        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', textAlign: 'left' }}>
                            <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#aaa' }}>
                                Check your <code style={{ color: '#fff' }}>.env.local</code> file in this app's directory.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
