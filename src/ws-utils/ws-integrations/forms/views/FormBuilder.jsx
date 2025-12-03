import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Copy, Eye, Settings, Download, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
/******************************
 * TYPES & CONSTANTS
 ******************************/
const FIELD_TYPES = [
  { type: "short_text", label: "Short text" },
  { type: "long_text", label: "Long text" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "number", label: "Number" },
  { type: "date", label: "Date" },
  { type: "radio", label: "Radio" },
  { type: "checkbox", label: "Checkbox" },
  { type: "dropdown", label: "Dropdown" },
  // Extend later: file, rating, matrix, signature, address, url, linear_scale, page_break, heading, paragraph, divider
];

const defaultForm = () => ({
  formId: null,
  companyId: null,
  name: "Untitled form",
  description: "",
  status: "draft",
  settings: {
    acceptResponses: true,
    captcha: false,
    domainAllowlist: [],
  },
  theme: { brand: "#1a73e8" },
});

/******************************
 * UTILITIES
 ******************************/
const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function generateNameKey(label, taken = new Set()) {
  let base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  if (!base) base = "q";
  let k = base;
  let i = 1;
  while (taken.has(k)) k = `${base}_${i++}`;
  return k;
}

/******************************
 * SORTABLE ITEM (simple Draggable wrapper)
 ******************************/

function SortableItem({ id, children, className }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/******************************
 * FIELD RENDERERS (Builder + Preview)
 ******************************/
function FieldPreview({ field, value, onChange, readOnly }) {
  const required = field.required ? "*" : "";
  const common = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  if (field.type === "short_text")
    return (
      <div className="mb-4">
        {common}
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2"
          placeholder={field.placeholder || "Your answer"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      </div>
    );

  if (field.type === "long_text")
    return (
      <div className="mb-4">
        {common}
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={4}
          placeholder={field.placeholder || "Your answer"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      </div>
    );

  if (["email", "phone", "number", "date"].includes(field.type)) {
    const typeMap = { email: "email", phone: "tel", number: "number", date: "date" };
    return (
      <div className="mb-4">
        {common}
        <input
          type={typeMap[field.type]}
          className="w-full border rounded-md px-3 py-2"
          placeholder={field.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      </div>
    );
  }

  if (field.type === "radio") {
    const opts = field.options || [];
    return (
      <div className="mb-4">
        {common}
        <div className="space-y-2">
          {opts.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input
                type="radio"
                name={field.nameKey}
                value={o.value}
                checked={value === o.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={readOnly}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    const opts = field.options || [];
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="mb-4">
        {common}
        <div className="grid grid-cols-1 gap-2">
          {opts.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={o.value}
                  checked={checked}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (e.target.checked) onChange?.([...arr, v]);
                    else onChange?.(arr.filter((x) => x !== v));
                  }}
                  disabled={readOnly}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "dropdown") {
    const opts = field.options || [];
    return (
      <div className="mb-4">
        {common}
        <select
          className="w-full border rounded-md px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={readOnly}
        >
          <option value="" disabled>
            {field.placeholder || "Select..."}
          </option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {common}
      <div className="text-sm text-gray-500">Unsupported field type: {field.type}</div>
    </div>
  );
}

/******************************
 * FIELD CARD (Builder view)
 ******************************/
function FieldCard({ field, onSelect, onDuplicate, onDelete, selected }) {
  return (
    <div
      className={`group border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition ${selected ? "ring-2 ring-indigo-500" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500">
          <GripVertical className="w-4 h-4 opacity-60" />
          <span className="text-xs uppercase tracking-wide">{field.type}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button className="p-1 hover:bg-gray-100 rounded" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-red-50 rounded" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
      <FieldPreview field={field} readOnly />
    </div>
  );
}

/******************************
 * RIGHT INSPECTOR (properties)
 ******************************/
function Inspector({ field, allNameKeys, onChange }) {
  if (!field) return (
    <div className="p-4 text-sm text-gray-500">Select a field to edit its properties.</div>
  );

  const update = (patch) => onChange({ ...field, ...patch });

  // editable options for choice fields
  const handleOptionChange = (idx, patch) => {
    const options = [...(field.options || [])];
    options[idx] = { ...options[idx], ...patch };
    update({ options });
  };

  const addOption = () => update({ options: [...(field.options || []), { label: "Option", value: uid("opt") }] });
  const removeOption = (idx) => update({ options: (field.options || []).filter((_, i) => i !== idx) });

  const canHaveOptions = ["radio", "checkbox", "dropdown"].includes(field.type);

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
        <input className="w-full border rounded px-3 py-2" value={field.label}
               onChange={(e) => update({ label: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
        <input className="w-full border rounded px-3 py-2" value={field.placeholder || ""}
               onChange={(e) => update({ placeholder: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm">Required</label>
        <input type="checkbox" checked={!!field.required} onChange={(e) => update({ required: e.target.checked })} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Name Key</label>
        <input className="w-full border rounded px-3 py-2" value={field.nameKey}
               onChange={(e) => update({ nameKey: e.target.value })} />
        <p className="text-xs text-gray-500 mt-1">Stable key used for mapping (unique inside this form).</p>
      </div>

      {canHaveOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-600">Options</label>
            <button className="text-indigo-600 text-sm" onClick={addOption}><Plus className="inline w-4 h-4 mr-1"/>Add</button>
          </div>
          <div className="space-y-2">
            {(field.options || []).map((o, idx) => (
              <div key={o.value} className="flex items-center gap-2">
                <input className="flex-1 border rounded px-2 py-1" value={o.label}
                       onChange={(e) => handleOptionChange(idx, { label: e.target.value })} />
                <input className="w-40 border rounded px-2 py-1" value={o.value}
                       onChange={(e) => handleOptionChange(idx, { value: e.target.value })} />
                <button className="p-1 hover:bg-red-50 rounded" onClick={() => removeOption(idx)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Min</label>
            <input type="number" className="w-full border rounded px-2 py-1" value={field.min ?? ""}
                   onChange={(e) => update({ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max</label>
            <input type="number" className="w-full border rounded px-2 py-1" value={field.max ?? ""}
                   onChange={(e) => update({ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </div>
        </div>
      )}
    </div>
  );
}

/******************************
 * LEFT PALETTE
 ******************************/
function FieldPalette({ onAdd }) {
  return (
    <div className="p-3 space-y-2">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Add a field</div>
      {FIELD_TYPES.map((ft) => (
        <button
          key={ft.type}
          className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50"
          onClick={() => onAdd(ft.type)}
        >
          {ft.label}
        </button>
      ))}
    </div>
  );
}

/******************************
 * PREVIEW RENDERER (public-like)
 ******************************/
function FormPreview({ form, fields }) {
  const [values, setValues] = useState({});

  const setVal = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple FE validation for required
    const missing = fields.filter((f) => f.required && !values[f.nameKey]);
    if (missing.length) {
      alert(`Please fill required: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    console.log("Preview submit payload:", values);
    alert("Looks good! This is a preview.");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h3 className="text-lg font-semibold mb-1">{form.name}</h3>
      {form.description ? (
        <p className="text-sm text-gray-600 mb-4">{form.description}</p>
      ) : null}
      {fields.map((f) => (
        <FieldPreview
          key={f.id}
          field={f}
          value={values[f.nameKey]}
          onChange={(v) => setVal(f.nameKey, v)}
        />
      ))}
      <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">Submit</button>
    </form>
  );
}

/******************************
 * MAIN BUILDER
 ******************************/
export default function FormBuilder() {
  const [form, setForm] = useState(defaultForm());
  const [fields, setFields] = useState(() => [
    // Starter fields (can remove)
    {
      id: uid("fld"),
      type: "short_text",
      label: "Full Name",
      nameKey: "full_name",
      placeholder: "Your name",
      required: true,
      sort: 0,
    },
    {
      id: uid("fld"),
      type: "email",
      label: "Email",
      nameKey: "email",
      placeholder: "name@example.com",
      required: true,
      sort: 1,
    },
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const nameKeys = useMemo(() => new Set(fields.map((f) => f.nameKey)), [fields]);
  const selectedField = useMemo(() => fields.find((f) => f.id === selectedId), [fields, selectedId]);

  // ADD FIELD
  const handleAddField = (type) => {
    const label = FIELD_TYPES.find((t) => t.type === type)?.label || "Field";
    const key = generateNameKey(label, nameKeys);
    const base = { id: uid("fld"), type, label, nameKey: key, required: false, sort: fields.length };
    if (["radio", "checkbox", "dropdown"].includes(type)) base.options = [
      { label: "Option 1", value: "opt_1" },
      { label: "Option 2", value: "opt_2" },
    ];
    setFields((s) => [...s, base]);
    setSelectedId(base.id);
  };

  // DUPLICATE FIELD
  const duplicateField = (id) => {
    setFields((s) => {
      const idx = s.findIndex((f) => f.id === id);
      if (idx === -1) return s;
      const f = s[idx];
      const dup = { ...f, id: uid("fld"), label: f.label + " (copy)", nameKey: generateNameKey(f.nameKey + "_copy", nameKeys), sort: f.sort + 0.01 };
      const next = [...s.slice(0, idx + 1), dup, ...s.slice(idx + 1)];
      return next.map((x, i) => ({ ...x, sort: i }));
    });
  };

  // DELETE FIELD
  const deleteField = (id) => {
    setFields((s) => s.filter((f) => f.id !== id).map((x, i) => ({ ...x, sort: i })));
    if (selectedId === id) setSelectedId(null);
  };

  // UPDATE FIELD (from Inspector)
  const patchField = (patch) => {
    setFields((s) => s.map((f) => (f.id === patch.id ? { ...f, ...patch } : f)));
  };

  // DND
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((s) => {
      const ids = s.map((f) => f.id);
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      const arr = arrayMove(s, oldIndex, newIndex);
      return arr.map((x, i) => ({ ...x, sort: i }));
    });
  };

  // EXPORT compiled render JSON (for backend save or embed preview)
  const compiled = useMemo(() => ({
    meta: { name: form.name, description: form.description, theme: form.theme },
    fields: fields
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((f) => ({
        type: f.type,
        label: f.label,
        nameKey: f.nameKey,
        placeholder: f.placeholder,
        required: !!f.required,
        options: f.options || undefined,
        min: f.min,
        max: f.max,
      })),
  }), [form, fields]);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(compiled, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.name || "form").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              className="text-lg font-semibold bg-transparent outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{form.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2" onClick={() => setShowPreview((s) => !s)}>
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2" onClick={downloadJSON}>
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button className="px-3 py-2 rounded bg-indigo-600 text-white">Save</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-4 px-4 py-4">
        {/* Left Palette */}
        <aside className="col-span-3 lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-3 py-2 text-sm font-medium">Fields</div>
          <FieldPalette onAdd={handleAddField} />
        </aside>

        {/* Center Canvas */}
        <main className="col-span-9 lg:col-span-7">
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="mb-4">
              <input
                className="text-2xl font-semibold w-full outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                className="w-full mt-2 text-sm text-gray-600 outline-none"
                placeholder="Form description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {fields.map((f) => (
                    <SortableItem key={f.id} id={f.id}>
                      <FieldCard
                        field={f}
                        selected={selectedId === f.id}
                        onSelect={() => setSelectedId(f.id)}
                        onDuplicate={() => duplicateField(f.id)}
                        onDelete={() => deleteField(f.id)}
                      />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
              <DragOverlay />
            </DndContext>

            <div className="mt-4">
              <button className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50" onClick={() => handleAddField("short_text")}> 
                <Plus className="w-4 h-4"/> Add question
              </button>
            </div>
          </div>
        </main>

        {/* Right Inspector / Preview */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm">
            <div className="border-b px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>Properties</span>
              <Settings className="w-4 h-4" />
            </div>
            <Inspector
              field={selectedField}
              allNameKeys={nameKeys}
              onChange={(patched) => patchField(patched)}
            />
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="border-b px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>Live Preview</span>
              <Eye className="w-4 h-4" />
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <FormPreview form={form} fields={fields.slice().sort((a,b)=>a.sort-b.sort)} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
