import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const B = {
  navy:'#0D1B5E', blue:'#1A3CC8', blueVib:'#1E50FF', accent:'#00C2FF',
  white:'#FFFFFF', offWhite:'#F0F4FF', border:'#D4DCFF',
  text:'#0D1535', textSub:'#3A4A7A', textMuted:'#7B8EC0',
  red:'#D91A1A', redBg:'#FFF1F0', green:'#0A8A56', greenBg:'#EDFBF4',
  amber:'#C47B00', amberBg:'#FFF8E6',
  shadow:'0 2px 16px rgba(13,27,94,.08)', shadowLg:'0 8px 32px rgba(13,27,94,.14)',
};

const TABS = ['Account','KYC Status','Bookings','Enquiries','Settings'];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const StatusPill = ({ status }) => {
  const map = {
    pending:       { bg:'#FFF8E6', color:B.amber,  border:'#FDE68A',  label:'Pending' },
    pending_approval:{ bg:'#FFF8E6', color:B.amber, border:'#FDE68A', label:'Pending Review' },
    under_review:  { bg:B.offWhite, color:B.blue,  border:B.border,   label:'Under Review' },
    approved:      { bg:B.greenBg,  color:B.green, border:'#8AEBC4',  label:'Approved' },
    confirmed:     { bg:B.greenBg,  color:B.green, border:'#8AEBC4',  label:'Confirmed' },
    rejected:      { bg:B.redBg,    color:B.red,   border:'#FFCCC7',  label:'Rejected' },
    cancelled:     { bg:B.redBg,    color:B.red,   border:'#FFCCC7',  label:'Cancelled' },
    not_submitted: { bg:B.offWhite, color:B.textMuted, border:B.border, label:'Not Submitted' },
    active:        { bg:B.greenBg,  color:B.green, border:'#8AEBC4',  label:'Active' },
  };
  const s = map[status] || map.not_submitted;
  return <span style={{ padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{s.label}</span>;
};

const Card = ({ children, style={} }) => (
  <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:14, boxShadow:B.shadow, ...style }}>
    {children}
  </div>
);

const inp = { width:'100%', height:44, padding:'0 12px', border:`1.5px solid ${B.border}`, borderRadius:9, fontSize:13, color:B.text, outline:'none', fontFamily:'inherit', background:B.white, boxSizing:'border-box' };

export default function ProfilePage() {
  const { user, changePassword, kycStatus } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState(tab ? TABS.find(t => t.toLowerCase().replace(' ','-') === tab) || 'Account' : 'Account');
  const [bookings,  setBookings]  = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [kycData,   setKycData]   = useState(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (active === 'Bookings') {
      setLoading(true);
      api.getBookings().then(r => setBookings(r.data?.bookings || [])).catch(()=>{}).finally(()=>setLoading(false));
    }
    if (active === 'Enquiries') {
      setLoading(true);
      api.getEnquiries().then(r => setEnquiries(r.data?.enquiries || [])).catch(()=>{}).finally(()=>setLoading(false));
    }
    if (active === 'KYC Status') {
      setLoading(true);
      api.getKycStatus().then(r => setKycData(r.kyc)).catch(()=>{}).finally(()=>setLoading(false));
    }
  }, [active]);

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ background:B.white, borderBottom:`1px solid ${B.border}` }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg,${B.navy},${B.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 4px 14px rgba(26,60,200,.3)' }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontSize:20, fontWeight:900, color:B.text, marginBottom:3, fontFamily:"'Outfit',sans-serif" }}>{user?.name}</h1>
              <div style={{ fontSize:13, color:B.textMuted }}>{user?.officialEmail || user?.email}</div>
              {user?.company?.name && <div style={{ fontSize:13, color:B.textSub, marginTop:2, fontWeight:600 }}>{user.company.name} · {user.company.country}</div>}
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <StatusPill status={kycStatus}/>
                {kycStatus !== 'approved' && (
                  <button onClick={()=>navigate('/kyc')} style={{ fontSize:11, color:B.blue, background:B.offWhite, border:`1px solid ${B.border}`, borderRadius:7, padding:'3px 11px', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                    {kycStatus==='not_submitted'?'Complete KYC →':'View KYC →'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={()=>setActive(t)} style={{ padding:'11px 18px', fontSize:13, fontWeight:active===t?800:500, color:active===t?B.text:B.textMuted, background:'transparent', border:'none', borderBottom:active===t?`2.5px solid ${B.blue}`:'2.5px solid transparent', cursor:'pointer', fontFamily:'inherit', marginBottom:-1, whiteSpace:'nowrap', transition:'all .15s' }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 24px 60px' }}>
        {/* KYC action banner - shown prominently when not yet approved */}
        {kycStatus !== 'approved' && active !== 'KYC Status' && (
          <div style={{ marginBottom:20, padding:'14px 20px', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
            background: kycStatus==='not_submitted'?'#EEF3FF':kycStatus==='pending'?'#FFF8E6':'#FFF1F0',
            border: `1px solid ${kycStatus==='not_submitted'?B.border:kycStatus==='pending'?'#FDE68A':'#FFCCC7'}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:26 }}>{kycStatus==='not_submitted'?'📋':kycStatus==='pending'?'⏳':'❌'}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:kycStatus==='not_submitted'?B.blue:kycStatus==='pending'?B.amber:B.red }}>
                  {kycStatus==='not_submitted'?'KYC Verification Required':kycStatus==='pending'?'KYC Verification Pending':'KYC Action Required'}
                </div>
                <div style={{ fontSize:12, color:B.textSub, marginTop:2 }}>
                  {kycStatus==='not_submitted'?'Upload your KYC documents to unlock rate search, bookings and enquiries.':
                   kycStatus==='pending'?"Your documents are under review. You'll be notified within 48 hours.":
                   'Your KYC was rejected. Please re-upload your documents.'}
                </div>
              </div>
            </div>
            <button onClick={()=>navigate('/kyc')} style={{ padding:'9px 22px', background:`linear-gradient(135deg,${B.blue},${B.blueVib})`, color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 2px 10px rgba(26,60,200,.28)', flexShrink:0 }}>
              {kycStatus==='not_submitted'?'Complete KYC →':'View KYC →'}
            </button>
          </div>
        )}

        {active==='Account'    && <AccountTab user={user} Card={Card} inp={inp} B={B}/>}
        {active==='KYC Status' && <KYCTab kycData={kycData} kycStatus={kycStatus} loading={loading} navigate={navigate} Card={Card} user={user} B={B}/>}
        {active==='Bookings'   && <BookingsTab bookings={bookings} loading={loading} Card={Card} B={B}/>}
        {active==='Enquiries'  && <EnquiriesTab enquiries={enquiries} loading={loading} Card={Card} B={B}/>}
        {active==='Settings'   && <SettingsTab changePassword={changePassword} Card={Card} inp={inp} B={B}/>}
      </div>
    </AppLayout>
  );
}

function AccountTab({ user, Card, inp, B }) {
  const [form, setForm] = useState({ name:user?.name||'', email:user?.officialEmail||user?.email||'', phone:user?.phone||'', companyName:user?.company?.name||'' });
  const [saved, setSaved] = useState(false);
  const s = k => e => setForm(f=>({...f,[k]:e.target.value}));
  return (
    <Card style={{ padding:24 }}>
      <div style={{ fontSize:15, fontWeight:800, color:B.text, marginBottom:18, fontFamily:"'Outfit',sans-serif" }}>Personal Information</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {[['Full Name','name','text','Your full name'],['Official Email','email','email','name@company.com'],['Mobile Number','phone','tel','+91 98765 43210'],['Company Name','companyName','text','Your company']].map(([l,k,t,ph])=>(
          <div key={k}>
            <label style={{ fontSize:12, fontWeight:700, color:B.textSub, display:'block', marginBottom:5 }}>{l}</label>
            <input type={t} value={form[k]} onChange={s(k)} placeholder={ph} style={inp}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12 }}>
        {saved && <span style={{ fontSize:13, color:B.green, fontWeight:600 }}>✓ Saved</span>}
        <button onClick={()=>setSaved(true)} style={{ padding:'9px 24px', background:`linear-gradient(135deg,${B.blue},${B.blueVib})`, color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 10px rgba(26,60,200,.28)' }}>Save Changes</button>
      </div>
    </Card>
  );
}

function KYCTab({ kycData, kycStatus, loading, navigate, Card, user, B }) {
  if (loading) return <Card style={{ padding:40, textAlign:'center', color:B.textMuted }}>Loading…</Card>;
  const cfg = {
    approved:         { icon:'✅', title:'KYC Verified',           color:B.green,  bg:B.greenBg, border:'#8AEBC4' },
    pending:          { icon:'⏳', title:'Verification Pending',    color:B.amber,  bg:B.amberBg, border:'#FDE68A' },
    rejected:         { icon:'❌', title:'Verification Failed',     color:B.red,    bg:B.redBg,   border:'#FFCCC7' },
    resubmit_required:{ icon:'⚠️', title:'Documents Required',     color:B.amber,  bg:B.amberBg, border:'#FDE68A' },
    not_submitted:    { icon:'📋', title:'Not Yet Submitted',       color:B.textMuted, bg:B.offWhite, border:B.border },
  };
  const s = cfg[kycStatus] || cfg.not_submitted;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Card style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:12 }}>
          <div style={{ fontSize:36 }}>{s.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:s.color, marginBottom:4 }}>{s.title}</div>
            {kycStatus==='approved' && <div style={{ fontSize:13, color:'#065F46' }}>Your account is fully verified. All platform features are unlocked.</div>}
            {kycStatus==='pending' && <div style={{ fontSize:13, color:'#78350F' }}>Our team will review your documents within 48 business hours.</div>}
            {(kycStatus==='rejected'||kycStatus==='resubmit_required') && <div style={{ fontSize:13, color:B.red }}>{user?.kyc?.rejectionReason || 'Please re-upload your documents.'}</div>}
            {kycStatus==='not_submitted' && <div style={{ fontSize:13, color:B.textMuted }}>Complete KYC verification to access rate search and booking features.</div>}
          </div>
          {kycStatus !== 'approved' && (
            <button onClick={()=>navigate('/kyc')} style={{ padding:'9px 20px', background:`linear-gradient(135deg,${B.blue},#1E50FF)`, color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {kycStatus==='not_submitted'?'Start KYC':'Resubmit'}
            </button>
          )}
        </div>
        {kycData && (
          <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Submitted',fmtDate(kycData.submittedAt)],['Reviewed',fmtDate(kycData.reviewedAt)],['GST Number',kycData.gstNumber||'—'],['GST Verified',kycData.gstVerified?'✅ Yes':'—']].map(([l,v])=>(
              <div key={l} style={{ padding:'10px 14px', background:B.offWhite, borderRadius:9, border:`1px solid ${B.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:B.textMuted, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {kycData?.documents?.length>0 && (
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:800, color:B.text, marginBottom:14 }}>Uploaded Documents</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {kycData.documents.map((doc,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', border:`1px solid ${B.border}`, borderRadius:9, background:B.offWhite }}>
                <div style={{ fontSize:13, fontWeight:600, color:B.text, flex:1, textTransform:'capitalize' }}>{doc.type?.replace(/_/g,' ')}</div>
                <div style={{ fontSize:11, color:B.textMuted }}>Auto-deletes {fmtDate(doc.scheduledDeleteAt)}</div>
                {doc.viewUrl ? <a href={doc.viewUrl} target="_blank" rel="noreferrer" style={{ fontSize:12, color:B.blue, fontWeight:700 }}>View →</a> : <span style={{ fontSize:11, color:B.textMuted }}>Expired</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BookingsTab({ bookings, loading, Card, B }) {
  if (loading) return <Card style={{ padding:40, textAlign:'center', color:B.textMuted }}>Loading…</Card>;
  if (!bookings.length) return (
    <Card style={{ padding:'56px 24px', textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:14 }}>📦</div>
      <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:6 }}>No bookings yet</div>
      <div style={{ fontSize:13, color:B.textMuted }}>Search freight rates and submit a booking to get started.</div>
    </Card>
  );
  return (
    <Card style={{ overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead><tr style={{ background:B.offWhite }}>
          {['Ref','Route','Mode','Amount','Status','Date'].map(h=>(
            <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:B.textMuted, textTransform:'uppercase', letterSpacing:'.4px', borderBottom:`1px solid ${B.border}` }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {bookings.map((b,i)=>(
            <tr key={b._id} style={{ borderBottom:i<bookings.length-1?`1px solid ${B.border}`:'none' }}>
              <td style={{ padding:'11px 14px', fontFamily:'ui-monospace,monospace', fontSize:11, fontWeight:800, color:B.blue }}>{b.bookingRef}</td>
              <td style={{ padding:'11px 14px', fontWeight:700, fontFamily:'ui-monospace,monospace', fontSize:12 }}>{b.originPort} → {b.destinationPort}</td>
              <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5, background:B.offWhite, color:B.navy }}>{b.mode}</span></td>
              <td style={{ padding:'11px 14px', fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{b.totalAmount?`USD ${Number(b.totalAmount).toLocaleString()}`:'—'}</td>
              <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99, background:b.status==='confirmed'||b.status==='approved'?B.greenBg:B.amberBg, color:b.status==='confirmed'||b.status==='approved'?B.green:B.amber }}>{b.status}</span></td>
              <td style={{ padding:'11px 14px', color:B.textMuted, fontSize:12 }}>{fmtDate(b.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function EnquiriesTab({ enquiries, loading, Card, B }) {
  if (loading) return <Card style={{ padding:40, textAlign:'center', color:B.textMuted }}>Loading…</Card>;
  if (!enquiries.length) return (
    <Card style={{ padding:'56px 24px', textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:14 }}>💬</div>
      <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:6 }}>No enquiries yet</div>
      <div style={{ fontSize:13, color:B.textMuted }}>Submit a custom rate request from the Enquiries page.</div>
    </Card>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {enquiries.map(e=>(
        <Card key={e._id} style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace', fontWeight:700, color:B.textMuted, marginBottom:3 }}>{e.enquiryRef}</div>
            <div style={{ fontSize:14, fontWeight:700, color:B.text, fontFamily:'ui-monospace,monospace' }}>{e.originPort} → {e.destinationPort} · {e.mode}</div>
            {e.targetRate && <div style={{ fontSize:12, color:B.textSub, marginTop:2 }}>Target: {e.currency} {e.targetRate}</div>}
            {e.adminResponse && <div style={{ fontSize:12, color:B.green, marginTop:4, fontWeight:700 }}>✓ Response: {e.adminResponse}</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:B.textMuted }}>{fmtDate(e.createdAt)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SettingsTab({ changePassword, Card, inp, B }) {
  const [pw, setPw] = useState({ current:'', newPw:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handle = async e => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { setErr('Passwords do not match'); return; }
    if (pw.newPw.length < 8) { setErr('Minimum 8 characters'); return; }
    setErr(''); setLoading(true);
    try { await changePassword(pw.current, pw.newPw); setMsg('Password updated successfully'); setPw({ current:'', newPw:'', confirm:'' }); }
    catch(e2) { setErr(e2.message); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{ padding:24 }}>
      <div style={{ fontSize:15, fontWeight:800, color:B.text, marginBottom:18, fontFamily:"'Outfit',sans-serif" }}>Change Password</div>
      {err && <div style={{ padding:'10px 14px', background:B.redBg, border:'1px solid #FFCCC7', borderRadius:9, fontSize:13, color:B.red, marginBottom:14 }}>{err}</div>}
      {msg && <div style={{ padding:'10px 14px', background:B.greenBg, border:'1px solid #8AEBC4', borderRadius:9, fontSize:13, color:B.green, marginBottom:14 }}>{msg}</div>}
      <form onSubmit={handle}>
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:400, marginBottom:18 }}>
          {[['Current Password','current'],['New Password','newPw'],['Confirm New Password','confirm']].map(([l,k])=>(
            <div key={k}>
              <label style={{ fontSize:12, fontWeight:700, color:B.textSub, display:'block', marginBottom:5 }}>{l}</label>
              <input type="password" value={pw[k]} onChange={e=>setPw(p=>({...p,[k]:e.target.value}))} style={inp}/>
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} style={{ padding:'9px 22px', background:`linear-gradient(135deg,${B.blue},#1E50FF)`, color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:'0 2px 10px rgba(26,60,200,.28)' }}>
          {loading?'Updating…':'Update Password'}
        </button>
      </form>
    </Card>
  );
}
