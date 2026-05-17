import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../../services/api';

/* ═══════════════════════════════════════════════════════════════
   NEXT GEN RATES — Registration Redesign v3
   Design: DARK BRAND PANEL (left) + LIGHT FORM PANEL (right)
   Typography: Sora (display) · Plus Jakarta Sans (body) · JetBrains Mono (codes)
═══════════════════════════════════════════════════════════════ */

/* ─── TOKENS ─── */
const B = {
  dkBg:      '#050C26',
  dkSurface: '#0A1540',
  dkBorder:  'rgba(255,255,255,0.08)',
  dkText:    '#FFFFFF',
  dkSub:     'rgba(255,255,255,0.55)',
  dkMuted:   'rgba(255,255,255,0.28)',
  cobalt:    '#1E4FFF',
  cobaltVib: '#3B6FFF',
  arctic:    '#00C6FF',
  arcticSoft:'rgba(0,198,255,0.15)',
  gradBrand: 'linear-gradient(160deg, #050C26 0%, #091240 40%, #0C1A55 70%, #0E1F6A 100%)',
  gradBtn:   'linear-gradient(135deg, #1539C8 0%, #1E4FFF 60%, #3B6FFF 100%)',
  gradAccent:'linear-gradient(90deg, #00C6FF 0%, #7DE8FF 100%)',
  ltBg:      '#F7F9FF',
  ltSurface: '#FFFFFF',
  ltBorder:  '#E2E8F8',
  ltBorderFoc: '#3B6FFF',
  ltText:    '#0D1535',
  ltSub:     '#3A4A7A',
  ltMuted:   '#7B8EC0',
  ltHint:    '#A0ADCC',
  jade:      '#00875A',
  jadeBg:    '#EDFBF4',
  jadeBdr:   '#7FE8B4',
  amber:     '#B86800',
  amberBg:   '#FFF8E6',
  amberBdr:  '#FFD470',
  red:       '#D91A1A',
  redBg:     '#FFF1F0',
  redBdr:    '#FFCCC7',
  shadowSm:  '0 2px 8px rgba(13,27,94,0.07)',
  shadowMd:  '0 6px 24px rgba(13,27,94,0.12)',
  shadowLg:  '0 16px 48px rgba(13,27,94,0.16)',
  shadowBtn: '0 4px 18px rgba(30,79,255,0.35)',
};

const F = {
  display: "'Sora', 'Outfit', sans-serif",
  body:    "'Plus Jakarta Sans', 'DM Sans', sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

/* ─── STATIC DATA ─── */

// UPDATED: Full company type list as specified
const COMPANY_TYPES = [
  'Freight Forwarder',
  'CHA',
  'Shipper / Exporter / Importer',
  'Trader',
  'Manufacturer',
  'Courier Company',
  'Airlines',
  'Shipping Line',
  'Road Transport Company',
  'NVOCC',
  'Rail Transport Company',
];

const BLOCKED_DOMAINS = ['gmail.com','yahoo.com','yahoo.in','yahoo.co.uk','yahoo.co.in','hotmail.com','hotmail.in','outlook.com','outlook.in','live.com','rediffmail.com','icloud.com','aol.com','mail.com','protonmail.com','tutanota.com','yandex.com','zoho.com','inbox.com','gmx.com','msn.com'];

const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahrain','Bangladesh','Belgium','Brazil','Cambodia','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Ethiopia','Finland','France','Germany','Ghana','Greece','Guatemala','Hong Kong','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Lebanon','Malaysia','Mexico','Morocco','Myanmar','Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Senegal','Singapore','South Africa','South Korea','Spain','Sri Lanka','Sweden','Switzerland','Taiwan','Tanzania','Thailand','Turkey','UAE','Uganda','Ukraine','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe'];

const PHONE_CODES = [
  {code:'+91',f:'🇮🇳',l:'India'},{code:'+1',f:'🇺🇸',l:'USA/Canada'},{code:'+971',f:'🇦🇪',l:'UAE'},
  {code:'+44',f:'🇬🇧',l:'UK'},{code:'+65',f:'🇸🇬',l:'Singapore'},{code:'+60',f:'🇲🇾',l:'Malaysia'},
  {code:'+86',f:'🇨🇳',l:'China'},{code:'+81',f:'🇯🇵',l:'Japan'},{code:'+49',f:'🇩🇪',l:'Germany'},
  {code:'+33',f:'🇫🇷',l:'France'},{code:'+39',f:'🇮🇹',l:'Italy'},{code:'+34',f:'🇪🇸',l:'Spain'},
  {code:'+966',f:'🇸🇦',l:'Saudi Arabia'},{code:'+974',f:'🇶🇦',l:'Qatar'},{code:'+968',f:'🇴🇲',l:'Oman'},
  {code:'+973',f:'🇧🇭',l:'Bahrain'},{code:'+965',f:'🇰🇼',l:'Kuwait'},{code:'+66',f:'🇹🇭',l:'Thailand'},
  {code:'+62',f:'🇮🇩',l:'Indonesia'},{code:'+63',f:'🇵🇭',l:'Philippines'},{code:'+84',f:'🇻🇳',l:'Vietnam'},
  {code:'+94',f:'🇱🇰',l:'Sri Lanka'},{code:'+880',f:'🇧🇩',l:'Bangladesh'},{code:'+92',f:'🇵🇰',l:'Pakistan'},
  {code:'+27',f:'🇿🇦',l:'South Africa'},{code:'+55',f:'🇧🇷',l:'Brazil'},{code:'+52',f:'🇲🇽',l:'Mexico'},
  {code:'+61',f:'🇦🇺',l:'Australia'},
];

/*
  KYC_CONFIGS — UPDATED per client feedback:
  - India: "Aadhaar Card" → "Company Owner / Director Govt. ID" (any valid govt photo ID)
  - India: "PAN Card" → "Company PAN Card"
  - All countries: "GST Certificate" → "Govt GST / VAT / TAX Certificate"
  - showGst: false everywhere (GST auto-verify feature removed; admin manually verifies)
  - No kycGstNumber field in INIT; GST/tax number entry only through vatGstTaxNo in Step 1
*/
const KYC_CONFIGS = {
  IN: {
    label: 'India', flag: '🇮🇳',
    fields: [
      { key: 'panNumber',    label: 'Company PAN Number',   placeholder: 'ABCDE1234F',     maxLength: 10, required: true,  hint: '10-character Company Permanent Account Number' },
      { key: 'aadhaarNumber',label: 'Aadhaar Number',       placeholder: '1234 5678 9012', maxLength: 12, required: true,  hint: '12-digit Aadhaar card number of the company owner / director' },
    ],
    documents: [
      { key: 'govt_id',      label: 'Company Owner / Director Govt. ID',  desc: 'Any valid government-issued photo ID (Aadhaar, Passport, Voter ID, Driving Licence, etc.)', required: true  },
      { key: 'pan',          label: 'Company PAN Card',                    desc: 'Clear photo or scan of the company PAN card',                                                  required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',   desc: 'Government-issued GST, VAT or tax registration certificate',                                   required: false },
      { key: 'business_reg', label: 'Business Registration',               desc: 'Incorporation / registration certificate',                                                      required: false },
      { key: 'address_proof',label: 'Address Proof',                       desc: 'Utility bill / rental agreement',                                                              required: false },
    ],
    showGst: false,
  },
  AE: {
    label: 'UAE', flag: '🇦🇪',
    fields: [
      { key: 'nationalId', label: 'Emirates ID Number', placeholder: '784-YYYY-XXXXXXX-X', required: true,  hint: 'Emirates National ID card number' },
      { key: 'taxId',      label: 'TRN / VAT Number',   placeholder: '100XXXXXXXXXXX3',    required: false, hint: '15-digit Tax Registration Number' },
    ],
    documents: [
      { key: 'national_id',  label: 'Emirates ID',                        desc: 'Front & back of Emirates ID',                       required: true  },
      { key: 'trade_license',label: 'Trade License',                      desc: 'Current year trade license',                        required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',  desc: 'Government-issued VAT or tax certificate',           required: false },
      { key: 'business_reg', label: 'MOA / Company Docs',                 desc: 'Memorandum of association',                         required: false },
      { key: 'address_proof',label: 'Address Proof',                      desc: 'Utility bill or tenancy agreement',                 required: false },
    ],
    showGst: false,
  },
  US: {
    label: 'USA', flag: '🇺🇸',
    fields: [
      { key: 'taxId',      label: 'EIN / Federal Tax ID',      placeholder: 'XX-XXXXXXX', required: true,  hint: '9-digit Employer Identification Number' },
      { key: 'nationalId', label: 'D-U-N-S Number (optional)', placeholder: 'XXXXXXXXX',  required: false },
    ],
    documents: [
      { key: 'business_reg', label: 'Business Registration',               desc: 'Articles of Incorporation / LLC docs',              required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',   desc: 'Federal or state tax certificate',                  required: false },
      { key: 'address_proof',label: 'Proof of Business Address',           desc: 'Utility bill or lease',                            required: true  },
      { key: 'other',        label: 'Other Documentation',                 desc: 'Any supporting business docs',                     required: false },
    ],
    showGst: false,
  },
  GB: {
    label: 'United Kingdom', flag: '🇬🇧',
    fields: [
      { key: 'taxId',      label: 'UK VAT Number',          placeholder: 'GB 000 0000 00', required: false },
      { key: 'nationalId', label: 'Companies House Number', placeholder: '12345678',       required: true,  hint: '8-digit company registration number' },
    ],
    documents: [
      { key: 'business_reg', label: 'Certificate of Incorporation',       desc: 'From Companies House',                             required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',  desc: 'UK VAT registration certificate',                  required: false },
      { key: 'address_proof',label: 'Proof of Registered Address',        desc: 'Recent utility bill or bank statement',            required: true  },
      { key: 'other',        label: 'Other Documents',                    desc: 'Any additional relevant docs',                    required: false },
    ],
    showGst: false,
  },
  SG: {
    label: 'Singapore', flag: '🇸🇬',
    fields: [
      { key: 'taxId',      label: 'GST Registration Number',     placeholder: 'M90000000A',  required: false },
      { key: 'nationalId', label: 'UEN (Unique Entity Number)',  placeholder: '200312345A',  required: true, hint: 'Business registration with ACRA' },
    ],
    documents: [
      { key: 'business_reg', label: 'ACRA Business Profile',               desc: 'From BizFile portal',                              required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',   desc: 'Singapore GST registration certificate',           required: false },
      { key: 'address_proof',label: 'Proof of Business Address',          desc: 'Utility or tenancy agreement',                    required: true  },
      { key: 'other',        label: 'Other Documents',                    desc: 'Any additional docs',                             required: false },
    ],
    showGst: false,
  },
  DEFAULT: {
    label: 'Other', flag: '🌐',
    fields: [
      { key: 'nationalId', label: 'National ID / Passport Number', required: true,  hint: 'Primary government identification number' },
      { key: 'taxId',      label: 'Tax ID / VAT Number',           required: false, hint: 'Local tax identification number' },
    ],
    documents: [
      { key: 'govt_id',      label: 'Government ID / Passport',           desc: 'Clear photo of any valid government-issued ID',    required: true  },
      { key: 'business_reg', label: 'Business Registration',              desc: 'Local company registration document',              required: true  },
      { key: 'gst',          label: 'Govt GST / VAT / TAX Certificate',  desc: 'Government-issued tax certificate',               required: false },
      { key: 'address_proof',label: 'Address Proof',                      desc: 'Recent utility bill or bank statement',           required: false },
      { key: 'other',        label: 'Other Documents',                    desc: 'Any additional supporting documents',             required: false },
    ],
    showGst: false,
  },
};

const COUNTRY_TO_KYC = { 'India': 'IN', 'UAE': 'AE', 'United Arab Emirates': 'AE', 'United States': 'US', 'United Kingdom': 'GB', 'Singapore': 'SG' };
const getKycKey = (c) => COUNTRY_TO_KYC[c] || 'DEFAULT';
const TODAY = new Date().toISOString().split('T')[0];
const isBlocked = (email) => BLOCKED_DOMAINS.includes((email.split('@')[1] || '').toLowerCase().trim());
const isValidUrl = (u) => !u || /^(https?:\/\/)?([\w-]+\.)+\w{2,}(\/\S*)?$/i.test(u);

/* ═══════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: ${F.body}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${B.ltBorder}; border-radius: 99px; }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes glow2    { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes slideD   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

  input, select, textarea, button { font-family: inherit; }
  a { text-decoration: none; }
  button { cursor: pointer; border: none; background: none; }

  .li {
    display: block; width: 100%; height: 46px; padding: 0 14px;
    background: #fff; border: 1.5px solid ${B.ltBorder}; border-radius: 10px;
    font-size: 14px; color: ${B.ltText};
    transition: border-color .15s, box-shadow .15s; outline: none;
  }
  .li:focus { border-color: ${B.cobaltVib}; box-shadow: 0 0 0 3px rgba(59,111,255,0.12); }
  .li.err   { border-color: ${B.red}; box-shadow: 0 0 0 3px rgba(217,26,26,0.08); }
  .li.ok    { border-color: ${B.jade}; box-shadow: 0 0 0 3px rgba(0,135,90,0.10); }
  .li.mono  { font-family: ${F.mono}; text-transform: uppercase; letter-spacing: 0.5px; }
  .li.pl    { padding-left: 40px; }
  .li.pr    { padding-right: 40px; }
  .li::placeholder { color: #B0BCDA; }
  .li:disabled { background: #F7F9FF; opacity: .65; cursor: not-allowed; }

  .ls {
    display: block; width: 100%; height: 46px; padding: 0 34px 0 14px;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B0BCDA' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 12px center;
    border: 1.5px solid ${B.ltBorder}; border-radius: 10px;
    font-size: 14px; color: ${B.ltText};
    appearance: none; -webkit-appearance: none;
    transition: border-color .15s, box-shadow .15s; outline: none; cursor: pointer;
  }
  .ls:focus { border-color: ${B.cobaltVib}; box-shadow: 0 0 0 3px rgba(59,111,255,0.12); }
  .ls.err   { border-color: ${B.red}; }
  .ls option { background: #fff; color: ${B.ltText}; }

  .lta {
    display: block; width: 100%; padding: 12px 14px; min-height: 86px;
    background: #fff; border: 1.5px solid ${B.ltBorder}; border-radius: 10px;
    font-size: 14px; color: ${B.ltText}; line-height: 1.6; resize: vertical;
    outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .lta:focus { border-color: ${B.cobaltVib}; box-shadow: 0 0 0 3px rgba(59,111,255,0.12); }
  .lta::placeholder { color: #B0BCDA; }

  .lbl { display: block; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: ${B.ltSub}; letter-spacing: .5px; text-transform: uppercase; }
  .lbl .req { color: ${B.red}; margin-left: 3px; }

  .fw { position: relative; }
  .fi { position: absolute; top: 50%; transform: translateY(-50%); display: flex; align-items: center; }
  .fi.l { left: 13px; pointer-events: none; }
  .fi.r { right: 13px; }

  .err-msg { display:flex; align-items:center; gap:5px; margin-top:5px; font-size:11.5px; color:${B.red}; line-height:1.4; }
  .hint    { margin-top:4px; font-size:11.5px; color:${B.ltHint}; line-height:1.5; }

  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:10px; font-family:inherit; font-weight:700; cursor:pointer; transition:all .18s; white-space:nowrap; border:none; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  .btn-primary { background:${B.gradBtn}; color:#fff; box-shadow:${B.shadowBtn}; }
  .btn-primary:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 8px 26px rgba(30,79,255,.45); filter:brightness(1.07); }
  .btn-secondary { background:#fff; color:${B.ltSub}; border:1.5px solid ${B.ltBorder}; }
  .btn-secondary:not(:disabled):hover { border-color:${B.cobaltVib}; color:${B.cobaltVib}; background:#F5F8FF; }
  .btn-ghost { background:transparent; color:${B.cobaltVib}; border:1.5px solid rgba(59,111,255,.3); }
  .btn-ghost:not(:disabled):hover { background:rgba(59,111,255,.06); border-color:${B.cobaltVib}; }

  .sec-card { background:#fff; border:1px solid ${B.ltBorder}; border-radius:14px; padding:22px; margin-bottom:18px; box-shadow:${B.shadowSm}; }
  .sec-card-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .sec-icon { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }
  .full { grid-column:1/-1; }

  .otp-b {
    width:46px; height:52px; text-align:center;
    font-family:${F.mono}; font-size:20px; font-weight:800;
    border:1.5px solid ${B.ltBorder}; border-radius:10px;
    background:#fff; color:${B.ltText}; outline:none; transition:all .15s;
  }
  .otp-b:focus  { border-color:${B.cobaltVib}; box-shadow:0 0 0 3px rgba(59,111,255,.12); }
  .otp-b.filled { border-color:${B.cobaltVib}; background:#F0F5FF; color:${B.cobalt}; }

  .ph-drop { animation: slideD .16s ease both; }
  .dz:hover { border-color:${B.cobaltVib} !important; background:#F5F8FF !important; }
  .dz-file:hover { background:#F7F9FF !important; }

  @media(max-width:860px) {
    .brand-col { display:none !important; }
    .mobile-logo { display:flex !important; }
    .g2 { grid-template-columns:1fr !important; }
    .full { grid-column:auto !important; }
  }
`;

/* ═══════════════════════════════════════════════════════
   MICRO ATOMS
═══════════════════════════════════════════════════════ */
const Spin = ({ size = 14, dark = false }) => (
  <div style={{ width: size, height: size, border: `2px solid ${dark ? 'rgba(30,79,255,.22)' : 'rgba(255,255,255,.25)'}`, borderTopColor: dark ? B.cobaltVib : '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
);

const ErrMsg = ({ m }) => !m ? null : (
  <p className="err-msg">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {m}
  </p>
);
const Hint = ({ c }) => <p className="hint">{c}</p>;
const Lbl  = ({ c, r }) => <label className="lbl">{c}{r && <span className="req">*</span>}</label>;

/* ═══════════════════════════════════════════════════════
   STEP BAR
═══════════════════════════════════════════════════════ */
function StepBar({ current }) {
  const steps = ['Company', 'Contact', 'KYC Docs', 'Password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const n = i + 1, done = current > n, active = current === n;
        return (
          <React.Fragment key={s}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: done ? B.cobalt : B.ltBorder, transition: 'background .35s', margin: '0 2px', borderRadius: 2 }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 12, fontWeight: 800, transition: 'all .3s', background: done ? B.jade : active ? B.gradBtn : '#fff', border: `2px solid ${done ? B.jade : active ? 'transparent' : B.ltBorder}`, color: done || active ? '#fff' : B.ltMuted, boxShadow: active ? B.shadowBtn : done ? '0 4px 12px rgba(0,135,90,.28)' : 'none' }}>
                {done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : n}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: active ? B.cobalt : done ? B.jade : B.ltHint, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OTP BOXES
═══════════════════════════════════════════════════════ */
function OtpBoxes({ value, onChange }) {
  const N = 6, refs = Array.from({ length: N }, () => useRef(null)); // eslint-disable-line
  const digits = value.split('').concat(Array(N).fill('')).slice(0, N);
  const handle = (i, v) => { if (!/^\d?$/.test(v)) return; const n = [...digits]; n[i] = v; onChange(n.join('')); if (v && i < N - 1) refs[i + 1].current?.focus(); };
  const onKey  = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus(); };
  const onPaste = (e) => { const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, N); if (p) { onChange(p.padEnd(N, '').slice(0, N)); refs[Math.min(p.length, N - 1)].current?.focus(); } e.preventDefault(); };
  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center', margin: '12px 0' }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} value={d} maxLength={1} inputMode="numeric"
          onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          className={`otp-b${d ? ' filled' : ''}`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHONE PICKER
═══════════════════════════════════════════════════════ */
function Phone({ code, num, onCode, onNum, err, disabled }) {
  const [open, setOpen] = useState(false), [q, setQ] = useState('');
  const ref = useRef();
  useEffect(() => {
    const f = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  const s = PHONE_CODES.find(p => p.code === code) || PHONE_CODES[0];
  const filt = PHONE_CODES.filter(p => p.l.toLowerCase().includes(q.toLowerCase()) || p.code.includes(q));
  return (
    <div ref={ref} style={{ display: 'flex', gap: 8, position: 'relative' }}>
      <button type="button" disabled={disabled} onClick={() => !disabled && (setOpen(o => !o), setQ(''))}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 46, background: '#fff', border: `1.5px solid ${err ? B.red : B.ltBorder}`, borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: B.ltText, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = B.cobaltVib; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = err ? B.red : B.ltBorder; }}>
        <span style={{ fontSize: 18 }}>{s.f}</span>
        <span style={{ fontFamily: F.mono, fontSize: 13 }}>{s.code}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="ph-drop" style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, zIndex: 400, background: '#fff', border: `1.5px solid ${B.ltBorder}`, borderRadius: 12, boxShadow: B.shadowLg, width: 252, maxHeight: 230, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 8px', borderBottom: `1px solid ${B.ltBorder}` }}>
            <div className="fw">
              <span className="fi l"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" autoFocus className="li pl" style={{ height: 34, fontSize: 13 }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filt.map(p => (
              <button key={p.code} type="button" onClick={() => { onCode(p.code); setOpen(false); setQ(''); }}
                style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, background: code === p.code ? '#F0F5FF' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left', transition: 'background .1s', color: B.ltText }}
                onMouseEnter={e => { if (code !== p.code) e.currentTarget.style.background = '#F7F9FF'; }}
                onMouseLeave={e => { if (code !== p.code) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ fontSize: 17 }}>{p.f}</span>
                <span style={{ fontFamily: F.mono, fontWeight: 700, color: B.cobalt, fontSize: 12 }}>{p.code}</span>
                <span style={{ color: B.ltMuted, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <input value={num} disabled={disabled} placeholder="Enter number" inputMode="tel"
        onChange={e => onNum(e.target.value.replace(/\D/g, '').slice(0, 12))}
        className={`li mono${err ? ' err' : ''}`}
        style={{ flex: 1 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DOC DROP ZONE
═══════════════════════════════════════════════════════ */
function DocZone({ files, onChange, err }) {
  const ref = useRef();
  const add = (inc) => onChange([...files, ...Array.from(inc)].slice(0, 5));
  return (
    <div>
      <div className="dz" onClick={() => files.length < 5 && ref.current.click()}
        onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files); }}
        style={{ border: `2px dashed ${err ? B.red : files.length ? B.jade : B.ltBorder}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center', background: files.length ? B.jadeBg : '#FAFBFF', cursor: files.length < 5 ? 'pointer' : 'default', transition: 'all .2s' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: files.length ? B.jadeBg : '#F0F5FF', border: `1px solid ${files.length ? B.jadeBdr : B.ltBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={files.length ? B.jade : B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: files.length ? B.jade : B.ltSub }}>
          {files.length ? `${files.length}/5 file${files.length > 1 ? 's' : ''} selected` : 'Drop files or click to browse'}
        </div>
        <div style={{ fontSize: 11.5, color: B.ltHint, marginTop: 4 }}>Company Reg. + Tax Certificates · PDF, JPG, PNG · Max 10MB · Up to 5 files</div>
      </div>
      <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => add(e.target.files)} />
      {files.map((f, i) => (
        <div key={i} className="dz-file" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: B.jadeBg, border: `1px solid ${B.jadeBdr}`, borderRadius: 8, marginTop: 6, transition: 'background .1s' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.jade} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{ flex: 1, fontSize: 12, color: B.ltText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
          <span style={{ fontSize: 11, color: B.ltMuted, flexShrink: 0 }}>{(f.size / 1024).toFixed(0)}KB</span>
          <button type="button" onClick={e => { e.stopPropagation(); onChange(files.filter((_, j) => j !== i)); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.red, fontSize: 17, fontWeight: 700, lineHeight: 1, padding: 2 }}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KYC DOC ROW
═══════════════════════════════════════════════════════ */
function KycDoc({ doc, file, onChange }) {
  const ref = useRef();
  return (
    <div style={{ border: `1.5px solid ${file ? B.jadeBdr : B.ltBorder}`, borderRadius: 11, padding: '12px 14px', background: file ? B.jadeBg : '#fff', marginBottom: 8, cursor: !file ? 'pointer' : 'default', transition: 'all .2s' }}
      onClick={() => !file && ref.current.click()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: file ? B.jadeBg : '#F0F5FF', border: `1px solid ${file ? B.jadeBdr : B.ltBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {file
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={B.jade} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: B.ltText }}>{doc.label}{doc.required && <span style={{ color: B.red, marginLeft: 3 }}>*</span>}</div>
          <div style={{ fontSize: 11.5, color: file ? B.jade : B.ltHint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : doc.desc}</div>
        </div>
        {file
          ? <button type="button" onClick={e => { e.stopPropagation(); onChange(null); }} style={{ fontSize: 11, color: B.red, background: B.redBg, border: `1px solid ${B.redBdr}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, flexShrink: 0 }}>Remove</button>
          : <button type="button" onClick={e => { e.stopPropagation(); ref.current.click(); }} style={{ fontSize: 12, color: B.cobaltVib, background: '#EEF3FF', border: `1px solid rgba(59,111,255,.22)`, borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>Choose file</button>}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => onChange(e.target.files[0] || null)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OTP PANEL
═══════════════════════════════════════════════════════ */
function OtpPanel({ label, sent, verified, loading, cooldown, otp, otpErr, onSend, onChange, onVerify, target }) {
  if (verified) return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg,${B.jade},#00A36A)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,135,90,.28)' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: B.jade }}>{label} verified ✓</span>
    </div>
  );
  return (
    <div>
      <button type="button" onClick={onSend} disabled={loading || cooldown > 0}
        className="btn btn-ghost" style={{ marginTop: 10, height: 36, padding: '0 16px', fontSize: 12, borderRadius: 9, opacity: loading || cooldown > 0 ? 0.6 : 1 }}>
        {loading && <Spin size={12} dark />}
        {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? 'Resend OTP' : 'Send OTP'}
      </button>
      {sent && (
        <div style={{ marginTop: 12, padding: '14px 16px', background: '#F5F8FF', border: `1px solid ${B.ltBorder}`, borderRadius: 12, animation: 'fadeIn .2s ease' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: B.ltSub, marginBottom: 2 }}>
            Enter 6-digit OTP sent to <strong style={{ color: B.ltText }}>{target}</strong>
          </div>
          <OtpBoxes value={otp} onChange={onChange} />
          <ErrMsg m={otpErr} />
          <button type="button" onClick={onVerify} disabled={loading || otp.length < 6}
            className="btn btn-primary" style={{ width: '100%', height: 42, fontSize: 13, marginTop: 4, borderRadius: 10, opacity: otp.length === 6 ? 1 : 0.5 }}>
            {loading && <Spin size={13} />}
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════════ */
function SecCard({ icon, title, subtitle, color = B.cobaltVib, children }) {
  return (
    <div className="sec-card">
      <div className="sec-card-header">
        <div className="sec-icon" style={{ background: `${color}14`, border: `1px solid ${color}2A` }}>{icon}</div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: B.ltText, letterSpacing: '-0.2px' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: B.ltMuted, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTICE BANNER
═══════════════════════════════════════════════════════ */
function Notice({ type = 'info', children }) {
  const map = {
    info:    { bg: '#EEF3FF', border: 'rgba(59,111,255,.22)', color: B.cobalt, icon: 'ℹ️' },
    warning: { bg: B.amberBg, border: B.amberBdr,             color: B.amber,  icon: '⚠️' },
    success: { bg: B.jadeBg,  border: B.jadeBdr,              color: B.jade,   icon: '✓'  },
    lock:    { bg: B.jadeBg,  border: B.jadeBdr,              color: B.jade,   icon: '🔒' },
  };
  const s = map[type];
  return (
    <div style={{ padding: '11px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, fontSize: 13, color: s.color, display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.6 }}>
      <span style={{ flexShrink: 0, fontSize: 14 }}>{s.icon}</span>
      <span>{children}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LEFT BRAND PANEL
═══════════════════════════════════════════════════════ */
function BrandPanel() {
  const features = ['Real-time rates from 50+ global carriers', 'Instant FCL, LCL & Air freight quotes', 'End-to-end booking management', 'Secure document verification & compliance', 'Dedicated relationship manager'];
  return (
    <div className="brand-col" style={{ width: 380, flexShrink: 0, background: B.gradBrand, padding: '44px 36px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(0,198,255,0.12) 0%, transparent 70%)`, top: -140, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, rgba(30,79,255,0.12) 0%, transparent 70%)`, bottom: -80, left: -60 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: 0.6 }} />
        <svg style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.06 }} width="380" height="300" viewBox="0 0 380 300" fill="none">
          {[0,1,2,3,4,5,6,7,8].map(i => <line key={i} x1={-60 + i*70} y1="300" x2={i*70 + 80} y2="0" stroke="white" strokeWidth="1"/>)}
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative', marginBottom: 40 }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <img src="/nextgen-logo.jpg" alt="NGR" style={{ width: 42, height: 42, borderRadius: 11, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: B.dkText, lineHeight: 1.1 }}>NEXT GEN{' '}<span style={{ background: B.gradAccent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RATES</span></div>
          <div style={{ fontSize: 10, color: B.dkMuted, marginTop: 3, letterSpacing: '0.6px', fontWeight: 500 }}>Instant Freight Rates Re-Imagined</div>
        </div>
      </div>
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${B.arctic}, ${B.cobaltVib})`, marginBottom: 16 }} />
        <h2 style={{ fontFamily: F.display, fontSize: 21, fontWeight: 800, color: B.dkText, lineHeight: 1.35, letterSpacing: '-0.3px', marginBottom: 12 }}>
          "Empowering{' '}<span style={{ background: B.gradAccent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Exporters</span>{' '}· Importers · Traders · Manufacturers · Forwarders to build agility in logistics."
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
        {[['50+', 'Carriers'], ['100+', 'Trade Lanes'], ['10k+', 'Daily Quotes'], ['120+', 'Countries']].map(([n, l]) => (
          <div key={l} style={{ padding: '14px 14px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12 }}>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800, color: B.arctic, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: B.dkMuted, marginTop: 4, fontWeight: 500 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {features.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: B.arcticSoft, border: `1px solid rgba(0,198,255,.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.arctic} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, fontSize: 11, color: B.dkMuted, position: 'relative' }}>
        © {new Date().getFullYear()} Next Gen Rates. All rights reserved.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN REGISTER PAGE
═══════════════════════════════════════════════════════ */
const INIT = {
  companyName:'', companyType:'', companyAddress:'', zipCode:'', country:'', website:'',
  incorporationDate:'', vatGstTaxNo:'', billingAddressSame:true, billingAddress:'',
  contactName:'', officialEmail:'', mobileCode:'+91', mobileNumber:'',
  landlineCode:'+91', landlineNumber:'', documents:[],
  emailOtp:'', mobileOtp:'', password:'', confirmPassword:'',
  directorName:'', directorEmail:'', directorMobileCode:'+91', directorMobile:'',
  // KYC identity fields — no kycGstNumber (GST verify removed; admin verifies manually)
  panNumber:'', aadhaarNumber:'', nationalId:'', taxId:'',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]           = useState(INIT);
  const [errs, setErrs]           = useState({});
  const [step, setStep]           = useState(1);
  const [globalErr, setGlobalErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [refId, setRefId]         = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCpw, setShowCpw]     = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [emailVer, setEmailVer]     = useState(false);
  const [mobileSent, setMobileSent] = useState(false);
  const [mobileVer, setMobileVer]   = useState(false);
  const [otpLoad, setOtpLoad]       = useState({ email: false, mobile: false });
  const [cool, setCool]             = useState({ email: 0, mobile: 0 });
  const [otpErrs, setOtpErrs]       = useState({ email: '', mobile: '' });
  const [kycFiles, setKycFiles]     = useState({});

  useEffect(() => {
    const t = setInterval(() => setCool(c => ({ email: Math.max(0, c.email - 1), mobile: Math.max(0, c.mobile - 1) })), 1000);
    return () => clearInterval(t);
  }, []);

  const set = useCallback(k => e => {
    const v = e && e.target !== undefined ? e.target.value : e;
    setForm(f => ({ ...f, [k]: v })); setErrs(er => ({ ...er, [k]: '' }));
  }, []);

  const kycKey = getKycKey(form.country);
  const kycCfg = KYC_CONFIGS[kycKey];

  const pwStr = pw => { let s = 0; if (pw.length >= 8) s++; if (/[a-z]/.test(pw)) s++; if (/[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^a-zA-Z\d]/.test(pw)) s++; return s; };
  const strength = pwStr(form.password);
  const strColor = [B.ltBorder, B.red, B.amber, B.amber, B.jade, B.jade][strength];
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];

  /* ── Validators ── */
  const v1 = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    else if (form.companyName.trim().length < 3) e.companyName = 'Enter the full legal name as per government registration documents';
    if (!form.companyType) e.companyType = 'Select company type';
    if (!form.companyAddress.trim()) e.companyAddress = 'Company address is required';
    if (!form.zipCode.trim()) e.zipCode = 'ZIP / Pin code is required';
    if (!form.country) e.country = 'Select a country';
    if (form.website && !isValidUrl(form.website)) e.website = 'Enter a valid website URL';
    if (!form.incorporationDate) e.incorporationDate = 'Business start date is required';
    else if (form.incorporationDate > TODAY) e.incorporationDate = 'Cannot select a future date';
    if (!form.billingAddressSame && !form.billingAddress.trim()) e.billingAddress = 'Billing address is required';
    setErrs(e); return Object.keys(e).length === 0;
  };

  const v2 = () => {
    const e = {};
    if (!form.contactName.trim()) e.contactName = 'Full name is required';
    else if (!form.contactName.trim().includes(' ')) e.contactName = 'Enter both first and last name';
    if (!form.officialEmail.trim()) e.officialEmail = 'Official email is required';
    else if (!/\S+@\S+\.\S+/.test(form.officialEmail)) e.officialEmail = 'Enter a valid email address';
    else if (isBlocked(form.officialEmail)) e.officialEmail = 'Personal emails not accepted — use your company email';
    if (!emailVer) e.officialEmail = e.officialEmail || 'Please verify your email with OTP';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
    else if (form.mobileNumber.length < 7) e.mobileNumber = 'Enter a valid mobile number';
    if (!mobileVer) e.mobileNumber = e.mobileNumber || 'Please verify your mobile with OTP';
    if (form.documents.length === 0) e.documents = 'Upload at least one document';
    if (!form.directorName.trim()) e.directorName = 'Director name is required';
    if (!form.directorEmail.trim()) e.directorEmail = 'Director email is required';
    else if (!/\S+@\S+\.\S+/.test(form.directorEmail)) e.directorEmail = 'Enter a valid director email';
    if (!form.directorMobile.trim()) e.directorMobile = 'Director mobile is required';
    else if (form.directorMobile.length < 7) e.directorMobile = 'Enter a valid mobile number';
    setErrs(e); return Object.keys(e).length === 0;
  };

  const v3 = () => {
    const e = {};
    kycCfg.fields.forEach(f => { if (f.required && !form[f.key]?.trim()) e[f.key] = `${f.label} is required`; });
    const missing = kycCfg.documents.filter(d => d.required && !kycFiles[d.key]);
    if (missing.length > 0) e.kycDocs = `Required: ${missing.map(d => d.label).join(', ')}`;
    setErrs(e); return Object.keys(e).length === 0;
  };

  const v4 = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must include uppercase, lowercase and a number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrs(e); return Object.keys(e).length === 0;
  };

  /* ── API handlers ── */
  const sendEmailOtp = async () => {
    const err = !form.officialEmail.trim() ? 'Enter your email first' : !/\S+@\S+\.\S+/.test(form.officialEmail) ? 'Invalid email' : isBlocked(form.officialEmail) ? 'Personal email not accepted' : null;
    if (err) { setErrs(er => ({ ...er, officialEmail: err })); return; }
    setOtpLoad(o => ({ ...o, email: true }));
    try { await api.sendRegistrationOtp({ type: 'email', value: form.officialEmail }); setEmailSent(true); setCool(c => ({ ...c, email: 60 })); }
    catch (err) { setErrs(er => ({ ...er, officialEmail: err.message || 'Failed to send OTP' })); }
    finally { setOtpLoad(o => ({ ...o, email: false })); }
  };

  const verifyEmailOtp = async () => {
    if (form.emailOtp.length < 6) { setOtpErrs(o => ({ ...o, email: 'Enter the complete OTP' })); return; }
    setOtpLoad(o => ({ ...o, email: true }));
    try { await api.verifyRegistrationOtp({ type: 'email', value: form.officialEmail, otp: form.emailOtp }); setEmailVer(true); setOtpErrs(o => ({ ...o, email: '' })); setErrs(er => ({ ...er, officialEmail: '' })); }
    catch (err) { setOtpErrs(o => ({ ...o, email: err.message || 'Invalid OTP' })); }
    finally { setOtpLoad(o => ({ ...o, email: false })); }
  };

  const sendMobileOtp = async () => {
    if (!form.mobileNumber || form.mobileNumber.length < 7) { setErrs(er => ({ ...er, mobileNumber: 'Enter your mobile number first' })); return; }
    setOtpLoad(o => ({ ...o, mobile: true }));
    try { await api.sendRegistrationOtp({ type: 'mobile', value: form.mobileCode + form.mobileNumber }); setMobileSent(true); setCool(c => ({ ...c, mobile: 60 })); }
    catch (err) { setErrs(er => ({ ...er, mobileNumber: err.message || 'Failed to send OTP' })); }
    finally { setOtpLoad(o => ({ ...o, mobile: false })); }
  };

  const verifyMobileOtp = async () => {
    if (form.mobileOtp.length < 6) { setOtpErrs(o => ({ ...o, mobile: 'Enter the complete OTP' })); return; }
    setOtpLoad(o => ({ ...o, mobile: true }));
    try { await api.verifyRegistrationOtp({ type: 'mobile', value: form.mobileCode + form.mobileNumber, otp: form.mobileOtp }); setMobileVer(true); setOtpErrs(o => ({ ...o, mobile: '' })); setErrs(er => ({ ...er, mobileNumber: '' })); }
    catch (err) { setOtpErrs(o => ({ ...o, mobile: err.message || 'Invalid OTP' })); }
    finally { setOtpLoad(o => ({ ...o, mobile: false })); }
  };

  const goNext = () => {
    setGlobalErr('');
    if (step === 1 && !v1()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (step === 2 && !v2()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (step === 3 && !v3()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (step === 4) { if (!v4()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } submit(); return; }
    setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      const fields = {
        companyName: form.companyName, companyType: form.companyType,
        companyAddress: form.companyAddress, zipCode: form.zipCode,
        country: form.country, website: form.website || '',
        incorporationDate: form.incorporationDate, vatGstTaxNo: form.vatGstTaxNo || '',
        billingAddress: form.billingAddressSame ? form.companyAddress : form.billingAddress,
        billingAddressSame: form.billingAddressSame,
        contactName: form.contactName, officialEmail: form.officialEmail,
        mobileCountryCode: form.mobileCode, mobileNumber: form.mobileNumber,
        mobile: form.mobileCode + form.mobileNumber,
        landlineCountryCode: form.landlineCode, landlineNumber: form.landlineNumber || '',
        landline: form.landlineNumber ? form.landlineCode + form.landlineNumber : '',
        directorName: form.directorName, directorEmail: form.directorEmail,
        directorMobileCode: form.directorMobileCode,
        directorMobile: form.directorMobileCode + form.directorMobile,
        password: form.password, kycCountry: kycKey,
        panNumber: form.panNumber || '', aadhaarNumber: form.aadhaarNumber || '',
        nationalId: form.nationalId || '', taxId: form.taxId || '',
      };
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
      form.documents.forEach((doc, i) => fd.append(`document_${i}`, doc));
      Object.entries(kycFiles).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const res = await api.submitRegistration(fd);
      setRefId(res.applicationId || res.registrationId || '');
      setDone(true);
    } catch (err) {
      setGlobalErr(err.message || 'Registration failed. Please check your details and try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSubmitting(false); }
  };

  /* ── NAV BUTTONS ── */
  const NavBtns = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${B.ltBorder}` }}>
      {step > 1
        ? <button type="button" onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-secondary" style={{ height: 44, padding: '0 22px', fontSize: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        : <div />}
      <button type="button" onClick={goNext} disabled={submitting} className="btn btn-primary" style={{ height: 46, padding: '0 32px', fontSize: 14, borderRadius: 11 }}>
        {submitting && <Spin size={15} />}
        {submitting ? 'Submitting…' : step === 4 ? 'Submit Registration ✓' : 'Continue →'}
      </button>
    </div>
  );

  /* ── SUCCESS SCREEN ── */
  if (done) return (
    <div style={{ minHeight: '100vh', background: B.ltBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F.body }}>
      <div style={{ background: '#fff', borderRadius: 22, maxWidth: 520, width: '100%', padding: '48px 40px', boxShadow: B.shadowLg, border: `1px solid ${B.ltBorder}`, textAlign: 'center', animation: 'fadeUp .4s ease both' }}>
        <div style={{ width: 84, height: 84, background: `linear-gradient(135deg,${B.jade},#00A36A)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: '0 8px 28px rgba(0,135,90,.32)', animation: 'glow2 2.5s ease-in-out infinite' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 900, color: B.ltText, marginBottom: 8, letterSpacing: '-0.4px' }}>Registration Submitted!</h2>
        <p style={{ fontSize: 14, color: B.ltSub, lineHeight: 1.75, marginBottom: 18 }}>
          Thank you <strong>{form.contactName.split(' ')[0]}</strong>! Your application for <strong>{form.companyName}</strong> is under review. We'll activate your account within <strong style={{ color: B.cobalt }}>24–48 business hours</strong>.
        </p>
        {refId && (
          <div style={{ padding: '10px 18px', background: '#EEF3FF', border: `1px solid rgba(59,111,255,.22)`, borderRadius: 10, display: 'inline-block', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: B.ltMuted }}>Application ID: </span>
            <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 800, color: B.cobaltVib }}>{refId}</span>
          </div>
        )}
        <div style={{ padding: '16px 18px', background: B.amberBg, border: `1px solid ${B.amberBdr}`, borderRadius: 13, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: B.amber, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.3px' }}>What happens next</div>
          {['Our team reviews your company & KYC documents', 'KYC verified and account activated upon approval', 'Confirmation email sent to you', 'Sign in with your email & password to access rates'].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 3 ? 7 : 0, fontSize: 12.5, color: B.ltSub }}>
              <div style={{ width: 21, height: 21, borderRadius: '50%', background: B.amberBg, border: `1px solid ${B.amberBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: B.amber, flexShrink: 0, fontFamily: F.mono }}>{i + 1}</div>
              <span style={{ paddingTop: 2 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', background: B.jadeBg, border: `1px solid ${B.jadeBdr}`, borderRadius: 10, marginBottom: 24, fontSize: 12.5, color: B.jade, textAlign: 'left' }}>
          💡 Once approved, sign in with <strong>{form.officialEmail}</strong> and your password.
        </div>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '13px 36px', fontSize: 15, borderRadius: 12 }}>Go to Login →</button>
      </div>
      <style>{CSS}</style>
    </div>
  );

  const stepTitles = ['', 'Company Information', 'Contact & Verification', 'KYC Documents', 'Set Password'];
  const stepSubs   = ['', 'Tell us about your registered company', 'Verify your contact details & upload company documents', 'Upload KYC identity & compliance documents', 'Create your secure login password'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: F.body }}>
      <BrandPanel />

      {/* ── RIGHT: LIGHT FORM SIDE ── */}
      <div style={{ flex: 1, background: B.ltBg, overflowY: 'auto', padding: '36px 24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: 660 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: 'none', marginBottom: 22, alignItems: 'center', gap: 12, background: B.gradBrand, borderRadius: 16, padding: '18px 22px', border: `1px solid ${B.dkBorder}` }}>
            <img src="/nextgen-logo.jpg" alt="NGR" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 18, color: '#fff' }}>NEXT GEN <span style={{ background: B.gradAccent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RATES</span></div>
              <div style={{ fontSize: 10, color: B.dkMuted, marginTop: 2 }}>Instant Freight Rates Re-Imagined</div>
            </div>
          </div>

          {/* Step badge + page title */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: '#EEF3FF', border: `1px solid rgba(59,111,255,.22)`, marginBottom: 10 }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: B.cobaltVib, letterSpacing: '.4px' }}>STEP {step} OF 4</span>
            </div>
            <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 900, color: B.ltText, margin: '0 0 4px', letterSpacing: '-0.4px' }}>{stepTitles[step]}</h1>
            <p style={{ fontSize: 13, color: B.ltMuted, margin: 0 }}>{stepSubs[step]}</p>
          </div>

          <StepBar current={step} />

          {/* Global error */}
          {globalErr && (
            <div style={{ padding: '12px 14px', background: B.redBg, border: `1px solid ${B.redBdr}`, borderRadius: 10, marginBottom: 20, fontSize: 13, color: B.red, display: 'flex', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {globalErr}
            </div>
          )}

          {/* ════════════════ STEP 1 ════════════════ */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp .28s ease both' }}>
              <SecCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                title="Company Details" subtitle="Your registered business information">
                <div className="g2">

                  {/* Company Name — updated hint text */}
                  <div className="full">
                    <Lbl c="Company Name" r />
                    <input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Acme Global Logistics Pvt. Ltd." className={`li${errs.companyName ? ' err' : ''}`} />
                    <ErrMsg m={errs.companyName} />
                    <Hint c="Only type the full legal name of your company as per the document issued by your local country / government — e.g. Pvt. Ltd., LLC, Inc., GmbH, Co. Ltd., etc." />
                  </div>

                  {/* Company Type — updated list (11 types) */}
                  <div>
                    <Lbl c="Company Type" r />
                    <select value={form.companyType} onChange={set('companyType')} className={`ls${errs.companyType ? ' err' : ''}`}>
                      <option value="">— Select type —</option>
                      {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ErrMsg m={errs.companyType} />
                  </div>

                  <div>
                    <Lbl c="Country" r />
                    <select value={form.country} onChange={set('country')} className={`ls${errs.country ? ' err' : ''}`}>
                      <option value="">— Select country —</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ErrMsg m={errs.country} />
                    <Hint c="KYC documents in step 3 are tailored to this country" />
                  </div>

                  <div className="full">
                    <Lbl c="Company Address" r />
                    <textarea value={form.companyAddress} onChange={set('companyAddress')} rows={3} placeholder="Full registered address including city and state" className={`lta${errs.companyAddress ? ' err' : ''}`} />
                    <ErrMsg m={errs.companyAddress} />
                  </div>

                  <div>
                    <Lbl c="ZIP / Pin Code" r />
                    <input value={form.zipCode} onChange={set('zipCode')} placeholder="e.g. 400001" className={`li${errs.zipCode ? ' err' : ''}`} />
                    <ErrMsg m={errs.zipCode} />
                  </div>

                  <div>
                    <Lbl c="Company Website" />
                    <div className="fw">
                      <span className="fi l"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></span>
                      <input value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" className={`li pl${errs.website ? ' err' : ''}`} />
                    </div>
                    <ErrMsg m={errs.website} />
                  </div>

                  {/* RENAMED: Incorporation / Start Date → Business Start Date */}
                  <div>
                    <Lbl c="Business Start Date" r />
                    <div className="fw">
                      <span className="fi l"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                      <input type="date" value={form.incorporationDate} onChange={set('incorporationDate')} max={TODAY} className={`li pl${errs.incorporationDate ? ' err' : ''}`} />
                    </div>
                    <ErrMsg m={errs.incorporationDate} />
                    <Hint c="Date the company started as per your government / local registration document — no future dates" />
                  </div>

                  <div>
                    <Lbl c="VAT / GST / TAX Number" />
                    <input value={form.vatGstTaxNo} onChange={set('vatGstTaxNo')} placeholder="Alphanumeric · varies by country" maxLength={30} className="li mono" />
                    <Hint c="Optional — enter the tax registration number provided by your local government" />
                  </div>

                  <div className="full" style={{ background: '#F7F9FF', border: `1px solid ${B.ltBorder}`, borderRadius: 12, padding: '16px 16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.billingAddressSame} onChange={e => setForm(f => ({ ...f, billingAddressSame: e.target.checked }))} style={{ width: 17, height: 17, accentColor: B.cobalt, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: B.ltSub }}>Billing address is same as company address</span>
                    </label>
                    {!form.billingAddressSame && (
                      <div style={{ marginTop: 14 }}>
                        <Lbl c="Billing Address" r />
                        <textarea value={form.billingAddress} onChange={set('billingAddress')} rows={3} placeholder="Full billing / invoicing address" className={`lta${errs.billingAddress ? ' err' : ''}`} />
                        <ErrMsg m={errs.billingAddress} />
                      </div>
                    )}
                  </div>
                </div>
              </SecCard>
            </div>
          )}

          {/* ════════════════ STEP 2 ════════════════ */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp .28s ease both' }}>
              <SecCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                title="Contact Details" subtitle="Verify your contact with OTP">
                <div className="g2">
                  <div className="full">
                    <Lbl c="Contact Person Full Name" r />
                    <input value={form.contactName} onChange={set('contactName')} placeholder="First Name Last Name" className={`li${errs.contactName ? ' err' : ''}`} />
                    <ErrMsg m={errs.contactName} />
                    <Hint c="Enter both first and last name" />
                  </div>

                  {/* Email OTP — note: uniqueness is checked server-side on OTP send */}
                  <div className="full">
                    <Lbl c="Official Company Email" r />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span className="fi l" style={{ zIndex: 1 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                        <input value={form.officialEmail} onChange={set('officialEmail')} type="email" placeholder="name@yourcompany.com" disabled={emailVer} className={`li pl${emailVer ? ' ok' : errs.officialEmail ? ' err' : ''}`} />
                        {emailVer && <span className="fi r" style={{ pointerEvents: 'none' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={B.jade} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></span>}
                      </div>
                      {!emailVer && (
                        <button type="button" onClick={sendEmailOtp} disabled={otpLoad.email || cool.email > 0} className="btn btn-primary" style={{ height: 46, padding: '0 16px', fontSize: 12, borderRadius: 10, flexShrink: 0, opacity: otpLoad.email || cool.email > 0 ? .65 : 1 }}>
                          {otpLoad.email && <Spin size={12} />}
                          {otpLoad.email ? '…' : cool.email > 0 ? `${cool.email}s` : emailSent ? 'Resend' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                    <ErrMsg m={errs.officialEmail} />
                    {!emailVer && <Hint c="⚠️ Gmail, Yahoo, Outlook and personal email domains not accepted. Email ID must not already be registered in the system." />}
                    <OtpPanel label="Email" sent={emailSent} verified={emailVer} loading={otpLoad.email} cooldown={cool.email} otp={form.emailOtp} otpErr={otpErrs.email} target={form.officialEmail} onSend={sendEmailOtp} onChange={v => { setForm(f => ({ ...f, emailOtp: v })); setOtpErrs(o => ({ ...o, email: '' })); }} onVerify={verifyEmailOtp} />
                  </div>

                  {/* Mobile OTP */}
                  <div className="full">
                    <Lbl c="Mobile Number" r />
                    <Phone code={form.mobileCode} num={form.mobileNumber} onCode={v => setForm(f => ({ ...f, mobileCode: v }))} onNum={v => { setForm(f => ({ ...f, mobileNumber: v })); setErrs(er => ({ ...er, mobileNumber: '' })); }} err={errs.mobileNumber} disabled={mobileVer} />
                    <ErrMsg m={errs.mobileNumber} />
                    {!mobileVer && <Hint c="Mobile number must not already be registered in the system." />}
                    <OtpPanel label="Mobile" sent={mobileSent} verified={mobileVer} loading={otpLoad.mobile} cooldown={cool.mobile} otp={form.mobileOtp} otpErr={otpErrs.mobile} target={`${form.mobileCode} ${form.mobileNumber}`} onSend={sendMobileOtp} onChange={v => { setForm(f => ({ ...f, mobileOtp: v })); setOtpErrs(o => ({ ...o, mobile: '' })); }} onVerify={verifyMobileOtp} />
                  </div>

                  <div className="full">
                    <Lbl c="Land Line Number" />
                    <Phone code={form.landlineCode} num={form.landlineNumber} onCode={v => setForm(f => ({ ...f, landlineCode: v }))} onNum={v => setForm(f => ({ ...f, landlineNumber: v }))} />
                    <Hint c="Office landline — optional" />
                  </div>

                  <div className="full">
                    <Lbl c="Company Registration & Tax Certificate" r />
                    <DocZone files={form.documents} onChange={docs => { setForm(f => ({ ...f, documents: docs })); setErrs(er => ({ ...er, documents: '' })); }} err={errs.documents} />
                    <ErrMsg m={errs.documents} />
                  </div>
                </div>
              </SecCard>

              {/* Director section */}
              <SecCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.amber} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>}
                title="Management / Director" subtitle="No OTP verification required for these fields"
                color={B.amber}>
                <div className="g2">
                  <div className="full">
                    <Lbl c="Director / CEO / MD Full Name" r />
                    <input value={form.directorName} onChange={set('directorName')} placeholder="Full Name" className={`li${errs.directorName ? ' err' : ''}`} />
                    <ErrMsg m={errs.directorName} />
                  </div>
                  <div>
                    <Lbl c="Director Email" r />
                    <div className="fw">
                      <span className="fi l"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                      <input value={form.directorEmail} onChange={set('directorEmail')} type="email" placeholder="director@yourcompany.com" className={`li pl${errs.directorEmail ? ' err' : ''}`} />
                    </div>
                    <ErrMsg m={errs.directorEmail} />
                    <Hint c="No OTP verification needed" />
                  </div>
                  <div>
                    <Lbl c="Director Mobile" r />
                    <Phone code={form.directorMobileCode} num={form.directorMobile} onCode={v => setForm(f => ({ ...f, directorMobileCode: v }))} onNum={v => { setForm(f => ({ ...f, directorMobile: v })); setErrs(er => ({ ...er, directorMobile: '' })); }} err={errs.directorMobile} />
                    <ErrMsg m={errs.directorMobile} />
                    <Hint c="No OTP verification needed" />
                  </div>
                </div>
              </SecCard>
            </div>
          )}

          {/* ════════════════ STEP 3 ════════════════ */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp .28s ease both' }}>
              <SecCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                title="KYC Documents" subtitle="Identity & compliance documents for your country">
                <div className="g2">

                  {/* Country banner */}
                  <div className="full" style={{ padding: '13px 16px', background: '#EEF3FF', border: `1px solid rgba(59,111,255,.2)`, borderRadius: 11, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{kycCfg.flag}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: B.cobalt }}>KYC for {kycCfg.label}</div>
                      <div style={{ fontSize: 12, color: B.ltMuted, marginTop: 2 }}>Based on your registered country: <strong style={{ color: B.ltSub }}>{form.country}</strong>. Documents are country-specific.</div>
                    </div>
                  </div>

                  {/*
                    KYC text fields.
                    NOTE: GST auto-verify feature has been REMOVED.
                    Admin will manually verify all tax/GST numbers from submitted documents.
                  */}
                  {kycCfg.fields.map(f => (
                    <div key={f.key} className="full">
                      <Lbl c={f.label} r={f.required} />
                      <input value={form[f.key] || ''} onChange={set(f.key)} placeholder={f.placeholder || ''} maxLength={f.maxLength} className={`li mono${errs[f.key] ? ' err' : ''}`} />
                      <ErrMsg m={errs[f.key]} />
                      {f.hint && <Hint c={f.hint} />}
                    </div>
                  ))}

                  {/* KYC document uploads */}
                  <div className="full">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 800, color: B.ltText }}>Upload KYC Documents</span>
                      <span style={{ fontSize: 11, color: B.ltHint }}>PDF, JPG, PNG · Max 10MB</span>
                    </div>
                    {kycCfg.documents.map(doc => (
                      <KycDoc key={doc.key} doc={doc} file={kycFiles[doc.key] || null} onChange={f => setKycFiles(prev => ({ ...prev, [doc.key]: f }))} />
                    ))}
                    <ErrMsg m={errs.kycDocs} />
                  </div>

                  <div className="full">
                    <Notice type="info">
                      ℹ️ <strong>Manual admin review:</strong> All submitted documents and tax/GST numbers will be verified offline by our compliance team — no instant verification needed here.
                    </Notice>
                  </div>
                  <div className="full">
                    <Notice type="lock">
                      🔒 <strong>All documents are encrypted</strong> and auto-deleted after verification. Stored securely on AWS S3.
                    </Notice>
                  </div>
                </div>
              </SecCard>
            </div>
          )}

          {/* ════════════════ STEP 4 ════════════════ */}
          {step === 4 && (
            <div style={{ animation: 'fadeUp .28s ease both' }}>
              <SecCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
                title="Set Your Password" subtitle="Secure your account with a strong password">
                <div className="g2">
                  <div className="full">
                    <Notice type="info">
                      <strong>One-time setup:</strong> You'll use this password to sign in once your account & KYC are approved. No separate KYC step needed after login.
                    </Notice>
                  </div>

                  {/* Review summary */}
                  <div className="full" style={{ background: '#F7F9FF', border: `1px solid ${B.ltBorder}`, borderRadius: 13, padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: B.ltSub, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.cobaltVib} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Review Summary
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        ['Company', form.companyName], ['Type', form.companyType],
                        ['Country', form.country],     ['Contact', form.contactName],
                        ['Email', form.officialEmail], ['Mobile', `${form.mobileCode} ${form.mobileNumber}`],
                        ['KYC', `${kycCfg.flag} ${kycCfg.label}`],
                        ['Docs', `${Object.values(kycFiles).filter(Boolean).length + form.documents.length} file(s)`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ background: '#fff', padding: '9px 12px', borderRadius: 9, border: `1px solid ${B.ltBorder}` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: B.ltHint, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: B.ltText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="full">
                    <Lbl c="Password" r />
                    <div className="fw">
                      <span className="fi l"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
                      <input value={form.password} onChange={set('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars · upper + lower + number" className={`li pl pr${errs.password ? ' err' : ''}`} />
                      <button type="button" className="fi r" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.ltHint, display: 'flex', padding: 2 }}>
                        {showPw
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
                      </button>
                    </div>
                    {form.password && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
                          {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: strength >= i ? strColor : B.ltBorder, transition: 'background .2s' }} />)}
                        </div>
                        <span style={{ fontSize: 11, color: strColor, fontWeight: 700 }}>{strLabel}</span>
                      </div>
                    )}
                    <ErrMsg m={errs.password} />
                  </div>

                  {/* Confirm password */}
                  <div className="full">
                    <Lbl c="Confirm Password" r />
                    <div className="fw">
                      <span className="fi l"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={B.ltHint} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
                      <input value={form.confirmPassword} onChange={set('confirmPassword')} type={showCpw ? 'text' : 'password'} placeholder="Re-enter your password" className={`li pl pr${errs.confirmPassword ? ' err' : ''}`} />
                      <button type="button" className="fi r" onClick={() => setShowCpw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.ltHint, display: 'flex', padding: 2 }}>
                        {showCpw
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
                      </button>
                    </div>
                    <ErrMsg m={errs.confirmPassword} />
                  </div>

                  <div className="full">
                    <Notice type="warning">
                      ℹ️ Your account will be in <strong>pending review</strong> status until our team approves your company and KYC documents.
                    </Notice>
                  </div>
                </div>
              </SecCard>
            </div>
          )}

          <NavBtns />

          <p style={{ textAlign: 'center', fontSize: 13, color: B.ltMuted, marginTop: 18 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: B.cobaltVib, fontWeight: 700 }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11.5, color: B.ltHint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            256-bit encrypted · Documents auto-deleted after verification · GDPR compliant
          </p>
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}
