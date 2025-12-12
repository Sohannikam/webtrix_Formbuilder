import React, { useMemo, useState } from 'react';
import { API_BASE_URL } from '@config/config';
import { fetchJson } from '@utils/fetchJson';

export default function PublicLeadForm({ config, onSuccess }) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const themeColor = config?.theme?.color || '#1a73e8';


  const fieldBlocks = useMemo(()=>{
    const items = [];
    for (const r of config?.rows||[]) for (const c of r.columns||[]) for (const i of c.items||[]) if (i.type==='field') items.push(i);
    return items;
  }, [config]);

  const set = (key,val)=> setData(d=>({...d, [key]:val}));


  const validate = () => {
    const e = {};
    for (const b of fieldBlocks) {
      const p = b.props||{};
      const v = (data[p.fieldKey] ?? '').toString();
      if (p.required && (!v || !v.trim())) e[p.fieldKey] = 'Required';
      if (!e[p.fieldKey] && p.pattern) {
        try { const re = new RegExp(p.pattern); if (!re.test(v)) e[p.fieldKey] = 'Invalid format'; } catch {}
      }
      if (!e[p.fieldKey] && p.minLength && v.length < p.minLength) e[p.fieldKey] = `Min ${p.minLength} chars`;
      if (!e[p.fieldKey] && p.maxLength && v.length > p.maxLength) e[p.fieldKey] = `Max ${p.maxLength} chars`;
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };


  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Map to lead payload: we just send the collected key-values
    try {
      const res = await fetchJson(`${API_BASE_URL}/lead/create`, {
        method:'POST',
        body: JSON.stringify(data)
      });
      if (res?.flag==='S') {
        if (config?.submit?.thankYou?.type==='redirect' && config.submit.thankYou.url) {
          window.location.href = config.submit.thankYou.url;
          return;
        }
        onSuccess?.(res);
      } else {
        alert(res?.msg || 'Failed to submit');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const renderBlock = (b) => {
    if (b.type==='title') {
      const { text, align='left', tag='h2' } = b.props||{};
      const Tag = tag;
      return <Tag className={`text-xl font-semibold text-${align}`}>{text}</Tag>;
    }
    if (b.type==='text') {
      const { html, align='left' } = b.props||{};
      return <div className={`text-${align} text-gray-700`} dangerouslySetInnerHTML={{__html:html}}/>;
    }
    if (b.type==='image') {
      const { url, alt, link, rounded=true, fit='cover' } = b.props||{};
      const img = <img src={url} alt={alt||''} className={`w-full ${rounded?'rounded-xl':''}`} style={{objectFit:fit}}/>;
      return url ? (link ? <a href={link} target="_blank" rel="noreferrer">{img}</a> : img) : null;
    }
    if (b.type==='divider') return <div className="h-px bg-gray-200 my-2"/>;
    if (b.type==='spacer') return <div style={{height:(b.props?.height||16)}}/>;
    if (b.type==='field') {
      const p = b.props||{};
      return (
        <label className="block">
          <div className="text-sm text-gray-700 mb-1">{p.label || p.fieldKey}{p.required && <span className="text-red-500">*</span>}</div>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder={p.placeholder||''}
            value={data[p.fieldKey]||''}
            onChange={e=>set(p.fieldKey, e.target.value)}
          />
          {errors[p.fieldKey] && <div className="text-xs text-red-500 mt-1">{errors[p.fieldKey]}</div>}
        </label>
      );
    }
    return null;
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="space-y-6">
        {(config?.rows||[]).map(row=>(
          <div key={row.id} className="grid md:grid-cols-12 gap-4">
            {(row.columns||[]).map(col=>(
              <div key={col.id} className={`md:col-span-${col.width} space-y-3`}>
                {(col.items||[]).map(it=>(
                  <div key={it.id}>{renderBlock(it)}</div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pt-6">
        <button type="submit"
          className="px-4 py-2 rounded text-white"
          style={{ background: themeColor }}>
          {config?.submit?.buttonText || 'Submit'}
        </button>
      </div>

      {(!config?.submit || config?.submit?.thankYou?.type==='text') && (
        <div className="sr-only" aria-live="polite" id="form-thanks">
          {config?.submit?.thankYou?.text || 'Thanks! We will contact you shortly.'}
        </div>
      )}
    </form>
  );
}
