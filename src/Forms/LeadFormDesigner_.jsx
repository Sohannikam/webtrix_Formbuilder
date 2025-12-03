import React, { useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nanoid } from 'nanoid';
import { Save } from 'lucide-react';

/**
 * One‑Column Lead Form Designer (v3)
 * Requirements from spec:
 * - Single sortable column (no rows, no two columns)
 * - Palette: Lead fields + Divider + Spacer only (title/text/image blocks removed)
 * - Form‑level Image with position: top | left | right | bottom
 *   • adjustable side width (left/right) via slider + number input
 *   • image dimensions with Maintain Aspect Ratio (width/height)
 * - Form‑level Title input
 * - Palette list compact; Add button at top‑right of each item
 * - Remove visible drag handle; drag by grabbing anywhere on the block
 * - Divider and Spacer are previewed visually (no boxes). Divider supports custom color + thickness.
 * - Save returns: { title, items, formImage }
 */

// -------------------- Types --------------------
const BLOCK_TYPES = { FIELD: 'field', DIVIDER: 'divider', SPACER: 'spacer' };

// -------------------- Utils --------------------
const newBlock = (type, fieldKeyOrLabel = null, label = null) => {
  if (type === BLOCK_TYPES.FIELD) {
    const key = typeof fieldKeyOrLabel === 'string' ? fieldKeyOrLabel : fieldKeyOrLabel?.key;
    const lab = label || (typeof fieldKeyOrLabel === 'object' ? fieldKeyOrLabel?.label : fieldKeyOrLabel);
    return { id: nanoid(8), type, props: { fieldKey: key, label: lab || key, placeholder: '', required: false, helpText: '' } };
  }
  if (type === BLOCK_TYPES.DIVIDER) return { id: nanoid(8), type, props: { color: '#e5e7eb', thickness: 1, marginY: 8 } };
  if (type === BLOCK_TYPES.SPACER)  return { id: nanoid(8), type, props: { height: 16 } };
  return null;
};

// -------------------- Sortable Item --------------------
const SortableItem = ({ id, selected, onClick, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} onClick={onClick}
         {...attributes} {...listeners}
         className={`${selected ? 'ring-2 ring-blue-500' : ''}`}>
      {children}
    </div>
  );
};

// -------------------- Block previews (Designer) --------------------
const BlockCard = ({ block }) => {
  const b = block;
  if (b.type === BLOCK_TYPES.FIELD) {
    const p = b.props || {};
    return (
      <div className="py-2">
        <label className="block text-xs text-gray-600 mb-1">{p.label || p.fieldKey}{p.required && <span className="text-red-500">*</span>}</label>
        <input className="w-full border rounded px-2 py-1 text-sm bg-white" placeholder={p.placeholder || ''} disabled />
        {p.helpText && <div className="text-[11px] text-gray-400 mt-1">{p.helpText}</div>}
      </div>
    );
  }
  if (b.type === BLOCK_TYPES.DIVIDER) {
    const { color = '#e5e7eb', thickness = 1, marginY = 8 } = b.props || {};
    return <div style={{ margin: `${marginY}px 0` }}><div style={{ height: thickness, backgroundColor: color, width: '100%' }} /></div>;
  }
  if (b.type === BLOCK_TYPES.SPACER) {
    const h = b.props?.height || 16;
    return <div style={{ height: h }} />;
  }
  return null;
};

// -------------------- Inspector --------------------
const Inspector = ({ selected, onChange, onDelete }) => {
  if (!selected) return <aside className="w-72 border-l bg-white p-3 text-sm text-gray-500">Select a block to edit.</aside>;
  const b = selected;
  const set = (path, val) => {
    const next = structuredClone(b);
    const segs = path.split('.');
    let cur = next;
    for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]];
    cur[segs.at(-1)] = val;
    onChange(next);
  };
  return (
    <aside className="w-72 border-l bg-white p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-700 capitalize">{b.type} block</div>
        <button className="text-red-600" onClick={onDelete}>Delete</button>
      </div>

      {b.type === BLOCK_TYPES.FIELD && (
        <div className="space-y-2">
          <label className="block">
            <div className="text-xs text-gray-500">Label</div>
            <input className="w-full border rounded px-2 py-1" value={b.props?.label || ''} onChange={e => set('props.label', e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs text-gray-500">Placeholder</div>
            <input className="w-full border rounded px-2 py-1" value={b.props?.placeholder || ''} onChange={e => set('props.placeholder', e.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!b.props?.required} onChange={e => set('props.required', e.target.checked)} /> Required
          </label>
          <label className="block">
            <div className="text-xs text-gray-500">Help text</div>
            <input className="w-full border rounded px-2 py-1" value={b.props?.helpText || ''} onChange={e => set('props.helpText', e.target.value)} />
          </label>
        </div>
      )}

      {b.type === BLOCK_TYPES.DIVIDER && (
        <div className="space-y-2">
          <label className="block">
            <div className="text-xs text-gray-500">Color</div>
            <input type="color" className="w-full h-8 border rounded" value={b.props?.color || '#e5e7eb'} onChange={e => set('props.color', e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs text-gray-500">Thickness (px)</div>
            <input type="number" className="w-full border rounded px-2 py-1" min={1} max={8} value={b.props?.thickness ?? 1} onChange={e => set('props.thickness', Number(e.target.value) || 1)} />
          </label>
          <label className="block">
            <div className="text-xs text-gray-500">Vertical margin (px)</div>
            <input type="number" className="w-full border rounded px-2 py-1" min={0} max={48} value={b.props?.marginY ?? 8} onChange={e => set('props.marginY', Number(e.target.value) || 0)} />
          </label>
        </div>
      )}

      {b.type === BLOCK_TYPES.SPACER && (
        <label className="block">
          <div className="text-xs text-gray-500">Height (px)</div>
          <input type="number" className="w-full border rounded px-2 py-1" value={b.props?.height || 16} onChange={e => set('props.height', Number(e.target.value) || 0)} />
        </label>
      )}
    </aside>
  );
};

// -------------------- Palette --------------------
const Palette = ({ fieldDefs, addItem }) => {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return fieldDefs;
    return fieldDefs.filter(f => (f.label || f.key).toLowerCase().includes(s) || (f.key || '').toLowerCase().includes(s));
  }, [q, fieldDefs]);

  return (
    <aside className="w-64 border-r bg-white flex flex-col">
      <div className="p-3 border-b flex items-center gap-2">
        <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Search fields…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="p-2 text-[11px] uppercase text-gray-400">Lead Fields</div>
      <div className="px-2 space-y-1 overflow-auto">
        {list.map(f => (
          <div key={f.key} className="border rounded px-2 py-1 flex items-center justify-between">
            <div className="truncate text-sm" title={f.label || f.key}>{f.label || f.key}</div>
            <button className="text-[11px] px-2 py-1 border rounded ml-2" onClick={() => addItem(newBlock(BLOCK_TYPES.FIELD, f.key, f.label))}>Add</button>
          </div>
        ))}
      </div>
      <div className="p-2 text-[11px] uppercase text-gray-400 border-t mt-2">Content</div>
      <div className="px-2 pb-4 space-y-1">
        <button className="w-full px-2 py-1 border rounded hover:bg-gray-50 text-sm" onClick={() => addItem(newBlock(BLOCK_TYPES.DIVIDER))}>+ Divider</button>
        <button className="w-full px-2 py-1 border rounded hover:bg-gray-50 text-sm" onClick={() => addItem(newBlock(BLOCK_TYPES.SPACER))}>+ Spacer</button>
      </div>
    </aside>
  );
};

// -------------------- Image Preview --------------------
function FormImage({ cfg }){
  const { url, alt, rounded=true, fit='cover', dims } = cfg || {};
  const h = dims?.height ? Math.max(40, Number(dims.height)) : undefined;
  const w = dims?.width ? Math.max(40, Number(dims.width)) : undefined;
  return (
    <div className={`${url ? '' : 'border border-dashed'} ${rounded?'rounded-xl':'rounded'} bg-gray-50 overflow-hidden flex items-center justify-center`} style={{ width: w || '100%', height: h || 160 }}>
      {url ? <img src={url} alt={alt||''} className="w-full h-full" style={{objectFit:fit}}/> : <div className="text-xs text-gray-400">Set form image URL</div>}
    </div>
  );
}

// Helpers for aspect ratio lock
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const updateDims = (dims, changed, value) => {
  const next = { ...dims };
  if (changed === 'width') {
    next.width = value;
    if (dims.lockAspect && dims.width > 0) {
      const ratio = dims.height / dims.width;
      next.height = Math.round(value * (isFinite(ratio) ? ratio : 1));
    }
  } else if (changed === 'height') {
    next.height = value;
    if (dims.lockAspect && dims.height > 0) {
      const ratio = dims.width / dims.height;
      next.width = Math.round(value * (isFinite(ratio) ? ratio : 1));
    }
  }
  if (!isFinite(next.width)) next.width = dims.width;
  if (!isFinite(next.height)) next.height = dims.height;
  return next;
};

// -------------------- Main Component --------------------
export default function LeadFormDesigner({
  initialConfig,
  fieldDefs = [], // [{key:'name', label:'Name'}, ...]
  onSave,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [title, setTitle] = useState(initialConfig?.title || '');
  const [items, setItems] = useState(initialConfig?.items || []);
  const [selectedId, setSelectedId] = useState(null);
  const [formImage, setFormImage] = useState(initialConfig?.formImage || {
    url:'', alt:'', position:'top', rounded:true, fit:'cover', sideSpan:4, dims: { width: 600, height: 240, lockAspect: true }
  });

  const selectedBlock = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId]);

  const addItem = (block) => setItems(arr => [...arr, block]);

  const replaceSelected = (updated) => setItems(arr => arr.map(i => i.id === updated.id ? updated : i));
  const deleteSelected  = () => { if (!selectedId) return; setItems(arr => arr.filter(i => i.id !== selectedId)); setSelectedId(null); };

  // ---- DnD handlers (single sortable list)
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((arr) => {
      const oldIndex = arr.findIndex(i => i.id === active.id);
      const newIndex = arr.findIndex(i => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return arr;
      return arrayMove(arr, oldIndex, newIndex);
    });
  };

  const saveConfig = () => onSave?.({ title, items, formImage });

  // Tailwind note: ensure col-span safelist (1..12) in your tailwind.config if JIT purges dynamic classes.
  const spanClass = (n) => `md:col-span-${n}`;

  // ---- Layout preview with form-level image ----
  const Preview = () => {
    const pos = formImage?.position || 'top';
    const side = clamp(Number(formImage?.sideSpan ?? 4), 3, 6);
    const main = Math.max(1, 12 - side);
    const imageEl = <FormImage cfg={formImage}/>;

    // Title at the top of the form area (always visible)
    const FormArea = (
      <div id="main" className="min-h-[120px] rounded-2xl bg-white p-2">
        {title && <div className="text-lg font-semibold text-gray-800 mb-2">{title}</div>}
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map(it => (
              <SortableItem key={it.id} id={it.id} selected={selectedId === it.id} onClick={() => setSelectedId(it.id)}>
                <BlockCard block={it} />
              </SortableItem>
            ))}
          </div>
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-6">Add fields, divider, or spacer</div>
        )}
      </div>
    );

    if (pos === 'left' || pos === 'right') {
      return (
        <div className="grid md:grid-cols-12 gap-4 p-4">
          {pos === 'left' && (<div className={spanClass(side)}>{imageEl}</div>)}
          <div className={spanClass(main)}>{FormArea}</div>
          {pos === 'right' && (<div className={spanClass(side)}>{imageEl}</div>)}
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {pos === 'top' && imageEl}
        {FormArea}
        {pos === 'bottom' && imageEl}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-56px)] w-full flex">
      <Palette fieldDefs={fieldDefs} addItem={addItem} />

      <div className="flex-1 bg-gray-50">
        {/* Top bar with title + form-level image settings */}
        <div className="p-3 flex flex-wrap items-center gap-3 sticky top-0 bg-gray-50 border-b z-10">
          <input className="flex-1 min-w-[220px] border rounded px-2 py-1 text-sm" placeholder="Form title (optional)" value={title} onChange={e=>setTitle(e.target.value)} />

          {/* Image controls */}
          <span className="text-sm text-gray-600">Image:</span>
          <input className="w-[220px] border rounded px-2 py-1 text-sm" placeholder="https://.../offer.jpg" value={formImage.url}
                 onChange={e=>setFormImage(f=>({...f, url:e.target.value}))} />
          <input className="w-[160px] border rounded px-2 py-1 text-sm" placeholder="Alt text" value={formImage.alt||''}
                 onChange={e=>setFormImage(f=>({...f, alt:e.target.value}))} />
          <select className="border rounded px-2 py-1 text-sm" value={formImage.position}
                  onChange={e=>setFormImage(f=>({...f, position:e.target.value}))}>
            <option value="top">top</option>
            <option value="left">left</option>
            <option value="right">right</option>
            <option value="bottom">bottom</option>
          </select>

          {(formImage.position==='left' || formImage.position==='right') && (
            <label className="text-xs text-gray-600 flex items-center gap-2 ml-2">
              Side width
              <input type="range" min={3} max={6} step={1} value={formImage.sideSpan}
                     onChange={e=>setFormImage(f=>({...f, sideSpan:Number(e.target.value)}))} />
              <input type="number" className="w-16 border rounded px-1 py-1 text-xs"
                     min={3} max={6} value={formImage.sideSpan}
                     onChange={e=>setFormImage(f=>({...f, sideSpan: clamp(Number(e.target.value)||4,3,6)}))} />
            </label>
          )}

          {/* Dimensions + aspect ratio */}
          <label className="text-xs text-gray-600 flex items-center gap-2 ml-2">
            W
            <input type="number" className="w-20 border rounded px-1 py-1 text-xs" min={40} max={2000}
                   value={formImage.dims?.width || 600}
                   onChange={e=>setFormImage(f=>({ ...f, dims: updateDims(f.dims||{width:600,height:240,lockAspect:true}, 'width', Number(e.target.value)||600) }))} />
          </label>
          <label className="text-xs text-gray-600 flex items-center gap-2">
            H
            <input type="number" className="w-20 border rounded px-1 py-1 text-xs" min={40} max={2000}
                   value={formImage.dims?.height || 240}
                   onChange={e=>setFormImage(f=>({ ...f, dims: updateDims(f.dims||{width:600,height:240,lockAspect:true}, 'height', Number(e.target.value)||240) }))} />
          </label>
          <label className="text-xs text-gray-600 flex items-center gap-1">
            <input type="checkbox" checked={!!formImage.dims?.lockAspect}
                   onChange={e=>setFormImage(f=>({ ...f, dims: { ...(f.dims||{ width:600, height:240 }), lockAspect: e.target.checked } }))} /> Lock aspect
          </label>

          <div className="ml-auto">
            <button className="px-3 py-2 rounded-xl bg-black text-white text-sm flex items-center gap-2" onClick={saveConfig}><Save size={16}/> Save</button>
          </div>
        </div>

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <Preview/>
        </DndContext>
      </div>

      <Inspector selected={selectedBlock} onChange={replaceSelected} onDelete={deleteSelected} />
    </div>
  );
}
