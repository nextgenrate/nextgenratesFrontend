// ════════════════════════════════════════════════════════════
//  EnquiriesPage.jsx
// ════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import * as api from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
  pending:      { bg:C.amberBg,  color:C.amber, border:C.amberBorder, label:'Pending'      },
  under_review: { bg:C.blueDim,  color:C.blue,  border:'#BFCFFF',     label:'Under Review' },
  responded:    { bg:C.greenBg,  color:C.green, border:C.greenBorder,  label:'Responded'    },
  closed:       { bg:C.panelAlt, color:C.textMuted, border:C.border,   label:'Closed'       },
};
const Pill = ({ status }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span style={{ padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>{s.label}</span>;
};
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' }) : '—';
const iSt = { width:'100%', height:44, padding:'0 13px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13.5, color:C.textPrimary, outline:'none', fontFamily:'inherit', background:C.inputBg, boxSizing:'border-box', transition:'border-color 0.15s' };
const sSt = { ...iSt, cursor:'pointer', appearance:'none', WebkitAppearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%238FA3C8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:34 };
const Lbl = ({ children, req }) => <label style={{ fontSize:11.5, fontWeight:700, color:C.textMid, display:'block', marginBottom:5 }}>{children}{req&&<span style={{ color:C.red, marginLeft:2 }}>*</span>}</label>;

function NewEnqModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ mode:'SEA-FCL', originPort:'', destinationPort:'', containerType:'40GP', targetRate:'', currency:'USD', cargoWeight:'18000', preferredLiner:'', preferredSailingDate:'', freeDays:'7', notes:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async e => {
    e.preventDefault();
    if (!form.originPort||!form.destinationPort) { setErr('Origin and destination ports are required.'); return; }
    setErr(''); setLoading(true);
    try { await api.createEnquiry(form); onSuccess(); }
    catch(e2) { setErr(e2.message||'Submission failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:20, width:'100%', maxWidth:600, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        {/* Header */}
        <div style={{ padding:'20px 26px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:900, color:C.textPrimary }}>Request Custom Rate</div>
            <div style={{ fontSize:12.5, color:C.textMid, marginTop:2 }}>Fill in your cargo details and we'll respond within 24 hours</div>
          </div>
          <button onClick={onClose} style={{ background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:8, cursor:'pointer', padding:'6px 10px', fontSize:18, color:C.textMid, lineHeight:1 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding:'22px 26px' }}>
          {err&&<div style={{ padding:'11px 14px', background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:9, fontSize:13, color:C.red, marginBottom:16 }}>{err}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14 }}>
            <div><Lbl>Mode</Lbl><select value={form.mode} onChange={set('mode')} style={sSt}>{['SEA-FCL','SEA-LCL','AIR'].map(m=><option key={m}>{m}</option>)}</select></div>
            <div><Lbl req>Origin Port</Lbl><input value={form.originPort} onChange={e=>setForm(f=>({...f,originPort:e.target.value.toUpperCase()}))} placeholder="INNSA" style={{ ...iSt, fontFamily:'ui-monospace,monospace' }}/></div>
            <div><Lbl req>Destination Port</Lbl><input value={form.destinationPort} onChange={e=>setForm(f=>({...f,destinationPort:e.target.value.toUpperCase()}))} placeholder="USEWR" style={{ ...iSt, fontFamily:'ui-monospace,monospace' }}/></div>
            <div><Lbl>Container Type</Lbl><select value={form.containerType} onChange={set('containerType')} style={sSt}>{['20GP','40GP','40HC','45HC','20RE','40RE'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><Lbl>Target Rate</Lbl><input type="number" value={form.targetRate} onChange={set('targetRate')} placeholder="0.00" style={iSt}/></div>
            <div><Lbl>Currency</Lbl><select value={form.currency} onChange={set('currency')} style={sSt}>{['USD','EUR','GBP','AED','INR'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><Lbl>Cargo Weight (KG)</Lbl><input type="number" value={form.cargoWeight} onChange={set('cargoWeight')} style={iSt}/></div>
            <div><Lbl>Preferred Sailing Date</Lbl><input type="date" value={form.preferredSailingDate} onChange={set('preferredSailingDate')} style={iSt}/></div>
            <div><Lbl>Free Days</Lbl><input type="number" value={form.freeDays} onChange={set('freeDays')} style={iSt}/></div>
            <div style={{ gridColumn:'1/-1' }}><Lbl>Preferred Liner</Lbl><input value={form.preferredLiner} onChange={set('preferredLiner')} placeholder="Any liner" style={iSt}/></div>
          </div>
          <div style={{ marginBottom:20 }}>
            <Lbl>Additional Notes</Lbl>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Commodity details, special requirements…" style={{ ...iSt, height:'auto', padding:'10px 13px', resize:'vertical' }}/>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 22px', background:C.panel, color:C.textBody, border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'10px 26px', background:loading?'#CBD5E1':C.btnGrad, color:loading?'#94A3B8':'#fff', border:'none', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:loading?'none':'0 4px 16px rgba(0,194,255,0.28)' }}>
              {loading&&<div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EnqDetailModal({ enq, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,29,94,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel, borderRadius:20, width:'100%', maxWidth:540, boxShadow:C.shadowLg, border:`1px solid ${C.border}` }}>
        <div style={{ padding:'20px 26px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Enquiry Details</div>
            <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace', fontWeight:700, color:C.blue, marginTop:3 }}>{enq.enquiryRef}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Pill status={enq.status}/>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:C.textMuted, lineHeight:1 }}>×</button>
          </div>
        </div>
        <div style={{ padding:'20px 26px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              ['Route',`${enq.originPort} → ${enq.destinationPort}`, true],
              ['Mode', enq.mode],
              ['Container', enq.containerType||'—'],
              ['Target Rate', enq.targetRate?`${enq.currency} ${enq.targetRate}`:'—'],
              ['Cargo Weight', enq.cargoWeight?`${enq.cargoWeight} KG`:'—'],
              ['Preferred Sailing', enq.preferredSailingDate?fmtDate(enq.preferredSailingDate):'—'],
              ['Free Days', enq.freeDays||'—'],
              ['Created', fmtDate(enq.createdAt)],
            ].map(([l,v,mono])=>(
              <div key={l} style={{ padding:'10px 13px', background:C.panelAlt, borderRadius:9, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13.5, fontWeight:600, color:C.textPrimary, fontFamily:mono?'ui-monospace,monospace':'inherit' }}>{v}</div>
              </div>
            ))}
          </div>
          {enq.notes&&<div style={{ padding:'12px 14px', background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Notes</div><div style={{ fontSize:13.5, color:C.textBody, lineHeight:1.6 }}>{enq.notes}</div></div>}
          {enq.adminResponse&&<div style={{ padding:'12px 14px', background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:10 }}><div style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>✓ Admin Response</div><div style={{ fontSize:13.5, color:'#065F46', lineHeight:1.6 }}>{enq.adminResponse}</div></div>}
        </div>
        <div style={{ padding:'14px 26px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 24px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,194,255,0.25)' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function EnquiriesPage() {
  const [enquiries,setEnquiries]=useState([]);
  const [loading,setLoading]   =useState(true);
  const [tab,setTab]            =useState('all');
  const [showNew,setShowNew]    =useState(false);
  const [selected,setSelected]  =useState(null);
  const TABS = ['all','pending','under_review','responded','closed'];

  const load = useCallback(async()=>{
    setLoading(true);
    try { const res=await api.getEnquiries({ status:tab!=='all'?tab:undefined }); setEnquiries(res.data?.enquiries||[]); }
    catch { setEnquiries([]); }
    finally { setLoading(false); }
  },[tab]);
  useEffect(()=>{ load(); },[load]);
  const counts = TABS.reduce((a,t)=>{ a[t]=t==='all'?enquiries.length:enquiries.filter(e=>e.status===t).length; return a; },{});

  return (
    <AppLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ background:C.pageBg, minHeight:'100vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 64px' }}>

          {/* Page header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:900, color:C.textPrimary, marginBottom:4 }}>Rate Enquiries</h1>
              <p style={{ fontSize:13.5, color:C.textMid }}>{enquiries.length} total enquiries · Responses within 24 hours</p>
            </div>
            <button onClick={()=>setShowNew(true)}
              style={{ padding:'11px 24px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Enquiry
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:18, overflow:'hidden', boxShadow:C.shadow }}>
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
              {TABS.map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{ padding:'12px 18px', fontSize:13, fontWeight:tab===t?700:500, color:tab===t?C.textPrimary:C.textMid, background:'transparent', border:'none', borderBottom:tab===t?`2.5px solid ${C.blue}`:'2.5px solid transparent', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                  {t.replace('_',' ').replace(/^\w/,c=>c.toUpperCase())}
                  {counts[t]>0&&<span style={{ fontSize:10.5, fontWeight:800, padding:'1px 8px', borderRadius:99, background:tab===t?C.blueDim:C.panelAlt, color:tab===t?C.blue:C.textMuted }}>{counts[t]}</span>}
                </button>
              ))}
            </div>
            <div style={{ padding:'10px 18px', display:'flex', justifyContent:'flex-end' }}>
              <button onClick={load} style={{ padding:'5px 14px', background:C.panelAlt, color:C.blue, border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>↻ Refresh</button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 0', background:C.panel, borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTopColor:C.cyan, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
              <p style={{ color:C.textMid }}>Loading enquiries…</p>
            </div>
          ) : !enquiries.length ? (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:'72px 24px', textAlign:'center', boxShadow:C.shadow }}>
              <div style={{ width:72, height:72, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>💬</div>
              <h3 style={{ fontSize:18, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>No Enquiries Yet</h3>
              <p style={{ fontSize:14, color:C.textMid, maxWidth:380, margin:'0 auto 24px', lineHeight:1.7 }}>Submit a custom rate request and our team will respond within 24 hours.</p>
              <button onClick={()=>setShowNew(true)} style={{ padding:'11px 28px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>Request Custom Rate</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {enquiries.map(e=>(
                <div key={e._id} onClick={()=>setSelected(e)} className="ng-card-hover"
                  style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:13, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', boxShadow:C.shadow }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:C.blueDim, border:`1px solid ${C.borderMid}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace', fontWeight:700, color:C.textMuted, marginBottom:3 }}>{e.enquiryRef}</div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:C.textPrimary, fontFamily:'ui-monospace,monospace' }}>{e.originPort} → {e.destinationPort} · {e.mode}</div>
                      <div style={{ fontSize:12.5, color:C.textMid, marginTop:2 }}>{e.containerType||'Any'}{e.targetRate?` · Target: ${e.currency} ${e.targetRate}`:''}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    <Pill status={e.status}/>
                    <div style={{ fontSize:11.5, color:C.textMuted }}>{fmtDate(e.createdAt)}</div>
                    {e.adminResponse&&<div style={{ fontSize:11.5, color:C.green, fontWeight:700 }}>✓ Response received</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNew&&<NewEnqModal onClose={()=>setShowNew(false)} onSuccess={()=>{ setShowNew(false); load(); }}/>}
      {selected&&<EnqDetailModal enq={selected} onClose={()=>setSelected(null)}/>}
      <style>{`.ng-card-hover{transition:all 0.18s ease;}.ng-card-hover:hover{box-shadow:0 8px 32px rgba(11,29,94,0.13)!important;transform:translateY(-2px);}`}</style>
    </AppLayout>
  );
}
export default EnquiriesPage;