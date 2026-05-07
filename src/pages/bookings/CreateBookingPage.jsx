import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const CONTAINERS  = ['20GP','40GP','40HC','45HC','20RE','40RE','20OT','40OT','20FR','40FR'];
const CARGO_TYPES = ['FAK','HAZ','REEFER','OOG','BULK','SPECIAL'];
const INCOTERMS   = ['FOB','CIF','EXW','DDP','DAP','CFR','FCA','CIP'];
const fmtDateUS   = d => d?new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'}):'—';

const iStB = { width:'100%', height:44, padding:'0 13px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13.5, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box', transition:'border-color 0.15s' };
const sStB = { ...iStB, cursor:'pointer', appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:34 };

const CardB = ({ title, children }) => (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:16, overflow:'hidden', boxShadow:C.shadow }}>
    <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, background:C.panelAlt }}>
      <div style={{ fontSize:13.5, fontWeight:800, color:C.textPrimary }}>{title}</div>
    </div>
    <div style={{ padding:'20px 22px' }}>{children}</div>
  </div>
);
const GridB = ({ cols=2, children }) => <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:12 }}>{children}</div>;
const FldB  = ({ label, full, req, children }) => (
  <div style={{ gridColumn:full?'1/-1':undefined }}>
    <label style={{ fontSize:11.5, fontWeight:700, color:C.textMid, display:'block', marginBottom:5 }}>
      {label}{req&&<span style={{ color:C.red, marginLeft:2 }}>*</span>}
    </label>
    {children}
  </div>
);

export function CreateBookingPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const { rate, origin, dest, container } = location.state||{};

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    mode: rate?.mode||'SEA-FCL', originPort:origin?.code||rate?.originPort||'',
    destinationPort:dest?.code||rate?.destinationPort||'', shippingLine:rate?.shippingLine||'',
    containerType:container||rate?.containerType||'40GP', cargoType:rate?.cargoType||'FAK',
    commodity:'', hsCode:'', incoterms:'FOB',
    sailingDate:rate?.sailingDate?new Date(rate.sailingDate).toISOString().slice(0,10):'',
    totalAmount:rate?.totalUsd||rate?.freightRateUsd||'', currency:'USD', customerNotes:'',
    pickupAddress:{   company:user?.company?.name||'', contact:user?.name||'', email:user?.officialEmail||user?.email||'', phone:user?.phone||'', street:'', city:'', country:'', postalCode:'' },
    deliveryAddress:{ company:'', contact:'', email:'', phone:'', street:'', city:'', country:'', postalCode:'' },
  });
  const set    = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const setAddr= (w,k) => e => setForm(f=>({...f,[w]:{...f[w],[k]:e.target.value}}));

  const submit = async() => {
    setError(''); setLoading(true);
    try {
      const res = await api.createBooking({ ...form, rate:rate?._id, rateSnapshot:rate });
      setSuccess(res.data?.booking||{ bookingRef:'NGR-'+Date.now().toString(36).toUpperCase() });
      setStep(3);
    } catch(err) { setError(err.message||'Submission failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const ADDR = [['Company Name','company'],['Contact Person','contact'],['Email','email'],['Phone','phone'],['Street Address','street'],['City','city'],['Country','country'],['Postal Code','postalCode']];

  // ── Success ──
  if (step===3&&success) return (
    <AppLayout>
      <div style={{ maxWidth:580, margin:'60px auto', padding:'0 28px' }}>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:20, padding:'52px 36px', textAlign:'center', boxShadow:C.shadowLg }}>
          <div style={{ width:80, height:80, background:'linear-gradient(135deg,#059669,#0CC77B)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', boxShadow:'0 8px 28px rgba(5,150,105,0.3)' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.textPrimary, marginBottom:8 }}>Booking Submitted!</h2>
          <div style={{ fontFamily:'ui-monospace,monospace', fontWeight:900, fontSize:16, color:C.blue, marginBottom:14, padding:'6px 16px', background:C.blueDim, borderRadius:8, display:'inline-block' }}>{success.bookingRef}</div>
          <p style={{ fontSize:14, color:C.textBody, lineHeight:1.7, marginBottom:26 }}>Your booking request has been received. Our team will review and confirm within <strong>24–48 business hours</strong>.</p>
          <div style={{ padding:'16px 18px', background:C.amberBg, border:`1px solid ${C.amberBorder}`, borderRadius:12, marginBottom:28, textAlign:'left' }}>
            {[['Route',`${form.originPort} → ${form.destinationPort}`],['Mode',form.mode],['Container',form.containerType],['Sailing',fmtDateUS(form.sailingDate)]].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid #FDE68A' }}>
                <span style={{ color:'#78350F', fontWeight:600 }}>{l}</span>
                <span style={{ color:C.textPrimary, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={()=>navigate('/bookings')} style={{ padding:'11px 24px', background:C.panel, color:C.textBody, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>View Bookings</button>
            <button onClick={()=>navigate('/rate-search')} style={{ padding:'11px 24px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,194,255,0.28)' }}>Search More Rates</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ background:C.pageBg, minHeight:'100vh' }}>
        <div style={{ maxWidth:840, margin:'0 auto', padding:'32px 28px 64px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
            <button onClick={()=>navigate(-1)} style={{ background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:9, cursor:'pointer', padding:'8px 16px', fontSize:13.5, fontWeight:600, color:C.textBody, fontFamily:'inherit', transition:'all 0.15s' }}>← Back</button>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, color:C.textPrimary, lineHeight:1 }}>Create Booking</h1>
              <p style={{ fontSize:12.5, color:C.textMid, marginTop:3 }}>{rate?`${rate.shippingLine} · ${rate.originPort} → ${rate.destinationPort}`:'New booking request'}</p>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:26 }}>
            {[['Shipment Details',1],['Address Details',2]].map(([label,s],i)=>(
              <React.Fragment key={s}>
                {i>0&&<div style={{ flex:1, height:2.5, background:step>i?C.blue:C.border, borderRadius:2, transition:'background 0.3s' }}/>}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13.5, background:step>=s?C.btnGrad:C.panel, color:step>=s?'#fff':C.textMuted, border:`2px solid ${step>=s?'transparent':C.border}`, boxShadow:step>=s?'0 4px 14px rgba(0,194,255,0.3)':'none', transition:'all 0.3s' }}>
                    {step>s?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>:s}
                  </div>
                  <div style={{ fontSize:11.5, fontWeight:600, color:step>=s?C.blue:C.textMuted, whiteSpace:'nowrap' }}>{label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Rate summary */}
          {rate&&(
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:C.shadow }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11.5, fontWeight:900 }}>{(rate.shippingLineCode||rate.shippingLine||'?').slice(0,4)}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{rate.shippingLine}</div>
                  <div style={{ fontSize:12, color:C.textMid, fontFamily:'ui-monospace,monospace' }}>{rate.originPort} → {rate.destinationPort} · {rate.containerType} · {rate.transitTimeDays}d transit</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10.5, color:C.textMuted, fontWeight:600, textTransform:'uppercase' }}>Total Rate</div>
                <div style={{ fontSize:20, fontWeight:900, color:C.textPrimary, fontFamily:'ui-monospace,monospace' }}>USD {(rate.totalUsd||rate.freightRateUsd||0).toLocaleString('en-US',{minimumFractionDigits:2})}</div>
              </div>
            </div>
          )}

          {error&&<div style={{ padding:'13px 16px', background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:10, fontSize:13.5, color:C.red, marginBottom:18 }}>{error}</div>}

          {/* Step 1 */}
          {step===1&&(
            <>
              <CardB title="Shipment Information">
                <GridB>
                  <FldB label="Shipping Mode"><select value={form.mode} onChange={set('mode')} style={sStB}>{['SEA-FCL','SEA-LCL','AIR'].map(m=><option key={m}>{m}</option>)}</select></FldB>
                  <FldB label="Container Type"><select value={form.containerType} onChange={set('containerType')} style={sStB}>{CONTAINERS.map(c=><option key={c}>{c}</option>)}</select></FldB>
                  <FldB label="Origin Port" req><input value={form.originPort} onChange={e=>setForm(f=>({...f,originPort:e.target.value.toUpperCase()}))} placeholder="INNSA" style={{ ...iStB, fontFamily:'ui-monospace,monospace' }}/></FldB>
                  <FldB label="Destination Port" req><input value={form.destinationPort} onChange={e=>setForm(f=>({...f,destinationPort:e.target.value.toUpperCase()}))} placeholder="USEWR" style={{ ...iStB, fontFamily:'ui-monospace,monospace' }}/></FldB>
                  <FldB label="Shipping Line"><input value={form.shippingLine} onChange={set('shippingLine')} placeholder="Maersk, Hapag-Lloyd…" style={iStB}/></FldB>
                  <FldB label="Preferred Sailing Date"><input type="date" value={form.sailingDate} onChange={set('sailingDate')} style={iStB}/></FldB>
                  <FldB label="Cargo Type"><select value={form.cargoType} onChange={set('cargoType')} style={sStB}>{CARGO_TYPES.map(c=><option key={c}>{c}</option>)}</select></FldB>
                  <FldB label="Incoterms"><select value={form.incoterms} onChange={set('incoterms')} style={sStB}>{INCOTERMS.map(i=><option key={i}>{i}</option>)}</select></FldB>
                  <FldB label="Commodity" full><input value={form.commodity} onChange={set('commodity')} placeholder="e.g. Auto Parts, Textiles, Electronics" style={iStB}/></FldB>
                  <FldB label="HS Code"><input value={form.hsCode} onChange={set('hsCode')} placeholder="e.g. 8703.10" style={{ ...iStB, fontFamily:'ui-monospace,monospace' }}/></FldB>
                  <FldB label="Estimated Amount (USD)"><input type="number" value={form.totalAmount} onChange={set('totalAmount')} placeholder="0.00" style={{ ...iStB, fontFamily:'ui-monospace,monospace' }}/></FldB>
                  <FldB label="Notes / Special Requirements" full><textarea value={form.customerNotes} onChange={set('customerNotes')} rows={3} placeholder="Hazardous goods details, packing instructions…" style={{ ...iStB, height:'auto', padding:'10px 13px', resize:'vertical' }}/></FldB>
                </GridB>
              </CardB>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={()=>setStep(2)} style={{ padding:'12px 30px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,194,255,0.28)' }}>Continue to Address Details →</button>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step===2&&(
            <>
              <CardB title="Pickup / Origin Address">
                <GridB>
                  {ADDR.map(([l,k])=>(
                    <FldB key={k} label={l} full={k==='street'}>
                      <input value={form.pickupAddress[k]} onChange={setAddr('pickupAddress',k)} placeholder={l} style={iStB}/>
                    </FldB>
                  ))}
                </GridB>
              </CardB>
              <CardB title="Delivery / Destination Address">
                <GridB>
                  {ADDR.map(([l,k])=>(
                    <FldB key={k} label={l} full={k==='street'}>
                      <input value={form.deliveryAddress[k]} onChange={setAddr('deliveryAddress',k)} placeholder={l} style={iStB}/>
                    </FldB>
                  ))}
                </GridB>
              </CardB>
              <div style={{ display:'flex', gap:12, justifyContent:'space-between' }}>
                <button onClick={()=>setStep(1)} style={{ padding:'12px 26px', background:C.panel, color:C.textBody, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                <button onClick={submit} disabled={loading} style={{ padding:'12px 34px', background:loading?'#CBD5E1':C.btnGrad, color:loading?'#94A3B8':'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:10, boxShadow:loading?'none':'0 4px 14px rgba(0,194,255,0.28)' }}>
                  {loading&&<div style={{ width:18, height:18, border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>}
                  {loading?'Submitting…':'Submit Booking Request'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


export default CreateBookingPage;