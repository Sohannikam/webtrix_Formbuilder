import React, { useMemo, useState, useEffect } from "react";
import { API_BASE_URL } from '@config/config';
import { fetchJson } from '@utils/fetchJson';
import { nanoid } from "nanoid";
import { LOCAL_FORM_API } from '@config/config';


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
  return children({ setNodeRef, style, attributes, listeners });

}

/******************************
 * FIELD RENDERERS (Builder + Preview)
 ******************************/
function FieldPreview({ field, value, onChange, editMode, patchField }) {

  const required = field.required ? "*" : "";
  // const common = (
  //   <label className="block text-sm font-medium text-gray-700 mb-1">
  //     {field.label} {required && <span className="text-red-500">*</span>}
  //   </label>
  // );

  const Label = () => {
    const [draftLabel, setDraftLabel] = useState(field.label);

    useEffect(() => {
      setDraftLabel(field.label);
    }, [field.label]);

    if (editMode) {
      return (
        <div className="mb-1">
          <div className="flex items-center gap-1">
            {/* Editable input  */}
            {/* Required * (also visible in edit mode) */}
            {field.required && <span className="text-red-500 mr-1">*</span>}
            <input
              className="block text-sm font-medium text-red-700 mb-1 border-b outline-none"
              value={draftLabel}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={() => patchField({ id: field.id, label: draftLabel })}
            />


          </div>
        </div>
      );
    }

    return (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.required && <span className="text-red-500 mr-1">*</span>}
        {field.label}

      </label>
    );
  };


  if (field.type === "short_text")
    return (
      <div className="mb-4">
        <Label />
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2"
          placeholder={field.placeholder || "Your answer"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={editMode}
        />
      </div>
    );

  if (field.type === "long_text")
    return (
      <div className="mb-4">
        <Label />
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={4}
          placeholder={field.placeholder || "Your answer"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={editMode}
        />
      </div>
    );

  if (["email", "phone", "number", "date"].includes(field.type)) {
    const typeMap = { email: "email", phone: "tel", number: "number", date: "date" };
    return (
      <div className="mb-4">
        <Label />
        <input
          type={typeMap[field.type]}
          className="w-full border rounded-md px-3 py-2"
          placeholder={field.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={editMode}
        />
      </div>
    );
  }

  if (field.type === "radio") {
    const opts = field.options || [];
    return (
      <div className="mb-4">
        <Label />
        <div className="space-y-2">
          {opts.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input
                type="radio"
                name={field.nameKey}
                value={o.value}
                checked={value === o.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={editMode}
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
        <Label />
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
                  disabled={editMode}
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

    // 📌 EDIT MODE → show select but readonly
    if (editMode) {
      return (
        <div className="mb-4">
          <Label />

          <select
            className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-default"
            value={value || ""}
            onChange={(e) => {
              // Prevent changing the selected value
              e.preventDefault();
              e.stopPropagation();
            }}
            // important: DO NOT USE disabled
            readOnly // does nothing for select, but good semantics
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

          <p className="text-xs text-gray-400 mt-1">Readonly preview</p>
        </div>
      );
    }

    // 📌 PREVIEW MODE → real dropdown
    return (
      <div className="mb-4">
        <Label />

        <select
          className="w-full border rounded-md px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
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
      <Label />
      <div className="text-sm text-gray-500">Unsupported field type: {field.type}</div>
    </div>
  );
}

/******************************
 * FIELD CARD (Builder view)
 ******************************/
function FieldCard({ field, onSelect, onDuplicate, onDelete, selected, patchField, dragHandle }) {


  return (
    <div
      className={`group border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition ${selected ? "ring-2 ring-indigo-500" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500"    {...dragHandle.attributes}
          {...dragHandle.listeners}>
          <GripVertical className="w-4 h-4 opacity-60" />
          <span className="text-xs uppercase tracking-wide">{field.type}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          {/* <button className="p-1 hover:bg-gray-100 rounded" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
            <Copy className="w-4 h-4" />
          </button> */}
          <button className="p-1 hover:bg-red-50 rounded" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end mb-3">
        <label className="text-sm mr-2">Required</label>
        <input
          type="checkbox"
          checked={!!field.required}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            patchField({ id: field.id, required: e.target.checked });
          }}
        />
      </div>


      <FieldPreview field={field} editMode={true} patchField={patchField} />
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
            <button className="text-indigo-600 text-sm" onClick={addOption}><Plus className="inline w-4 h-4 mr-1" />Add</button>
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
function FieldPalette({ fieldTypes, onAdd }) {

  return (
    <div className="p-3 space-y-2">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Add a field
      </div>

      {fieldTypes.length === 0 && (
        <p className="text-gray-500 text-sm">Loading...</p>
      )}

      {fieldTypes.map((ft) => (
        <button
          key={ft.name}
          className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50"
          onClick={() => onAdd(ft.type, ft.name)}
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
function FormPreview({ form, fields, formStyle, formSettings }) {

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
    <form
      onSubmit={handleSubmit}
      className="p-4"
      style={{
      }}
    >

      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: formStyle.title_color }}
      >
        {form.name}
      </h3>

      {form.description ? (
        <p className="text-sm text-gray-600 mb-4 break-words whitespace-pre-wrap">
          {form.description}
        </p>

      ) : null}
      {fields.map((f) => (
        <FieldPreview
          key={f.id}
          field={f}
          value={values[f.nameKey]}
          onChange={(v) => setVal(f.nameKey, v)}
          patchField={() => { }} // Add dummy function
          editMode={false} // Make sure editMode is false for preview
        />
      ))}
      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-indigo-600 text-white"
        >
          Submit
        </button>

        {formSettings?.show_cancel_button && (
          <button
            type="button"
            className="bg-red-400 px-4 py-2 rounded-md border col text-white"
            onClick={() => {
              // Preview-only behavior
              alert("Cancel clicked (preview)");
            }}
          >
            Cancel
          </button>
        )}
      </div>


    </form>
  );
}

/******************************
 * MAIN BUILDER
 ******************************/


export default function FormBuilder() {

  useEffect(() => {
    const savedFormId = localStorage.getItem("formId");
    if (savedFormId) {
      console.log("inside svedFromid")
      setFormId(savedFormId);
      console.log("formid inside useEffect of FromBuilder is" + formId)
    }
  }, []);

  const [showFormStyle, setShowFormStyle] = useState(false)
  const [formStyle, setFormStyle] = useState({
    background_color: "#ffffff",
    border_radius: "12px",
    box_shadow: "0 8px 20px rgba(0,0,0,0.08)",
    border_color: "rgba(0,0,0,0.08)",
    title_color: "#111827",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const [showSettings, setShowSettings] = useState(false);

  const [formSettings, setFormSettings] = useState({
    display_mode: "inline",
    delay_ms: 0,
    popup_trigger: "delay",
    slide_position: "bottom-right",
    scroll_percent: 50,
    background_color: "#ffffff",
    border_radius: 8,
    box_shadow: "0 4px 10px rgba(0,0,0,0.08)",
    title_color: "#111827",
    border_color: "#e5e7eb",
    show_cancel_button: null,
    enable_recaptcha: true,
    // recaptcha_site_key: "6LeunDEsAAAAAHKh03CuWp_IEYJLW9uPT3BaJYE0"

    reshow_delay_value: 0,
    reshow_delay_unit: "seconds", // "seconds" | "minutes" | "hours"
    reshow_delay_ms: 0,
      success_title: "Thank You",
  success_description: "",
  });

    const [tempSuccessTitle, setTempSuccessTitle]= useState(formSettings.success_title || "")
  const [tempSuccessDescription,setTempSuccessDescription] = useState(formSettings.success_description || "");

  const [formId, setFormId] = useState("ZD4dRJq6X4Ccif02qghpP");
  const [definitionFields, setDefinitionFields] = useState([]);
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


  useEffect(() => {
    async function fetchFormDefinition() {
      try {
        const res = await fetch(
          `${LOCAL_FORM_API}/form/${formId}`
        );

        const definition = await res.json();

        if (typeof definition?.settings?.show_cancel_button === "boolean") {
          setFormSettings((prev) => ({
            ...prev,
            show_cancel_button: definition.settings.show_cancel_button,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch form settings", err);
      }
    }

    fetchFormDefinition();
  }, [formId]);


  // Fetch form definitions when component loads
  useEffect(() => {
    const loadFormDefinitions = async () => {
      try {

        const response = await fetchJson(`${API_BASE_URL}/getDefinations`, {
          method: 'POST',
          body: JSON.stringify({ menuID: `92` }),
        });
        // setLinkedFields(response?.data || []);
        if (response?.data) {
          // ❌ fields you want to remove
          const removeList = [
            "customer_id",
            "record_index",
            "company_id",
            "record_type",
            "password",
            "is_password_update",
            "last_activity_type",
            "latitude",
            "longitude",
            "modified_by",
            "modified_date",
            "one_drive_folder",
            "last_activity_date",
            "branch_id",
            "status",
            "created_date",
            "created_by",
            "user_name",
            "type",
            "stages",
            "lead_source",
            "lead_priority",
            "assignee",
            "additional_contacts",
            "customer_portal_access",
            "follow_up_date",
            "customer_image"
          ];

          // ✅ filter out unwanted fields
          const filtered = response.data.filter(f => !removeList.includes(f.Field));

          setDefinitionFields(filtered);
        }
      } catch (error) {
        console.error('Error loading form definitions:', error);
      }
    };

    loadFormDefinitions();
  }, []); // Run only once on mount

  const fetchDropdownOptions = async (slug) => {
    try {
      const response = await fetchJson(`${API_BASE_URL}/categorySlugList`, {
        method: "POST",
        body: JSON.stringify({ status: "active", slug }),
      });

      // Option A: Stringify for readable output
      console.log("Response of dropdown:", JSON.stringify(response, null, 2));

      const list = response?.data?.[0]?.sublist || [];

      return list.map(item => ({
        label: item.categoryName,
        value: item.category_id,
      }));
    } catch (err) {
      console.error("Dropdown fetch error for slug:", slug, err);
      return [];
    }
  };

  const toMs = (value, unit) => {
  const v = Number(value) || 0;
  if (unit === "seconds") return v * 1000;
  if (unit === "minutes") return v * 60 * 1000;
  if (unit === "hours") return v * 60 * 60 * 1000;
  return 0;
};


  // convertedFieldTypes from database 
  const convertedFieldTypes = useMemo(() => {
    if (!definitionFields.length) return [];

    return definitionFields.map((f) => {
      let fieldType = "short_text"; // default

      // Map specific DB fields to Dropdown
      const dropdownFields = ["lead_source", "stages", "lead_priority", "enquiry_for", "assignee"];

      if (dropdownFields.includes(f.Field)) {
        fieldType = "dropdown";
      } else if (f.Type.startsWith("varchar")) {
        fieldType = "short_text";
      } else if (f.Type.startsWith("text")) {
        fieldType = "long_text";
      } else if (f.Type.startsWith("int")) {
        fieldType = "number";
      } else if (f.Type === "date") {
        fieldType = "date";
      } else if (f.Type.includes("enum")) {

        fieldType = "radio";

        const enumValues = f.Type
          .match(/'([^']+)'/g)
          ?.map(v => v.replace(/'/g, ""));

        return {
          type: "radio",
          label: f.Field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          name: f.Field,
          options: enumValues?.map(v => ({
            label: v.charAt(0).toUpperCase() + v.slice(1),
            value: v
          })) || []
        };
      }

      return {
        type: fieldType,
        label: f.Field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        name: f.Field,
      };
    });

  }, [definitionFields]);


  const saveFormSettings = async (patch) => {
    try {
      console.log("form id inside of saveFormSetting api is" + formId)
      console.log("patch inside saveformsetting is :", JSON.stringify(patch, null, 2));

      await fetch(
        `${LOCAL_FORM_API}/${formId}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patch }),
        }
      );
    } catch (err) {
      console.error("Failed to save form settings", err);
    }
  };


  // ADD FIELD
  const handleAddField = (type, fieldName) => {

    // Label from DB field
    const label = fieldName
      ? fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : FIELD_TYPES.find((t) => t.type === type)?.label || "Field";

    let rawKey = fieldName || generateNameKey(label, nameKeys);

    if (rawKey === "stages") {
      rawKey = "lead_stages";
    }

    if (rawKey === "enquiry_for") {
      rawKey = "enquiry_list";
    }


    const key = rawKey;

    const base = {
      id: uid("fld"),
      type,
      label,
      nameKey: key,
      required: false,
      sort: fields.length
    };

    const matched = convertedFieldTypes.find((t) => t.name === key);
    if (matched && matched.type === "radio") {
      base.options = matched.options;
    }

    // If DB field is dropdown type, fetch dynamic options
    if (["dropdown"].includes(type)) {

      // These fields must come from API
      const apiFields = ["lead_source", "lead_stages", "lead_priority", "enquiry_list", "assignee"];

      if (apiFields.includes(key)) {
        base.options = []; // this create new field in base as options

        // Fetch async and update the field options
        fetchDropdownOptions(key).then((opts) => {
          setFields((prev) =>
            prev.map((f) =>
              f.id === base.id ? { ...f, options: opts } : f
            )
          );
        });
      } else {
        // For normal dropdowns
        base.options = [
          { label: "Option 1", value: "opt1" },
          { label: "Option 2", value: "opt2" }
        ];
      }
    }


    setFields((s) => [...s, base]); //add this base field to the UI
    setSelectedId(base.id);
  };


  // DUPLICATE FIELD
  const duplicateField = (id) => {
    console.log("inside duplicate field option")
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
    console.log("inside dleteField option")
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
    settings: formSettings,
    fields: fields
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        nameKey: f.nameKey,
        placeholder: f.placeholder,
        required: !!f.required,
        options: f.options || undefined,
        min: f.min,
        max: f.max,
      })),
  }), [form, fields, formSettings]);



  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(compiled, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.name || "form").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const jsonString = JSON.stringify(compiled, null, 2);
  localStorage.setItem("json", jsonString)



  const saveFormDefinition = async () => {
    try {
      const payload = {
        formId: "ZD4dRJq6X4Ccif02qghpP",
        definition: compiled
      };

      // Print the definition from payload


      setFormId(payload.formId);  // persist it in state
      localStorage.setItem("formId", payload.formId);

      console.log("Definition in payload:", payload.definition);
      console.log("Full payload:", JSON.stringify(payload, null, 2));


      const response = await fetchJson(`${LOCAL_FORM_API}/saveDefinition`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Form saved successfully!");
      console.log("Saved:", response);

    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving form.");
    }
  };

  const updateSettingsSilent = (patch) => {
    console.log("Full payload:", JSON.stringify(patch, null, 2));

    setFormSettings((prev) => ({ ...prev, ...patch }));
    saveFormSettings(patch);
  };

  const updateSettingsWithAlert = (patch) => {
    // const updated = { ...formSettings, ...patch };
    // setFormSettings(updated);
    // saveFormSettings(updated);

    console.log("Patch inside of updatSetting with alert:", JSON.stringify(patch, null, 2));
    setFormSettings((prev) => ({ ...prev, ...patch }));
    saveFormSettings(patch);
  };

  const handlePopupTriggerChange = (newTrigger) => {
    if (newTrigger === "delay") {
      updateSettingsSilent({
        popup_trigger: "delay",
        scroll_percent: 50,
      });
    }

    if (newTrigger === "scroll") {
      updateSettingsSilent({
        popup_trigger: "scroll",
        delay_sec: null,
        delay_ms: 2000,
      });
    }
  };


  const handleDisplayModeChange = (mode) => {
    // Base update
    const update = {
      display_mode: mode,
    };

    // If leaving popup mode, reset popup-specific fields
    if (mode !== "popup") {
      update.popup_trigger = null;
      update.delay_ms = 0;
      // update.scroll_percent = null;
    }
    console.log("update in handleDisplayModeChange is" + update)
    updateSettingsWithAlert(update);
  };

function handleSaveSuccessMessage ()
{
  updateSettingsWithAlert(
    {
      success_title:tempSuccessTitle,
      success_description: tempSuccessDescription,
    }
  );

  setShowSuccessModal(false);
}

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
            <button
              className="px-3 py-2 rounded bg-indigo-600 text-white"
              onClick={saveFormDefinition}
            >
              Save
            </button>

            <button
              className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
              Form Settings
            </button>

            <button
              className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setShowFormStyle(true)}
            >
              🎨 Form Style
            </button>

            <button
  className="px-4 py-2 bg-blue-600 text-white rounded"
  onClick={() => setShowSuccessModal(true)}
>
  Edit Success Message
</button>


          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto h-[85vh] px-4 py-4">
        <div className="flex gap-4 items-stretch h-full">

          {/* Left Palette */}
          <aside className="flex-[2] min-w-0 bg-white rounded-2xl border shadow-sm overflow-y-auto">
            <div className="border-b px-3 py-2 text-sm font-medium">Fields</div>
            <FieldPalette fieldTypes={convertedFieldTypes} onAdd={handleAddField} />
          </aside>

          {/* Center Canvas */}
          <main className="flex-[7] min-w-0 bg-white rounded-2xl border shadow-sm p-4 overflow-y-auto">
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

            {/* Your DND + fields */}
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {fields.map((f) => (
                    <SortableItem key={f.id} id={f.id}>
                      {({ setNodeRef, style, attributes, listeners }) => (
                        <div ref={setNodeRef} style={style}>
                          <FieldCard
                            field={f}
                            selected={selectedId === f.id}
                            onSelect={() => setSelectedId(f.id)}
                            onDelete={() => deleteField(f.id)}
                            patchField={patchField}
                            dragHandle={{ attributes, listeners }}
                          />
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
              <DragOverlay />
            </DndContext>
            <div className="mt-4">
              <button className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50" onClick={() => handleAddField("short_text")}>
                <Plus className="w-4 h-4" /> Add question
              </button>
            </div>
          </main>

          {/* Right Inspector / Preview */}
          <aside className="flex-[3] min-w-0 space-y-4">
            {/* <div className="bg-white rounded-2xl border shadow-sm">
            <div className="border-b px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>Properties</span>
              <Settings className="w-4 h-4" />
            </div>
            <Inspector
              field={selectedField}
              allNameKeys={nameKeys}
              onChange={(patched) => patchField(patched)}
            />
          </div> */}

            <div className="bg-white border shadow-sm overflow-hidden">
              <div className="border-b px-3 py-2 text-sm font-medium flex items-center justify-between">
                <span>Live Preview</span>
                <Eye className="w-4 h-4" />
              </div>



            </div>

            <div
              className="max-h-full overflow-auto"
              style={{
                backgroundColor: formStyle.background_color,
                borderRadius: formStyle.border_radius,
                boxShadow: formStyle.box_shadow,
                border: `1px solid ${formStyle.border_color}`,
              }}
            >
              <FormPreview
                form={form}
                fields={fields.slice().sort((a, b) => a.sort - b.sort)}
                formStyle={formStyle}
                formSettings={formSettings}
              />
            </div>

          </aside>

        </div>
      </div>

      {/* Form setting modal  */}


      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-[420px] rounded-xl shadow-lg p-5 relative">

            {/* Close */}
            <button
              className="group absolute top-3 right-3 text-black hover:text-black"
              onClick={() => setShowSettings(false)}
              aria-label="Close"
            >
              ✕

              {/* Tooltip */}
              <span
                className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 
               bg-black text-white text-xs px-2 py-1 rounded
               opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Close
              </span>
            </button>


            <h3 className="text-lg font-semibold mb-4">Form Settings</h3>

            {/* Display Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Display Mode
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formSettings.display_mode === "inline"}
                    onChange={() => handleDisplayModeChange("inline")}
                  />
                  Inline (Embed in page)
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formSettings.display_mode === "popup"}
                    onChange={() => handleDisplayModeChange("popup")}
                  />

                  Popup
                </label>

                {/* Slide-in placeholder */}
                <label className="flex items-center gap-2">
                  <input type="radio"
                    checked={formSettings.display_mode === "slide_in"}
                    onChange={() => handleDisplayModeChange("slide_in")} />
                  Slide-in
                </label>
              </div>
            </div>

            {/* Popup Delay */}
            {formSettings.display_mode === "popup" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Popup Trigger
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formSettings.popup_trigger === "delay"}
                      onChange={() => handlePopupTriggerChange("delay")}
                    />
                    After delay
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formSettings.popup_trigger === "scroll"}
                      onChange={() => handlePopupTriggerChange("scroll")}
                    />

                    On scroll
                  </label>
                </div>
              </div>
            )}


            {formSettings.display_mode === "popup" &&
              formSettings.popup_trigger === "delay" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Popup Delay (seconds)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="Enter delay"
                    className="w-full border rounded px-3 py-2"
                    value={formSettings.delay_sec ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSettingsSilent({
                        delay_sec: value,
                        delay_ms: value === "" ? 0 : Number(value) * 1000,
                      });
                    }}
                  />
                </div>
              )}


            {formSettings.display_mode === "popup" &&
              formSettings.popup_trigger === "scroll" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Show popup after scroll
                  </label>

                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formSettings.scroll_percent}
                    onChange={(e) =>
                      updateSettingsWithAlert({
                        scroll_percent: Number(e.target.value),
                      })
                    }
                  >
                    <option value={50}>50% page scroll</option>
                    <option value={75}>75% page scroll</option>
                  </select>
                </div>
              )}

            {/* Slide-in Position */}
            {formSettings.display_mode === "slide_in" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Slide-in Position
                </label>

                <select
                  className="w-full border rounded px-3 py-2"
                  value={formSettings.slide_position || "bottom-right"}
                  onChange={(e) =>
                    updateSettingsWithAlert({
                      slide_position: e.target.value,
                    })
                  }
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="flex items-center justify-between text-sm font-medium">
                <span>Show Cancel Button</span>

                <input
                  type="checkbox"
                  checked={formSettings.show_cancel_button ?? true}
                  onChange={(e) => {
                    const value = e.target.checked;

                    // ✅ Update local state (no refresh yet)
                    setFormSettings((prev) => ({
                      ...prev,
                      show_cancel_button: value,
                    }));

                    // ✅ PATCH only the changed field
                    updateSettingsWithAlert({
                      show_cancel_button: value,
                    });
                  }}
                  className="h-4 w-4"
                />
              </label>

              <p className="mt-1 text-xs text-gray-500">
                If disabled, users must submit the form to close it.
              </p>
            </div>


<div className="mt-5">
  <label className="block text-sm font-medium mb-2">
    Show form again after submission
  </label>

  <div className="flex gap-2">
    {/* Number input */}
    <input
      type="number"
      min="0"
      className="w-24 border rounded px-2 py-1"
      value={formSettings.reshow_delay_value ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        const unit = formSettings.reshow_delay_unit;
        const ms = toMs(value, unit);

        updateSettingsWithAlert({
          reshow_delay_value: value,
          reshow_delay_unit: unit,
          reshow_delay_ms: ms,
        });
      }}
    />

    {/* Unit select */}
    <select
      className="border rounded px-2 py-1"
      value={formSettings.reshow_delay_unit}
      onChange={(e) => {
        const unit = e.target.value;
        const value = formSettings.reshow_delay_value;
        const ms = toMs(value, unit);

        updateSettingsWithAlert({
          reshow_delay_value: value,
          reshow_delay_unit: unit,
          reshow_delay_ms: ms,
        });
      }}
    >
      <option value="seconds">Seconds</option>
      <option value="minutes">Minutes</option>
      <option value="hours">Hours</option>
    </select>
  </div>

  <p className="mt-1 text-xs text-gray-500">
    After submitting, the form will reappear after this time.
  </p>
</div>


          </div>
        </div>
      )}

      {showFormStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-[360px] rounded-xl shadow-lg p-5 relative">

            {/* Close */}
            <button
              className="absolute top-3 right-3"
              onClick={() => setShowFormStyle(false)}
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4">Form Style</h3>

            {/* Background Color */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Background Color
              </label>

              <input
                type="color"
                value={formStyle.background_color}
                onChange={(e) => {
                  const color = e.target.value;

                  setFormStyle({
                    ...formStyle,
                    background_color: color,
                  })

                  setFormSettings((prev) => ({
                    ...prev,
                    background_color: color,
                  }));
                }}
                className="w-12 h-8 cursor-pointer"
              />
            </div>

            {/* Title Color  */}

            <div className="flex items-center justify-between mt-4">
              <label className="text-sm font-medium">
                Title Color
              </label>

              <input
                type="color"
                value={formStyle.title_color}
                onChange={(e) => {
                  const color = e.target.value;

                  setFormStyle((prev) => ({
                    ...prev,
                    title_color: color,
                  }));

                  setFormSettings((prev) => ({
                    ...prev,
                    title_color: color,
                  }));
                }}
                className="w-12 h-8 cursor-pointer"
              />
            </div>


            {/* border color  */}

            <div className="flex items-center justify-between mt-4">
              <label className="text-sm font-medium">
                Border Color
              </label>

              <input
                type="color"
                value={formStyle.border_color}
                onChange={(e) => {
                  const color = e.target.value;

                  setFormStyle((prev) => ({
                    ...prev,
                    border_color: color,
                  }));

                  setFormSettings((prev) => ({
                    ...prev,
                    border_color: color,
                  }));
                }}
                className="w-12 h-8 cursor-pointer"
              />
            </div>

            {/* border radius  */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">
                Border Radius
              </label>

              <input
                type="range"
                min="0"
                max="32"
                value={parseInt(formStyle.border_radius)}
                onChange={(e) => {
                  const value = `${e.target.value}px`;

                  setFormStyle((prev) => ({
                    ...prev,
                    border_radius: value,
                  }));

                  setFormSettings((prev) => ({
                    ...prev,
                    border_radius: value,
                  }));
                }}
                className="w-full"
              />
            </div>

            {/* box shadow  */}

            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">
                Box Shadow
              </label>

              <select
                className="w-full border rounded px-2 py-1"
                value={formStyle.box_shadow}
                onChange={(e) => {
                  const value = e.target.value;

                  setFormStyle((prev) => ({
                    ...prev,
                    box_shadow: value,
                  }));

                  setFormSettings((prev) => ({
                    ...prev,
                    box_shadow: value,
                  }));
                }}
              >
                <option value="none">None</option>
                <option value="0 4px 12px rgba(0,0,0,0.08)">Soft</option>
                <option value="0 8px 20px rgba(0,0,0,0.12)">Medium</option>
                <option value="0px 5px 15px rgba(0, 0, 0, 0.35)">Strong</option>

              </select>
            </div>


          </div>
        </div>
      )}

{showSuccessModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-5">
      <h2 className="text-lg font-semibold mb-4">
        Success Message Settings
      </h2>

      {/* Success Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Success Title
        </label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={tempSuccessTitle}
          onChange={(e) => setTempSuccessTitle(e.target.value)}
          placeholder="Form submitted successfully"
        />
      </div>

      {/* Success Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Success Description
        </label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={4}
          value={tempSuccessDescription}
          onChange={(e) =>
            setTempSuccessDescription(e.target.value)
          }
          placeholder="Thank you for contacting us. We will get back to you shortly."
        />
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-2 mt-5">
        <button
          className="px-4 py-2 border rounded"
          onClick={() => setShowSuccessModal(false)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={handleSaveSuccessMessage}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
