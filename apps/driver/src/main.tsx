import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { performanceService } from './services/performanceService'
import { registerSW } from 'virtual:pwa-register'

/**
 * TERMINAL INITIALIZATION
 * Bootstraps the tactical environment and performance monitoring.
 */

// 📈 Performance Monitoring
performanceService.initLongTaskObserver();

// 📲 Intelligent PWA Service Worker Registration
// Uses virtual:pwa-register for modern lifecycle management
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('New terminal tactical update available. Apply now?')) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.info('[PWA] Terminal ready for offline deployment.');
    },
});

// 🛡️ Error Boundary & Global Fault Tolerance
window.onerror = (message, source, lineno, colno, error) => {
    console.error('[Terminal Fatal]', { message, source, lineno, colno, error });
};

import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
