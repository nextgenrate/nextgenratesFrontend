import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const C = { navy:'#0D1B5E', orange:'#1A3CC8', border:'#D4DCFF', text:'#0F172A', sub:'#475569', muted:'#94A3B8', red:'#DC2626', blue:'#1A3CC8', green:'#059669' };

// ─── Shared page shell ────────────────────────────────────────
const Shell = ({ title, subtitle, children }) => (
  <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${C.navy} 0%, #1a3a7a 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
    <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize:'32px 32px' }}/>
    <div style={{ width:'100%', maxWidth:420, position:'relative' }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, background:C.orange, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20l2-8h16l2 8H2z"/><path d="M6 12V8l3-3 3 3 3-3 3 3v4"/></svg>
          </div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:20 }}>Next Gen Rates</span>
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:'32px 28px', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:13, color:C.muted, marginBottom:22 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
  </div>
);

// ─── OTP input boxes ──────────────────────────────────────────
function OtpInput({ value, onChange, length = 6 }) {
  const refs = Array.from({ length }, () => useRef(null)); // eslint-disable-line
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };
  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits]; next[i] = v;
    onChange(next.join(''));
    if (v && i < length - 1) refs[i + 1].current?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) { onChange(pasted.padEnd(length, '').slice(0, length)); refs[Math.min(pasted.length, length - 1)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display:'flex', gap:10, justifyContent:'center', margin:'20px 0' }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} value={d} maxLength={1} inputMode="numeric"
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{
            width:48, height:56, textAlign:'center', fontSize:22, fontWeight:700,
            border:`2px solid ${d ? C.navy : C.border}`, borderRadius:10,
            color:C.text, outline:'none', background: d ? '#EEF3FF' : '#fff',
            transition:'all 0.15s', fontFamily:'inherit',
          }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  VerifyEmailPage
// ══════════════════════════════════════════════════════════════
export function VerifyEmailPage() {
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!userId) navigate('/register');
  }, [userId, navigate]);

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      await verifyEmail(userId, otp);
      setSuccess(true);
      setTimeout(() => navigate('/kyc'), 2000);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try { await resendOtp(email, 'verification'); setCooldown(60); }
    catch (err) { setError(err.message); }
    finally { setResending(false); }
  };

  if (success) return (
    <Shell title="Email Verified!" subtitle="Redirecting you to complete KYC…">
      <div style={{ textAlign:'center', padding:'12px 0' }}>
        <div style={{ width:56, height:56, background:'#ECFDF5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style={{ fontSize:14, color:C.sub }}>Your email has been verified successfully.</p>
      </div>
    </Shell>
  );

  return (
    <Shell title="Verify your email" subtitle={email ? `We sent a 6-digit code to ${email}` : 'Enter the code sent to your email'}>
      {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red }}>{error}</div>}

      <OtpInput value={otp} onChange={setOtp} />

      <button onClick={handleVerify} disabled={loading || otp.length < 6} style={{
        width:'100%', padding:'12px', background: otp.length === 6 ? C.orange : '#CBD5E1',
        color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700,
        cursor: otp.length === 6 ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', marginBottom:16,
      }}>
        {loading && <div style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
        {loading ? 'Verifying…' : 'Verify Email'}
      </button>

      <div style={{ textAlign:'center', fontSize:13 }}>
        <span style={{ color:C.muted }}>Didn't receive it? </span>
        <button onClick={handleResend} disabled={cooldown > 0 || resending} style={{ fontSize:13, color: cooldown > 0 ? C.muted : C.blue, background:'none', border:'none', cursor: cooldown > 0 ? 'default' : 'pointer', fontWeight:600 }}>
          {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
        </button>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════
//  ResetPasswordPage
// ══════════════════════════════════════════════════════════════
export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('otp'); // 'otp' | 'newpw' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleOtp = () => {
    if (!email || otp.length < 6) { setError('Enter your email and the 6-digit OTP'); return; }
    setError(''); setStep('newpw');
  };

  const handleReset = async e => {
    e.preventDefault();
    if (pw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (pw !== pw2) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email, otp, pw);
      setStep('done');
    } catch (err) { setError(err.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const inp = { width:'100%', padding:'10px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.text, outline:'none', background:'#fff', fontFamily:'inherit', marginBottom:14 };

  return (
    <Shell title={step === 'done' ? 'Password reset!' : 'Reset your password'} subtitle={step === 'otp' ? 'Enter your email and the OTP sent to it' : step === 'newpw' ? 'Choose a strong new password' : undefined}>
      {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red }}>{error}</div>}

      {step === 'otp' && <>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your registered email" style={inp} />
        <OtpInput value={otp} onChange={setOtp} />
        <button onClick={handleOtp} style={{ width:'100%', padding:'12px', background:C.navy, color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Continue
        </button>
      </>}

      {step === 'newpw' && (
        <form onSubmit={handleReset}>
          <div style={{ position:'relative', marginBottom:14 }}>
            <input value={pw} onChange={e => setPw(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="New password (min 8 chars)" style={{ ...inp, marginBottom:0, paddingRight:42 }} />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <input value={pw2} onChange={e => setPw2(e.target.value)} type="password" placeholder="Confirm new password" style={inp} />
          {/* Password strength */}
          {pw && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                {[/[a-z]/, /[A-Z]/, /\d/, /.{8,}/].map((r, i) => (
                  <div key={i} style={{ flex:1, height:4, borderRadius:2, background: r.test(pw) ? [C.red,'#1A3CC8',C.orange,C.green][i] : C.border }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Include uppercase, lowercase, number · min 8 chars</div>
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:C.orange, color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading && <div style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
            Reset Password
          </button>
        </form>
      )}

      {step === 'done' && (
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ width:56, height:56, background:'#ECFDF5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p style={{ fontSize:14, color:C.sub, marginBottom:20 }}>Your password has been reset successfully.</p>
          <Link to="/login" style={{ display:'block', padding:'12px', background:C.navy, color:'#fff', borderRadius:9, fontSize:14, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
            Sign In
          </Link>
        </div>
      )}
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════
//  SetPasswordPage (first-login forced change)
// ══════════════════════════════════════════════════════════════
export function SetPasswordPage() {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (pw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (pw !== pw2) { setError('Passwords do not match'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) { setError('Password must include uppercase, lowercase and number'); return; }
    setError(''); setLoading(true);
    try {
      await changePassword('', pw); // no current pw for first-login
      setDone(true);
      setTimeout(() => navigate('/kyc'), 1800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Shell title="Set your password" subtitle={`Hi ${user?.name || 'there'} — your account was created by an admin. Please set your own password to continue.`}>
      {done ? (
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <div style={{ width:52, height:52, background:'#ECFDF5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p style={{ fontSize:14, color:C.sub }}>Password set! Redirecting…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red }}>{error}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.sub, display:'block', marginBottom:5 }}>New Password</label>
            <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="Min 8 chars, upper+lower+number"
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.sub, display:'block', marginBottom:5 }}>Confirm Password</label>
            <input value={pw2} onChange={e => setPw2(e.target.value)} type="password" placeholder="Repeat your password"
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:C.orange, color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading && <div style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
            Set Password &amp; Continue
          </button>
        </form>
      )}
    </Shell>
  );
}
