import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { performanceService } from './services/performanceService'

// Initialize Main-Thread Monitoring
performanceService.initLongTaskObserver();

// PWA Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);

            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('New terminal version available. Refresh to upgrade?')) {
                                window.location.reload();
                            }
                        }
                    };
                }
            };
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Global Error Handling for Terminal Stability
window.onerror = (message, source, lineno, colno, error) => {
    console.error('[Terminal Fatal]', { message, source, lineno, colno, error });
    // Prevent white screens by logging to telemetry if possible
};

import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
