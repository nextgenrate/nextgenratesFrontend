import React, { useState, useRef, useEffect } from 'react';

/* ════════════════════════════════════════════════════════════
   BUTTON
════════════════════════════════════════════════════════════ */
const BTN_BASE = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  gap:7, fontFamily:'inherit', fontWeight:600, borderRadius:8,
  border:'none', cursor:'pointer', whiteSpace:'nowrap',
  transition:'all 0.15s ease', outline:'none', textDecoration:'none',
};
const BTN_SIZES = {
  xs: { height:28, padding:'0 10px', fontSize:11.5 },
  sm: { height:34, padding:'0 14px', fontSize:13 },
  md: { height:42, padding:'0 20px', fontSize:14 },
  lg: { height:48, padding:'0 28px', fontSize:15 },
};
const BTN_VARIANTS = {
  primary:   { background:'#1A3CC8', color:'#fff',     border:'none', boxShadow:'0 2px 8px rgba(249,115,22,0.28)' },
  secondary: { background:'#fff',    color:'#1A3CC8',  border:'1.5px solid #B8C8FF' },
  ghost:     { background:'transparent', color:'#475569', border:'1.5px solid transparent' },
  outline:   { background:'#fff',    color:'#1A3CC8',  border:'1.5px solid #1A3CC8' },
  danger:    { background:'#FEF2F2', color:'#DC2626',  border:'1.5px solid #FECACA' },
};

export function Button({ children, variant='primary', size='md', icon, iconRight, loading, disabled, fullWidth, onClick, type='button', style={} }) {
  const base = { ...BTN_BASE, ...BTN_SIZES[size], ...BTN_VARIANTS[variant] };
  if (fullWidth) base.width = '100%';
  if (disabled || loading) { base.opacity = 0.55; base.cursor = 'not-allowed'; }

  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      style={{ ...base, ...style }}
      onMouseEnter={e => {
        if (disabled||loading) return;
        if (variant==='primary')   { e.currentTarget.style.background='#1639B0'; e.currentTarget.style.transform='translateY(-1px)'; }
        if (variant==='secondary') { e.currentTarget.style.borderColor='#1A3CC8'; e.currentTarget.style.background='#EEF3FF'; e.currentTarget.style.transform='translateY(-1px)'; }
        if (variant==='ghost')     { e.currentTarget.style.background='#F0F4FF'; e.currentTarget.style.color='#0F172A'; }
        if (variant==='outline')   { e.currentTarget.style.background='#EEF3FF'; }
      }}
      onMouseLeave={e => {
        if (disabled||loading) return;
        const s = BTN_VARIANTS[variant];
        e.currentTarget.style.background = s.background;
        e.currentTarget.style.borderColor = s.border?.split(' ')[2] || 'transparent';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.color = s.color;
      }}
    >
      {loading && <SpinnerInline />}
      {!loading && icon && <span style={{display:'flex',alignItems:'center',flexShrink:0}}>{icon}</span>}
      <span>{children}</span>
      {!loading && iconRight && <span style={{display:'flex',alignItems:'center',flexShrink:0}}>{iconRight}</span>}
    </button>
  );
}

function SpinnerInline() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{animation:'spin 0.7s linear infinite',flexShrink:0}}>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
    <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>;
}

/* ════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  'With Rates':      { bg:'#ECFDF5', color:'#059669', border:'#A7F3D0' },
  'No Rates':        { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
  'Expired':         { bg:'#F0F4FF', color:'#64748B', border:'#B8C8FF' },
  'Booking Placed':  { bg:'#EEF3FF', color:'#1A3CC8', border:'#BFDBFE' },
  'Rates Available': { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  'Rates Requested': { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  'Quoted':          { bg:'#F0FDFA', color:'#0891B2', border:'#A5F3FC' },
  'Lost':            { bg:'#FDF2F8', color:'#9D174D', border:'#FBCFE8' },
  'pending':         { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  'approved':        { bg:'#ECFDF5', color:'#059669', border:'#A7F3D0' },
  'rejected':        { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP['Expired'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:99, fontSize:11.5,
      fontWeight:600, background:s.bg, color:s.color,
      border:`1px solid ${s.border}`, whiteSpace:'nowrap',
    }}>
      <span style={{width:6,height:6,borderRadius:'50%',background:s.color,flexShrink:0}}/>
      {status}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MODE TAG
════════════════════════════════════════════════════════════ */
const MODE_MAP = {
  'SEA-FCL': { bg:'#EEF3FF', color:'#1A3CC8' },
  'SEA-LCL': { bg:'#F0FDFA', color:'#0891B2' },
  'AIR':     { bg:'#F5F3FF', color:'#7C3AED' },
  'LAND':    { bg:'#EEF3FF', color:'#D97706' },
};
export function ModeTag({ mode }) {
  const s = MODE_MAP[mode] || MODE_MAP['SEA-FCL'];
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:700,letterSpacing:'0.04em',background:s.bg,color:s.color,whiteSpace:'nowrap'}}>{mode}</span>;
}

/* ════════════════════════════════════════════════════════════
   PORT CODE TAG
════════════════════════════════════════════════════════════ */
export function PortCode({ code }) {
  return <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',background:'#1A3CC8',color:'#fff',fontSize:10.5,fontWeight:700,letterSpacing:'0.06em',borderRadius:5,fontFamily:'monospace',whiteSpace:'nowrap',flexShrink:0}}>{code}</span>;
}

/* ════════════════════════════════════════════════════════════
   AVATAR
════════════════════════════════════════════════════════════ */
export function Avatar({ initials, size=36 }) {
  return <div style={{width:size,height:size,borderRadius:10,background:'linear-gradient(135deg,#1A3CC8,#1A3CC8)',color:'#fff',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,flexShrink:0,userSelect:'none'}}>{initials}</div>;
}

/* ════════════════════════════════════════════════════════════
   SPINNER
════════════════════════════════════════════════════════════ */
export function Spinner({ size=22, color='#1A3CC8' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{animation:'spin 0.75s linear infinite',display:'block'}}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.2"/>
    <path d="M12 3a9 9 0 019 9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>;
}

/* ════════════════════════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════════════════════════ */
export function EmptyState({ icon, title, description, action }) {
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 24px',textAlign:'center'}}>
    <div style={{width:64,height:64,background:'#F0F4FF',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,color:'#B8C8FF'}}>{icon}</div>
    <div style={{fontSize:16,fontWeight:600,color:'#0F172A',marginBottom:8}}>{title}</div>
    {description && <div style={{fontSize:13,color:'#94A3B8',maxWidth:380,marginBottom:20,lineHeight:1.6}}>{description}</div>}
    {action}
  </div>;
}

/* ════════════════════════════════════════════════════════════
   KYC BANNER
════════════════════════════════════════════════════════════ */
export function KycBanner({ status }) {
  if (status === 'approved') return null;
  const configs = {
    pending:       { bg:'#FFFBEB', color:'#92400E', border:'#FDE68A', text:'KYC verification is pending. You can browse rates but cannot place bookings until approved.' },
    rejected:      { bg:'#FEF2F2', color:'#991B1B', border:'#FECACA', text:'KYC was rejected. Please re-upload your documents or contact support.' },
    info_required: { bg:'#EEF3FF', color:'#1E40AF', border:'#BFDBFE', text:'Additional information required for KYC. Please check your profile and update documents.' },
  };
  const c = configs[status];
  if (!c) return null;
  return <div style={{padding:'10px 24px',fontSize:13,fontWeight:500,background:c.bg,color:c.color,borderBottom:`1px solid ${c.border}`}}>{c.text}</div>;
}

/* ════════════════════════════════════════════════════════════
   DIVIDER
════════════════════════════════════════════════════════════ */
export function Divider({ style={} }) {
  return <div style={{height:1,background:'#D4DCFF',...style}}/>;
}

/* ════════════════════════════════════════════════════════════
   DROPDOWN (generic)
════════════════════════════════════════════════════════════ */
export function Dropdown({ trigger, children, minWidth=180 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="slide-down" style={{position:'absolute',top:'calc(100% + 6px)',left:0,minWidth,background:'#fff',border:'1px solid #D4DCFF',borderRadius:12,boxShadow:'0 10px 40px rgba(0,0,0,0.12)',zIndex:300,padding:6}}>
          {React.Children.map(children, child => child ? React.cloneElement(child, { _close: () => setOpen(false) }) : null)}
        </div>
      )}
    </div>
  );
}
export function DropdownItem({ children, onClick, _close, danger=false }) {
  return (
    <button onClick={() => { onClick?.(); _close?.(); }}
      style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'9px 10px',borderRadius:7,fontSize:13,color:danger?'#DC2626':'#0F172A',background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'background 0.12s'}}
      onMouseEnter={e=>e.currentTarget.style.background=danger?'#FEF2F2':'#F0F4FF'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >{children}</button>
  );
}
