import React, { useState, useRef, useCallback, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { CURRENCIES, CHARGE_OPTIONS } from '../../data/mockData';
import { searchPorts, getLoadTypes } from '../../services/api';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const C = {
  pageBg: '#F0F4FB', panel: '#FFFFFF', inputBg: '#F5F8FF', inputFocus: '#FFFFFF', hover: '#EEF3FF',
  navy: '#0B1D5E', blue: '#1A4FD8', blueDim: '#EEF3FF', cyan: '#00C2FF', cyanDim: '#E6F9FF',
  heroGrad: 'linear-gradient(135deg, #0B1D5E 0%, #1A4FD8 60%, #00C2FF 100%)',
  btnGrad:  'linear-gradient(90deg, #1540C0 0%, #1A6FE8 55%, #00C2FF 100%)',
  textPrimary: '#0B1D5E', textBody: '#2D3F6B', textMid: '#5A6E9C', textMuted: '#8FA3C8',
  border: '#DDE5F5', borderMid: '#BCC9E8', borderBlue: '#1A4FD8', borderCyan: '#00C2FF',
  shadow: '0 2px 12px rgba(11,29,94,0.08)', shadowMd: '0 6px 24px rgba(11,29,94,0.10)',
  shadowLg: '0 16px 48px rgba(11,29,94,0.14)',
  glowCyan: '0 0 0 3px rgba(0,194,255,0.18)', glowBlue: '0 0 0 3px rgba(26,79,216,0.15)',
};

const mkTrigger = (open) => ({
  display:'flex', alignItems:'center', gap:9, width:'100%', height:46, padding:'0 14px',
  background: open ? C.inputFocus : C.inputBg, border:`1.5px solid ${open ? C.borderCyan : C.border}`,
  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
  boxShadow: open ? C.glowCyan : 'none', transition:'all 0.18s', outline:'none',
});
const dropBase = {
  position:'absolute', top:'calc(100% + 7px)', left:0,
  background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:14,
  boxShadow:C.shadowLg, zIndex:400,
};
const doneBtn = {
  width:'100%', height:42, background:C.btnGrad, color:'#fff', border:'none',
  borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  boxShadow:'0 4px 16px rgba(0,194,255,0.25)',
};
const inputBase = {
  width:'100%', height:46, padding:'0 14px', background:C.inputBg,
  border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14,
  color:C.textPrimary, fontFamily:'inherit', outline:'none', transition:'all 0.18s',
};

const Lbl = ({ children }) => (
  <span style={{ display:'block', fontSize:11, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:7 }}>{children}</span>
);
const Chev = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted, transform:open?'rotate(180deg)':'none', transition:'transform 0.18s', flexShrink:0 }}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TabIcon = ({ mode, active }) => {
  const c = active ? C.cyan : C.textMuted;
  if (mode==='FCL') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="1" stroke={c} strokeWidth="1.8"/><path d="M8 6v12M16 6v12" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;
  if (mode==='LCL') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2" stroke={c} strokeWidth="1.8" fill="none" strokeLinejoin="round"/><polyline points="2 17 12 22 22 17" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/><polyline points="2 12 12 17 22 12" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>;
  if (mode==='AIR') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 16l-6-6 2-7-2-1-4 6-4-3-1 1 2 4-3 2 1 2 4-1 1 4 2-1V16Z" stroke={c} strokeWidth="1.8" fill="none" strokeLinejoin="round"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="7" width="15" height="10" rx="1" stroke={c} strokeWidth="1.8" fill="none"/><path d="M16 10h3l3 4v3h-6V10Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none"/><circle cx="6" cy="19" r="2" stroke={c} strokeWidth="1.8" fill="none"/><circle cx="19" cy="19" r="2" stroke={c} strokeWidth="1.8" fill="none"/></svg>;
};

function useDropdown() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return { open, setOpen, ref };
}

/* ══════════════════════════════════════════════════════════════
   LIVE PORT INPUT
   • Shows all ports immediately on focus (empty query → GET all)
   • Filters as user types with 260ms debounce
   • Grouped by region in the initial dropdown
══════════════════════════════════════════════════════════════ */
function LivePortInput({ value, onChange, portType = 'sea', placeholder, isDoor }) {
  const [query, setQuery]         = useState('');
  const [allPorts, setAllPorts]   = useState([]);   // pre-fetched full list for this portType
  const [results, setResults]     = useState([]);   // filtered results shown in dropdown
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [prefetched, setPrefetched] = useState(false);
  const ref       = useRef();
  const debounce  = useRef();

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Pre-fetch all ports for this type on mount (silent, no loading state)
  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      try {
        const res  = await searchPorts({ q: '', type: portType, limit: 30 });
        const list = res?.data || res || [];
        if (!cancelled) { setAllPorts(list); setPrefetched(true); }
      } catch { /* non-fatal */ }
    };
    prefetch();
    return () => { cancelled = true; };
  }, [portType]);

  // Filter allPorts client-side for instant response on small queries
  const clientFilter = useCallback((q) => {
    if (!q.trim()) return allPorts;
    const lq = q.toLowerCase();
    return allPorts.filter(p =>
      p.name.toLowerCase().includes(lq) ||
      p.code.toLowerCase().includes(lq) ||
      (p.country || '').toLowerCase().includes(lq)
    );
  }, [allPorts]);

  // Server search for queries not covered by prefetched list
  const serverSearch = useCallback(async (q) => {
    setLoading(true);
    try {
      const res  = await searchPorts({ q, type: portType, limit: 15 });
      const list = res?.data || res || [];
      setResults(list);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [portType]);

  const handleFocus = () => {
    if (isDoor) return;
    // Show all prefetched ports immediately
    if (prefetched && allPorts.length > 0) {
      setResults(allPorts);
      setOpen(true);
    } else if (!prefetched) {
      // Still loading — show spinner briefly then open when ready
      setLoading(true);
    }
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (value) onChange(null);

    // Immediately filter client-side for responsiveness
    const clientResults = clientFilter(q);
    setResults(clientResults);
    if (clientResults.length > 0) setOpen(true);

    // Also hit server for queries that might not be in the prefetched list
    clearTimeout(debounce.current);
    if (q.trim().length >= 2) {
      debounce.current = setTimeout(() => serverSearch(q), 260);
    }
  };

  // When prefetch completes while focused, open dropdown
  useEffect(() => {
    if (prefetched && loading) {
      setLoading(false);
      if (!query && allPorts.length > 0) {
        setResults(allPorts);
        setOpen(true);
      }
    }
  }, [prefetched, allPorts]);

  const handleSelect = (port) => { onChange(port); setQuery(''); setResults(allPorts); setOpen(false); };
  const handleClear  = (e)    => { e.stopPropagation(); onChange(null); setQuery(''); setResults(allPorts); };
  const displayVal   = value  ? `${value.name}, ${value.country} (${value.code})` : query;

  // Group results by region for the initial (unfiltered) view
  const grouped = !query.trim() && results.length > 0
    ? results.reduce((acc, p) => {
        const r = p.region || 'Other';
        if (!acc[r]) acc[r] = [];
        acc[r].push(p);
        return acc;
      }, {})
    : null;

  const PortRow = ({ port }) => (
    <button key={port.code} type="button" onClick={() => handleSelect(port)}
      style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = C.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <span style={{ flexShrink:0, fontFamily:'monospace', fontSize:11, fontWeight:800, background: portType==='air' ? C.blueDim : C.cyanDim, color: portType==='air' ? C.blue : '#007DAA', padding:'2px 7px', borderRadius:5, minWidth:48, textAlign:'center', border:`1px solid ${portType==='air' ? '#BFCFFF' : 'rgba(0,194,255,0.25)'}`, letterSpacing:'0.04em' }}>
        {port.code}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{port.name}</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{port.country}</div>
      </div>
      {value?.code === port.code && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color:C.cyan, flexShrink:0 }}>
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Input box */}
      <div style={{ display:'flex', alignItems:'center', background: open ? C.inputFocus : C.inputBg, border:`1.5px solid ${open ? C.borderCyan : value ? C.borderBlue : C.border}`, borderRadius:10, height:46, boxShadow: open ? C.glowCyan : value ? C.glowBlue : 'none', transition:'all 0.18s', overflow:'hidden' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft:13, marginRight:2, color: value ? C.blue : C.textMuted, flexShrink:0, pointerEvents:'none' }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
        <input
          value={isDoor ? query : displayVal}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={isDoor ? 'Enter door address / zip…' : placeholder}
          style={{ flex:1, height:'100%', padding:'0 8px', border:'none', background:'transparent', fontSize:14, color:C.textPrimary, fontFamily:'inherit', outline:'none' }}
        />
        {loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight:12, color:C.cyan, flexShrink:0, animation:'lpi-spin 0.8s linear infinite' }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42" strokeDashoffset="12" strokeLinecap="round"/>
          </svg>
        )}
        {!loading && value && (
          <button onClick={handleClear} style={{ marginRight:10, background:C.hover, border:'none', cursor:'pointer', color:C.textMid, width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, padding:0 }}>×</button>
        )}
        {!loading && !value && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginRight:12, color:C.textMuted, flexShrink:0 }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{ ...dropBase, right:0, overflow:'hidden', minWidth:320 }}>
          {/* Header */}
          <div style={{ padding:'8px 14px 6px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted }}>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              {query.trim()
                ? <input value={query} onChange={handleInput} autoFocus
                    style={{ border:'none', outline:'none', fontSize:12.5, color:C.textPrimary, fontFamily:'inherit', background:'transparent', width:160 }}
                    placeholder="Type to filter…"/>
                : <span style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {portType==='air' ? 'All Airports' : 'All Ports'} ({results.length})
                  </span>
              }
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:16, lineHeight:1, padding:0 }}>×</button>
          </div>

          {/* Search within dropdown */}
          {!query.trim() && (
            <div style={{ padding:'8px 14px 6px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 10px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted, flexShrink:0 }}>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  placeholder={`Search ${portType==='air' ? 'airports' : 'ports'}…`}
                  onChange={handleInput}
                  style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:C.textPrimary, fontFamily:'inherit', flex:1 }}
                />
              </div>
            </div>
          )}

          {/* Port list — grouped by region when unfiltered */}
          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {grouped
              ? Object.entries(grouped).map(([region, ports]) => (
                  <div key={region}>
                    <div style={{ padding:'7px 14px 4px', fontSize:10, fontWeight:800, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', background:C.inputBg, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0 }}>
                      {region}
                    </div>
                    {ports.map(p => <PortRow key={p.code} port={p} />)}
                  </div>
                ))
              : results.map(p => <PortRow key={p.code} port={p} />)
            }
          </div>
        </div>
      )}

      {/* No results */}
      {open && !loading && results.length === 0 && (
        <div style={{ ...dropBase, right:0, padding:'20px 16px', textAlign:'center', minWidth:260 }}>
          <div style={{ fontSize:13.5, color:C.textMid, fontWeight:500 }}>No {portType==='air'?'airports':'ports'} found</div>
          {query && <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Try "{query.toUpperCase()}" or a city name</div>}
        </div>
      )}

      <style>{`@keyframes lpi-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Constants ── */
const TABS = [
  { id:'FCL', label:'FCL' }, { id:'LCL', label:'LCL' },
  { id:'AIR', label:'AIR' }, { id:'LAND', label:'LAND', disabled:true },
];
const TODAY = new Date().toISOString().split('T')[0];
const DEFAULT_FORM = {
  tab:'FCL', originType:'CY', destType:'CY',
  originCarrierSD:false, originIncludeNearby:false, destCarrierSD:false, destIncludeNearby:false,
  origin:null, dest:null, containerCode:'', qty:'1', cargoKg:'18000',
  cbm:'4', wm:'4', chargeableKg:'860', sailingDate:TODAY,
  currency:'USD', charges:['freight','origin','dest'], refName:'',
   actualKg:'', lengthCm:'', widthCm:'', heightCm:'', pieces:'1',
  chargeableKg:'860',
};
const ORIGIN_TOGGLES = { FCL:['DOOR','CY'], LCL:['DOOR','CFS'], AIR:null };
const DEST_TOGGLES   = { FCL:['CY','DOOR'], LCL:['CFS','DOOR'], AIR:null };
const ORIGIN_DEFAULT = { FCL:'CY', LCL:'CFS', AIR:null };
const DEST_DEFAULT   = { FCL:'CY', LCL:'CFS', AIR:null };

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function RateSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]           = useState(DEFAULT_FORM);
  const [loadOpen, setLoadOpen]   = useState(false);
  const [formError, setFormError] = useState('');
  const [containerTypes, setContainerTypes] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [dataLoading, setDataLoading]       = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [ctRes, rsRes] = await Promise.allSettled([
          getLoadTypes(),
          api.get('/rates/my-searches'),
        ]);
        if (ctRes.status === 'fulfilled') {
          setContainerTypes((ctRes.value?.data || []).map(t => ({
            code: t.loadCode, name: t.loadDescription, cbm: t.cbm, kg: t.kgs,
          })));
        }
        if (rsRes.status === 'fulfilled') {
          setRecentSearches(rsRes.value?.data || []);
        }
      } catch (e) { console.warn('Init load:', e.message); }
      finally { setDataLoading(false); }
    };
    init();
  }, []);

  // ── Prefill from "Edit Search" ──────────────────────────────
useEffect(() => {
  const prefill = location.state?.prefill;
  if (!prefill) return;

  setForm(f => ({
    ...f,
    ...(prefill.origin        && { origin: prefill.origin }),
    ...(prefill.dest          && { dest: prefill.dest }),
    ...(prefill.tab           && { tab: prefill.tab }),
    ...(prefill.containerCode && { containerCode: prefill.containerCode }),
    // reset origin/dest types to match the tab
    originType: ORIGIN_DEFAULT[prefill.tab] || 'CY',
    destType:   DEST_DEFAULT[prefill.tab]   || 'CY',
  }));

  // Clear the navigation state so refresh doesn't re-prefill
  window.history.replaceState({}, '');
}, []); // runs once on mount

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const changeTab = tab => {
    setForm(f => ({ ...f, tab, originType:ORIGIN_DEFAULT[tab]||'CY', destType:DEST_DEFAULT[tab]||'CY', origin:null, dest:null }));
    setFormError('');
  };
  const swapPorts = () => setForm(f => ({ ...f, origin:f.dest, dest:f.origin }));

  const handleSearch = () => {
    if (!form.origin) { setFormError('Please select an origin port or airport.'); return; }
    if (!form.dest)   { setFormError('Please select a destination port or airport.'); return; }
    setFormError('');
    const mode = form.tab==='FCL'?'SEA-FCL':form.tab==='LCL'?'SEA-LCL':'AIR';
    const loadLabel = form.tab==='AIR'?`${form.chargeableKg} KG`:form.tab==='LCL'?`Charged Wt: ${form.wm} W/M`:form.containerCode?`${form.containerCode} x${form.qty}`:'N/A';
    const entry = { id:`rs_${Date.now()}`, originCode:form.origin.code, originName:`${form.origin.name}, ${form.origin.country}`, destCode:form.dest.code, destName:`${form.dest.name}, ${form.dest.country}`, mode, load:loadLabel, ago:'just now' };
    setRecentSearches(p => [entry, ...p.slice(0,4)]);
   navigate('/rates/results', {
  state:{
    origin:form.origin, dest:form.dest, tab:form.tab,
    containerCode:form.containerCode, qty:form.qty, sailingDate:form.sailingDate,
    // Air-specific
    actualKg:form.actualKg, lengthCm:form.lengthCm, widthCm:form.widthCm,
    heightCm:form.heightCm, pieces:form.pieces,
  }
});
  };

  const chargesLabel = (() => {
    const sel = CHARGE_OPTIONS.filter(o => form.charges.includes(o.id));
    return sel.length ? sel.map(o => o.label.split(' ')[0]).join(', ') : 'Freight Only';
  })();

  const portType      = form.tab==='AIR' ? 'air' : 'sea';
  const originToggles = ORIGIN_TOGGLES[form.tab];
  const destToggles   = DEST_TOGGLES[form.tab];
  const iFocus = e => { e.target.style.borderColor=C.borderCyan; e.target.style.boxShadow=C.glowCyan; e.target.style.background=C.inputFocus; };
  const iBlur  = e => { e.target.style.borderColor=C.border;     e.target.style.boxShadow='none';      e.target.style.background=C.inputBg; };

  return (
    <AppLayout>
      <style>{`
        .rsp-root input:not([type=checkbox]),.rsp-root input[type=date],.rsp-root input[type=number]{background:${C.inputBg}!important;border:1.5px solid ${C.border}!important;border-radius:10px!important;color:${C.textPrimary}!important;height:46px!important;font-size:14px!important;font-family:inherit!important;transition:all 0.18s!important}
        .rsp-root input::placeholder{color:${C.textMuted}!important;font-size:13.5px!important}
        .rsp-root input:focus{border-color:${C.borderCyan}!important;box-shadow:${C.glowCyan}!important;background:${C.inputFocus}!important;outline:none!important}
        .rsp-root input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:0.5}
        .rsp-root input[type=number]::-webkit-inner-spin-button{opacity:0.3}
        .rsp-drop select{background:${C.inputBg}!important;border:1.5px solid ${C.border}!important;border-radius:9px!important;color:${C.textPrimary}!important;font-family:inherit!important;height:40px!important;padding:0 10px!important;font-size:13.5px!important;width:100%;cursor:pointer}
        .rsp-drop select:focus{border-color:${C.borderCyan}!important;outline:none}
        .ng-card{transition:all 0.2s ease}
        .ng-card:hover{border-color:${C.borderCyan}!important;box-shadow:${C.shadowMd},0 0 0 1px rgba(0,194,255,0.2)!important;transform:translateY(-3px)}
        .ng-swap{transition:all 0.22s ease}
        .ng-swap:hover{border-color:${C.borderCyan}!important;background:${C.cyanDim}!important;color:${C.cyan}!important;transform:rotate(180deg)}
        .ng-btn-primary{background:${C.btnGrad}!important;border:none!important;color:#fff!important;font-weight:700!important;box-shadow:0 4px 18px rgba(0,194,255,0.3)!important;transition:all 0.18s!important}
        .ng-btn-primary:hover{filter:brightness(1.06)!important;transform:translateY(-1px)!important}
        .ng-btn-sec{background:#fff!important;border:1.5px solid ${C.border}!important;color:${C.textBody}!important;transition:all 0.18s!important}
        .ng-btn-sec:hover{border-color:${C.borderBlue}!important;color:${C.blue}!important;background:${C.blueDim}!important}
        .ng-reset:hover{color:${C.blue}!important}
        .ng-tab{transition:all 0.15s;font-family:inherit}
        .ng-tab:hover:not(.ng-tab-on):not(:disabled){color:${C.textBody}!important;background:${C.hover}!important}
        .ng-tog-btn{transition:all 0.15s}
        .ng-tog-btn:hover:not(.active){background:${C.hover}!important;color:${C.navy}!important}
        .ng-opt{display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border-radius:8px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left;transition:background 0.1s}
        .ng-opt:hover{background:${C.hover}!important}
        .ng-opt.sel{background:${C.cyanDim}!important}
        .ng-stat{transition:all 0.18s;cursor:default}
        .ng-stat:hover{border-color:${C.borderCyan}!important;box-shadow:${C.shadowMd}!important;transform:translateY(-2px)}
        .ng-live{animation:livepulse 2s ease-in-out infinite}
        @keyframes livepulse{0%,100%{box-shadow:0 0 0 0 rgba(0,194,255,0.5)}50%{box-shadow:0 0 0 5px rgba(0,194,255,0)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="rsp-root">
        {/* HERO */}
        <div style={{ background:C.heroGrad, padding:'48px 40px 80px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:-20, right:-20, width:180, height:180, borderRadius:'50%', border:'1px solid rgba(0,194,255,0.15)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-40, left:'30%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,194,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ maxWidth:1320, margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:9, marginBottom:20, background:'rgba(0,194,255,0.15)', border:'1px solid rgba(0,194,255,0.35)', borderRadius:99, padding:'6px 16px 6px 9px' }}>
              <span className="ng-live" style={{ width:8, height:8, borderRadius:'50%', background:C.cyan, display:'inline-block', flexShrink:0 }}/>
              <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.9)', fontWeight:600 }}>Live rates · 50+ global carriers</span>
            </div>
            <h1 style={{ fontSize:40, fontWeight:900, color:'#fff', marginBottom:10, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Find the Best <span style={{ color:C.cyan }}>Freight Rates</span>
            </h1>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.7)', fontWeight:400, lineHeight:1.6 }}>
              Compare FCL · LCL · Air — instant carrier rates, transit times &amp; charges
            </p>
          </div>
        </div>

        <div style={{ maxWidth:1320, margin:'0 auto', padding:'0 28px 72px' }}>

          {/* SEARCH PANEL */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:20, padding:'0 30px 28px', boxShadow:C.shadowLg, marginTop:-48, position:'relative', zIndex:10 }}>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:`1.5px solid ${C.border}`, marginBottom:26 }}>
              {TABS.map(({ id, label, disabled }) => {
                const active = form.tab===id;
                return (
                  <button key={id} type="button" disabled={disabled}
                    className={`ng-tab ${active?'ng-tab-on':''}`}
                    onClick={() => !disabled && changeTab(id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'16px 22px', fontSize:14, fontWeight:active?700:500, color:active?C.navy:disabled?C.textMuted:C.textMid, background:'transparent', border:'none', borderBottom:`2.5px solid ${active?C.cyan:'transparent'}`, cursor:disabled?'not-allowed':'pointer', marginBottom:-1.5, opacity:disabled?0.4:1 }}>
                    <TabIcon mode={id} active={active}/>
                    {label}
                    {disabled && <span style={{ fontSize:9, fontWeight:700, background:C.hover, color:C.textMuted, padding:'1px 6px', borderRadius:4 }}>Soon</span>}
                  </button>
                );
              })}
            </div>

            {/* Origin / Swap / Dest */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 1fr', gap:18, alignItems:'start', marginBottom:20 }}>
              <div>
                <Lbl>Origin</Lbl>
                {originToggles && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <NgToggle options={originToggles} value={form.originType} onChange={set('originType')}/>
                    <NgCheck checked={form.originCarrierSD} onChange={set('originCarrierSD')} label="Carrier SD"/>
                    <NgCheck checked={form.originIncludeNearby} onChange={set('originIncludeNearby')} label="Nearby"/>
                  </div>
                )}
                {form.tab==='AIR' && <div style={{ height:6 }}/>}
                <LivePortInput value={form.origin} onChange={set('origin')} portType={portType}
                  placeholder={form.tab==='AIR'?'Search origin airport…':form.originType==='DOOR'?'Enter door address…':'Click to browse or type to search…'}
                  isDoor={form.originType==='DOOR'}/>
              </div>

              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:2, paddingTop:originToggles?42:0 }}>
                <button type="button" onClick={swapPorts} className="ng-swap"
                  style={{ width:46, height:46, border:`1.5px solid ${C.border}`, borderRadius:10, background:'#fff', color:C.textMid, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:20, boxShadow:C.shadow }}>
                  ⇄
                </button>
              </div>

              <div>
                <Lbl>Destination</Lbl>
                {destToggles && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <NgToggle options={destToggles} value={form.destType} onChange={set('destType')}/>
                    <NgCheck checked={form.destCarrierSD} onChange={set('destCarrierSD')} label="Carrier SD"/>
                    <NgCheck checked={form.destIncludeNearby} onChange={set('destIncludeNearby')} label="Nearby"/>
                  </div>
                )}
                {form.tab==='AIR' && <div style={{ height:6 }}/>}
                <LivePortInput value={form.dest} onChange={set('dest')} portType={portType}
                  placeholder={form.tab==='AIR'?'Search destination airport…':form.destType==='DOOR'?'Enter door address…':'Click to browse or type to search…'}
                  isDoor={form.destType==='DOOR'}/>
              </div>
            </div>

            <div style={{ height:1, background:C.border, marginBottom:20 }}/>

            {/* Filter Row */}
            {/* Filter Row */}
<div style={{ display:'flex', gap:14, alignItems:'flex-start', flexWrap:'wrap', marginBottom:24 }}>

  {/* Sailing Date — always shown */}
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <Lbl>Sailing Date</Lbl>
    <div style={{ position:'relative' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:C.textMuted, pointerEvents:'none', zIndex:1 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <input type="date" value={form.sailingDate} min={TODAY}
        onChange={e => setForm(f=>({...f, sailingDate:e.target.value}))}
        onFocus={iFocus} onBlur={iBlur}
        style={{ ...inputBase, paddingLeft:40, minWidth:172 }}/>
    </div>
  </div>

  {/* FCL load type */}
  {form.tab==='FCL' && (
    <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:210 }}>
      <Lbl>Load Type</Lbl>
      {dataLoading
        ? <div style={{ height:46, background:C.inputBg, border:`1.5px solid ${C.border}`, borderRadius:10, display:'flex', alignItems:'center', paddingLeft:14 }}><span style={{ fontSize:13, color:C.textMuted }}>Loading…</span></div>
        : <NgLoadType code={form.containerCode} qty={form.qty} kg={form.cargoKg} containerTypes={containerTypes} onUpdate={(c,q,k)=>setForm(f=>({...f,containerCode:c,qty:q,cargoKg:k}))} open={loadOpen} setOpen={setLoadOpen}/>
      }
    </div>
  )}

  {/* LCL load details */}
  {form.tab==='LCL' && (
    <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:220 }}>
      <Lbl>Load Details</Lbl>
      <NgLCL wm={form.wm} cbm={form.cbm} onUpdate={(wm,cbm)=>setForm(f=>({...f,wm,cbm}))}/>
    </div>
  )}

  {/* AIR — full width cargo block on its own row */}
  {form.tab==='AIR' && (
    <div style={{ width:'100%', marginTop:4 }}>
      <Lbl>Cargo Dimensions &amp; Weight</Lbl>
      <div style={{ background:C.inputBg, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'14px 16px' }}>

        {/* Single row: AW · Pieces · L · W · H */}
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr 1fr 1fr 1fr', gap:10, marginBottom: form.actualKg ? 10 : 0 }}>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Actual Weight (KG) *</div>
            <input type="number" min="0.1" step="0.1"
              value={form.actualKg||''} onChange={e=>set('actualKg')(e.target.value)}
              placeholder="e.g. 30"
              style={{ ...inputBase, height:40, fontSize:13, padding:'0 10px' }}/>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Pieces</div>
            <input type="number" min="1" step="1"
              value={form.pieces||1} onChange={e=>set('pieces')(e.target.value)}
              style={{ ...inputBase, height:40, fontSize:13, padding:'0 10px' }}/>
          </div>
          {[['L (cm)','lengthCm'],['W (cm)','widthCm'],['H (cm)','heightCm']].map(([lbl,key])=>(
            <div key={key}>
              <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{lbl}</div>
              <input type="number" min="1"
                value={form[key]||''} onChange={e=>set(key)(e.target.value)}
                placeholder="cm"
                style={{ ...inputBase, height:40, fontSize:13, padding:'0 10px' }}/>
            </div>
          ))}
        </div>

        {/* CW calculator — only shows when weight is entered */}
        {form.actualKg && (
          <div style={{ background:C.blueDim, border:`1px solid ${C.borderMid}`, borderRadius:9, padding:'10px 16px', display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
            {(() => {
              const vw = form.lengthCm && form.widthCm && form.heightCm
                ? Math.round((parseFloat(form.lengthCm)*parseFloat(form.widthCm)*parseFloat(form.heightCm))/6000*100)/100
                : 0;
              const totalVW = Math.round(vw * (parseInt(form.pieces)||1) * 100)/100;
              const totalAW = Math.round(parseFloat(form.actualKg||0) * (parseInt(form.pieces)||1) * 100)/100;
              const cw      = Math.max(totalVW, totalAW);
              return (
                <>
                  {[
                    ['Vol. Weight',        `${totalVW} KG`, false],
                    ['Act. Weight',        `${totalAW} KG`, false],
                    ['Chargeable Weight',  `${cw} KG`,      true ],
                  ].map(([l,v,highlight])=>(
                    <div key={l} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      <div style={{ fontSize:9.5, color:C.textMid, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{l}</div>
                      <div style={{ fontSize:14, fontWeight:900, color:highlight?C.navy:C.textBody, fontFamily:'ui-monospace,monospace' }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ marginLeft:'auto', padding:'5px 12px', background:'#FEF08A', border:'1px solid #FDE047', borderRadius:7, fontSize:11, fontWeight:700, color:'#92400E' }}>
                    CW = MAX(Actual, Vol. Weight) ÷ 6000
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  )}

  {/* Locals & Charges + Reference + Currency — shown for FCL/LCL only inline, for AIR in a sub-row */}
  {form.tab !== 'AIR' && (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:230 }}>
        <Lbl>Locals &amp; Charges</Lbl>
        <NgMultiSel value={form.charges} onChange={set('charges')} options={CHARGE_OPTIONS} triggerLabel={chargesLabel}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted }}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, minWidth:180 }}>
        <Lbl>Reference Name</Lbl>
        <div style={{ position:'relative' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:C.textMuted, pointerEvents:'none' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          <input value={form.refName} onChange={e=>set('refName')(e.target.value)} placeholder="Optional reference…" onFocus={iFocus} onBlur={iBlur} style={{ ...inputBase, paddingLeft:38 }}/>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:128 }}>
        <Lbl>Currency</Lbl>
        <NgSel value={form.currency} onChange={set('currency')} options={CURRENCIES.map(c=>({ value:c.code, label:`${c.symbol} ${c.code}` }))}/>
      </div>
    </>
  )}

  {/* For AIR: Locals + Currency in a compact row below the cargo block */}
  {form.tab === 'AIR' && (
    <div style={{ width:'100%', display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:220 }}>
        <Lbl>Locals &amp; Charges</Lbl>
        <NgMultiSel value={form.charges} onChange={set('charges')} options={CHARGE_OPTIONS} triggerLabel={chargesLabel}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted }}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, minWidth:180 }}>
        <Lbl>Reference Name</Lbl>
        <div style={{ position:'relative' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:C.textMuted, pointerEvents:'none' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          <input value={form.refName} onChange={e=>set('refName')(e.target.value)} placeholder="Optional reference…" onFocus={iFocus} onBlur={iBlur} style={{ ...inputBase, paddingLeft:38 }}/>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:128 }}>
        <Lbl>Currency</Lbl>
        <NgSel value={form.currency} onChange={set('currency')} options={CURRENCIES.map(c=>({ value:c.code, label:`${c.symbol} ${c.code}` }))}/>
      </div>
    </div>
  )}

</div>
            {formError && (
              <div style={{ display:'flex', alignItems:'center', gap:10, background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:10, padding:'12px 16px', fontSize:13.5, color:'#B91C1C', marginBottom:18 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                {formError}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button type="button" onClick={()=>setForm(DEFAULT_FORM)} className="ng-reset"
                style={{ display:'flex', alignItems:'center', gap:7, fontSize:13.5, fontWeight:500, color:C.textMid, background:'none', border:'none', cursor:'pointer', padding:'4px 2px', fontFamily:'inherit', transition:'color 0.15s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 01-9 9 9 9 0 01-6.3-2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M3 12a9 9 0 019-9 9 9 0 016.3 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Reset
              </button>
              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="ng-btn-sec" style={{ display:'inline-flex', alignItems:'center', gap:8, height:46, padding:'0 22px', fontSize:14, fontWeight:600, borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  Schedule Search
                </button>
                <button type="button" onClick={handleSearch} className="ng-btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:9, height:46, padding:'0 30px', fontSize:15, borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}>
                  Search Rates
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginTop:20 }}>
            {[
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="1" stroke={C.blue} strokeWidth="1.8"/><path d="M8 6v12M16 6v12" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round"/></svg>, value:'50+', label:'Carriers connected', color:C.blue, bg:C.blueDim },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, value:'10K+', label:'Global routes', color:'#059669', bg:'#ECFDF5' },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#007DAA" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="#007DAA" strokeWidth="1.8" strokeLinecap="round"/></svg>, value:'Live', label:'Rate updates', color:'#007DAA', bg:C.cyanDim },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, value:'99.8%', label:'Rate accuracy', color:'#7C3AED', bg:'#F5F3FF' },
            ].map((s,i) => (
              <div key={i} className="ng-stat" style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'center', gap:14, boxShadow:C.shadow }}>
                <div style={{ width:46, height:46, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:'-0.03em', lineHeight:1.1 }}>{s.value}</div>
                  <div style={{ fontSize:12.5, color:C.textMid, fontWeight:500, marginTop:3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Searches */}
          {/* <section style={{ marginTop:36 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, fontSize:17, fontWeight:700, color:C.textPrimary }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color:C.textMid }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Recent Searches
              </div>
              {recentSearches.length > 3 && (
                <button style={{ fontSize:13.5, color:C.blue, fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Show All →</button>
              )}
            </div>

            {dataLoading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{ background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'18px 20px', height:140 }}>
                    {[80,60,40].map((w,j)=><div key={j} style={{ height:12, background:C.border, borderRadius:6, width:`${w}%`, marginBottom:10, animation:'shimmer 1.5s infinite' }}/>)}
                  </div>
                ))}
              </div>
            ) : recentSearches.length===0 ? (
              <div style={{ textAlign:'center', padding:'32px 20px', background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:16, color:C.textMuted, fontSize:14 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color:C.border, marginBottom:10 }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <div style={{ fontWeight:600, color:C.textMid, marginBottom:4 }}>No recent searches yet</div>
                <div>Search for rates above to see your history here</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {recentSearches.slice(0,3).map(r=>(
                  <div key={r.id} className="ng-card" onClick={handleSearch}
                    style={{ background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'18px 20px', cursor:'pointer', boxShadow:C.shadow, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:C.heroGrad, borderRadius:'16px 16px 0 0' }}/>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, marginTop:4 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:C.hover, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color:C.blue }}><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v13M5 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ fontSize:13, color:C.textBody, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{r.originName}</span>
                      <span style={{ background:C.hover, color:C.navy, fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:5, fontFamily:'monospace', flexShrink:0, border:`1px solid ${C.border}` }}>{r.originCode}</span>
                    </div>
                    <div style={{ marginLeft:7, marginBottom:4 }}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0v10M2 8l4 4 4-4" stroke={C.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:C.cyanDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color:'#007DAA' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                      </div>
                      <span style={{ fontSize:13, color:C.textPrimary, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{r.destName}</span>
                      <span style={{ background:C.cyanDim, color:'#007DAA', fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:5, fontFamily:'monospace', flexShrink:0, border:'1px solid rgba(0,194,255,0.2)' }}>{r.destCode}</span>
                    </div>
                    <div style={{ height:1, background:C.border, marginBottom:12 }}/>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <NgModeTag mode={r.mode}/>
                        <span style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>{r.load}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:C.textMuted }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        {r.ago}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section> */}
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Sub-components ── */
function NgModeTag({ mode }) {
  const m = { 'SEA-FCL':{bg:'#EEF3FF',color:'#1A4FD8',border:'#BFCFFF'}, 'SEA-LCL':{bg:'#E6F9FF',color:'#007DAA',border:'#B3E9FF'}, 'AIR':{bg:'#F5F3FF',color:'#6D28D9',border:'#DDD6FE'}, 'LAND':{bg:'#FFFBEB',color:'#B45309',border:'#FDE68A'} };
  const s = m[mode]||m['SEA-FCL'];
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, letterSpacing:'0.05em', background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>{mode}</span>;
}
function NgToggle({ options, value, onChange }) {
  return (
    <div style={{ display:'inline-flex', border:`1.5px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.inputBg }}>
      {options.map(opt=>(
        <button key={opt} type="button" onClick={()=>onChange(opt)} className="ng-tog-btn"
          style={{ padding:'5px 14px', fontSize:12.5, fontWeight:600, border:'none', cursor:'pointer', background:value===opt?C.navy:'transparent', color:value===opt?'#fff':C.textMid, borderLeft:opt===options[0]?'none':`1.5px solid ${C.border}`, fontFamily:'inherit' }}>
          {opt}
        </button>
      ))}
    </div>
  );
}
function NgCheck({ checked, onChange, label }) {
  return (
    <label style={{ display:'inline-flex', alignItems:'center', gap:7, cursor:'pointer', userSelect:'none' }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange?.(e.target.checked)} style={{ display:'none' }}/>
      <span style={{ width:17, height:17, borderRadius:5, border:`1.5px solid ${checked?C.blue:C.border}`, background:checked?C.blue:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
        {checked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span style={{ fontSize:13, color:C.textMid, fontWeight:500 }}>{label}</span>
    </label>
  );
}
function NgSel({ value, onChange, options=[] }) {
  const { open, setOpen, ref } = useDropdown();
  const sel = options.find(o=>o.value===value);
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={mkTrigger(open)}>
        <span style={{ flex:1, textAlign:'left', fontSize:14, color:sel?C.textPrimary:C.textMuted, fontWeight:500 }}>{sel?.label||'Select…'}</span>
        <Chev open={open}/>
      </button>
      {open&&(
        <div className="slide-down rsp-drop" style={{ ...dropBase, right:0, minWidth:155, padding:5 }}>
          {options.map((opt,i)=>(
            <button key={i} type="button" onClick={()=>{ onChange(opt.value); setOpen(false); }}
              className={`ng-opt ${opt.value===value?'sel':''}`}
              style={{ fontSize:14, color:opt.value===value?C.blue:C.textBody, fontWeight:opt.value===value?600:400 }}>
              {opt.value===value&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, color:C.blue }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function NgMultiSel({ value=[], onChange, options=[], triggerLabel, icon }) {
  const { open, setOpen, ref } = useDropdown();
  const toggle = id => { if (options.find(o=>o.id===id)?.required) return; onChange(value.includes(id)?value.filter(v=>v!==id):[...value,id]); };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={mkTrigger(open)}>
        <span style={{ display:'flex', alignItems:'center', flexShrink:0 }}>{icon}</span>
        <span style={{ flex:1, textAlign:'left', fontSize:14, color:C.textBody, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{triggerLabel}</span>
        <Chev open={open}/>
      </button>
      {open&&(
        <div className="slide-down rsp-drop" style={{ ...dropBase, minWidth:290 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 8px', borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.08em' }}>Charges</span>
            <div style={{ display:'flex', gap:12 }}>
              <button type="button" style={{ fontSize:12.5, color:C.textMid, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }} onClick={()=>onChange([])}>Clear</button>
              <button type="button" style={{ fontSize:12.5, color:C.blue, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }} onClick={()=>onChange(options.map(o=>o.id))}>Select All</button>
            </div>
          </div>
          <div style={{ padding:'6px' }}>
            {options.map(opt=>(
              <button key={opt.id} type="button" onClick={()=>toggle(opt.id)} className="ng-opt" style={{ cursor:opt.required?'default':'pointer' }}>
                <span style={{ width:17, height:17, borderRadius:5, border:`1.5px solid ${value.includes(opt.id)?C.blue:C.border}`, background:value.includes(opt.id)?C.blue:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {value.includes(opt.id)&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span style={{ fontSize:13.5, color:C.textBody }}>{opt.label}</span>
                {opt.required&&<span style={{ marginLeft:'auto', fontSize:11, color:C.textMuted, fontStyle:'italic' }}>required</span>}
              </button>
            ))}
          </div>
          <div style={{ padding:'8px 12px 12px', borderTop:`1px solid ${C.border}` }}>
            <button type="button" onClick={()=>setOpen(false)} style={doneBtn}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
function NgLoadType({ code, qty, kg, onUpdate, open, setOpen, containerTypes=[] }) {
  const ref = React.useRef();
  React.useEffect(() => {
    const h = e => { if (ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [setOpen]);
  const sel   = containerTypes.find(c=>c.code===code);
  const label = sel ? `${sel.code} × ${qty}` : 'Select load type';
  const numSt = { height:40, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit', background:C.inputBg, color:C.textPrimary, outline:'none', width:'100%', textAlign:'center' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={mkTrigger(open)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted }}><rect x="2" y="6" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M8 6v12M16 6v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span style={{ flex:1, textAlign:'left', fontSize:14, color:sel?C.textPrimary:C.textMuted, fontWeight:sel?500:400 }}>{label}</span>
        <Chev open={open}/>
      </button>
      {open&&(
        <div className="slide-down rsp-drop" style={{ ...dropBase, minWidth:470 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 78px 160px 70px', gap:10, padding:'12px 16px 9px', borderBottom:`1px solid ${C.border}` }}>
            {['Load Type','Qty','Cargo Weight',''].map((h,i)=><span key={i} style={{ fontSize:10.5, fontWeight:700, color:C.textMid, textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</span>)}
          </div>
          <div className="rsp-drop" style={{ display:'grid', gridTemplateColumns:'1fr 78px 160px 70px', gap:10, padding:'14px 16px', alignItems:'center' }}>
            <select value={code} onChange={e=>onUpdate(e.target.value,qty,kg)}>
              <option value="">Select type</option>
              {containerTypes.map(c=><option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
            <input type="number" min="1" max="99" value={qty} onChange={e=>onUpdate(code,e.target.value,kg)} style={numSt}/>
            <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.border}`, borderRadius:8, overflow:'hidden', height:40 }}>
              <input type="number" min="1" value={kg} onChange={e=>onUpdate(code,qty,e.target.value)} style={{ ...numSt, border:'none', borderRadius:0, flex:1, width:'auto', textAlign:'left', padding:'0 8px' }}/>
              <span style={{ padding:'0 10px', background:C.cyanDim, borderLeft:`1px solid rgba(0,194,255,0.2)`, height:'100%', display:'flex', alignItems:'center', fontSize:11, fontWeight:800, color:'#007DAA', whiteSpace:'nowrap' }}>KG</span>
            </div>
            <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
              <button type="button" onClick={()=>onUpdate(code,Math.max(1,parseInt(qty||1)-1).toString(),kg)} style={{ width:30, height:30, borderRadius:'50%', border:`1.5px solid ${C.border}`, background:'#fff', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', color:C.textMid }}>−</button>
              <button type="button" onClick={()=>onUpdate(code,(parseInt(qty||1)+1).toString(),kg)} style={{ width:30, height:30, borderRadius:'50%', border:`1.5px solid ${C.borderCyan}`, background:C.cyanDim, cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', color:'#007DAA' }}>+</button>
            </div>
          </div>
          <div style={{ padding:'10px 16px 14px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button type="button" onClick={()=>onUpdate('','1','')} style={{ fontSize:13, color:C.textMid, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Reset</button>
            <button type="button" onClick={()=>setOpen(false)} style={{ ...doneBtn, width:'auto', padding:'9px 28px', height:'auto', fontSize:14 }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
function NgLCL({ wm, cbm, onUpdate }) {
  const { open, setOpen, ref } = useDropdown();
  const fSt = { width:'100%', height:44, padding:'0 12px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:14, fontFamily:'inherit', background:C.inputBg, color:C.textPrimary, outline:'none' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={mkTrigger(open)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color:C.textMuted, flexShrink:0 }}><rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="2" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
        <span style={{ flex:1, textAlign:'left', fontSize:14, color:C.textPrimary, fontWeight:500 }}>Charged Wt: {wm} W/M</span>
        <Chev open={open}/>
      </button>
      {open&&(
        <div className="slide-down rsp-drop" style={{ ...dropBase, minWidth:310, padding:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><Lbl>Volume (CBM)</Lbl><input type="number" min="0.01" step="0.01" value={cbm} onChange={e=>onUpdate(wm,e.target.value)} style={fSt}/></div>
            <div><Lbl>Weight (W/M)</Lbl><input type="number" min="0.01" step="0.01" value={wm} onChange={e=>onUpdate(e.target.value,cbm)} style={fSt}/></div>
          </div>
          <button type="button" onClick={()=>setOpen(false)} style={doneBtn}>Done</button>
        </div>
      )}
    </div>
  );
}
