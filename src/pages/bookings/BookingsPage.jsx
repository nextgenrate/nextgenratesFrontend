// ════════════════════════════════════════════════════════════
//  BookingsPage.jsx
// ════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
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
  pending:      { bg:C.amberBg, color:C.amber,    border:C.amberBorder,  label:'Pending'      },
  under_review: { bg:C.blueDim, color:C.blue,     border:'#BFCFFF',      label:'Under Review' },
  approved:     { bg:C.greenBg, color:C.green,    border:C.greenBorder,  label:'Approved'     },
  confirmed:    { bg:C.greenBg, color:C.green,    border:C.greenBorder,  label:'Confirmed'    },
  rejected:     { bg:C.redBg,   color:C.red,      border:C.redBorder,    label:'Rejected'     },
  cancelled:    { bg:C.redBg,   color:C.red,      border:C.redBorder,    label:'Cancelled'    },
};
const Pill = ({ status }) => { const s=STATUS_CFG[status]||STATUS_CFG.pending; return <span style={{ padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>{s.label}</span>; };
const fmtDate = d => d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const TABS = ['all','pending','under_review','approved','confirmed','rejected','cancelled'];

function BookingDetailModal({ b, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:20, width:'100%', maxWidth:580, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ padding:'20px 26px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Booking Details</div>
            <div style={{ fontSize:12, fontFamily:'ui-monospace,monospace', fontWeight:800, color:C.blue, marginTop:3 }}>{b.bookingRef}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Pill status={b.status}/>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:C.textMuted, lineHeight:1 }}>×</button>
          </div>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'20px 26px' }}>
     
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
  {[
    ['Route',        `${b.originPort} → ${b.destinationPort}`, true],
    ['Mode',         b.mode==='AIR' ? '✈ Air Freight' : b.mode],
    ['Carrier',      b.shippingLine||b.carrier||'—'],
    // Show container for sea, chargeable weight for air
    b.mode==='AIR'
      ? ['Chargeable Wt', b.chargeableKg ? `${b.chargeableKg} KG` : '—']
      : ['Container',     b.containerType||'—'],
    ['Cargo Type',   b.cargoType||'FAK'],
    b.mode==='AIR'
      ? ['Dimensions', b.lengthCm ? `${b.lengthCm}×${b.widthCm}×${b.heightCm} CM` : '—']
      : ['Incoterms',  b.incoterms||'—'],
    ['Sailing Date', fmtDate(b.sailingDate)],
    ['Total Amount', b.totalAmount ? `USD ${Number(b.totalAmount).toLocaleString()}` : '—'],
    ['Submitted',    fmtDate(b.createdAt)],
    ['Updated',      fmtDate(b.updatedAt)],
  ].map(([l,v,mono])=>(
    <div key={l} style={{ padding:'10px 13px', background:C.panelAlt, borderRadius:9, border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{l}</div>
      <div style={{ fontSize:13.5, fontWeight:600, color:C.textPrimary, fontFamily:mono?'ui-monospace,monospace':'inherit' }}>{v}</div>
    </div>
  ))}
</div>
          {b.customerNotes&&<div style={{ marginTop:12, padding:'12px 14px', background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:4 }}>Your Notes</div><div style={{ fontSize:13.5, color:C.textBody, lineHeight:1.6 }}>{b.customerNotes}</div></div>}
          {b.adminNotes&&<div style={{ marginTop:10, padding:'12px 14px', background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:'uppercase', marginBottom:4 }}>Admin Notes</div><div style={{ fontSize:13.5, color:'#065F46', lineHeight:1.6 }}>{b.adminNotes}</div></div>}
        </div>
        <div style={{ padding:'14px 26px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 26px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,194,255,0.25)' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function BookingsPage() {
  const navigate = useNavigate();
  const [bookings,setBookings]=useState([]);
  const [loading,setLoading]  =useState(true);
  const [tab,setTab]           =useState('all');
  const [selected,setSelected] =useState(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try { const res=await api.getBookings({ status:tab!=='all'?tab:undefined }); setBookings(res.data?.bookings||[]); }
    catch { setBookings([]); }
    finally { setLoading(false); }
  },[tab]);
  useEffect(()=>{ load(); },[load]);
  const counts = TABS.reduce((a,t)=>{ a[t]=t==='all'?bookings.length:bookings.filter(b=>b.status===t).length; return a; },{});

  return (
    <AppLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.ng-row:hover{background:#F4F7FF!important;}`}</style>
      <div style={{ background:C.pageBg, minHeight:'100vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 64px' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:900, color:C.textPrimary, marginBottom:4 }}>My Bookings</h1>
              <p style={{ fontSize:13.5, color:C.textMid }}>{bookings.length} booking{bookings.length!==1?'s':''} total</p>
            </div>
            <button onClick={()=>navigate('/bookings/create')}
              style={{ padding:'11px 24px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Booking
            </button>
          </div>

          {/* Tabs */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:18, overflow:'hidden', boxShadow:C.shadow }}>
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
              {TABS.map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{ padding:'12px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?C.textPrimary:C.textMid, background:'transparent', border:'none', borderBottom:tab===t?`2.5px solid ${C.blue}`:'2.5px solid transparent', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                  {t.replace('_',' ').replace(/^\w/,c=>c.toUpperCase())}
                  {counts[t]>0&&<span style={{ fontSize:10.5, fontWeight:800, padding:'1px 7px', borderRadius:99, background:tab===t?C.blueDim:C.panelAlt, color:tab===t?C.blue:C.textMuted }}>{counts[t]}</span>}
                </button>
              ))}
            </div>
            <div style={{ padding:'10px 18px', display:'flex', justifyContent:'flex-end' }}>
              <button onClick={load} style={{ padding:'5px 14px', background:C.panelAlt, color:C.blue, border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>↻ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 0', background:C.panel, borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTopColor:C.cyan, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
              <p style={{ color:C.textMid }}>Loading bookings…</p>
            </div>
          ) : !bookings.length ? (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:'72px 24px', textAlign:'center', boxShadow:C.shadow }}>
              <div style={{ width:72, height:72, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>📦</div>
              <h3 style={{ fontSize:18, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>No Bookings Yet</h3>
              <p style={{ fontSize:14, color:C.textMid, maxWidth:380, margin:'0 auto 24px', lineHeight:1.7 }}>Search freight rates and submit a booking request to get started.</p>
              <button onClick={()=>navigate('/rate-search')} style={{ padding:'11px 28px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>Search Rates</button>
            </div>
          ) : (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:C.shadow }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:C.panelAlt, borderBottom:`1.5px solid ${C.border}` }}>
                    {['Booking Ref','Route','Mode','Carrier','Sailing','Amount','Status','Date',''].map(h=>(
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b,i)=>(
                    <tr key={b._id} className="ng-row" style={{ borderBottom:i<bookings.length-1?`1px solid ${C.border}`:'none', cursor:'pointer', transition:'background 0.12s' }}
                      onClick={()=>setSelected(b)}>
                      <td style={{ padding:'13px 14px', fontFamily:'ui-monospace,monospace', fontSize:11.5, fontWeight:800, color:C.blue, whiteSpace:'nowrap' }}>{b.bookingRef}</td>
                      <td style={{ padding:'13px 14px', fontWeight:700, fontFamily:'ui-monospace,monospace', fontSize:12.5, color:C.textPrimary }}>{b.originPort} → {b.destinationPort}</td>
                      <td style={{ padding:'13px 14px' }}>
  <span style={{ fontSize:11.5, fontWeight:700, padding:'3px 9px', borderRadius:6,
    background: b.mode==='AIR' ? '#F0F8FF' : C.blueDim,
    color: b.mode==='AIR' ? '#0369A1' : C.navy,
    border:`1px solid ${b.mode==='AIR' ? '#BAE6FD' : C.borderMid}` }}>
    {b.mode==='AIR' ? '✈ AIR' : b.mode}
  </span>
</td>
                      <td style={{ padding:'13px 14px', color:C.textBody }}>{b.shippingLine||b.carrier||'—'}</td>
                      <td style={{ padding:'13px 14px', color:C.textBody, whiteSpace:'nowrap' }}>{fmtDate(b.sailingDate)}</td>
                      <td style={{ padding:'13px 14px', fontWeight:700, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap', color:C.textPrimary }}>{b.totalAmount?`USD ${Number(b.totalAmount).toLocaleString()}`:'—'}</td>
                      <td style={{ padding:'13px 14px' }}><Pill status={b.status}/></td>
                      <td style={{ padding:'13px 14px', color:C.textMuted, fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(b.createdAt)}</td>
                      <td style={{ padding:'13px 14px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selected&&<BookingDetailModal b={selected} onClose={()=>setSelected(null)}/>}
    </AppLayout>
  );
}
export default BookingsPage;


