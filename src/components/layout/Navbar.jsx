import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const B = {
  navy:'#0D1B5E', blue:'#1A3CC8', accent:'#00C2FF',
  white:'#FFFFFF', offWhite:'#F0F4FF', border:'#D4DCFF',
  text:'#0D1535', textSub:'#3A4A7A', textMuted:'#7B8EC0',
  red:'#D91A1A', green:'#0A8A56', amber:'#C47B00',
};

const NAV = [
  { to:'/rate-search', label:'Rate Search' },
  { to:'/enquiries',   label:'Enquiries' },
  { to:'/quotes',      label:'Quotes' },
  { to:'/bookings',    label:'Bookings' },
];

export default function Navbar() {
  const { user, logout, kycStatus } = useAuth();
  const navigate  = useNavigate();
  const [drop, setDrop] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setDrop(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const doLogout = async () => {
    setDrop(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* KYC banners — only for active accounts */}
      {user && user.status === 'active' && kycStatus === 'pending' && (
        <div style={{ background:'#FFF8E6', borderBottom:'1px solid #FDE68A', padding:'8px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:13 }}>
          <span style={{ color:B.amber, fontWeight:700 }}>⏳ Verification Pending</span>
          <span style={{ color:'#78350F' }}>— Our team is reviewing your documents. You'll be notified within 24–48 hours.</span>
        </div>
      )}
      {user && user.status === 'active' && (kycStatus === 'rejected' || kycStatus === 'resubmit_required') && (
        <div style={{ background:'#FFF1F0', borderBottom:'1px solid #FFCCC7', padding:'8px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:13 }}>
          <span style={{ color:B.red, fontWeight:700 }}>❌ Action Required</span>
          <span style={{ color:'#7F1D1D' }}>—</span>
          <Link to="/kyc" style={{ color:B.red, fontWeight:700, textDecoration:'underline' }}>Re-upload your documents</Link>
        </div>
      )}

      {user && user.status === 'active' && (kycStatus === 'not_submitted') && (
        <div style={{ background:'#EEF3FF', borderBottom:`1px solid ${B.border}`, padding:'8px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:13 }}>
          <span style={{ color:B.blue, fontWeight:700 }}>📋 KYC Required</span>
          <span style={{ color:B.textSub }}>— Please complete your KYC verification to access all platform features.</span>
          <Link to="/kyc" style={{ color:B.blue, fontWeight:800, textDecoration:'underline', marginLeft:4 }}>Complete KYC →</Link>
        </div>
      )}

      <nav style={{ background:B.white, borderBottom:`1px solid ${B.border}`, height:60, display:'flex', alignItems:'center', padding:'0 24px', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 12px rgba(13,27,94,.08)' }}>

        {/* Logo */}
        <Link to="/rate-search" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginRight:32, flexShrink:0 }}>
          <img src="/nextgen-logo.jpg" alt="NGR" style={{ width:34, height:34, borderRadius:8, objectFit:'contain', background:B.navy, padding:2 }}/>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:15, color:B.navy, lineHeight:1, letterSpacing:'-.2px' }}>
              NEXT GEN <span style={{ background:`linear-gradient(90deg,${B.blue},${B.accent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>RATES</span>
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display:'flex', gap:2, flex:1, alignItems:'center' }}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding:'6px 13px', borderRadius:8, fontSize:13, fontWeight: isActive ? 700 : 500,
              color: isActive ? B.navy : B.textSub, textDecoration:'none',
              background: isActive ? B.offWhite : 'transparent',
              border: `1px solid ${isActive ? B.border : 'transparent'}`,
              transition:'all .15s',
            })}>
              {label}
            </NavLink>
          ))}
          <Link to="/bookings/create" style={{ marginLeft:10, padding:'7px 16px', background:`linear-gradient(135deg,${B.blue},#1E50FF)`, color:'#fff', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:5, boxShadow:'0 2px 10px rgba(26,60,200,.3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Booking
          </Link>
        </div>

        {/* User menu */}
        <div ref={ref} style={{ position:'relative', marginLeft:16 }}>
          <button onClick={() => setDrop(d => !d)} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 5px', background:'transparent', border:`1.5px solid ${B.border}`, borderRadius:99, cursor:'pointer', fontFamily:'inherit' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${B.navy},${B.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff' }}>{initials}</div>
            <span style={{ fontSize:13, fontWeight:600, color:B.text, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={B.textMuted} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {drop && (
            <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:B.white, border:`1px solid ${B.border}`, borderRadius:14, minWidth:210, boxShadow:'0 10px 36px rgba(13,27,94,.14)', overflow:'hidden', animation:'navFade .15s ease' }}>
              {/* User info */}
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${B.border}`, background:B.offWhite }}>
                <div style={{ fontSize:13, fontWeight:800, color:B.text }}>{user?.name}</div>
                <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>{user?.officialEmail || user?.email}</div>
                <div style={{ marginTop:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:99,
                    background: kycStatus==='approved'?'#EDFBF4':'#FFF8E6',
                    color: kycStatus==='approved'?B.green:B.amber,
                    border: `1px solid ${kycStatus==='approved'?'#8AEBC4':'#FDE68A'}` }}>
                    KYC: {(kycStatus||'pending').replace(/_/g,' ')}
                  </span>
                </div>
              </div>
              {[
                { label:'My Profile',    to:'/profile',  icon:'👤' },
                { label:'My Bookings',   to:'/bookings', icon:'📦' },
                { label:'Rate Search',   to:'/rate-search', icon:'🔍' },
              ].map(({ label, to, icon }) => (
                <Link key={to} to={to} onClick={() => setDrop(false)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13, color:B.text, textDecoration:'none', borderBottom:`1px solid ${B.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = B.offWhite}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize:16 }}>{icon}</span>{label}
                </Link>
              ))}
              <button onClick={doLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13, color:B.red, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF1F0'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
      <style>{`@keyframes navFade{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}`}</style>
    </>
  );
}
