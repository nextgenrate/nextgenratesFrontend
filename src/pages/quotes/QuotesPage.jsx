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
export function QuotesPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div style={{ background:C.pageBg, minHeight:'100vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 64px' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:900, color:C.textPrimary, marginBottom:4 }}>Quotes</h1>
              <p style={{ fontSize:13.5, color:C.textMid }}>Manage and track your approved rate quotes</p>
            </div>
            <button onClick={()=>navigate('/rate-search')}
              style={{ padding:'11px 24px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
              Search Rates
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { label:'Total Quotes', value:'0', color:C.blue, bg:C.blueDim, icon:'📋' },
              { label:'Active',       value:'0', color:C.green, bg:C.greenBg, icon:'✅' },
              { label:'Pending',      value:'0', color:C.amber, bg:C.amberBg, icon:'⏳' },
              { label:'Expired',      value:'0', color:C.textMuted, bg:C.panelAlt, icon:'📁' },
            ].map(s=>(
              <div key={s.label} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:13, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, boxShadow:C.shadow }}>
                <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1.1 }}>{s.value}</div>
                  <div style={{ fontSize:12, color:C.textMid, fontWeight:500, marginTop:2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:'80px 24px', textAlign:'center', boxShadow:C.shadow }}>
            <div style={{ width:80, height:80, background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', fontSize:36 }}>💬</div>
            <h3 style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginBottom:10 }}>No Quotes Yet</h3>
            <p style={{ fontSize:14, color:C.textMid, maxWidth:400, margin:'0 auto 26px', lineHeight:1.7 }}>
              Approved quotes from your enquiries will appear here. Search rates and submit an enquiry to get started.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button onClick={()=>navigate('/enquiries')}
                style={{ padding:'11px 26px', background:C.panel, color:C.textBody, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; e.currentTarget.style.background=C.blueDim; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textBody; e.currentTarget.style.background=C.panel; }}>
                Go to Enquiries
              </button>
              <button onClick={()=>navigate('/rate-search')}
                style={{ padding:'11px 26px', background:C.btnGrad, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(0,194,255,0.28)' }}>
                Search Rates
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default QuotesPage;