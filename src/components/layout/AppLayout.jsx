import React from 'react';
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F4FB',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F0F4FB; }
        ::-webkit-scrollbar-thumb { background: #C8D5F0; border-radius: 3px; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { from { background-position:200% center; } to { background-position:-200% center; } }
        @keyframes livepulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,194,255,0.5)} 50%{box-shadow:0 0 0 6px rgba(0,194,255,0)} }

        .slide-down { animation: fadeUp 0.18s ease both; }
        .ng-f1 { animation: fadeUp 0.42s 0.05s ease both; }
        .ng-f2 { animation: fadeUp 0.42s 0.14s ease both; }
        .ng-f3 { animation: fadeUp 0.42s 0.23s ease both; }
        .ng-f4 { animation: fadeUp 0.42s 0.32s ease both; }
      `}</style>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}