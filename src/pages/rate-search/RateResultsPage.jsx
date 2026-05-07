import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import * as api from '../../services/api';

// ─── Design tokens ────────────────────────────────────────────
const C = {
  pageBg:'#EEF2FA', panel:'#FFFFFF', panelAlt:'#F7F9FF', inputBg:'#F4F7FF',
  navy:'#0B1D5E', blue:'#1A4FD8', blueVib:'#1E50FF', blueDim:'#EEF3FF',
  cyan:'#00C2FF', cyanDim:'#E6F9FF',
  coral:'#E8490A', coralBg:'#FFF1EC',
  green:'#059669', greenBg:'#ECFDF5',
  amber:'#D97706', amberBg:'#FFFBEB',
  textPrimary:'#0B1D5E', textBody:'#2D3F6B', textMid:'#5A6E9C', textMuted:'#8FA3C8',
  border:'#DDE5F5', borderMid:'#BCC9E8', borderCyan:'#00C2FF',
  shadow:'0 1px 4px rgba(11,29,94,0.06),0 2px 12px rgba(11,29,94,0.07)',
  shadowMd:'0 4px 20px rgba(11,29,94,0.10)',
  shadowLg:'0 12px 48px rgba(11,29,94,0.14)',
  btnGrad:'linear-gradient(90deg,#1540C0 0%,#1A6FE8 55%,#00C2FF 100%)',
  heroGrad:'linear-gradient(135deg,#0B1D5E 0%,#1A4FD8 60%,#00C2FF 100%)',
};

const CARRIER_COLORS = {
  MAEU:'#00A3DE',MAERSK:'#00A3DE',HLCU:'#E87722','HAPAG-LLOYD':'#E87722',
  MSCU:'#0073CF',MSC:'#0073CF',CMDU:'#C8102E','CMA CGM':'#C8102E',
  COSU:'#CC0000',COSCO:'#CC0000',EGLV:'#00563F',EVERGREEN:'#00563F',
  ONEY:'#E60012',ONE:'#E60012',ZIMU:'#4B286D',ZIM:'#4B286D',
};
const getCC = (code, name) =>
  CARRIER_COLORS[code?.toUpperCase()] || CARRIER_COLORS[name?.toUpperCase()?.split(' ')[0]] || C.blue;

const fmtD = d => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtUSD = n => `$${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2})}`;

// ─── Pill badge ───────────────────────────────────────────────
const StatusPill = ({ label, color, bg, border }) => (
  <span style={{ padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, background:bg, color, border:`1px solid ${border}`, whiteSpace:'nowrap' }}>{label}</span>
);

// ─── Section label ────────────────────────────────────────────
const SLabel = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{children}</div>
);

// ─── Route visualizer ─────────────────────────────────────────
function RouteBar({ rate }) {
  const stops = [
    { code:rate.originPort, name:rate.originPortName||rate.originPort, terminal:rate.originTerminal },
    ...(rate.viaPort||[]).map((c,i)=>({ code:c, name:rate.viaPortNames?.[i]||c, terminal:rate.viaTerminals?.[i]||'' })),
    { code:rate.destinationPort, name:rate.destinationPortName||rate.destinationPort, terminal:rate.destinationTerminal },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', flex:1, padding:'0 8px', minWidth:0 }}>
      {stops.map((stop, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{ flex:1, display:'flex', alignItems:'center', margin:'0 4px', minWidth:20 }}>
              <div style={{ flex:1, height:2, background:`linear-gradient(90deg,${C.blue}30,${C.cyan}80)`, position:'relative', borderRadius:2 }}>
                {i === Math.floor(stops.length/2) && (
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:C.panel, borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 1.5px ${C.border}` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20l2-8h16l2 8H2z"/><path d="M6 12V8l3-3 3 3 3-3 3 3v4"/></svg>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
            <div style={{ width:i===0||i===stops.length-1?11:7, height:i===0||i===stops.length-1?11:7, borderRadius:'50%', background:i===0||i===stops.length-1?C.blue:C.textMuted, border:`2px solid ${C.panel}`, boxShadow:`0 0 0 1.5px ${i===0||i===stops.length-1?C.blue:C.border}` }} />
            <div style={{ fontSize:10.5, fontWeight:700, color:i===0||i===stops.length-1?C.navy:C.textMid, fontFamily:'ui-monospace,monospace', letterSpacing:'0.4px' }}>{stop.code}</div>
            {stop.terminal && <div style={{ fontSize:9, color:C.textMuted, maxWidth:70, textAlign:'center', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{stop.terminal}</div>}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Charge table ─────────────────────────────────────────────
function ChargeTable({ title, charges, accentColor }) {
  if (!charges?.length) return null;
  const total = charges.reduce((s,c) => s+(c.amount||0), 0);
  const currency = charges[0]?.currency || 'USD';
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:3, height:16, background:accentColor, borderRadius:2 }} />
        <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
      </div>
      <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:C.panelAlt }}>
              {['Charge Name','Basis','Equipment','Qty','Unit Price','Amount'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:['Amount','Unit Price','Qty'].includes(h)?'right':'left', fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {charges.map((ch,i)=>(
              <tr key={i} style={{ borderBottom:i<charges.length-1?`1px solid ${C.border}`:'none', background:i%2?C.panelAlt:C.panel }}>
                <td style={{ padding:'9px 12px', color:C.textPrimary, fontWeight:500 }}>{ch.name}</td>
                <td style={{ padding:'9px 12px', color:C.textMid, fontSize:12 }}>{ch.basis||'per equipment'}</td>
                <td style={{ padding:'9px 12px', textAlign:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background:C.blueDim, color:C.blue }}>{ch.code||'—'}</span>
                </td>
                <td style={{ padding:'9px 12px', textAlign:'right', color:C.textBody }}>{ch.qty||1}.00</td>
                <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'ui-monospace,monospace', color:C.textBody, fontSize:12 }}>
                  <span style={{ color:C.textMuted, fontSize:10, marginRight:3 }}>{ch.currency}</span>{(ch.amount||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                </td>
                <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontWeight:700, color:C.textPrimary }}>
                  <span style={{ color:C.textMuted, fontSize:10, marginRight:3 }}>{ch.currency}</span>{(ch.amount||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:C.panelAlt, borderTop:`2px solid ${C.border}` }}>
              <td colSpan={5} style={{ padding:'9px 12px', fontSize:12, fontWeight:700, color:C.textPrimary }}>Subtotal</td>
              <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontWeight:800, color:accentColor, fontSize:13 }}>
                <span style={{ fontSize:10, marginRight:3 }}>{currency}</span>{total.toLocaleString('en-US',{minimumFractionDigits:2})}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Details Modal ────────────────────────────────────────────
function DetailsModal({ rate, onClose, onBook }) {
  if (!rate) return null;
  const freightTotal = (rate.freightCharges||[]).reduce((s,c)=>s+(c.amount||0),0);
  const originTotal  = (rate.originCharges||[]).reduce((s,c)=>s+(c.amount||0),0);
  const destTotal    = (rate.destinationCharges||[]).reduce((s,c)=>s+(c.amount||0),0);
  const grandTotal   = rate.totalUsd||(freightTotal+originTotal+destTotal);
  const cc = getCC(rate.shippingLineCode, rate.shippingLine);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:20, width:'100%', maxWidth:920, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>

        {/* Header */}
        <div style={{ padding:'20px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:cc, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:900, letterSpacing:'0.5px', flexShrink:0, boxShadow:`0 4px 12px ${cc}40` }}>
              {(rate.shippingLineCode||rate.shippingLine||'?').slice(0,4)}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary }}>{rate.shippingLine}</div>
              <div style={{ fontSize:12, color:C.textMid, display:'flex', gap:10, marginTop:2, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, color:C.blue, fontFamily:'ui-monospace,monospace', fontSize:11 }}>#{rate.rateCode||rate._id?.slice(-8)}</span>
                <span>{rate.serviceMode}</span>
                {rate.serviceName&&<span>{rate.serviceName}</span>}
                <span style={{ fontWeight:700, padding:'1px 8px', borderRadius:5, background:C.greenBg, color:C.green, fontSize:11, border:`1px solid ${C.greenBorder}` }}>{rate.rateType||'SPOT RATE'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:9, cursor:'pointer', padding:'8px 10px', display:'flex', transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Route + meta */}
        <div style={{ padding:'16px 28px', background:C.panelAlt, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <RouteBar rate={rate} />
          <div style={{ display:'flex', gap:24, marginTop:14, flexWrap:'wrap' }}>
            {[
              ['Sailing Date', fmtD(rate.sailingDate)],
              ['Transit Time', rate.transitTimeDays?`${rate.transitTimeDays} Days`:'—'],
              ['Free Days', rate.freeDays?`${rate.freeDays} Days`:'—'],
              ['Cargo Type', rate.cargoType||'FAK'],
              ['Container', rate.containerType||'—'],
              ['Valid From', fmtD(rate.validFrom)],
              [rate.validTo?'Valid Until':'Validity', rate.validTo?fmtD(rate.validTo):'Open-ended'],
            ].map(([l,v])=>(
              <div key={l}>
                <SLabel>{l}</SLabel>
                <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charges */}
        <div style={{ flex:1, overflow:'auto', padding:'22px 28px' }}>
          <ChargeTable title="Freight Charges — Ocean Leg" charges={rate.freightCharges} accentColor={C.blue} />
          <ChargeTable title="Origin Charges — Port of Loading" charges={rate.originCharges} accentColor={C.coral} />
          <ChargeTable title="Destination Charges — Port of Discharge" charges={rate.destinationCharges} accentColor={C.green} />
          {(rate.inclusions||rate.remarks) && (
            <div style={{ display:'grid', gridTemplateColumns:rate.inclusions&&rate.remarks?'1fr 1fr':'1fr', gap:12, marginTop:8 }}>
              {rate.inclusions&&<div style={{ padding:'12px 14px', background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Included</div><div style={{ fontSize:13, color:'#065F46', lineHeight:1.6 }}>{rate.inclusions}</div></div>}
              {rate.remarks&&<div style={{ padding:'12px 14px', background:C.amberBg, border:`1px solid #FDE68A`, borderRadius:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.amber, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Remarks</div><div style={{ fontSize:13, color:'#78350F', lineHeight:1.6 }}>{rate.remarks}</div></div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'18px 28px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <SLabel>Total Estimated Cost</SLabel>
            <div style={{ fontSize:28, fontWeight:900, color:C.textPrimary, fontFamily:'ui-monospace,monospace', lineHeight:1.1 }}>USD {grandTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
            <div style={{ fontSize:11.5, color:C.textMuted, marginTop:4 }}>Rates subject to liner availability · Valid: {fmtD(rate.validFrom)}{rate.validTo?` – ${fmtD(rate.validTo)}`:' onwards'}</div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="ng-btn-sec" style={{ padding:'11px 22px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
            <button onClick={()=>onBook(rate)} className="ng-btn-coral" style={{ padding:'11px 28px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Request Booking →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Match Rates Modal ────────────────────────────────────────
function MatchRatesModal({ rate, onClose }) {
  const [form, setForm] = useState({ containerType:rate?.containerType||'40GP', targetRate:'', currency:'USD', cargoWt:'18000', liner:'', sailingDate:'', freeDays:'7', notes:'' });
  const [done, setDone] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const iSt = { width:'100%', height:40, padding:'0 11px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box', transition:'border-color 0.15s' };
  const sSt = { ...iSt, cursor:'pointer', appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', paddingRight:28 };

  if (done) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.panel, borderRadius:18, padding:'48px 40px', textAlign:'center', maxWidth:380, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ width:64, height:64, background:'linear-gradient(135deg,#059669,#0CC77B)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 6px 24px rgba(5,150,105,0.3)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize:18, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>Request Sent!</div>
        <div style={{ fontSize:13.5, color:C.textMid, marginBottom:24, lineHeight:1.6 }}>Our team will review your target rate and respond within 24 hours.</div>
        <button onClick={onClose} className="ng-btn-primary" style={{ padding:'11px 32px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:18, width:'100%', maxWidth:540, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Request Better Rate</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 100px', gap:10, marginBottom:14 }}>
            {[
              ['Equipment', <div style={{ padding:'8px 10px', border:`2px solid ${C.blue}`, borderRadius:8, fontSize:13, fontWeight:700, color:C.blue, textAlign:'center', background:C.blueDim }}>{form.containerType}</div>],
              ['Target Rate', <input value={form.targetRate} onChange={set('targetRate')} placeholder="Enter target rate" style={iSt}/>],
              ['Currency', <select value={form.currency} onChange={set('currency')} style={sSt}>{['USD','EUR','GBP','AED','INR'].map(c=><option key={c}>{c}</option>)}</select>],
              ['Cargo Wt (KG)', <input value={form.cargoWt} onChange={set('cargoWt')} style={iSt}/>],
            ].map(([l,el])=>(
              <div key={l}><div style={{ fontSize:11, fontWeight:600, color:C.textMid, marginBottom:5 }}>{l}</div>{el}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:10, marginBottom:14 }}>
            {[
              ['Preferred Liner', <input value={form.liner} onChange={set('liner')} placeholder="Any liner" style={iSt}/>],
              ['Preferred Sailing Date', <input type="date" value={form.sailingDate} onChange={set('sailingDate')} style={iSt}/>],
              ['Free Days', <input value={form.freeDays} onChange={set('freeDays')} style={{ ...iSt, textAlign:'center' }}/>],
            ].map(([l,el])=>(
              <div key={l}><div style={{ fontSize:11, fontWeight:600, color:C.textMid, marginBottom:5 }}>{l}</div>{el}</div>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.textMid, marginBottom:5 }}>Additional Notes</div>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any specific requirements..." style={{ ...iSt, height:'auto', padding:'9px 11px', resize:'vertical' }}/>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} className="ng-btn-sec" style={{ padding:'10px 20px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={()=>setDone(true)} className="ng-btn-coral" style={{ padding:'10px 24px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Send Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email Modal ──────────────────────────────────────────────
function EmailModal({ rate, onClose }) {
  const [email, setEmail] = useState('');
  const [note, setNote]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const iSt = { width:'100%', height:44, padding:'0 13px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13.5, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box' };

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    try { await api.sendRateEmail({ rateId:rate._id, recipientEmail:email, note }); } catch {}
    setDone(true); setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1002, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:18, width:'100%', maxWidth:430, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        {done ? (
          <div style={{ padding:'48px 32px', textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📧</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary, marginBottom:6 }}>Email Sent!</div>
            <div style={{ fontSize:13.5, color:C.textMid, marginBottom:24 }}>Rate details sent to <strong style={{ color:C.textPrimary }}>{email}</strong></div>
            <button onClick={onClose} className="ng-btn-primary" style={{ padding:'10px 32px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding:'18px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Send Rate by Email</div>
              <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:22 }}>×</button>
            </div>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ padding:'11px 14px', background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ fontSize:10.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Carrier</div><div style={{ fontSize:13.5, fontWeight:700, color:C.textPrimary }}>{rate.shippingLine}</div></div>
                <div><div style={{ fontSize:10.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Route</div><div style={{ fontSize:13, fontWeight:700, fontFamily:'ui-monospace,monospace', color:C.navy }}>{rate.originPort} → {rate.destinationPort}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:10.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Total</div><div style={{ fontSize:15, fontWeight:900, color:C.coral, fontFamily:'ui-monospace,monospace' }}>${(rate.totalUsd||rate.freightRateUsd||0).toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:'block', marginBottom:5 }}>Recipient Email *</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="client@company.com" style={iSt}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textMid, display:'block', marginBottom:5 }}>Note (optional)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add a note for the recipient..." style={{ ...iSt, height:'auto', padding:'10px 13px', resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={onClose} className="ng-btn-sec" style={{ padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSend} disabled={!email||loading} className="ng-btn-primary" style={{ padding:'9px 20px', borderRadius:8, fontSize:13, cursor:email?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {loading&&<div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
                  Send Email
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Rate Card ────────────────────────────────────────────────
function RateCard({ rate, onViewDetails, onBook, onMatchRates, onEmail }) {
  const [expanded, setExpanded] = useState(true);
  const cc = getCC(rate.shippingLineCode, rate.shippingLine);
  const freightTotal = (rate.freightCharges||[]).reduce((s,c)=>s+(c.amount||0),0);
  const total = rate.totalUsd || freightTotal;

  return (
    <div className="ng-card-hover" style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', marginBottom:14, boxShadow:C.shadow }}>

      {/* Top accent line */}
      <div style={{ height:3, background:`linear-gradient(90deg,${cc},${cc}80)`, opacity:0.85 }} />

      {/* Main row */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr auto', minHeight:100 }}>

        {/* Carrier */}
        <div style={{ padding:'16px 18px', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            {rate.serviceMode||'CY/CY'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:cc, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10.5, fontWeight:900, letterSpacing:'0.5px', flexShrink:0, boxShadow:`0 4px 12px ${cc}35` }}>
              {(rate.shippingLineCode||rate.shippingLine||'?').slice(0,4)}
            </div>
            <div>
              <div style={{ fontSize:13.5, fontWeight:800, color:C.textPrimary, lineHeight:1.2 }}>{rate.shippingLine}</div>
              {rate.serviceName&&<div style={{ fontSize:10.5, color:C.textMuted, marginTop:1 }}>{rate.serviceName}</div>}
            </div>
          </div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, background:C.greenBg, border:`1px solid ${C.greenBorder}`, width:'fit-content' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:C.green }} />
            <span style={{ fontSize:10, fontWeight:700, color:C.green, letterSpacing:'0.03em' }}>{rate.rateType||'SPOT RATE'}</span>
          </span>
        </div>

        {/* Route */}
        <div style={{ padding:'16px 12px', cursor:'pointer', display:'flex', alignItems:'center' }} onClick={()=>setExpanded(e=>!e)}>
          <RouteBar rate={rate} />
        </div>

        {/* Price */}
        <div style={{ padding:'16px 22px', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:220 }}>
          <div>
            <SLabel>Freight Rate</SLabel>
            <div style={{ fontSize:16, fontWeight:700, color:C.textBody, fontFamily:'ui-monospace,monospace' }}>
              USD {freightTotal.toLocaleString('en-US',{minimumFractionDigits:2})}
            </div>
          </div>
          <div>
            <SLabel>Total Rate</SLabel>
            <div style={{ fontSize:22, fontWeight:900, color:C.textPrimary, fontFamily:'ui-monospace,monospace', lineHeight:1.1 }}>
              USD {total.toLocaleString('en-US',{minimumFractionDigits:2})}
            </div>
            <div style={{ fontSize:10.5, color:C.textMuted, marginTop:2 }}>All charges included</div>
          </div>
        </div>
      </div>

      {/* Expanded row */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'220px 1fr auto', background:C.panelAlt }}>
          <div />
          <div style={{ padding:'13px 12px', display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { l:'Sailing Date', v:fmtD(rate.sailingDate) },
              { l:'Transit Time', v:rate.transitTimeDays?`${rate.transitTimeDays} days`:'—' },
              { l:'Free Days', v:rate.freeDays?`${rate.freeDays} days`:'—' },
              { l:'Cargo', v:rate.cargoType||'FAK' },
              { l:'Valid From', v:fmtD(rate.validFrom) },
            ].map(({ l, v }) => (
              <div key={l}>
                <SLabel>{l}</SLabel>
                <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 20px', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:8, justifyContent:'center', minWidth:220 }}>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>onViewDetails(rate)} className="ng-btn-sec"
                style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                View Details
              </button>
              <button onClick={()=>onBook(rate)} className="ng-btn-coral"
                style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>
                Book Now
              </button>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <button onClick={()=>onMatchRates(rate)}
                style={{ flex:1, padding:'7px 0', background:C.blueDim, color:C.blue, border:`1px solid ${C.blue}30`, borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.blue; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.blueDim; e.currentTarget.style.color=C.blue; }}>
                + Match Rates
              </button>
              <button onClick={()=>onEmail(rate)}
                style={{ flex:1, padding:'7px 0', background:C.panelAlt, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:4, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────
function FilterSidebar({ filters, onChange, filterOptions, loading }) {
  const Radio = ({ label, checked, onSelect }) => (
    <label onClick={onSelect} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', marginBottom:8, fontSize:13.5, color:checked?C.textPrimary:C.textMid, fontWeight:checked?600:400 }}>
      <div style={{ width:17, height:17, borderRadius:'50%', border:`2px solid ${checked?C.blue:C.border}`, background:checked?C.blue:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
        {checked&&<div style={{ width:5, height:5, borderRadius:'50%', background:'#fff' }}/>}
      </div>
      {label}
    </label>
  );
  const Toggle = ({ checked, onChange:onT }) => (
    <div onClick={()=>onT(!checked)} style={{ width:38, height:21, borderRadius:99, background:checked?C.blue:C.border, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ width:15, height:15, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:checked?20:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
    </div>
  );
  const Sec = ({ title, children }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ width:224, flexShrink:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:14.5, fontWeight:700, color:C.textPrimary }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:C.textMid }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filters
        </div>
        <button onClick={()=>onChange({ carrier:'', direct:'', hideEmpty:false, cargo:'', container:'', cardStatus:'All' })}
          style={{ fontSize:12, color:C.blue, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear All</button>
      </div>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px' }}>
        <Sec title="Shipping Line">
          <div style={{ position:'relative', marginBottom:10 }}>
            <input placeholder="Search lines…" value={filters.carrier} onChange={e=>onChange({...filters,carrier:e.target.value})}
              style={{ width:'100%', padding:'8px 10px 8px 30px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12.5, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box', color:C.textPrimary }}/>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          {!loading&&filterOptions.carriers?.slice(0,6).map(c=>(
            <Radio key={c} label={c} checked={filters.carrier===c} onSelect={()=>onChange({...filters,carrier:filters.carrier===c?'':c})}/>
          ))}
        </Sec>
        <Sec title="Card Status">
          {['All','Active','Expired'].map(s=><Radio key={s} label={s} checked={filters.cardStatus===s} onSelect={()=>onChange({...filters,cardStatus:s})}/>)}
        </Sec>
        <Sec title="Direct Route">
          {['All','Direct','Indirect'].map((s,i)=><Radio key={s} label={s} checked={filters.direct===['','direct','indirect'][i]} onSelect={()=>onChange({...filters,direct:['','direct','indirect'][i]})}/>)}
        </Sec>
        <Sec title="Hide Empty Cards">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12.5, color:C.textMid }}>No</span>
            <Toggle checked={filters.hideEmpty} onChange={v=>onChange({...filters,hideEmpty:v})}/>
            <span style={{ fontSize:12.5, color:C.textBody, fontWeight:500 }}>Yes</span>
          </div>
        </Sec>
        {filterOptions.cargoTypes?.length>1&&(
          <Sec title="Cargo Type">
            {['All',...filterOptions.cargoTypes].map(c=><Radio key={c} label={c} checked={(filters.cargo||'All')===c} onSelect={()=>onChange({...filters,cargo:c==='All'?'':c})}/>)}
          </Sec>
        )}
        {filterOptions.containerTypes?.length>1&&(
          <Sec title="Container Type">
            {filterOptions.containerTypes.map(c=><Radio key={c} label={c} checked={filters.container===c} onSelect={()=>onChange({...filters,container:filters.container===c?'':c})}/>)}
          </Sec>
        )}
      </div>
    </div>
  );
}

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_RATES = [
  { id:'r1', rateCode:'P_8288884518_MAEU', rateType:'SPOT RATE', shippingLine:'Maersk', shippingLineCode:'MAEU', originPort:'INNSA', originPortName:'Nhava Sheva (JNPT)', originTerminal:'Gateway Terminals', destinationPort:'USEWR', destinationPortName:'Newark', destinationTerminal:'Maher Terminal', viaPort:['OMSLL'], viaPortNames:['Salalah'], serviceMode:'CY/CY', serviceName:'IME STBY GEMINI', containerType:'40GP', sailingDate:new Date('2026-03-28'), transitTimeDays:38, freeDays:4, cargoType:'FAK', validFrom:new Date('2026-03-28'), freightCharges:[{ name:'Basic Ocean Freight', code:'BOF', basis:'per equipment', currency:'USD', amount:1890, qty:1 },{ name:'Emergency Risk Surcharge', code:'ERS', basis:'per equipment', currency:'USD', amount:100, qty:1 }], originCharges:[{ name:'Terminal Handling Charge', code:'THC', basis:'per equipment', currency:'INR', amount:11334, qty:1 },{ name:'Export Service Charge', code:'ESC', basis:'per equipment', currency:'USD', amount:110, qty:1 }], destinationCharges:[{ name:'Container Protection', code:'CPU', basis:'per equipment', currency:'USD', amount:25, qty:1 },{ name:'Terminal Handling Charge', code:'THC', basis:'per equipment', currency:'USD', amount:7550, qty:1 }], freightRateUsd:1990, totalUsd:9725, inclusions:'Vessel Risk Surcharge', remarks:'ADFT 4 DAYS = 72.00 USD' },
  { id:'r2', rateCode:'HLCU_SP_2026_004', rateType:'SPOT RATE', shippingLine:'Hapag-Lloyd', shippingLineCode:'HLCU', originPort:'INNSA', originPortName:'Nhava Sheva (JNPT)', originTerminal:'Gateway Terminals', destinationPort:'USEWR', destinationPortName:'Newark', destinationTerminal:'Maher Terminal', viaPort:['SGSIN'], viaPortNames:['Singapore PSA'], serviceMode:'CY/CY', serviceName:'QUANTUM PACIFIC', containerType:'40GP', sailingDate:new Date('2026-04-07'), transitTimeDays:32, freeDays:5, cargoType:'FAK', validFrom:new Date('2026-04-01'), validTo:new Date('2026-04-30'), freightCharges:[{ name:'Basic Ocean Freight', code:'BOF', basis:'per equipment', currency:'USD', amount:3170, qty:1 },{ name:'Bunker Adjustment Factor', code:'BAF', basis:'per equipment', currency:'USD', amount:180, qty:1 }], originCharges:[{ name:'Origin Terminal Handling', code:'OTHC', basis:'per equipment', currency:'INR', amount:10733, qty:1 }], destinationCharges:[{ name:'Terminal Handling Charge', code:'THC', basis:'per equipment', currency:'USD', amount:7550, qty:1 }], freightRateUsd:3350, totalUsd:11180, inclusions:'Vessel Risk Surcharge', remarks:'ADFT 7 DAYS = 119.00 USD' },
];

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function RateResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const s = location.state||{};
  const origin = s.origin||{ code:'INNSA', name:'Nhava Sheva' };
  const dest   = s.dest  ||{ code:'USEWR', name:'Newark' };
  const mode   = s.tab==='LCL'?'SEA-LCL':s.tab==='AIR'?'AIR':'SEA-FCL';
  const containerCode = s.containerCode||'40GP';

  const [rates,  setRates]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [filterOptions, setFilterOptions] = useState({ carriers:[], cargoTypes:[], containerTypes:[] });
  const [filters,setFilters]= useState({ carrier:'', direct:'', hideEmpty:false, cargo:'', container:'', cardStatus:'All' });
  const [sortBy, setSortBy] = useState('freightRateUsd');
  const [page,   setPage]   = useState(1);
  const [pagination,setPagination]=useState({});
  const [detailsModal,setDetailsModal]=useState(null);
  const [matchModal,  setMatchModal  ]=useState(null);
  const [emailModal,  setEmailModal  ]=useState(null);

  const loadRates = useCallback(async()=>{
    setLoading(true);
    try {
      const res = await api.searchRates({ mode, originPort:origin.code, destinationPort:dest.code, containerType:filters.container||containerCode||undefined, sortBy, page, limit:10, filterCarrier:filters.carrier||undefined, filterDirect:filters.direct||undefined, filterCargo:filters.cargo||undefined });
      setRates(res.data.rates||[]); setPagination(res.data.pagination||{}); setFilterOptions(res.data.filters||{});
    } catch {
      setRates(MOCK_RATES); setPagination({ total:MOCK_RATES.length, pages:1, page:1, limit:10 }); setFilterOptions({ carriers:['Maersk','Hapag-Lloyd','MSC'], cargoTypes:['FAK'], containerTypes:['40GP','20GP','40HC'] });
    } finally { setLoading(false); }
  },[mode,origin.code,dest.code,filters,sortBy,page,containerCode]);

  useEffect(()=>{ loadRates(); },[loadRates]);
  const handleBook = r => navigate('/bookings/create',{ state:{ rate:r, origin, dest, container:r.containerType||containerCode } });

  return (
    <AppLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .ng-card-hover { transition: all 0.18s ease; }
        .ng-card-hover:hover { box-shadow: 0 8px 32px rgba(11,29,94,0.13) !important; transform: translateY(-2px); }
        .ng-btn-primary { background: linear-gradient(90deg,#1540C0,#1A6FE8 55%,#00C2FF) !important; color:#fff !important; border:none !important; font-weight:700 !important; box-shadow:0 4px 18px rgba(0,194,255,0.28) !important; transition:all 0.18s !important; }
        .ng-btn-primary:hover:not(:disabled) { filter:brightness(1.07) !important; transform:translateY(-1px) !important; }
        .ng-btn-primary:disabled { background:#CBD5E1 !important; box-shadow:none !important; color:#94A3B8 !important; cursor:not-allowed !important; }
        .ng-btn-sec { background:#fff !important; border:1.5px solid #DDE5F5 !important; color:#2D3F6B !important; transition:all 0.18s !important; }
        .ng-btn-sec:hover { border-color:#1A4FD8 !important; color:#1A4FD8 !important; background:#EEF3FF !important; }
        .ng-btn-coral { background:#E8490A !important; color:#fff !important; border:none !important; font-weight:700 !important; transition:all 0.18s !important; }
        .ng-btn-coral:hover { filter:brightness(1.08) !important; }
      `}</style>

      {/* Search summary bar */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, boxShadow:'0 1px 4px rgba(11,29,94,0.05)' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'11px 28px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* CY/DOOR toggles + port — Origin */}
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Origin</div>
            <div style={{ display:'flex', gap:4 }}>
              {['DOOR','CY'].map(t=><span key={t} style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:t==='CY'?C.navy:C.panelAlt, color:t==='CY'?'#fff':C.textMuted, border:`1px solid ${t==='CY'?C.navy:C.border}` }}>{t}</span>)}
            </div>
          </div>
          <div style={{ flex:1, minWidth:200, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:9, padding:'8px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
            <span style={{ fontSize:13.5, fontWeight:600, color:C.textPrimary }}>{origin.name}</span>
            <span style={{ marginLeft:'auto', fontSize:10.5, fontWeight:800, padding:'2px 7px', background:C.navy, borderRadius:4, color:'#fff', fontFamily:'ui-monospace,monospace', letterSpacing:'0.04em' }}>{origin.code}</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted, flexShrink:0 }}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Destination</div>
            <div style={{ display:'flex', gap:4 }}>
              {['CY','DOOR'].map(t=><span key={t} style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:t==='CY'?C.navy:C.panelAlt, color:t==='CY'?'#fff':C.textMuted, border:`1px solid ${t==='CY'?C.navy:C.border}` }}>{t}</span>)}
            </div>
          </div>
          <div style={{ flex:1, minWidth:200, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:9, padding:'8px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
            <span style={{ fontSize:13.5, fontWeight:600, color:C.textPrimary }}>{dest.name}</span>
            <span style={{ marginLeft:'auto', fontSize:10.5, fontWeight:800, padding:'2px 7px', background:C.navy, borderRadius:4, color:'#fff', fontFamily:'ui-monospace,monospace', letterSpacing:'0.04em' }}>{dest.code}</span>
          </div>
          <button onClick={()=>navigate(-1)} style={{ padding:'9px 18px', background:C.coralBg, color:C.coral, border:`1.5px solid ${C.coral}40`, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Search
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth:1320, margin:'0 auto', padding:'24px 28px 64px', minHeight:'calc(100vh - 120px)' }}>
        {/* Results header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, color:C.textPrimary, lineHeight:1, marginBottom:4 }}>Instant Rates</h2>
            {!loading&&<p style={{ fontSize:13, color:C.textMid }}>{pagination.total||rates.length} rate{(pagination.total||rates.length)!==1?'s':''} found · {origin.code} → {dest.code}</p>}
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={()=>setMatchModal({})} className="ng-btn-sec" style={{ padding:'9px 18px', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              + Match Rates
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.textMid }}>
              <span>Sort by</span>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ padding:'8px 32px 8px 12px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13.5, fontWeight:600, color:C.textPrimary, outline:'none', cursor:'pointer', background:C.panel, appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' }}>
                <option value="freightRateUsd">Lowest Freight</option>
                <option value="totalUsd">Lowest Total</option>
                <option value="transitTimeDays">Fastest Transit</option>
                <option value="sailingDate">Earliest Sailing</option>
                <option value="carrier">Carrier Name</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
          <FilterSidebar filters={filters} onChange={setFilters} filterOptions={filterOptions} loading={loading}/>
          <div style={{ flex:1, minWidth:0 }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'80px 0', background:C.panel, borderRadius:16, border:`1px solid ${C.border}` }}>
                <div style={{ width:44, height:44, border:`3px solid ${C.border}`, borderTopColor:C.cyan, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
                <p style={{ color:C.textMid, fontSize:14 }}>Searching best rates…</p>
              </div>
            ) : rates.length===0 ? (
              <div style={{ textAlign:'center', padding:'64px 20px', background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, boxShadow:C.shadow }}>
                <div style={{ fontSize:44, marginBottom:14 }}>🔍</div>
                <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary, marginBottom:7 }}>No rates found</div>
                <div style={{ fontSize:13.5, color:C.textMid, marginBottom:20 }}>Try adjusting your filters or request a custom rate.</div>
                <button onClick={()=>setMatchModal({})} className="ng-btn-coral" style={{ padding:'11px 28px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Request Custom Rate</button>
              </div>
            ) : (
              <>
                {rates.map(r=>(
                  <RateCard key={r._id||r.id} rate={r}
                    onViewDetails={setDetailsModal} onBook={handleBook}
                    onMatchRates={setMatchModal} onEmail={setEmailModal}/>
                ))}
                {pagination.pages>1&&(
                  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:24 }}>
                    <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="ng-btn-sec"
                      style={{ padding:'9px 20px', borderRadius:9, fontSize:13, fontWeight:600, cursor:page===1?'not-allowed':'pointer', fontFamily:'inherit', opacity:page===1?0.5:1 }}>← Prev</button>
                    <span style={{ fontSize:13, color:C.textMid, padding:'0 4px' }}>Page {page} of {pagination.pages}</span>
                    <button disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)} className="ng-btn-sec"
                      style={{ padding:'9px 20px', borderRadius:9, fontSize:13, fontWeight:600, cursor:page>=pagination.pages?'not-allowed':'pointer', fontFamily:'inherit', opacity:page>=pagination.pages?0.5:1 }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {detailsModal&&<DetailsModal rate={detailsModal} onClose={()=>setDetailsModal(null)} onBook={handleBook}/>}
      {matchModal  &&<MatchRatesModal rate={matchModal} onClose={()=>setMatchModal(null)}/>}
      {emailModal  &&<EmailModal rate={emailModal} onClose={()=>setEmailModal(null)}/>}
    </AppLayout>
  );
}