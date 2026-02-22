import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../styles/index.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import { bootstrap } from './bootstrap';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from '@/components/AuthGate';
import { performanceService } from '@/services/performanceService';

// Initialize Main-Thread Monitoring
performanceService.initLongTaskObserver();

// Defensive Global Guard - Neutralize vendor SDK crashes before any logic executes
if (typeof window !== "undefined") {
  if (!(window as any).Activity) {
    Object.defineProperty(window, "Activity", {
      value: {},
      writable: true,
      configurable: true,
    });
  }
}

// Initialize safe runtime layer
bootstrap().catch(err => {
  console.error("[Index] Critical bootstrap failure:", err);
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);