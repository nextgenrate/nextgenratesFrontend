import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const T = {
  ink: '#0D1535', inkSub: '#3A4A7A', inkMuted: '#7B8EC0',
  ocean: '#1A3CC8', oceanLight: '#EEF3FF',
  coral: '#1A3CC8', coralLight: '#EEF3FF',
  jade: '#0A8A56', jadeLight: '#EDFBF4',
  gold: '#C47B00', goldLight: '#FFF8E6',
  surface: '#F0F4FF', border: '#D4DCFF', white: '#fff',
  red: '#D91A1A', redLight: '#FFF1F0',
  green: '#0A8A56', greenLight: '#EDFBF4',
};

// ─── Country-based KYC configuration ─────────────────────────
const KYC_CONFIGS = {
  IN: {
    country: 'India', flag: '🇮🇳',
    fields: [
      { key: 'panNumber', label: 'PAN Number', placeholder: 'ABCDE1234F', maxLength: 10, pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', required: true, hint: '10-character Permanent Account Number' },
      { key: 'aadhaarNumber', label: 'Aadhaar Number', placeholder: '1234 5678 9012', maxLength: 12, required: true, hint: '12-digit Aadhaar card number', type: 'aadhaar' },
    ],
    documents: [
      { key: 'aadhaar', label: 'Aadhaar Card', desc: 'Front & back scan/photo', required: true },
      { key: 'pan', label: 'PAN Card', desc: 'Clear photo or scan', required: true },
      { key: 'gst', label: 'GST Certificate', desc: 'GSTIN registration cert', required: false },
      { key: 'business_reg', label: 'Business Registration', desc: 'Incorporation certificate', required: false },
      { key: 'address_proof', label: 'Address Proof', desc: 'Utility bill / rental agreement', required: false },
    ],
    showGst: true,
  },
  AE: {
    country: 'UAE', flag: '🇦🇪',
    fields: [
      { key: 'nationalId', label: 'Emirates ID Number', placeholder: '784-YYYY-XXXXXXX-X', required: true, hint: 'Emirates National ID card number' },
      { key: 'taxId', label: 'TRN / VAT Number', placeholder: '100XXXXXXXXXXX3', required: false, hint: '15-digit Tax Registration Number' },
    ],
    documents: [
      { key: 'national_id', label: 'Emirates ID', desc: 'Front & back of Emirates ID', required: true },
      { key: 'trade_license', label: 'Trade License', desc: 'Current year trade license', required: true },
      { key: 'business_reg', label: 'MOA / Company Documents', desc: 'Memorandum of association', required: false },
      { key: 'address_proof', label: 'Address Proof', desc: 'Utility bill or tenancy contract', required: false },
    ],
    showGst: false,
  },
  US: {
    country: 'USA', flag: '🇺🇸',
    fields: [
      { key: 'taxId', label: 'EIN / Federal Tax ID', placeholder: 'XX-XXXXXXX', required: true, hint: '9-digit Employer Identification Number' },
      { key: 'nationalId', label: 'D-U-N-S Number (optional)', placeholder: 'XXXXXXXXX', required: false, hint: 'Dun & Bradstreet 9-digit number' },
    ],
    documents: [
      { key: 'business_reg', label: 'Business Registration', desc: 'Articles of Incorporation / LLC docs', required: true },
      { key: 'address_proof', label: 'Proof of Business Address', desc: 'Utility bill or lease', required: true },
      { key: 'other', label: 'Other Documentation', desc: 'Any supporting business docs', required: false },
    ],
    showGst: false,
  },
  GB: {
    country: 'United Kingdom', flag: '🇬🇧',
    fields: [
      { key: 'taxId', label: 'UK VAT Number', placeholder: 'GB 000 0000 00', required: false, hint: 'Value Added Tax registration number' },
      { key: 'nationalId', label: 'Companies House Number', placeholder: '12345678', required: true, hint: '8-digit company registration number' },
    ],
    documents: [
      { key: 'business_reg', label: 'Certificate of Incorporation', desc: 'From Companies House', required: true },
      { key: 'address_proof', label: 'Proof of Registered Address', desc: 'Recent utility bill or bank statement', required: true },
      { key: 'other', label: 'Other Documents', desc: 'Any additional relevant docs', required: false },
    ],
    showGst: false,
  },
  SG: {
    country: 'Singapore', flag: '🇸🇬',
    fields: [
      { key: 'taxId', label: 'GST Registration Number', placeholder: 'M90000000A', required: false, hint: 'Singapore GST registration' },
      { key: 'nationalId', label: 'UEN (Unique Entity Number)', placeholder: '200312345A', required: true, hint: 'Business registration with ACRA' },
    ],
    documents: [
      { key: 'business_reg', label: 'ACRA Business Profile', desc: 'From BizFile portal', required: true },
      { key: 'address_proof', label: 'Proof of Business Address', desc: 'Utility or tenancy agreement', required: true },
      { key: 'other', label: 'Other Documents', desc: 'Any additional docs', required: false },
    ],
    showGst: false,
  },
  DEFAULT: {
    country: 'Other', flag: '🌐',
    fields: [
      { key: 'nationalId', label: 'National ID / Passport Number', required: true, hint: 'Primary government identification number' },
      { key: 'taxId', label: 'Tax ID / VAT Number', required: false, hint: 'Local tax identification number' },
    ],
    documents: [
      { key: 'national_id', label: 'Government ID / Passport', desc: 'Clear photo of valid ID', required: true },
      { key: 'business_reg', label: 'Business Registration', desc: 'Local company registration', required: true },
      { key: 'address_proof', label: 'Address Proof', desc: 'Recent utility bill or bank statement', required: false },
      { key: 'other', label: 'Other Documents', desc: 'Any additional supporting documents', required: false },
    ],
    showGst: false,
  },
};

const COUNTRY_LIST = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'OTHER', name: 'Other Country', flag: '🌐' },
];

// ─── File upload zone ─────────────────────────────────────────
function UploadZone({ doc, file, onChange, disabled }) {
  const ref = useRef();
  return (
    <div style={{ border: `2px dashed ${file ? T.green : T.border}`, borderRadius: 10, padding: '12px 14px', background: file ? T.greenLight : T.surface, transition: 'all 0.2s', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: file ? T.greenLight : T.white, border: `1px solid ${file ? '#BBF7D0' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {file
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{doc.label} {doc.required && <span style={{ color: T.coral }}>*</span>}</div>
          <div style={{ fontSize: 11, color: file ? T.green : T.inkMuted, marginTop: 1 }}>{file ? file.name : doc.desc}</div>
        </div>
        {file
          ? <button onClick={() => !disabled && onChange(null)} disabled={disabled} style={{ fontSize: 11, color: T.coral, background: T.coralLight, border: `1px solid ${T.coral}40`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>Remove</button>
          : <button onClick={() => !disabled && ref.current.click()} disabled={disabled} style={{ fontSize: 12, color: T.ocean, background: T.oceanLight, border: `1px solid ${T.ocean}30`, borderRadius: 7, padding: '6px 14px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>Choose file</button>}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => onChange(e.target.files[0] || null)} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function KycPage() {
  const navigate = useNavigate();
  const { user, uploadKyc, verifyGst, kycStatus, refreshUser } = useAuth();

  const [step, setStep] = useState(1); // 1=select country, 2=details, 3=docs, 4=done
  const [countryCode, setCountryCode] = useState('IN');
  const [gstInput, setGstInput] = useState('');
  const [gstResult, setGstResult] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [files, setFiles] = useState({});
  const [form, setForm] = useState({
    companyName: user?.company?.name || '',
    companyAddress: user?.company?.address || '',
    companyCity: user?.company?.city || '',
    companyCountry: '',
    companyPincode: user?.company?.pincode || '',
    gstNumber: '',
    panNumber: '', aadhaarNumber: '',
    nationalId: '', taxId: '',
    phoneCountryCode: user?.phoneCountryCode || '+91',
    phone: user?.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (kycStatus === 'approved') navigate('/rate-search'); }, [kycStatus, navigate]);

  const cfg = KYC_CONFIGS[countryCode] || KYC_CONFIGS.DEFAULT;
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const inp = { padding: '9px 12px', border: `1.5px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.ink, outline: 'none', fontFamily: 'inherit', width: '100%', background: T.white };

  const handleGstVerify = async () => {
    if (!gstInput.trim()) return;
    setGstLoading(true); setGstResult(null);
    try {
      const res = await verifyGst(gstInput.trim().toUpperCase());
      setGstResult({ success: true, ...res });
      setForm(f => ({ ...f, gstNumber: gstInput.trim().toUpperCase(), companyName: res.gstDetails?.legalName || f.companyName }));
    } catch (err) { setGstResult({ success: false, error: err.message }); }
    finally { setGstLoading(false); }
  };

  const handleSubmit = async () => {
    const missingRequired = cfg.documents.filter(d => d.required && !files[d.key]);
    if (missingRequired.length > 0) { setError(`Required: ${missingRequired.map(d => d.label).join(', ')}`); return; }
    if (!form.companyName) { setError('Company name is required'); return; }
    const missingFields = cfg.fields.filter(f => f.required && !form[f.key]);
    if (missingFields.length > 0) { setError(`Required fields missing: ${missingFields.map(f => f.label).join(', ')}`); return; }

    setError(''); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      ['companyName','companyAddress','companyCity','companyCountry','companyPincode','gstNumber','panNumber','aadhaarNumber','nationalId','taxId'].forEach(k => fd.append(k, form[k] || ''));
      fd.append('country', countryCode);
      await uploadKyc(fd);
      setStep(4);
    } catch (err) { setError(err.message || 'Upload failed. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // Status screens
  if (kycStatus === 'pending') return (
    <AppLayout><div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(13,27,94,0.08)' }}>
        <div style={{ width:72, height:72, background:'#FFF8E6', border:'1px solid #FDE68A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:36 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 8, fontFamily:"'Outfit',sans-serif" }}>KYC Verification Pending</h2>
        <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.7, marginBottom: 16 }}>Your documents have been submitted and are under review. Our team will verify within <strong>48 business hours</strong>.</p>
        <div style={{ padding:'12px 16px', background:'#FFF8E6', border:'1px solid #FDE68A', borderRadius:10, marginBottom:24, textAlign:'left', fontSize:12, color:'#78350F', lineHeight:1.6 }}>
          You will receive an email once your KYC is approved. After approval, you'll have full access to rate search, bookings, and enquiries.
        </div>
        <button onClick={() => navigate('/profile')} style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#1A3CC8,#1E50FF)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow:'0 3px 12px rgba(26,60,200,.28)' }}>View Profile</button>
      </div>
    </div></AppLayout>
  );

  if (kycStatus === 'rejected' || kycStatus === 'resubmit_required') {
    const reason = user?.kyc?.rejectionReason || 'Please re-upload correct documents.';
    // Allow resubmission — fall through to the form
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 38, height: 38, background: T.ocean, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T.ink, lineHeight: 1 }}>KYC Verification</h1>
              <p style={{ fontSize: 13, color: T.inkMuted, marginTop: 2 }}>Complete to unlock rate search &amp; bookings</p>
            </div>
          </div>
          {(kycStatus === 'rejected' || kycStatus === 'resubmit_required') && (
            <div style={{ padding: '12px 16px', background: T.redLight, border: '1px solid #FECACA', borderRadius: 10, marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 3 }}>❌ Action Required</div>
              <div style={{ fontSize: 13, color: '#7F1D1D' }}>{user?.kyc?.rejectionReason || 'Your previous submission was not approved. Please re-upload.'}</div>
            </div>
          )}
        </div>

        {/* Step bar */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
            {[['Country', 1], ['Details', 2], ['Documents', 3]].map(([label, s], i) => (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: step > i ? T.ocean : T.border, transition: 'background 0.3s' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, transition: 'all 0.3s', background: step >= s ? T.ocean : T.white, color: step >= s ? '#fff' : T.inkMuted, border: `2px solid ${step >= s ? T.ocean : T.border}` }}>
                    {step > s ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : s}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: step >= s ? T.ocean : T.inkMuted }}>{label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Step 1: Country ── */}
        {step === 1 && (
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Select Your Country</div>
            <div style={{ fontSize: 13, color: T.inkMuted, marginBottom: 20, lineHeight: 1.6 }}>KYC requirements vary by country. We'll show the correct documents and fields for your location.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
              {COUNTRY_LIST.map(c => (
                <button key={c.code} onClick={() => setCountryCode(c.code === 'OTHER' ? 'DEFAULT' : c.code)} style={{
                  padding: '14px 16px', borderRadius: 10, border: `2px solid ${(c.code === 'OTHER' ? countryCode === 'DEFAULT' : countryCode === c.code) ? T.ocean : T.border}`,
                  background: (c.code === 'OTHER' ? countryCode === 'DEFAULT' : countryCode === c.code) ? T.oceanLight : T.surface,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 22 }}>{c.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: (c.code === 'OTHER' ? countryCode === 'DEFAULT' : countryCode === c.code) ? T.ocean : T.ink }}>{c.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '13px', background: T.ocean, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Continue with {cfg.flag} {cfg.country} →
            </button>
          </div>
        )}

        {/* ── Step 2: Company + ID fields ── */}
        {step === 2 && (
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px' }}>
            {/* GST / Tax verify (India only) */}
            {cfg.showGst && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
                  GST Verification <span style={{ fontSize: 12, fontWeight: 400, color: T.inkMuted }}>(optional — auto-fills company details)</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={gstInput} onChange={e => setGstInput(e.target.value.toUpperCase())} placeholder="e.g. 29ABCDE1234F1Z5" maxLength={15} style={{ ...inp, flex: 1, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.5px' }} />
                  <button onClick={handleGstVerify} disabled={gstLoading || !gstInput} style={{ padding: '9px 18px', background: gstInput ? T.ocean : '#CBD5E1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: gstInput ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    {gstLoading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                    Verify GST
                  </button>
                </div>
                {gstResult && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: gstResult.success ? T.greenLight : T.redLight, borderRadius: 8, border: `1px solid ${gstResult.success ? '#BBF7D0' : '#FECACA'}`, fontSize: 12 }}>
                    {gstResult.success ? <><span style={{ fontWeight: 700, color: T.green }}>✓ GST Verified</span>{gstResult.gstDetails && <span style={{ color: '#065F46', marginLeft: 8 }}>{gstResult.gstDetails.legalName} · {gstResult.gstDetails.state}</span>}</> : <span style={{ color: T.red }}>{gstResult.error}</span>}
                  </div>
                )}
                <div style={{ height: 1, background: T.border, margin: '20px 0' }} />
              </div>
            )}

            {/* Company details */}
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Company Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>Company Name *</label>
                <input value={form.companyName} onChange={set('companyName')} placeholder="Your company name" style={inp} />
              </div>
              {cfg.fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>{f.label} {f.required && '*'}</label>
                  <input value={form[f.key] || ''} onChange={set(f.key)} placeholder={f.placeholder || ''} maxLength={f.maxLength} style={{ ...inp, fontFamily: f.type === 'aadhaar' || f.key === 'panNumber' || f.key === 'nationalId' ? 'ui-monospace, monospace' : 'inherit', textTransform: f.key === 'panNumber' ? 'uppercase' : 'none' }} />
                  {f.hint && <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 3 }}>{f.hint}</div>}
                </div>
              ))}
              {cfg.showGst && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>GST Number</label>
                  <input value={form.gstNumber} onChange={set('gstNumber')} placeholder="Auto-filled after GST verify" style={{ ...inp, fontFamily: 'ui-monospace, monospace' }} />
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>Registered Address</label>
                <input value={form.companyAddress} onChange={set('companyAddress')} placeholder="Street address" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>City</label>
                <input value={form.companyCity} onChange={set('companyCity')} placeholder="City" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: 'block', marginBottom: 5 }}>Postal Code</label>
                <input value={form.companyPincode} onChange={set('companyPincode')} placeholder="Postal/ZIP code" style={inp} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 20px', background: T.white, color: T.ink, border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', background: T.ocean, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Continue to Documents →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Documents ── */}
        {step === 3 && (
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Upload {cfg.flag} {cfg.country} Documents</div>
            <div style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.6, marginBottom: 18 }}>
              Accepted: PDF, JPG, PNG (max 10 MB each). Documents are encrypted and auto-deleted from our servers after <strong>3 days</strong> — only your KYC status is retained.
            </div>
            <div style={{ marginBottom: 16 }}>
              {cfg.documents.map(doc => (
                <UploadZone key={doc.key} doc={doc} file={files[doc.key]} disabled={submitting} onChange={file => setFiles(f => ({ ...f, [doc.key]: file }))} />
              ))}
            </div>

            {error && <div style={{ padding: '10px 14px', background: T.redLight, border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: T.red, marginBottom: 14 }}>{error}</div>}

            <div style={{ padding: '10px 14px', background: T.goldLight, border: `1px solid #FDE68A`, borderRadius: 8, fontSize: 12, color: '#78350F', marginBottom: 18, lineHeight: 1.5 }}>
              🔒 <strong>Privacy:</strong> Documents are stored securely on AWS S3 with encryption and auto-deleted after 3 days for your privacy. Only your verification status is permanently stored.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} disabled={submitting} style={{ padding: '12px 20px', background: T.white, color: T.ink, border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '12px', background: submitting ? '#CBD5E1' : T.coral, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting && <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {submitting ? 'Submitting…' : 'Submit KYC Documents'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: T.greenLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 10 }}>Documents Submitted!</h2>
            <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
              Our team will review your <strong>{cfg.country}</strong> KYC documents within <strong>48 business hours</strong>. You'll receive an email once verified.
            </p>
            <div style={{ background: T.goldLight, border: '1px solid #FDE68A', borderRadius: 10, padding: '16px', marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>What happens next?</div>
              {['Documents reviewed by our team', 'Verification status updated', 'Email notification sent', 'Full platform access unlocked'].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 3 ? 6 : 0, fontSize: 12, color: '#78350F', alignItems: 'center' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FEF08A', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#92400E', flexShrink: 0 }}>{i + 1}</div>
                  {s}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/profile')} style={{ padding: '12px 36px', background: 'linear-gradient(135deg,#1A3CC8,#1E50FF)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow:'0 3px 12px rgba(26,60,200,.28)' }}>
              Go to My Profile
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </AppLayout>
  );
}
