import React from 'react';

const App: React.FC = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#fff',
            fontFamily: 'sans-serif'
        }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Yalla Wasel Driver</h1>
            <p style={{ color: '#aaa' }}>Logistics & Delivery Portal</p>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                border: '1px solid #333',
                borderRadius: '12px'
            }}>
                <p>Driver authentication and dashboard coming soon.</p>
            </div>
        </div>
    );
};

export default App;
