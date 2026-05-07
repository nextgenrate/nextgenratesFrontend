import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const B = {
  navy:'#0D1B5E', navyDark:'#060F3A', blue:'#1A3CC8', blueVib:'#1E50FF',
  accent:'#00C2FF', white:'#FFFFFF', offWhite:'#F0F4FF',
  border:'#D4DCFF', text:'#0D1535', textSub:'#3A4A7A', textMuted:'#7B8EC0',
  red:'#D91A1A', redBg:'#FFF1F0', redBorder:'#FFCCC7', amber:'#C47B00', amberBg:'#FFF8E6',
  green:'#0A8A56', greenBg:'#EDFBF4',
};

const iStyle = (err) => ({
  width:'100%', height:48, padding:'0 14px',
  border:`1.5px solid ${err ? B.red : B.border}`,
  borderRadius:10, fontSize:14, color:B.text, outline:'none',
  fontFamily:'inherit', background:B.white, boxSizing:'border-box',
});

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/rate-search';
  const { forgotPassword } = useAuth();

  const [form, setForm]     = useState({ email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');
  const [screen, setScreen] = useState('login'); // 'login'|'forgot'|'sent'
  const [fEmail, setFEmail] = useState('');
  const [fLoading, setFLoading] = useState(false);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleLogin = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setError('');
    try {
      const res = await login(form.email, form.password);
      if (res?.user?.mustChangePassword) { navigate('/set-password'); return; }
      navigate(from, { replace:true });
    } catch(err) {
      // Show pending_approval as a different banner, not a red error
      if (err.message?.includes('under review') || err.message?.includes('pending_approval') || err.message?.includes('pending review')) {
        setScreen('pending');
        return;
      }
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleForgot = async e => {
    e.preventDefault();
    if (!fEmail) return;
    setFLoading(true);
    try { await forgotPassword(fEmail); setScreen('sent'); }
    catch(err) { setError(err.message); }
    finally { setFLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh', display:'flex', fontFamily:"'DM Sans','Outfit',-apple-system,sans-serif", background:B.offWhite}}>

      {/* ── Brand Panel ── */}
      <div className="brand-panel" style={{
        width:380, flexShrink:0,
        background:`linear-gradient(165deg,${B.navyDark} 0%,${B.navy} 55%,#162299 100%)`,
        padding:'40px 32px', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh',
      }}>
        <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
          {[140,260,380].map((r,i)=>(
            <div key={i} style={{position:'absolute',width:r,height:r,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.07)',top:`${i*20-5}%`,left:`${i*10-15}%`}}/>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:12,position:'relative',marginBottom:48}}>
          <img src="/nextgen-logo.jpg" alt="Next Gen Rates"
            style={{width:56,height:56,borderRadius:12,objectFit:'contain',background:'#fff',padding:2}}/>
          <div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:22,color:B.white,lineHeight:1}}>
              NEXT GEN <span style={{background:`linear-gradient(90deg,${B.accent},#7DF9FF)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>RATES</span>
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:3,letterSpacing:'.5px'}}>Instant Freight Rates Re-Imagined!</div>
          </div>
        </div>

        <div style={{position:'relative',flex:1}}>
          <div style={{width:28,height:3,background:`linear-gradient(90deg,${B.accent},${B.blueVib})`,borderRadius:2,marginBottom:16}}/>
          <p style={{fontSize:15,color:'rgba(255,255,255,0.8)',lineHeight:1.8,fontStyle:'italic'}}>
            "Empowering <span style={{color:B.accent}}>Exporters</span> · Importers · Traders · Manufacturers · Forwarders to build agility in logistics through NextGen engagement."
          </p>
          <div style={{marginTop:40,display:'flex',flexDirection:'column',gap:12}}>
            {['Real-time rates from 50+ carriers','Instant FCL, LCL & Air quotes','End-to-end booking management','Verified network of shippers worldwide'].map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(0,194,255,0.18)',border:`1px solid ${B.accent}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.accent} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.7)'}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.28)'}}>© {new Date().getFullYear()} Next Gen Rates</div>
      </div>

      {/* ── Form Panel ── */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>
        <div style={{width:'100%',maxWidth:440}}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{display:'none',marginBottom:24}}>
            <div style={{background:`linear-gradient(135deg,${B.navyDark},${B.navy})`,borderRadius:16,padding:'20px 24px',display:'flex',alignItems:'center',gap:12}}>
              <img src="/nextgen-logo.jpg" alt="Next Gen Rates" style={{width:44,height:44,borderRadius:10,objectFit:'contain',background:'#fff',padding:2}}/>
              <div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:18,color:'#fff',lineHeight:1}}>
                  NEXT GEN <span style={{background:`linear-gradient(90deg,${B.accent},#7DF9FF)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>RATES</span>
                </div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.45)',marginTop:2}}>Instant Freight Rates Re-Imagined!</div>
              </div>
            </div>
          </div>

          <div style={{background:B.white,borderRadius:20,padding:'36px 32px',boxShadow:'0 12px 48px rgba(13,27,94,.15)',border:`1px solid ${B.border}`}}>

            {screen === 'pending' && (
              <div style={{textAlign:'center', padding:'8px 0'}}>
                <div style={{width:64, height:64, background:'#EEF3FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28}}>⏳</div>
                <h3 style={{fontSize:18, fontWeight:900, color:B.text, marginBottom:8}}>Account Under Review</h3>
                <p style={{fontSize:13, color:B.textSub, lineHeight:1.7, marginBottom:18}}>
                  Your company registration is currently being reviewed by our team.
                  Once approved, you will receive a confirmation email and can sign in.
                </p>
                <div style={{padding:'12px 16px', background:B.amberBg||'#FFF8E6', border:'1px solid #FDE68A', borderRadius:10, marginBottom:20, textAlign:'left'}}>
                  <div style={{fontSize:12, fontWeight:700, color:B.amber, marginBottom:6}}>Typical review timeline: 24–48 business hours</div>
                  <div style={{fontSize:12, color:'#78350F'}}>Check your registered email for updates. Contact support if you have not heard back within 3 business days.</div>
                </div>
                <button onClick={()=>setScreen('login')} style={{fontSize:13, color:B.blue, background:'none', border:'none', cursor:'pointer', fontWeight:700}}>← Back to Login</button>
              </div>
            )}

            {screen === 'login' && <>
              <h2 style={{fontSize:22,fontWeight:900,color:B.text,margin:'0 0 4px',fontFamily:"'Outfit',sans-serif"}}>Welcome back</h2>
              <p style={{fontSize:13,color:B.textMuted,margin:'0 0 22px'}}>Sign in to your Next Gen Rates account</p>

              {error && (
                <div style={{padding:'11px 14px',background:B.redBg,border:`1px solid ${B.redBorder}`,borderRadius:9,marginBottom:16,fontSize:13,color:B.red}}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:12,fontWeight:700,color:B.textSub,display:'block',marginBottom:5}}>Email Address</label>
                  <input value={form.email} onChange={set('email')} type="email" placeholder="name@yourcompany.com"
                    autoComplete="username" style={iStyle(!form.email && error)}/>
                </div>
                <div style={{marginBottom:6}}>
                  <label style={{fontSize:12,fontWeight:700,color:B.textSub,display:'block',marginBottom:5}}>Password</label>
                  <div style={{position:'relative'}}>
                    <input value={form.password} onChange={set('password')} type={showPw?'text':'password'}
                      placeholder="••••••••" autoComplete="current-password"
                      style={{...iStyle(!form.password && error),paddingRight:44}}/>
                    <button type="button" onClick={()=>setShowPw(p=>!p)}
                      style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:B.textMuted,display:'flex',padding:0}}>
                      {showPw
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <div style={{textAlign:'right',marginBottom:22}}>
                  <button type="button" onClick={()=>{setScreen('forgot');setError('');}}
                    style={{fontSize:12,color:B.blue,background:'none',border:'none',cursor:'pointer',fontWeight:700}}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  style={{
                    width:'100%',padding:'13px',
                    background:loading ? B.border : `linear-gradient(135deg,${B.blue},${B.blueVib})`,
                    color:loading ? B.textMuted : '#fff',
                    border:'none',borderRadius:11,fontSize:15,fontWeight:800,
                    cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    boxShadow:loading?'none':'0 4px 18px rgba(26,60,200,.36)',
                  }}>
                  {loading && <div style={{width:17,height:17,border:'2.5px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div style={{marginTop:20,textAlign:'center',fontSize:13,color:B.textMuted}}>
                New to Next Gen Rates?{' '}
                <Link to="/register" style={{color:B.blue,fontWeight:700,textDecoration:'none'}}>Create account</Link>
              </div>
            </>}

            {screen === 'forgot' && <>
              <button onClick={()=>{setScreen('login');setError('');}}
                style={{fontSize:12,color:B.blue,background:'none',border:'none',cursor:'pointer',fontWeight:700,marginBottom:18,display:'flex',alignItems:'center',gap:4,padding:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to login
              </button>
              <h2 style={{fontSize:20,fontWeight:900,color:B.text,margin:'0 0 4px',fontFamily:"'Outfit',sans-serif"}}>Reset Password</h2>
              <p style={{fontSize:13,color:B.textMuted,margin:'0 0 20px'}}>We'll send a password reset OTP to your registered email.</p>
              {error && <div style={{padding:'11px 14px',background:B.redBg,border:`1px solid ${B.redBorder}`,borderRadius:9,marginBottom:14,fontSize:13,color:B.red}}>{error}</div>}
              <form onSubmit={handleForgot}>
                <div style={{marginBottom:18}}>
                  <label style={{fontSize:12,fontWeight:700,color:B.textSub,display:'block',marginBottom:5}}>Email Address</label>
                  <input value={fEmail} onChange={e=>setFEmail(e.target.value)} type="email" placeholder="your@company.com" style={iStyle(false)}/>
                </div>
                <button type="submit" disabled={fLoading||!fEmail}
                  style={{width:'100%',padding:'13px',background:`linear-gradient(135deg,${B.blue},${B.blueVib})`,color:'#fff',border:'none',borderRadius:11,fontSize:14,fontWeight:800,cursor:fEmail?'pointer':'not-allowed',fontFamily:'inherit',boxShadow:'0 4px 18px rgba(26,60,200,.3)'}}>
                  {fLoading ? 'Sending…' : 'Send Reset OTP'}
                </button>
              </form>
            </>}

            {screen === 'sent' && (
              <div style={{textAlign:'center',padding:'12px 0'}}>
                <div style={{width:60,height:60,background:B.greenBg,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={B.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,color:B.text,marginBottom:8,fontFamily:"'Outfit',sans-serif"}}>Check your email</h3>
                <p style={{fontSize:13,color:B.textMuted,marginBottom:22,lineHeight:1.6}}>
                  If <strong>{fEmail}</strong> is registered, we've sent a password reset OTP.
                </p>
                <Link to="/reset-password"
                  style={{display:'block',padding:'12px',background:`linear-gradient(135deg,${B.blue},${B.blueVib})`,color:'#fff',borderRadius:11,fontSize:14,fontWeight:800,textDecoration:'none',textAlign:'center',boxShadow:'0 4px 14px rgba(26,60,200,.28)'}}>
                  Enter OTP &amp; Reset Password
                </Link>
                <button onClick={()=>setScreen('login')} style={{marginTop:12,fontSize:12,color:B.textMuted,background:'none',border:'none',cursor:'pointer'}}>
                  Back to login
                </button>
              </div>
            )}
          </div>

          <p style={{textAlign:'center',marginTop:14,fontSize:11.5,color:B.textMuted}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:4,verticalAlign:'middle'}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Secured with 256-bit encryption
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes spin { to { transform:rotate(360deg); } }
        input:focus { border-color:${B.blue} !important; box-shadow:0 0 0 3px rgba(26,60,200,.1) !important; }
        * { box-sizing:border-box; }
        @media (max-width:800px) { .brand-panel { display:none !important; } .mobile-logo { display:block !important; } }
      `}</style>
    </div>
  );
}
