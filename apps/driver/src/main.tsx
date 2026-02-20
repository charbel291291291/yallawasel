import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { telemetry } from './services/telemetry';

// Activate performance monitoring
console.debug('[Telemetry] Driver monitoring active');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
