import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import * as api from '../../services/api';

const C = {
  pageBg:'#EEF2FA', panel:'#FFFFFF', panelAlt:'#F7F9FF', inputBg:'#F4F7FF',
  navy:'#0B1D5E', blue:'#1A4FD8', blueVib:'#1E50FF', blueDim:'#EEF3FF',
  cyan:'#00C2FF', green:'#059669', greenBg:'#ECFDF5', greenBorder:'#A7F3D0',
  amber:'#D97706', amberBg:'#FFFBEB', amberBorder:'#FDE68A',
  red:'#DC2626', redBg:'#FEF2F2', redBorder:'#FECACA',
  textPrimary:'#0B1D5E', textBody:'#2D3F6B', textMid:'#5A6E9C', textMuted:'#8FA3C8',
  border:'#DDE5F5', borderMid:'#BCC9E8',
  shadow:'0 1px 4px rgba(11,29,94,0.06),0 2px 12px rgba(11,29,94,0.07)',
  shadowMd:'0 4px 20px rgba(11,29,94,0.10)', shadowLg:'0 12px 48px rgba(11,29,94,0.14)',
  btnGrad:'linear-gradient(90deg,#1540C0 0%,#1A6FE8 55%,#00C2FF 100%)',
};

const STATUS_CFG = {
  pending:      { bg:C.amberBg, color:C.amber,  border:C.amberBorder, label:'Pending'      },
  under_review: { bg:C.blueDim, color:C.blue,   border:'#BFCFFF',     label:'Under Review' },
  approved:     { bg:C.greenBg, color:C.green,  border:C.greenBorder, label:'Approved'     },
  confirmed:    { bg:C.greenBg, color:C.green,  border:C.greenBorder, label:'Confirmed'    },
  rejected:     { bg:C.redBg,   color:C.red,    border:C.redBorder,   label:'Rejected'     },
  cancelled:    { bg:C.redBg,   color:C.red,    border:C.redBorder,   label:'Cancelled'    },
};

const Pill = ({ status }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
};

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  : '—';

const TABS = ['all','pending','under_review','approved','confirmed','rejected','cancelled'];

export function QuotesPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getBookings()
      .then(res => setBookings(res.data?.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived counts ──────────────────────────────────────────
  const total   = bookings.length;
  const active  = bookings.filter(b => ['approved','confirmed'].includes(b.status)).length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const expired = bookings.filter(b => ['rejected','cancelled'].includes(b.status)).length;

  // ── Tab filtering ───────────────────────────────────────────
  const visible = tab === 'all' ? bookings : bookings.filter(b => b.status === tab);

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? total : bookings.filter(b => b.status === t).length;
    return acc;
  }, {});

  return (
    <AppLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.q-card{transition:all 0.18s ease;}.q-card:hover{box-shadow:0 8px 32px rgba(11,29,94,0.13)!important;transform:translateY(-2px);}`}</style>
      <div style={{ background:C.pageBg, minHeight:'100vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 64px' }}>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:900, color:C.textPrimary, marginBottom:4 }}>Quotes</h1>
              <p style={{ fontSize:13.5, color:C.textMid }}>{total} total quotes · Track your approved rates</p>
            </div>
            <button onClick={() => navigate('/rate-search')}
              style={{ padding:'11px 24px', background:C.btnGrad, color:'#fff', border:'none',
                borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
              Search Rates
            </button>
          </div>

          {/* Stats row — wired to real values */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { label:'Total Quotes', value: total,   color:C.blue,      bg:C.blueDim,   icon:'📋' },
              { label:'Active',       value: active,  color:C.green,     bg:C.greenBg,   icon:'✅' },
              { label:'Pending',      value: pending, color:C.amber,     bg:C.amberBg,   icon:'⏳' },
              { label:'Expired',      value: expired, color:C.textMuted, bg:C.panelAlt,  icon:'📁' },
            ].map(s => (
              <div key={s.label} style={{ background:C.panel, border:`1px solid ${C.border}`,
                borderRadius:13, padding:'16px 20px', display:'flex', alignItems:'center',
                gap:14, boxShadow:C.shadow }}>
                <div style={{ width:44, height:44, borderRadius:12, background:s.bg,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1.1 }}>
                    {loading ? '—' : s.value}   {/* ← shows — while loading */}
                  </div>
                  <div style={{ fontSize:12, color:C.textMid, fontWeight:500, marginTop:2 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14,
            marginBottom:18, overflow:'hidden', boxShadow:C.shadow }}>
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding:'12px 18px', fontSize:13, fontWeight:tab===t?700:500,
                    color:tab===t?C.textPrimary:C.textMid, background:'transparent', border:'none',
                    borderBottom:tab===t?`2.5px solid ${C.blue}`:'2.5px solid transparent',
                    cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                    display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                  {t.replace('_',' ').replace(/^\w/, c => c.toUpperCase())}
                  {tabCounts[t] > 0 && (
                    <span style={{ fontSize:10.5, fontWeight:800, padding:'1px 8px', borderRadius:99,
                      background:tab===t?C.blueDim:C.panelAlt, color:tab===t?C.blue:C.textMuted }}>
                      {tabCounts[t]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content — loading / empty / list */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 0', background:C.panel,
              borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ width:40, height:40, border:`3px solid ${C.border}`,
                borderTopColor:C.cyan, borderRadius:'50%',
                animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
              <p style={{ color:C.textMid }}>Loading quotes…</p>
            </div>

          ) : !visible.length ? (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16,
              padding:'80px 24px', textAlign:'center', boxShadow:C.shadow }}>
              <div style={{ width:80, height:80, background:C.panelAlt, border:`1px solid ${C.border}`,
                borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 22px', fontSize:36 }}>💬</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginBottom:10 }}>
                {tab === 'all' ? 'No Quotes Yet' : `No ${tab.replace('_',' ')} quotes`}
              </h3>
              <p style={{ fontSize:14, color:C.textMid, maxWidth:400, margin:'0 auto 26px', lineHeight:1.7 }}>
                {tab === 'all'
                  ? 'Approved quotes from your enquiries will appear here. Search rates and submit an enquiry to get started.'
                  : 'No quotes with this status yet.'}
              </p>
              {tab === 'all' && (
                <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  <button onClick={() => navigate('/enquiries')}
                    style={{ padding:'11px 26px', background:C.panel, color:C.textBody,
                      border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14,
                      fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; e.currentTarget.style.background=C.blueDim; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textBody; e.currentTarget.style.background=C.panel; }}>
                    Go to Enquiries
                  </button>
                  <button onClick={() => navigate('/rate-search')}
                    style={{ padding:'11px 26px', background:C.btnGrad, color:'#fff', border:'none',
                      borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                      fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
                    Search Rates
                  </button>
                </div>
              )}
            </div>

          ) : (
            /* ── Booking cards list ── */
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {visible.map(b => (
                <div key={b._id} className="q-card" onClick={() => setSelected(b)}
                  style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:13,
                    padding:'16px 20px', display:'flex', justifyContent:'space-between',
                    alignItems:'center', cursor:'pointer', boxShadow:C.shadow }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.blueDim,
                      border:`1px solid ${C.borderMid}`, display:'flex', alignItems:'center',
                      justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace',
                        fontWeight:700, color:C.textMuted, marginBottom:3 }}>
                        {b.bookingRef}
                      </div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:C.textPrimary,
                        fontFamily:'ui-monospace,monospace' }}>
                        {b.originPort} → {b.destinationPort} · {b.mode}
                      </div>
                      <div style={{ fontSize:12.5, color:C.textMid, marginTop:2 }}>
                        {b.carrier || 'Any carrier'}
                        {b.totalAmount ? ` · ${b.currency} ${b.totalAmount.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column',
                    alignItems:'flex-end', gap:6 }}>
                    <Pill status={b.status}/>
                    <div style={{ fontSize:11.5, color:C.textMuted }}>{fmtDate(b.createdAt)}</div>
                    {b.sailingDate && (
                      <div style={{ fontSize:11.5, color:C.textMid }}>
                        Sailing: {fmtDate(b.sailingDate)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)',
          backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center',
          justifyContent:'center', padding:20 }}
          onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div style={{ background:C.panel, borderRadius:20, width:'100%', maxWidth:540,
            boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
            <div style={{ padding:'20px 26px', borderBottom:`1px solid ${C.border}`,
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Booking Details</div>
                <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace',
                  fontWeight:700, color:C.blue, marginTop:3 }}>{selected.bookingRef}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Pill status={selected.status}/>
                <button onClick={() => setSelected(null)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    fontSize:22, color:C.textMuted, lineHeight:1 }}>×</button>
              </div>
            </div>
            <div style={{ padding:'20px 26px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['Route', `${selected.originPort} → ${selected.destinationPort}`, true],
                  ['Mode',  selected.mode],
                  ['Carrier', selected.carrier || '—'],
                  ['Container', selected.containerType || '—'],
                  ['Amount', selected.totalAmount ? `${selected.currency} ${selected.totalAmount.toLocaleString()}` : '—'],
                  ['Sailing Date', fmtDate(selected.sailingDate)],
                  ['Cargo Type', selected.cargoType || '—'],
                  ['Created', fmtDate(selected.createdAt)],
                ].map(([l, v, mono]) => (
                  <div key={l} style={{ padding:'10px 13px', background:C.panelAlt,
                    borderRadius:9, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.textMuted,
                      textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13.5, fontWeight:600, color:C.textPrimary,
                      fontFamily: mono ? 'ui-monospace,monospace' : 'inherit' }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.customerNotes && (
                <div style={{ marginTop:12, padding:'12px 14px', background:C.panelAlt,
                  border:`1px solid ${C.border}`, borderRadius:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted,
                    textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Notes</div>
                  <div style={{ fontSize:13.5, color:C.textBody, lineHeight:1.6 }}>
                    {selected.customerNotes}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'14px 26px', borderTop:`1px solid ${C.border}`,
              display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setSelected(null)}
                style={{ padding:'9px 24px', background:C.btnGrad, color:'#fff', border:'none',
                  borderRadius:9, fontSize:13.5, fontWeight:700, cursor:'pointer',
                  fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,194,255,0.25)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default QuotesPage;
