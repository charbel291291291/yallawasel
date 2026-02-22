import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/index.css'
import { performanceService } from '@/services/performanceService'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * TERMINAL INITIALIZATION
 * Bootstraps the tactical environment and performance monitoring.
 */

// 📈 Performance Monitoring
performanceService.initLongTaskObserver();

// 🛡️ Error Boundary & Global Fault Tolerance
window.onerror = (message, source, lineno, colno, error) => {
    console.error('[Terminal Fatal]', { message, source, lineno, colno, error });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
