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
  shadow:'0 1px 3px rgba(11,29,94,0.05),0 2px 8px rgba(11,29,94,0.06)',
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
  <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:bg, color, border:`1px solid ${border}`, whiteSpace:'nowrap' }}>{label}</span>
);

// ─── Section label ────────────────────────────────────────────
const SLabel = ({ children }) => (
  <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{children}</div>
);

// ─── Route visualizer ─────────────────────────────────────────
function RouteBar({ rate }) {
  const stops = [
    { code:rate.originPort, name:rate.originPortName||rate.originPort, terminal:rate.originTerminal },
    ...(rate.viaPort||[]).map((c,i)=>({ code:c, name:rate.viaPortNames?.[i]||c, terminal:rate.viaTerminals?.[i]||'' })),
    { code:rate.destinationPort, name:rate.destinationPortName||rate.destinationPort, terminal:rate.destinationTerminal },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', flex:1, padding:'0 6px', minWidth:0 }}>
      {stops.map((stop, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{ flex:1, display:'flex', alignItems:'center', margin:'0 3px', minWidth:16 }}>
              <div style={{ flex:1, height:1.5, background:`linear-gradient(90deg,${C.blue}30,${C.cyan}80)`, position:'relative', borderRadius:2 }}>
                {i === Math.floor(stops.length/2) && (
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:C.panel, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 1px ${C.border}` }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20l2-8h16l2 8H2z"/><path d="M6 12V8l3-3 3 3 3-3 3 3v4"/></svg>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
            <div style={{ width:i===0||i===stops.length-1?9:5, height:i===0||i===stops.length-1?9:5, borderRadius:'50%', background:i===0||i===stops.length-1?C.blue:C.textMuted, border:`1.5px solid ${C.panel}`, boxShadow:`0 0 0 1px ${i===0||i===stops.length-1?C.blue:C.border}` }} />
            <div style={{ fontSize:9.5, fontWeight:700, color:i===0||i===stops.length-1?C.navy:C.textMid, fontFamily:'ui-monospace,monospace', letterSpacing:'0.4px' }}>{stop.code}</div>
            {stop.terminal && <div style={{ fontSize:8.5, color:C.textMuted, maxWidth:60, textAlign:'center', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{stop.terminal}</div>}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Charge table ─────────────────────────────────────────────
// currency badge: USD gets blue, INR gets amber, others get neutral
const CurrencyBadge = ({ currency }) => {
  const styles = {
    USD: { bg:'#EEF3FF', color:'#1A4FD8', border:'#BCC9E8' },
    INR: { bg:'#FFFBEB', color:'#B45309', border:'#FDE68A' },
  };
  const s = styles[currency] || { bg:C.panelAlt, color:C.textMid, border:C.border };
  return (
    <span style={{ display:'inline-block', fontSize:9.5, fontWeight:800, letterSpacing:'0.04em', padding:'1px 5px', borderRadius:4, background:s.bg, color:s.color, border:`1px solid ${s.border}`, marginRight:4, verticalAlign:'middle' }}>
      {currency}
    </span>
  );
};

const fmtAmt = (amount) => Number(amount||0).toLocaleString('en-US',{minimumFractionDigits:2});

function ChargeTable({ title, charges, accentColor }) {
  if (!charges?.length) return null;
  const total = charges.reduce((s,c) => s+(c.amount||0), 0);
  const currency = charges[0]?.currency || 'USD';
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:3, height:15, background:accentColor, borderRadius:2 }} />
        <span style={{ fontSize:11.5, fontWeight:700, color:C.textPrimary, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
      </div>
      <div style={{ border:`1px solid ${C.border}`, borderRadius:9, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F0F4FF' }}>
              <th style={{ padding:'8px 12px', textAlign:'left',  fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}` }}>Charge Name</th>
              <th style={{ padding:'8px 10px', textAlign:'left',  fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>Basis</th>
              <th style={{ padding:'8px 10px', textAlign:'center',fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}` }}>Equip.</th>
              <th style={{ padding:'8px 10px', textAlign:'right', fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}` }}>Qty</th>
              <th style={{ padding:'8px 14px', textAlign:'right', fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', borderLeft:`1px solid ${C.border}` }}>Unit Price</th>
              <th style={{ padding:'8px 14px', textAlign:'right', fontSize:10.5, fontWeight:700, color:C.navy,    textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', background:'#E8EDFF', borderLeft:`1px solid ${C.borderMid}` }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((ch,i)=>(
              <tr key={i} style={{ borderBottom:i<charges.length-1?`1px solid ${C.border}`:'none', background:i%2===0?C.panel:'#FAFBFF' }}>
                <td style={{ padding:'9px 12px', color:C.textPrimary, fontWeight:600, fontSize:13 }}>{ch.name}</td>
                <td style={{ padding:'9px 10px', color:C.textMid, fontSize:12 }}>{ch.basis||'per equipment'}</td>
                <td style={{ padding:'9px 10px', textAlign:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:C.blueDim, color:C.blue }}>{ch.code||'—'}</span>
                </td>
                <td style={{ padding:'9px 10px', textAlign:'right', color:C.textMid, fontSize:13, fontFamily:'ui-monospace,monospace' }}>{ch.qty||1}.00</td>
                {/* Unit Price — muted, smaller */}
                <td style={{ padding:'9px 14px', textAlign:'right', fontFamily:'ui-monospace,monospace', color:C.textMid, fontSize:12.5, borderLeft:`1px solid ${C.border}` }}>
                  <CurrencyBadge currency={ch.currency} />
                  <span style={{ verticalAlign:'middle' }}>{fmtAmt(ch.amount)}</span>
                </td>
                {/* Amount — prominent, navy, highlighted column */}
                <td style={{ padding:'9px 14px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontWeight:800, color:C.navy, fontSize:14, background:'#EEF3FF', borderLeft:`1px solid ${C.borderMid}` }}>
                  <CurrencyBadge currency={ch.currency} />
                  <span style={{ verticalAlign:'middle' }}>{fmtAmt(ch.amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#E4EAFF', borderTop:`2px solid ${C.borderMid}` }}>
              <td colSpan={5} style={{ padding:'9px 12px', fontSize:12, fontWeight:700, color:C.textPrimary }}>Subtotal</td>
              <td style={{ padding:'9px 14px', textAlign:'right', fontFamily:'ui-monospace,monospace', fontWeight:900, color:accentColor, fontSize:15, borderLeft:`1px solid ${C.borderMid}` }}>
                <CurrencyBadge currency={currency} />
                <span style={{ verticalAlign:'middle' }}>{fmtAmt(total)}</span>
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
      <div style={{ background:C.panel, borderRadius:18, width:'100%', maxWidth:920, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>

        {/* Header */}
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:cc, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:900, letterSpacing:'0.5px', flexShrink:0, boxShadow:`0 3px 10px ${cc}40` }}>
              {(rate.shippingLineCode||rate.shippingLine||'?').slice(0,4)}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:C.textPrimary }}>{rate.shippingLine}</div>
              <div style={{ fontSize:11, color:C.textMid, display:'flex', gap:8, marginTop:2, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, color:C.blue, fontFamily:'ui-monospace,monospace', fontSize:10 }}>#{rate.rateCode||rate._id?.slice(-8)}</span>
                <span>{rate.serviceMode}</span>
                {rate.serviceName&&<span>{rate.serviceName}</span>}
                <span style={{ fontWeight:700, padding:'1px 7px', borderRadius:5, background:C.greenBg, color:C.green, fontSize:10, border:`1px solid ${C.greenBorder}` }}>{rate.rateType||'SPOT RATE'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:8, cursor:'pointer', padding:'6px 8px', display:'flex', transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Route + meta */}
        <div style={{ padding:'12px 24px', background:C.panelAlt, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <RouteBar rate={rate} />
          <div style={{ display:'flex', gap:20, marginTop:10, flexWrap:'wrap' }}>
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
                <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charges */}
        <div style={{ flex:1, overflow:'auto', padding:'18px 24px' }}>
          <ChargeTable title="Freight Charges — Ocean Leg" charges={rate.freightCharges} accentColor={C.blue} />
          <ChargeTable title="Origin Charges — Port of Loading" charges={rate.originCharges} accentColor={C.coral} />
          <ChargeTable title="Destination Charges — Port of Discharge" charges={rate.destinationCharges} accentColor={C.green} />
          {(rate.inclusions||rate.remarks) && (
            <div style={{ display:'grid', gridTemplateColumns:rate.inclusions&&rate.remarks?'1fr 1fr':'1fr', gap:10, marginTop:6 }}>
              {rate.inclusions&&<div style={{ padding:'10px 12px', background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:9 }}><div style={{ fontSize:9.5, fontWeight:700, color:C.green, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Included</div><div style={{ fontSize:12, color:'#065F46', lineHeight:1.5 }}>{rate.inclusions}</div></div>}
              {rate.remarks&&<div style={{ padding:'10px 12px', background:C.amberBg, border:`1px solid #FDE68A`, borderRadius:9 }}><div style={{ fontSize:9.5, fontWeight:700, color:C.amber, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Remarks</div><div style={{ fontSize:12, color:'#78350F', lineHeight:1.5 }}>{rate.remarks}</div></div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <SLabel>Total Estimated Cost</SLabel>
            <div style={{ fontSize:24, fontWeight:900, color:C.textPrimary, fontFamily:'ui-monospace,monospace', lineHeight:1.1 }}>USD {grandTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
            <div style={{ fontSize:10.5, color:C.textMuted, marginTop:3 }}>Rates subject to liner availability · Valid: {fmtD(rate.validFrom)}{rate.validTo?` – ${fmtD(rate.validTo)}`:' onwards'}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} className="ng-btn-sec" style={{ padding:'9px 18px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
            <button onClick={()=>onBook(rate)} className="ng-btn-coral" style={{ padding:'9px 22px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Request Booking →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Match Rates Modal ────────────────────────────────────────
function MatchRatesModal({ rate, onClose }) {
  const [form, setForm] = useState({
    containerType: rate?.containerType || '40GP',
    targetRate: '', currency: 'USD', cargoWt: '18000',
    liner: '', sailingDate: '', freeDays: '7', notes: ''
  });
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // ← NEW: actually calls the API
  const handleSend = async () => {
    if (!form.targetRate) { setError('Please enter a target rate'); return; }
    setLoading(true); setError('');
    try {
      await api.createEnquiry({
        mode:                  rate?.mode || 'SEA-FCL',
        originPort:            rate?.originPort || '',
        destinationPort:       rate?.destinationPort || '',
        containerType:         form.containerType,
        targetRate:            parseFloat(form.targetRate),
        currency:              form.currency,
        cargoWeight:           parseFloat(form.cargoWt),
        weightUnit:            'KG',
        preferredLiner:        form.liner || undefined,
        preferredSailingDate:  form.sailingDate || undefined,
        freeDays:              parseInt(form.freeDays) || 7,
        notes:                 form.notes || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iSt = { width:'100%', height:38, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12.5, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box' };
  const sSt = { ...iSt, cursor:'pointer', appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', paddingRight:28 };

  if (done) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.panel, borderRadius:16, padding:'40px 36px', textAlign:'center', maxWidth:360, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ width:56, height:56, background:'linear-gradient(135deg,#059669,#0CC77B)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 6px 24px rgba(5,150,105,0.3)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:6 }}>Request Sent!</div>
        <div style={{ fontSize:12.5, color:C.textMid, marginBottom:20, lineHeight:1.6 }}>
          Our team will review your target rate and respond within <strong>24 hours</strong>.<br/>
          Check your email for confirmation.
        </div>
        <button onClick={onClose} className="ng-btn-primary" style={{ padding:'10px 28px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:C.panel, borderRadius:16, width:'100%', maxWidth:520, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:14.5, fontWeight:800, color:C.textPrimary }}>Request Better Rate</div>
            {rate && <div style={{ fontSize:11, color:C.textMid, marginTop:2, fontFamily:'ui-monospace,monospace' }}>{rate.originPort} → {rate.destinationPort} · {rate.shippingLine}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:20, lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {error && (
            <div style={{ padding:'9px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:12.5, color:'#DC2626', marginBottom:12 }}>
              {error}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 100px', gap:8, marginBottom:12 }}>
            {[
              ['Equipment', <div style={{ padding:'7px 10px', border:`2px solid ${C.blue}`, borderRadius:7, fontSize:12.5, fontWeight:700, color:C.blue, textAlign:'center', background:C.blueDim }}>{form.containerType}</div>],
              ['Target Rate *', <input value={form.targetRate} onChange={set('targetRate')} type="number" placeholder="Enter target rate" style={iSt}/>],
              ['Currency', <select value={form.currency} onChange={set('currency')} style={sSt}>{['USD','EUR','GBP','AED','INR'].map(c=><option key={c}>{c}</option>)}</select>],
              ['Cargo Wt (KG)', <input value={form.cargoWt} onChange={set('cargoWt')} type="number" style={iSt}/>],
            ].map(([l, el]) => (
              <div key={l}><div style={{ fontSize:10.5, fontWeight:600, color:C.textMid, marginBottom:4 }}>{l}</div>{el}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:8, marginBottom:12 }}>
            {[
              ['Preferred Liner', <input value={form.liner} onChange={set('liner')} placeholder="Any liner" style={iSt}/>],
              ['Preferred Sailing Date', <input type="date" value={form.sailingDate} onChange={set('sailingDate')} style={iSt}/>],
              ['Free Days', <input value={form.freeDays} onChange={set('freeDays')} type="number" style={{ ...iSt, textAlign:'center' }}/>],
            ].map(([l, el]) => (
              <div key={l}><div style={{ fontSize:10.5, fontWeight:600, color:C.textMid, marginBottom:4 }}>{l}</div>{el}</div>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:C.textMid, marginBottom:4 }}>Additional Notes</div>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any specific requirements…" style={{ ...iSt, height:'auto', padding:'8px 10px', resize:'vertical' }}/>
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose} className="ng-btn-sec" style={{ padding:'8px 18px', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={handleSend} disabled={loading} className="ng-btn-coral"
              style={{ padding:'8px 20px', borderRadius:8, fontSize:12.5, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, opacity:loading?0.8:1 }}>
              {loading && <div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
              {loading ? 'Sending…' : 'Send Request'}
            </button>
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
  const iSt = { width:'100%', height:40, padding:'0 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box' };

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    try { await api.sendRateEmail({ rateId:rate._id, recipientEmail:email, note }); } catch {}
    setDone(true); setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1002, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:16, width:'100%', maxWidth:420, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        {done ? (
          <div style={{ padding:'40px 28px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📧</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.textPrimary, marginBottom:5 }}>Email Sent!</div>
            <div style={{ fontSize:12.5, color:C.textMid, marginBottom:20 }}>Rate details sent to <strong style={{ color:C.textPrimary }}>{email}</strong></div>
            <button onClick={onClose} className="ng-btn-primary" style={{ padding:'9px 28px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:14.5, fontWeight:800, color:C.textPrimary }}>Send Rate by Email</div>
              <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:20 }}>×</button>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ padding:'9px 12px', background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:9, marginBottom:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ fontSize:9.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Carrier</div><div style={{ fontSize:12.5, fontWeight:700, color:C.textPrimary }}>{rate.shippingLine}</div></div>
                <div><div style={{ fontSize:9.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Route</div><div style={{ fontSize:12, fontWeight:700, fontFamily:'ui-monospace,monospace', color:C.navy }}>{rate.originPort} → {rate.destinationPort}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:9.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Total</div><div style={{ fontSize:14, fontWeight:900, color:C.coral, fontFamily:'ui-monospace,monospace' }}>${(rate.totalUsd||rate.freightRateUsd||0).toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
              </div>
              <div style={{ marginBottom:11 }}>
                <label style={{ fontSize:11, fontWeight:600, color:C.textMid, display:'block', marginBottom:4 }}>Recipient Email *</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="client@company.com" style={iSt}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:600, color:C.textMid, display:'block', marginBottom:4 }}>Note (optional)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add a note for the recipient..." style={{ ...iSt, height:'auto', padding:'9px 12px', resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={onClose} className="ng-btn-sec" style={{ padding:'8px 16px', borderRadius:7, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSend} disabled={!email||loading} className="ng-btn-primary" style={{ padding:'8px 18px', borderRadius:7, fontSize:12.5, cursor:email?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                  {loading&&<div style={{ width:11, height:11, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
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
    <div className="ng-card-hover" style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:10, boxShadow:C.shadow }}>

      {/* Top accent line */}
      <div style={{ height:2, background:`linear-gradient(90deg,${cc},${cc}80)`, opacity:0.85 }} />

      {/* Main row */}
      <div style={{ display:'grid', gridTemplateColumns:'190px 1fr auto', minHeight:72 }}>

        {/* Carrier */}
        <div style={{ padding:'12px 14px', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            {rate.serviceMode||'CY/CY'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:cc, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9.5, fontWeight:900, letterSpacing:'0.5px', flexShrink:0, boxShadow:`0 3px 8px ${cc}35` }}>
              {(rate.shippingLineCode||rate.shippingLine||'?').slice(0,4)}
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>{rate.shippingLine}</div>
              {rate.serviceName&&<div style={{ fontSize:9.5, color:C.textMuted, marginTop:1 }}>{rate.serviceName}</div>}
            </div>
          </div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:99, background:C.greenBg, border:`1px solid ${C.greenBorder}`, width:'fit-content' }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:C.green }} />
            <span style={{ fontSize:9.5, fontWeight:700, color:C.green, letterSpacing:'0.03em' }}>{rate.rateType||'SPOT RATE'}</span>
          </span>
        </div>

        {/* Route */}
        <div style={{ padding:'10px 8px', cursor:'pointer', display:'flex', alignItems:'center' }} onClick={()=>setExpanded(e=>!e)}>
          <RouteBar rate={rate} />
        </div>

        {/* Price */}
        <div style={{ padding:'12px 16px', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:190 }}>
          <div>
            <SLabel>Freight Rate</SLabel>
            <div style={{ fontSize:13.5, fontWeight:700, color:C.textBody, fontFamily:'ui-monospace,monospace' }}>
              USD {freightTotal.toLocaleString('en-US',{minimumFractionDigits:2})}
            </div>
          </div>
          <div>
            <SLabel>Total Rate</SLabel>
            <div style={{ fontSize:18, fontWeight:900, color:C.textPrimary, fontFamily:'ui-monospace,monospace', lineHeight:1.1 }}>
              USD {total.toLocaleString('en-US',{minimumFractionDigits:2})}
            </div>
            <div style={{ fontSize:9.5, color:C.textMuted, marginTop:2 }}>All charges included</div>
          </div>
        </div>
      </div>

      {/* Expanded row */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'190px 1fr auto', background:C.panelAlt }}>
          <div />
          <div style={{ padding:'9px 10px', display:'flex', gap:18, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { l:'Sailing Date', v:fmtD(rate.sailingDate) },
              { l:'Transit Time', v:rate.transitTimeDays?`${rate.transitTimeDays} days`:'—' },
              { l:'Free Days', v:rate.freeDays?`${rate.freeDays} days`:'—' },
              { l:'Cargo', v:rate.cargoType||'FAK' },
              { l:'Valid From', v:fmtD(rate.validFrom) },
            ].map(({ l, v }) => (
              <div key={l}>
                <SLabel>{l}</SLabel>
                <div style={{ fontSize:11.5, fontWeight:600, color:C.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'8px 14px', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:6, justifyContent:'center', minWidth:190 }}>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>onViewDetails(rate)} className="ng-btn-sec"
                style={{ flex:1, padding:'7px 0', borderRadius:7, fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                View Details
              </button>
              <button onClick={()=>onBook(rate)} className="ng-btn-coral"
                style={{ flex:1, padding:'7px 0', borderRadius:7, fontSize:11.5, cursor:'pointer', fontFamily:'inherit' }}>
                Book Now
              </button>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <button onClick={()=>onMatchRates(rate)}
                style={{ flex:1, padding:'5px 0', background:C.blueDim, color:C.blue, border:`1px solid ${C.blue}30`, borderRadius:6, fontSize:10.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.blue; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.blueDim; e.currentTarget.style.color=C.blue; }}>
                + Match Rates
              </button>
              <button onClick={()=>onEmail(rate)}
                style={{ flex:1, padding:'5px 0', background:C.panelAlt, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:6, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:3, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
    <label onClick={onSelect} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:5, fontSize:12.5, color:checked?C.textPrimary:C.textMid, fontWeight:checked?600:400 }}>
      <div style={{ width:15, height:15, borderRadius:'50%', border:`2px solid ${checked?C.blue:C.border}`, background:checked?C.blue:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
        {checked&&<div style={{ width:4, height:4, borderRadius:'50%', background:'#fff' }}/>}
      </div>
      {label}
    </label>
  );
  const Toggle = ({ checked, onChange:onT }) => (
    <div onClick={()=>onT(!checked)} style={{ width:34, height:19, borderRadius:99, background:checked?C.blue:C.border, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ width:13, height:13, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:checked?18:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
    </div>
  );
  const Sec = ({ title, children }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ width:200, flexShrink:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13.5, fontWeight:700, color:C.textPrimary }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:C.textMid }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filters
        </div>
        <button onClick={()=>onChange({ carrier:'', direct:'', hideEmpty:false, cargo:'', container:'', cardStatus:'All' })}
          style={{ fontSize:11, color:C.blue, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear All</button>
      </div>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px' }}>
        <Sec title="Shipping Line">
          <div style={{ position:'relative', marginBottom:8 }}>
            <input placeholder="Search lines…" value={filters.carrier} onChange={e=>onChange({...filters,carrier:e.target.value})}
              style={{ width:'100%', padding:'7px 8px 7px 26px', border:`1.5px solid ${C.border}`, borderRadius:7, fontSize:12, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box', color:C.textPrimary }}/>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11.5, color:C.textMid }}>No</span>
            <Toggle checked={filters.hideEmpty} onChange={v=>onChange({...filters,hideEmpty:v})}/>
            <span style={{ fontSize:11.5, color:C.textBody, fontWeight:500 }}>Yes</span>
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
  const [cargoCalc, setCargoCalc] = useState(null); // ← ADD THIS

const loadRates = useCallback(async () => {
  setLoading(true);
  try {
    let res;
    if (mode === 'AIR') {
      res = await api.searchAirRates({
        originPort:      origin.code,
        destinationPort: dest.code,
        actualKg:        parseFloat(s.actualKg  || 50),
        lengthCm:        parseFloat(s.lengthCm  || 0),
        widthCm:         parseFloat(s.widthCm   || 0),
        heightCm:        parseFloat(s.heightCm  || 0),
        pieces:          parseInt(s.pieces      || 1),
        page,
        limit: 20,
      });
      setRates(res.data?.rates || []);
      if (res.data?.cargo) setCargoCalc(res.data.cargo);
      setPagination(res.data?.pagination || {});
      setFilterOptions({ carriers: [...new Set((res.data?.rates||[]).map(r=>r.carrier).filter(Boolean))] });
    } else {
      res = await api.searchRates({
        mode, originPort: origin.code, destinationPort: dest.code,
        containerType: filters.container || containerCode || undefined,
        sortBy, page, limit: 20,
        filterCarrier: filters.carrier || undefined,
        filterDirect:  filters.direct  || undefined,
        filterCargo:   filters.cargo   || undefined,
      });
      setRates(res.data?.rates || []);
      setPagination(res.data?.pagination || {});
      setFilterOptions(res.data?.filters || {});
    }
  } catch {
    setRates(MOCK_RATES);
    setPagination({ total: MOCK_RATES.length, pages: 1, page: 1, limit: 20 });
  } finally {
    setLoading(false);
  }
}, [mode, origin.code, dest.code, filters, sortBy, page, containerCode,
    s.actualKg, s.lengthCm, s.widthCm, s.heightCm, s.pieces]); // ← explicit deps

  useEffect(()=>{ loadRates(); },[loadRates]);
  const handleBook = r => navigate('/bookings/create', {
  state: {
    rate:      r,
    origin,
    dest,
    container: r.containerType || containerCode,
    // Pass air cargo dimensions so CreateBookingPage can pre-fill them
    actualKg:  s.actualKg,
    lengthCm:  s.lengthCm,
    widthCm:   s.widthCm,
    heightCm:  s.heightCm,
    pieces:    s.pieces,
  }
});


  function AirRateCard({ rate, onBook, onMatchRates }) {
  const quote = rate.quote;
  if (!quote) return null;

  return (
    <div className="ng-card-hover" style={{ background:C.panel, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden', marginBottom:10, boxShadow:C.shadow }}>
      <div style={{ height:2, background:'linear-gradient(90deg,#1540C0,#00C2FF)', opacity:0.85 }}/>
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr auto', minHeight:80 }}>

        {/* Carrier */}
        <div style={{ padding:'12px 14px', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase' }}>✈ AIR FREIGHT</div>
          <div style={{ fontSize:13, fontWeight:800, color:C.textPrimary }}>{rate.carrier}</div>
          <div style={{ fontSize:10, color:C.textMuted }}>{rate.cargoType} · VW÷{rate.vwDivisor||6000}</div>
        </div>

        {/* Slab info */}
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6, justifyContent:'center' }}>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[
              ['Route',           `${rate.originPort} → ${rate.destinationPort}`],
              ['Matched Slab',    quote.slab?.name || '—'],
              ['Rate',            `USD ${quote.slab?.ratePerKg}/KG`],
              ['Min Charge',      `USD ${quote.slab?.minCharge}`],
              ['Transit',         rate.transitTime || '—'],
              ['Chargeable Wt',   `${quote.cw} KG`],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, fontFamily:'ui-monospace,monospace' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price + actions */}
        <div style={{ padding:'12px 16px', borderLeft:`1px solid ${C.border}`, display:'flex',
          flexDirection:'column', justifyContent:'space-between', minWidth:200 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:2 }}>Est. Freight Cost</div>
            <div style={{ fontSize:20, fontWeight:900, color:C.navy, fontFamily:'ui-monospace,monospace' }}>
              USD {quote.freightCost?.toLocaleString('en-US', {minimumFractionDigits:2})}
            </div>
            <div style={{ fontSize:9.5, color:C.textMuted, marginTop:2 }}>
              MAX({quote.cw} KG × {quote.slab?.ratePerKg}, min {quote.slab?.minCharge})
            </div>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <button onClick={()=>onMatchRates(rate)} className="ng-btn-sec"
              style={{ flex:1, padding:'7px 0', borderRadius:7, fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              + Match
            </button>
            <button onClick={()=>onBook(rate)} className="ng-btn-coral"
              style={{ flex:1, padding:'7px 0', borderRadius:7, fontSize:11.5, cursor:'pointer', fontFamily:'inherit' }}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
    <AppLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .ng-card-hover { transition: all 0.18s ease; }
        .ng-card-hover:hover { box-shadow: 0 6px 24px rgba(11,29,94,0.12) !important; transform: translateY(-1px); }
        .ng-btn-primary { background: linear-gradient(90deg,#1540C0,#1A6FE8 55%,#00C2FF) !important; color:#fff !important; border:none !important; font-weight:700 !important; box-shadow:0 4px 18px rgba(0,194,255,0.28) !important; transition:all 0.18s !important; }
        .ng-btn-primary:hover:not(:disabled) { filter:brightness(1.07) !important; transform:translateY(-1px) !important; }
        .ng-btn-primary:disabled { background:#CBD5E1 !important; box-shadow:none !important; color:#94A3B8 !important; cursor:not-allowed !important; }
        .ng-btn-sec { background:#fff !important; border:1.5px solid #DDE5F5 !important; color:#2D3F6B !important; transition:all 0.18s !important; }
        .ng-btn-sec:hover { border-color:#1A4FD8 !important; color:#1A4FD8 !important; background:#EEF3FF !important; }
        .ng-btn-coral { background:#E8490A !important; color:#fff !important; border:none !important; font-weight:700 !important; transition:all 0.18s !important; }
        .ng-btn-coral:hover { filter:brightness(1.08) !important; }
      `}</style>

      {/* Search summary bar */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, boxShadow:'0 1px 3px rgba(11,29,94,0.04)' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'8px 24px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Origin */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ fontSize:8.5, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Origin</div>
            <div style={{ display:'flex', gap:3 }}>
              {['DOOR','CY'].map(t=><span key={t} style={{ padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700, background:t==='CY'?C.navy:C.panelAlt, color:t==='CY'?'#fff':C.textMuted, border:`1px solid ${t==='CY'?C.navy:C.border}` }}>{t}</span>)}
            </div>
          </div>
          <div style={{ flex:1, minWidth:180, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
            <span style={{ fontSize:12.5, fontWeight:600, color:C.textPrimary }}>{origin.name}</span>
            <span style={{ marginLeft:'auto', fontSize:9.5, fontWeight:800, padding:'1px 6px', background:C.navy, borderRadius:3, color:'#fff', fontFamily:'ui-monospace,monospace', letterSpacing:'0.04em' }}>{origin.code}</span>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted, flexShrink:0 }}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {/* Destination */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ fontSize:8.5, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Destination</div>
            <div style={{ display:'flex', gap:3 }}>
              {['CY','DOOR'].map(t=><span key={t} style={{ padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700, background:t==='CY'?C.navy:C.panelAlt, color:t==='CY'?'#fff':C.textMuted, border:`1px solid ${t==='CY'?C.navy:C.border}` }}>{t}</span>)}
            </div>
          </div>
          <div style={{ flex:1, minWidth:180, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
            <span style={{ fontSize:12.5, fontWeight:600, color:C.textPrimary }}>{dest.name}</span>
            <span style={{ marginLeft:'auto', fontSize:9.5, fontWeight:800, padding:'1px 6px', background:C.navy, borderRadius:3, color:'#fff', fontFamily:'ui-monospace,monospace', letterSpacing:'0.04em' }}>{dest.code}</span>
          </div>
          <button onClick={() => navigate('/rate-search', {
  state: {
    prefill: {
      origin,
      dest,
      tab:           mode === 'SEA-LCL' ? 'LCL' : mode === 'AIR' ? 'AIR' : 'FCL',
      containerCode: containerCode || '',
    }
  }
})} style={{ padding:'7px 14px', background:C.coralBg, color:C.coral, border:`1.5px solid ${C.coral}40`, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit', flexShrink:0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Search
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth:1320, margin:'0 auto', padding:'18px 24px 48px', minHeight:'calc(100vh - 120px)' }}>
        {/* Results header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:900, color:C.textPrimary, lineHeight:1, marginBottom:3 }}>Instant Rates</h2>
            {!loading&&<p style={{ fontSize:12, color:C.textMid }}>{pagination.total||rates.length} rate{(pagination.total||rates.length)!==1?'s':''} found · {origin.code} → {dest.code}</p>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={()=>setMatchModal({})} className="ng-btn-sec" style={{ padding:'7px 14px', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              + Match Rates
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:C.textMid }}>
              <span>Sort by</span>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ padding:'7px 28px 7px 10px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontWeight:600, color:C.textPrimary, outline:'none', cursor:'pointer', background:C.panel, appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 9px center' }}>
                <option value="freightRateUsd">Lowest Freight</option>
                <option value="totalUsd">Lowest Total</option>
                <option value="transitTimeDays">Fastest Transit</option>
                <option value="sailingDate">Earliest Sailing</option>
                <option value="carrier">Carrier Name</option>
              </select>
            </div>
          </div>
        </div>
        {/* Air cargo summary — show when AIR mode and cargo is calculated */}
{mode === 'AIR' && cargoCalc && (
  <div style={{ background:'#EEF3FF', border:`1px solid ${C.borderMid}`, borderRadius:10,
    padding:'10px 16px', marginBottom:14, display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
    <div style={{ fontSize:11, fontWeight:800, color:C.navy, textTransform:'uppercase', letterSpacing:'0.06em' }}>
      ✈ Cargo Calculation
    </div>
    {[
      ['Actual Weight', `${cargoCalc.totalAW} KG`],
      ['Volume Weight', `${cargoCalc.totalVW} KG`],
      ['Chargeable Weight', `${cargoCalc.cw} KG`],
      ['VW Divisor', `÷ ${cargoCalc.divisor}`],
    ].map(([l, v]) => (
      <div key={l}>
        <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</div>
        <div style={{ fontSize:13, fontWeight:800, color:C.navy, fontFamily:'ui-monospace,monospace' }}>{v}</div>
      </div>
    ))}
    <div style={{ marginLeft:'auto', padding:'5px 12px', background:'#FEF08A', borderRadius:7,
      fontSize:11, fontWeight:700, color:'#92400E' }}>
      CW = MAX(Actual, Volume Weight)
    </div>
  </div>
)}

        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
          
          <FilterSidebar filters={filters} onChange={setFilters} filterOptions={filterOptions} loading={loading}/>
          <div style={{ flex:1, minWidth:0 }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'60px 0', background:C.panel, borderRadius:12, border:`1px solid ${C.border}` }}>
                <div style={{ width:38, height:38, border:`3px solid ${C.border}`, borderTopColor:C.cyan, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
                <p style={{ color:C.textMid, fontSize:13 }}>Searching best rates…</p>
              </div>
            ) : rates.length===0 ? (
              <div style={{ textAlign:'center', padding:'52px 20px', background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, boxShadow:C.shadow }}>
                <div style={{ fontSize:38, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:15, fontWeight:800, color:C.textPrimary, marginBottom:6 }}>No rates found</div>
                <div style={{ fontSize:12.5, color:C.textMid, marginBottom:18 }}>Try adjusting your filters or request a custom rate.</div>
                <button onClick={()=>setMatchModal({})} className="ng-btn-coral" style={{ padding:'9px 24px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Request Custom Rate</button>
              </div>
            ) : (
              <>
                {rates.map(r => (
  mode === 'AIR'
    ? <AirRateCard key={r._id} rate={r} onBook={handleBook} onMatchRates={setMatchModal}/>
    : <RateCard key={r._id||r.id} rate={r}
        onViewDetails={setDetailsModal} onBook={handleBook}
        onMatchRates={setMatchModal} onEmail={setEmailModal}/>
))}
                {pagination.pages>1&&(
                  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:18 }}>
                    <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="ng-btn-sec"
                      style={{ padding:'7px 16px', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:page===1?'not-allowed':'pointer', fontFamily:'inherit', opacity:page===1?0.5:1 }}>← Prev</button>
                    <span style={{ fontSize:12.5, color:C.textMid, padding:'0 4px' }}>Page {page} of {pagination.pages}</span>
                    <button disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)} className="ng-btn-sec"
                      style={{ padding:'7px 16px', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:page>=pagination.pages?'not-allowed':'pointer', fontFamily:'inherit', opacity:page>=pagination.pages?0.5:1 }}>Next →</button>
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
