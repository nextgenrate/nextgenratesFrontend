import React, { useState, useRef, useEffect } from 'react';

/* ── Design tokens ── */
export const T = {
  ink:       '#0B0F1A',
  steel:     '#111827',
  plate:     '#1A2235',
  rail:      '#232D42',
  border:    '#1E2D47',
  borderHov: '#2A3E5E',
  amber:     '#F59E0B',
  amberDim:  'rgba(245,158,11,0.12)',
  amberGlow: 'rgba(245,158,11,0.25)',
  cyan:      '#22D3EE',
  cyanDim:   'rgba(34,211,238,0.1)',
  text:      '#E2E8F0',
  sub:       '#8899BB',
  muted:     '#4A5870',
  red:       '#F43F5E',
  redDim:    'rgba(244,63,94,0.1)',
  green:     '#10B981',
  mono:      "'Space Mono', monospace",
  head:      "'Syne', sans-serif",
  body:      "'Outfit', sans-serif",
};

/* ── Shared style builders ── */
export const fieldWrap = { display: 'flex', flexDirection: 'column' };

export const fieldLabel = {
  fontFamily: T.mono,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.muted,
  display: 'block',
  marginBottom: 6,
};

export const inputBase = (focused = false, err = false) => ({
  height: 44,
  padding: '0 14px',
  background: focused ? '#0A0C14' : T.steel,
  border: `1.5px solid ${err ? T.red : focused ? T.amber : T.border}`,
  borderRadius: 9,
  color: T.text,
  fontSize: 13.5,
  fontFamily: T.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  boxShadow: focused ? `0 0 0 3px ${T.amberGlow}` : 'none',
  transition: 'all 0.18s',
});

export const selectBase = {
  ...inputBase(),
  cursor: 'pointer',
  paddingRight: 34,
  appearance: 'none',
  WebkitAppearance: 'none',
  fontFamily: T.mono,
  fontSize: 13,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234A5870' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 11px center',
};

/* ════════════════════════════════
   FOCUSED INPUT
════════════════════════════════ */
export function FInput({ value, onChange, placeholder, type = 'text', min, style = {} }) {
  const [f, setF] = useState(false);
  return (
    <input
      value={value} onChange={onChange} type={type} min={min}
      placeholder={placeholder}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...inputBase(f), ...style }}
    />
  );
}

/* ════════════════════════════════
   PORT SEARCH INPUT
════════════════════════════════ */
export function PortInput({ value, onChange, ports = [], placeholder, isDoor = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();
  const inputRef = useRef();
  const blurTimer = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = ports.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const displayVal = value ? `${value.name}, ${value.country}` : '';
  const [focused, setFocused] = useState(false);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Icon */}
        <span style={{ position: 'absolute', left: 12, color: T.muted, display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
          {isDoor ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v13M5 10h14M5 20c0-3.5 3.1-5 7-5s7 1.5 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || (isDoor ? 'Door address…' : 'Port or city…')}
          value={open ? query : displayVal}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); setFocused(true); }}
          onBlur={() => {
            setFocused(false);
            blurTimer.current = setTimeout(() => setOpen(false), 180);
          }}
          autoComplete="off"
          style={{
            ...inputBase(focused),
            paddingLeft: 38,
            paddingRight: value ? 72 : 14,
          }}
        />

        {/* Port code badge */}
        {value && !open && (
          <span style={{
            position: 'absolute', right: 34,
            background: T.amberDim, color: T.amber,
            fontFamily: T.mono, fontSize: 9.5, fontWeight: 700,
            padding: '2px 8px', borderRadius: 5,
            border: `1px solid rgba(245,158,11,0.2)`,
            letterSpacing: '0.05em', pointerEvents: 'none',
          }}>
            {value.code}
          </span>
        )}

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onMouseDown={() => { clearTimeout(blurTimer.current); onChange(null); setQuery(''); }}
            style={{
              position: 'absolute', right: 10,
              width: 18, height: 18, borderRadius: '50%',
              background: T.muted, border: 'none', cursor: 'pointer',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
            }}
          >✕</button>
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0D1220',
          border: `1px solid ${T.borderHov}`,
          borderRadius: 11,
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          zIndex: 300, overflow: 'hidden',
        }}>
          {filtered.map(p => (
            <button
              key={p.code}
              type="button"
              onMouseDown={() => { clearTimeout(blurTimer.current); onChange(p); setOpen(false); setQuery(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: 'transparent', border: 'none',
                borderBottom: `1px solid ${T.border}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: T.muted, flexShrink: 0 }}>
                <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 7v13M5 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.country} · {p.region}</div>
              </div>
              <span style={{
                background: T.amber, color: '#0B0F1A',
                fontFamily: T.mono, fontSize: 9.5, fontWeight: 700,
                padding: '2px 7px', borderRadius: 4,
                letterSpacing: '0.05em', flexShrink: 0,
              }}>{p.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   PILL TOGGLE
════════════════════════════════ */
export function PillToggle({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: T.steel,
      borderRadius: 7,
      padding: 3,
      border: `1px solid ${T.border}`,
      gap: 2,
    }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(o)}
            style={{
              padding: '4px 11px',
              borderRadius: 5, border: 'none', cursor: 'pointer',
              fontFamily: T.mono, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.05em', transition: 'all 0.13s',
              background: active ? T.amber : 'transparent',
              color: active ? '#0B0F1A' : T.sub,
            }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════
   CHECKBOX
════════════════════════════════ */
export function Chk({ checked, onChange, label: lbl }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 15, height: 15, borderRadius: 4,
          border: `1.5px solid ${checked ? T.amber : T.border}`,
          background: checked ? T.amberDim : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <polyline points="20 6 9 17 4 12" stroke={T.amber} strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 11.5, color: T.sub, fontFamily: T.body }}>{lbl}</span>
    </label>
  );
}

/* ════════════════════════════════
   MULTI-SELECT DROPDOWN
════════════════════════════════ */
export function MultiSelect({ value, onChange, options, triggerLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = id => {
    if (options.find(o => o.id === id)?.required) return;
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          ...inputBase(open),
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', padding: '0 14px',
        }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke={T.amber} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {triggerLabel}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" stroke={T.sub} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 230, background: '#0D1220',
          border: `1px solid ${T.borderHov}`,
          borderRadius: 11,
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          zIndex: 400, padding: 6,
        }}>
          {options.map(o => {
            const sel = value.includes(o.id);
            return (
              <button key={o.id} type="button" onClick={() => toggle(o.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 7, border: 'none',
                  background: sel ? T.amberDim : 'transparent',
                  cursor: o.required ? 'default' : 'pointer',
                  fontFamily: T.body, transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!o.required && !sel) e.currentTarget.style.background = 'rgba(245,158,11,0.05)'; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1.5px solid ${sel ? T.amber : T.border}`,
                  background: sel ? T.amber : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.13s',
                }}>
                  {sel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#0B0F1A" strokeWidth="3.5" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: T.text, flex: 1, textAlign: 'left' }}>{o.label}</span>
                {o.required && <span style={{ fontSize: 9.5, color: T.muted, fontFamily: T.mono }}>REQ</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   FCL LOAD SELECTOR
════════════════════════════════ */
export function LoadTypeSelector({ code, qty, kg, onUpdate, open, setOpen }) {
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [setOpen]);

  const label = code ? `${code} × ${qty}` : 'Select container…';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          ...inputBase(open),
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', padding: '0 14px',
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="20" height="12" rx="1.5" stroke={T.amber} strokeWidth="1.5"/>
          <path d="M8 6v12M16 6v12" stroke={T.amber} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: code ? T.text : T.muted, fontFamily: T.mono }}>
          {label}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" stroke={T.sub} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 460, background: '#0D1220',
          border: `1px solid ${T.borderHov}`,
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          zIndex: 400,
        }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px 72px', gap: 10, padding: '12px 16px 10px', borderBottom: `1px solid ${T.border}` }}>
            {['Container Type', 'Qty', 'Cargo (KG)', ''].map((h, i) => (
              <span key={i} style={{ ...fieldLabel, marginBottom: 0 }}>{h}</span>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px 72px', gap: 10, padding: '14px 16px', alignItems: 'center' }}>
            <select value={code} onChange={e => onUpdate(e.target.value, qty, kg)}
              style={{ ...selectBase, height: 38, fontSize: 12, padding: '0 28px 0 10px' }}>
              <option value="">Select…</option>
              {[
                ['20FT', '20FT Dry'],  ['40FT', '40FT Dry'],
                ['40HC', '40HC Dry'],  ['20RF', '20FT Reefer'],
                ['40RF', '40FT Reefer'], ['20OT', '20FT Open Top'],
                ['40OT', '40FT Open Top'], ['20FR', '20FT Flat Rack'],
              ].map(([v, l]) => <option key={v} value={v}>{v} — {l}</option>)}
            </select>

            <input type="number" min="1" max="99" value={qty}
              onChange={e => onUpdate(code, e.target.value, kg)}
              style={{ ...inputBase(), height: 38, textAlign: 'center', fontSize: 14, fontFamily: T.mono, padding: '0 6px' }}
            />

            <input type="number" min="1" value={kg}
              onChange={e => onUpdate(code, qty, e.target.value)}
              style={{ ...inputBase(), height: 38, textAlign: 'center', fontSize: 13, fontFamily: T.mono, padding: '0 8px' }}
            />

            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={() => onUpdate(code, Math.max(1, parseInt(qty || 1) - 1).toString(), kg)}
                style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub }}>−</button>
              <button type="button" onClick={() => onUpdate(code, (parseInt(qty || 1) + 1).toString(), kg)}
                style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${T.amber}`, background: T.amberDim, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber }}>+</button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={() => onUpdate('', '1', '')}
              style={{ fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.body }}>
              Clear
            </button>
            <button type="button" onClick={() => setOpen(false)}
              style={{ background: T.amber, color: '#0B0F1A', border: 'none', borderRadius: 7, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.body }}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   LCL LOAD SELECTOR
════════════════════════════════ */
export function LCLLoadSelector({ wm, cbm, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ ...inputBase(open), display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0 14px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="2" width="8" height="8" rx="1" stroke={T.amber} strokeWidth="1.5"/>
          <rect x="14" y="2" width="8" height="8" rx="1" stroke={T.amber} strokeWidth="1.5"/>
          <rect x="2" y="14" width="8" height="8" rx="1" stroke={T.amber} strokeWidth="1.5"/>
          <rect x="14" y="14" width="8" height="8" rx="1" stroke={T.amber} strokeWidth="1.5"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: T.text, fontFamily: T.mono }}>
          W/M: {wm} · CBM: {cbm}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" stroke={T.sub} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 300, background: '#0D1220',
          border: `1px solid ${T.borderHov}`,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
          zIndex: 400, padding: 18,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={fieldWrap}>
              <span style={fieldLabel}>Volume (CBM)</span>
              <input type="number" min="0.01" step="0.01" value={cbm}
                onChange={e => onUpdate(wm, e.target.value)}
                style={{ ...inputBase(), height: 38, fontFamily: T.mono, textAlign: 'center' }}/>
            </div>
            <div style={fieldWrap}>
              <span style={fieldLabel}>Weight (W/M)</span>
              <input type="number" min="0.01" step="0.01" value={wm}
                onChange={e => onUpdate(e.target.value, cbm)}
                style={{ ...inputBase(), height: 38, fontFamily: T.mono, textAlign: 'center' }}/>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            style={{ width: '100%', background: T.amber, color: '#0B0F1A', border: 'none', borderRadius: 7, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.body }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   STATUS BADGE
════════════════════════════════ */
const STATUS_MAP = {
  'With Rates':      { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', border: 'rgba(16,185,129,0.3)'  },
  'No Rates':        { bg: 'rgba(244,63,94,0.1)',   color: '#F43F5E', border: 'rgba(244,63,94,0.3)'   },
  'Expired':         { bg: 'rgba(75,85,101,0.1)',   color: '#8899BB', border: 'rgba(75,85,101,0.3)'   },
  'Booking Placed':  { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  },
  'Rates Available': { bg: 'rgba(34,211,238,0.1)',  color: '#22D3EE', border: 'rgba(34,211,238,0.3)'  },
  'Quoted':          { bg: 'rgba(139,92,246,0.1)',  color: '#A78BFA', border: 'rgba(139,92,246,0.3)'  },
  'Lost':            { bg: 'rgba(244,63,94,0.1)',   color: '#F43F5E', border: 'rgba(244,63,94,0.3)'   },
  'pending':         { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  },
  'approved':        { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', border: 'rgba(16,185,129,0.3)'  },
  'rejected':        { bg: 'rgba(244,63,94,0.1)',   color: '#F43F5E', border: 'rgba(244,63,94,0.3)'   },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP['Expired'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11.5,
      fontWeight: 600, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
      fontFamily: T.body,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
      {status}
    </span>
  );
}

/* ════════════════════════════════
   MODE BADGE (recent cards)
════════════════════════════════ */
export function ModeBadge({ mode }) {
  const cfg = {
    'SEA-FCL': { color: '#60A5FA', bg: '#1E3A5F' },
    'SEA-LCL': { color: '#34D399', bg: '#0F3D2E' },
    'AIR':     { color: '#C084FC', bg: '#3B1E5A' },
  }[mode] || { color: T.sub, bg: T.plate };

  return (
    <span style={{
      fontFamily: T.mono, fontSize: 9, fontWeight: 800,
      letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 4,
      color: cfg.color, background: cfg.bg,
    }}>
      {mode === 'SEA-FCL' ? 'FCL' : mode === 'SEA-LCL' ? 'LCL' : mode}
    </span>
  );
}

/* ════════════════════════════════
   PORT BADGE
════════════════════════════════ */
export function PortBadge({ code, variant = 'origin' }) {
  const isOrigin = variant === 'origin';
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 9.5, fontWeight: 700,
      background: isOrigin ? T.amberDim : T.cyanDim,
      color: isOrigin ? T.amber : T.cyan,
      padding: '2px 8px', borderRadius: 5,
      border: `1px solid ${isOrigin ? 'rgba(245,158,11,0.2)' : 'rgba(34,211,238,0.2)'}`,
      letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {code}
    </span>
  );
}

/* ════════════════════════════════
   SPINNER
════════════════════════════════ */
export function Spinner({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'ff-spin 0.75s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke={T.amber} strokeWidth="2.5" strokeOpacity="0.2"/>
      <path d="M12 3a9 9 0 019 9" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ════════════════════════════════
   EMPTY STATE
════════════════════════════════ */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: T.plate, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: T.muted }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: T.muted, maxWidth: 380, marginBottom: 20, lineHeight: 1.6 }}>{description}</div>}
      {action}
    </div>
  );
}