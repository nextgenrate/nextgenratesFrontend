import React, { useState, useRef, useEffect } from 'react';

/* ════════════════════════════════════════════════════════════
   FIELD WRAPPER
════════════════════════════════════════════════════════════ */
export function Field({ label, children, error, required, style={} }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5,...style}}>
      {label && (
        <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em'}}>
          {label}{required && <span style={{color:'#DC2626',marginLeft:2}}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{fontSize:11.5,color:'#DC2626'}}>{error}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TEXT INPUT
════════════════════════════════════════════════════════════ */
const INPUT_BASE = {
  width:'100%', height:42, padding:'0 12px',
  border:'1.5px solid #D4DCFF', borderRadius:8,
  background:'#fff', fontSize:14, color:'#0F172A',
  fontFamily:'inherit', outline:'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
};

export function Input({ type='text', placeholder, value, onChange, onBlur, prefix, suffix, clearable, disabled, readOnly, autoComplete, style={} }) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? '#1A3CC8' : '#D4DCFF';
  const boxShadow   = focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none';

  return (
    <div style={{position:'relative',display:'flex',alignItems:'center'}}>
      {prefix && <span style={{position:'absolute',left:12,color:'#94A3B8',display:'flex',alignItems:'center',pointerEvents:'none',zIndex:1}}>{prefix}</span>}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={onChange} onBlur={e=>{setFocused(false);onBlur?.(e);}}
        onFocus={()=>setFocused(true)}
        disabled={disabled} readOnly={readOnly} autoComplete={autoComplete}
        style={{
          ...INPUT_BASE,
          borderColor, boxShadow,
          paddingLeft:  prefix  ? 38 : 12,
          paddingRight: (clearable && value) || suffix ? 36 : 12,
          opacity: disabled ? 0.55 : 1,
          cursor:  disabled ? 'not-allowed' : 'text',
          ...style,
        }}
      />
      {clearable && value && (
        <button type="button" onClick={() => onChange?.({ target:{ value:'' } })}
          style={{position:'absolute',right:10,width:18,height:18,borderRadius:'50%',background:'#94A3B8',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>
          ✕
        </button>
      )}
      {suffix && <span style={{position:'absolute',right:10,color:'#94A3B8',display:'flex',alignItems:'center'}}>{suffix}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PORT SEARCH INPUT
════════════════════════════════════════════════════════════ */
export function PortInput({ value, onChange, ports=[], placeholder, isDoor=false }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = ports.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.country.toLowerCase().includes(q);
  }).slice(0, 8);

  const displayVal = value ? `${value.name}, ${value.country}` : '';

  return (
    <div ref={ref} style={{position:'relative'}}>
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {/* Anchor or Door icon */}
        <span style={{position:'absolute',left:12,color:'#94A3B8',display:'flex',alignItems:'center',pointerEvents:'none'}}>
          {isDoor
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v13M5 10h14M5 20c0-3.5 3.1-5 7-5s7 1.5 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          }
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || (isDoor ? 'Search by Door' : 'Search by Port')}
          value={open ? query : displayVal}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          autoComplete="off"
          style={{
            ...INPUT_BASE,
            paddingLeft:38,
            paddingRight: value ? 76 : 12,
          }}
          onFocus_actual={() => inputRef.current?.select()}
        />
        {value && !open && (
          <span style={{position:'absolute',right:32,background:'#1A3CC8',color:'#fff',fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:5,fontFamily:'monospace',letterSpacing:'0.05em'}}>{value.code}</span>
        )}
        {value && (
          <button type="button" onClick={() => { onChange(null); setQuery(''); }}
            style={{position:'absolute',right:9,width:18,height:18,borderRadius:'50%',background:'#94A3B8',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="slide-down" style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #D4DCFF',borderRadius:12,boxShadow:'0 10px 40px rgba(0,0,0,0.12)',zIndex:300,overflow:'hidden'}}>
          {filtered.map(p => (
            <button key={p.code} type="button"
              onClick={() => { onChange(p); setOpen(false); setQuery(''); }}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background:'transparent',border:'none',borderBottom:'1px solid #F0F4FF',cursor:'pointer',textAlign:'left',transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#F0F4FF'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{color:'#94A3B8',flexShrink:0}}>
                <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 7v13M5 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'#0F172A'}}>{p.name}</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>{p.country} · {p.region}</div>
              </div>
              <span style={{background:'#1A3CC8',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,fontFamily:'monospace',flexShrink:0}}>{p.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SELECT DROPDOWN
════════════════════════════════════════════════════════════ */
export function Select({ value, onChange, options=[], placeholder, disabled, prefix, style={} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const getLabel = opt => typeof opt === 'string' ? opt : opt.label ?? opt.name ?? opt.code;
  const getValue = opt => typeof opt === 'string' ? opt : opt.value ?? opt.code ?? opt;
  const selected = options.find(o => getValue(o) === value);

  return (
    <div ref={ref} style={{position:'relative',...style}}>
      <button type="button" disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          display:'flex',alignItems:'center',gap:8,width:'100%',height:42,padding:'0 12px',
          border:`1.5px solid ${open ? '#1A3CC8' : '#D4DCFF'}`,borderRadius:8,
          background:'#fff',cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          opacity: disabled ? 0.55 : 1,
          transition:'border-color 0.15s,box-shadow 0.15s',
        }}
      >
        {prefix && <span style={{display:'flex',alignItems:'center',color:'#94A3B8',flexShrink:0}}>{prefix}</span>}
        <span style={{flex:1,textAlign:'left',fontSize:14,color:selected?'#0F172A':'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {selected ? getLabel(selected) : (placeholder || 'Select…')}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{color:'#94A3B8',flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform 0.15s'}}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="slide-down" style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid #D4DCFF',borderRadius:12,boxShadow:'0 10px 40px rgba(0,0,0,0.12)',zIndex:300,maxHeight:260,overflowY:'auto',padding:5}}>
          {options.map((opt, i) => {
            const label = getLabel(opt);
            const val   = getValue(opt);
            const sel   = val === value;
            return (
              <button key={i} type="button"
                onClick={() => { onChange(val); setOpen(false); }}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 10px',borderRadius:7,background:sel?'#EEF3FF':'transparent',border:'none',cursor:'pointer',fontSize:13.5,color:sel?'#1A3CC8':'#0F172A',fontFamily:'inherit',textAlign:'left',transition:'background 0.1s',fontWeight:sel?500:400}}
                onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='#F0F4FF'; }}
                onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background='transparent'; }}
              >
                <span style={{width:14,flexShrink:0}}>
                  {sel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#1A3CC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TOGGLE GROUP  (DOOR/CY or DOOR/CFS)
════════════════════════════════════════════════════════════ */
export function ToggleGroup({ options, value, onChange, disabled }) {
  return (
    <div style={{display:'inline-flex',border:'1.5px solid #D4DCFF',borderRadius:8,overflow:'hidden',flexShrink:0}}>
      {options.map(opt => (
        <button key={opt} type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(opt)}
          style={{
            padding:'5px 14px', fontSize:12.5, fontWeight:value===opt?600:500,
            color:     value===opt ? '#fff'    : '#475569',
            background:value===opt ? '#0D1B5E' : '#fff',
            border:'none',cursor:disabled?'not-allowed':'pointer',
            borderLeft: opt === options[0] ? 'none' : '1.5px solid #D4DCFF',
            transition:'all 0.15s', lineHeight:1,
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CHECKBOX
════════════════════════════════════════════════════════════ */
export function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:7,cursor:disabled?'not-allowed':'pointer',userSelect:'none',opacity:disabled?0.55:1}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange?.(e.target.checked)} disabled={disabled} style={{position:'absolute',opacity:0,width:0,height:0}}/>
      <span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?'#1A3CC8':'#B8C8FF'}`,background:checked?'#1A3CC8':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {label && <span style={{fontSize:12.5,color:'#475569'}}>{label}</span>}
    </label>
  );
}

/* ════════════════════════════════════════════════════════════
   RADIO
════════════════════════════════════════════════════════════ */
export function Radio({ checked, onChange, label }) {
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
      <input type="radio" checked={checked} onChange={()=>onChange?.()} style={{position:'absolute',opacity:0,width:0,height:0}}/>
      <span style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${checked?'#1A3CC8':'#B8C8FF'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
        {checked && <span style={{width:7,height:7,borderRadius:'50%',background:'#1A3CC8'}}/>}
      </span>
      {label && <span style={{fontSize:13,color:checked?'#0F172A':'#475569',fontWeight:checked?500:400}}>{label}</span>}
    </label>
  );
}

/* ════════════════════════════════════════════════════════════
   MULTI-SELECT (Charges)
════════════════════════════════════════════════════════════ */
export function MultiSelect({ value=[], onChange, options=[], triggerLabel, prefix }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = id => {
    if (options.find(o=>o.id===id)?.required) return;
    onChange(value.includes(id) ? value.filter(v=>v!==id) : [...value, id]);
  };

  const label = (() => {
    if (triggerLabel) return triggerLabel;
    const sel = options.filter(o => value.includes(o.id));
    return sel.length ? sel.map(o => o.label.split(' ')[0]).join(', ') : 'Select charges';
  })();

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" onClick={() => setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:8,width:'100%',height:42,padding:'0 12px',border:`1.5px solid ${open?'#1A3CC8':'#D4DCFF'}`,borderRadius:8,background:'#fff',cursor:'pointer',fontFamily:'inherit',boxShadow:open?'0 0 0 3px rgba(37,99,235,0.1)':'none',transition:'all 0.15s'}}>
        {prefix && <span style={{color:'#94A3B8',flexShrink:0,display:'flex',alignItems:'center'}}>{prefix}</span>}
        <span style={{flex:1,textAlign:'left',fontSize:14,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{color:'#94A3B8',flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform 0.15s'}}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="slide-down" style={{position:'absolute',top:'calc(100% + 6px)',left:0,minWidth:260,background:'#fff',border:'1px solid #D4DCFF',borderRadius:12,boxShadow:'0 10px 40px rgba(0,0,0,0.12)',zIndex:300,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 8px',borderBottom:'1px solid #D4DCFF'}}>
            <span style={{fontSize:11,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.05em'}}>Locals and Customs</span>
            <div style={{display:'flex',gap:8}}>
              <button type="button" style={{fontSize:11,color:'#94A3B8',background:'none',border:'none',cursor:'pointer'}} onClick={()=>onChange([])}>Clear All</button>
              <button type="button" style={{fontSize:11,color:'#1A3CC8',background:'none',border:'none',cursor:'pointer'}} onClick={()=>onChange(options.map(o=>o.id))}>Select All</button>
            </div>
          </div>
          <div style={{padding:'6px'}}>
            {options.map(opt => (
              <button key={opt.id} type="button"
                onClick={() => toggle(opt.id)}
                style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 10px',borderRadius:7,background:'transparent',border:'none',cursor:opt.required?'default':'pointer',fontFamily:'inherit',textAlign:'left',transition:'background 0.1s'}}
                onMouseEnter={e=>{if(!opt.required)e.currentTarget.style.background='#F0F4FF';}}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${value.includes(opt.id)?'#1A3CC8':'#B8C8FF'}`,background:value.includes(opt.id)?'#1A3CC8':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                  {value.includes(opt.id) && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span style={{fontSize:13,color:'#0F172A'}}>{opt.label}</span>
                {opt.required && <span style={{marginLeft:'auto',fontSize:10,color:'#94A3B8'}}>required</span>}
              </button>
            ))}
          </div>
          <div style={{padding:'8px 14px 12px',borderTop:'1px solid #D4DCFF'}}>
            <Button onClick={() => setOpen(false)} style={{width:'100%',justifyContent:'center',background:'#0D1B5E',color:'#fff',height:36,borderRadius:8,fontSize:13,fontWeight:600}}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// local Button for MultiSelect
function Button({ onClick, style={}, children }) {
  return <button type="button" onClick={onClick} style={{display:'flex',alignItems:'center',border:'none',cursor:'pointer',fontFamily:'inherit',...style}}>{children}</button>;
}
