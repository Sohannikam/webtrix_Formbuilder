import React, { useMemo, useState, useEffect } from "react";
import { API_BASE_URL } from '@config/config';
import { fetchJson } from '@utils/fetchJson';
import { nanoid } from "nanoid";
import { LOCAL_FORM_API } from '@config/config';
import EmbedScriptModal from "@modals/EmbedScriptModal";
import ShowSuccessModal from "@modals/ShowSuccessModal";
import FormSettingsModal from "@modals/FormSettingsModal";
import FormStyleModal from "@modals/FormStyleModal";
import { useFormBuilder } from "@context/FormBuilderContext";

import { useFormId } from "@hooks/useFromId";
import { useHydratedValue } from "@hooks/useHydratedValue";


import {
  fetchDropdownOptionsApi,
  fetchMenuDefinitions,
  saveFormDefinitionApi,
  saveFormSettingsApi,
  fetchFormDefinitionApi,
} from "@api/allApi";



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

// const defaultForm = () => ({
//   formId: null,
//   companyId: null,
//   name: "Untitled form",
//   description: "",
//   status: "draft",
//   settings: {
//     acceptResponses: true,
//     captcha: false,
//     domainAllowlist: [],
//   },
//   theme: { brand: "#1a73e8" },
// });

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
function FieldPreview({ field, value, onChange, editMode, FieldLabelColor }) {
  const { patchField } = useFormBuilder();

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
      <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: FieldLabelColor }} >
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
function FieldCard({ field, onSelect, onDuplicate, onDelete, selected, dragHandle }) {

  const { patchField } = useFormBuilder();

  const handleRequiredChange = (e) => {
    e.stopPropagation();

    if (typeof patchField === 'function') {
      patchField({ id: field.id, required: e.target.checked });
    }
    else {
      console.error("patch field is not a function")
    }
  }

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
          onChange={handleRequiredChange}
        />
      </div>


      <FieldPreview field={field} editMode={true} />
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
function FormPreview() {

  const { form, fields, formStyle, formSettings } = useFormBuilder();

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
        style={{
          color: formStyle.title_color,
          textAlign: formStyle.title_align,
        }}
      >
        {form.name}
      </h3>

      {form.description ? (
        <p className="text-sm text-gray-600 mb-4 break-words whitespace-pre-wrap" style={{
          color: formStyle.description_color,
          textAlign: formStyle.description_align
        }}>
          {form.description}
        </p>

      ) : null}
      {fields.map((f) => (
        <FieldPreview
          key={f.id}
          field={f}
          value={values[f.nameKey]}
          onChange={(v) => setVal(f.nameKey, v)}
          editMode={false} // Make sure editMode is false for preview
          FieldLabelColor={formStyle.Field_Color}
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
  console.log("inside FormBuilder component")

  //   useEffect(() => {
  //   const savedFormId = localStorage.getItem("formId");
  //   console.log("saved Form Id is"+savedFormId)
  //   if (savedFormId) {
  //     setFormId(savedFormId);
  //   }

  // }, []);

  const { formId, setFormId, isNewForm, setIsNewForm } = useFormId();


  const DEFAULT_FORM_SETTINGS = {
    display_mode: "inline",        // inline | popup | slide_in
    delay_ms: 0,
    popup_trigger: "delay",        // delay | scroll
    scroll_percent: 50,

    show_cancel_button: true,
    enable_recaptcha: false,
    recaptcha_site_key: "",

    background_color: "#ffffff",
    border_radius: "12px",
    box_shadow: "0 8px 20px rgba(0,0,0,0.08)",
    border_color: "rgba(0,0,0,0.08)",

    success_title: "Thank You",
    success_description: "We will contact you shortly",
    redirect_url: "",

    reshow_delay_ms: 0,
  };

  const {
    form,
    setForm,
    fields,
    setFields,
    formSettings,
    setFormSettings,
    formStyle,
    setFormStyle,
  } = useFormBuilder();

  const [showFormStyle, setShowFormStyle] = useState(false)
  const [copybtn, setCopybtn] = useState(false);
  // const [formStyle, setFormStyle] = useState({
  //   background_color: "#ffffff",
  //   border_radius: "12px",
  //   box_shadow: "0 8px 20px rgba(0,0,0,0.08)",
  //   border_color: "rgba(0,0,0,0.08)",
  //   title_color: "#111827",
  //   description_color: "#111827",
  //   title_align:"left",
  //   description_align:"left",
  //   Field_Color:"#111827"
  // });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  // const [formSettings, setFormSettings] = useState({
  //   display_mode: "inline",
  //   delay_ms: 0,
  //   popup_trigger: "delay",
  //   slide_position: "bottom-right",
  //   scroll_percent: 50,
  //   background_color: "#ffffff",
  //   border_radius: 8,
  //   box_shadow: "0 4px 10px rgba(0,0,0,0.08)",
  //   title_color: "#111827",
  //   description_color: "#111827",
  //   Field_Color:"#111827",
  //   title_align:"left",
  //   description_align:"left",
  //   border_color: "#e5e7eb",
  //   show_cancel_button: null,
  //   enable_recaptcha: true,
  //   // recaptcha_site_key: "6LeunDEsAAAAAHKh03CuWp_IEYJLW9uPT3BaJYE0"

  //   reshow_delay_value: 0,
  //   reshow_delay_unit: "seconds", // "seconds" | "minutes" | "hours"
  //   reshow_delay_ms: 0,
  //     success_title: "Thank You",
  // success_description: "",
  // });

  const [tempSuccessTitle, setTempSuccessTitle] = useState(formSettings.success_title || "")
  const [tempSuccessDescription, setTempSuccessDescription] = useState(formSettings.success_description || "");

  const [definitionFields, setDefinitionFields] = useState([]);
  // const [form, setForm] = useState(defaultForm());
  // const [fields, setFields] = useState(() => [
  //   // Starter fields (can remove)
  //   {
  //     id: uid("fld"),
  //     type: "short_text",
  //     label: "Full Name",
  //     nameKey: "full_name",
  //     placeholder: "Your name",
  //     required: true,
  //     sort: 0,
  //   },
  //   {
  //     id: uid("fld"),
  //     type: "email",
  //     label: "Email",
  //     nameKey: "email",
  //     placeholder: "name@example.com",
  //     required: true,
  //     sort: 1,
  //   },
  // ]);

  const [selectedId, setSelectedId] = useState(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedScript, setEmbedScript] = useState("");

  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const nameKeys = useMemo(() => new Set(fields.map((f) => f.nameKey)), [fields]);
  const selectedField = useMemo(() => fields.find((f) => f.id === selectedId), [fields, selectedId]);


  // useEffect(() => {

  //     if (!formId) return; // ✅ CRITICAL

  //   async function load() {
  //     try {

  //     const definition = await fetchFormDefinitionApi(formId);

  //       if (typeof definition?.settings?.show_cancel_button === "boolean") {
  //         setFormSettings((prev) => ({
  //           ...prev,
  //           show_cancel_button: definition.settings.show_cancel_button,
  //         }));
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch form settings", err);
  //     }
  //   }

  //   load();
  // }, [formId]);



  // useEffect(() => {

  //   if (!formId) return;

  //   async function load() {

  //     try {
  //       const definition1 = await fetchFormDefinitionApi(formId);

  //       console.log("definition inside rawa funciton is ", definition1)
  //       const raw = definition1?.data?.definition.settings?.show_cancel_button;
  //       const is_lead = definition1?.data.is_lead_form;
  //       console.log("value of raw is ", raw)
  //       console.log("value of is lead is",is_lead)

  //       if (raw !== undefined) {

  //         console.log("inside raw is present")

  //         setFormSettings((prev) => ({
  //           ...prev,
  //           show_cancel_button: Boolean(Number(raw)),

  //         }));
  //       }


  //       if (is_lead !== undefined) {

  //         console.log("inside is_lead is present",is_lead)

  //         setFormSettings((prev) => ({
  //           ...prev,
  //           is_lead_form: Number(is_lead), // 0 or 1

  //         }));
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch form settings", err);
  //     }
  //   }

  //   load();
  // }, [formId]);

useHydratedValue({ formId, setFormSettings });


  useEffect(() => {
    async function load() {
      try {
        const response = await fetchMenuDefinitions(92);
        if (!response?.data) return;

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
          // "lead_source",
          "lead_priority",
          "assignee",
          "additional_contacts",
          "customer_portal_access",
          "follow_up_date",
          "customer_image"
        ];

        setDefinitionFields(
          response.data.filter(f => !removeList.includes(f.Field))
        );
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);


  const toMs = (value, unit) => {
    const v = Number(value) || 0;
    if (unit === "seconds") return v * 1000;
    if (unit === "minutes") return v * 60 * 1000;
    if (unit === "hours") return v * 60 * 60 * 1000;
    return 0;
  };

  function createNewForm() {
    localStorage.removeItem("formId");
    setFormId(null);
    localStorage.setItem("forceNewForm", "true");
    console.log("local storage is saved for forceNewForm")

    setIsNewForm(true);

    setFields([]);
    setFormSettings(DEFAULT_FORM_SETTINGS);
  }


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
        const textIdentifiers = [
          "pan_number",
        ];

        if (textIdentifiers.includes(f.Field)) {
          fieldType = "short_text";
        } else {
          fieldType = "number";
        }
      }
      else if (f.Type === "date") {
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


  // const saveFormSettings = async (patch) => {
  //   try {
  //     console.log("form id inside of saveFormSetting api is" + formId)
  //     console.log("patch inside saveformsetting is :", JSON.stringify(patch, null, 2));

  //     await fetch(
  //       `${LOCAL_FORM_API}/${formId}/settings`,
  //       {
  //         method: "PUT",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ patch }),
  //       }
  //     );
  //   } catch (err) {
  //     console.error("Failed to save form settings", err);
  //   }
  // };


  // ADD FIELD

  const saveFormSettings = async (patch) => {
    try {
      await saveFormSettingsApi({ formId, patch });
    } catch (err) {
      console.error("Failed to save form settings", err);
    }
  };


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
        fetchDropdownOptionsApi(key).then((opts) => {
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
  // const patchField = (patch) => {
  //   setFields((s) => s.map((f) => (f.id === patch.id ? { ...f, ...patch } : f)));
  // };

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
    theme: form.theme,          // keep theme if you want it in definition
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
      let id = formId;
      let createdNow = false;
      console.log("form id inside saveFormDefinition is" + id);

      // 🔥 CREATE formId only FIRST TIME
      if (!id) {
        id = nanoid(16);
        setFormId(id);
        localStorage.setItem("formId", id);

        // ✅ new form is officially created
        localStorage.removeItem("forceNewForm");
        createdNow = true;
      }

      if (createdNow && isNewForm) {
        showEmbedScriptModal(id);
        setIsNewForm(false);
      }
      await saveFormDefinitionApi({
        formId: id,
        name: form.name,
        description: form.description,
        compiled,
      });

      alert("Form saved successfully");

    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  function showEmbedScriptModal(formId) {
    setEmbedScript(`
<script src="https://webtrixformbuilder-8ae4b5.netlify.app/embed.js"
        data-form-id="${formId}">
</script>
  `);

    setShowEmbedModal(true);
  }


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

  function handleSaveSuccessMessage() {
    updateSettingsWithAlert(
      {
        success_title: tempSuccessTitle,
        success_description: tempSuccessDescription,
      }
    );

    setShowSuccessModal(false);
  }

  const handleCopy = async () => {

    try {
      await navigator.clipboard.writeText(embedScript);
      setCopybtn(true);

      setTimeout(() => {
        setCopybtn(false);
      }, 3000)
    } catch (error) {
      console.log("error in handleCopy " + error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between whitespace-nowrap">
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
              onClick={createNewForm}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              + New Form
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
              <FormPreview />
            </div>

          </aside>

        </div>
      </div>

      {/* Form setting modal  */}



      <FormSettingsModal
        open={showSettings}
        formSettings={formSettings}
        setFormSettings={setFormSettings}
        onClose={() => setShowSettings(false)}
        onDisplayModeChange={handleDisplayModeChange}
        onPopupTriggerChange={handlePopupTriggerChange}
        updateSettingsWithAlert={updateSettingsWithAlert}
        updateSettingsSilent={updateSettingsSilent}
        toMs={toMs}
      />


      <FormStyleModal
        open={showFormStyle}
        formStyle={formStyle}
        setFormStyle={setFormStyle}
        onClose={() => setShowFormStyle(false)}
        onSave={() => {
          updateSettingsWithAlert({
            background_color: formStyle.background_color,
            border_radius: formStyle.border_radius,
            box_shadow: formStyle.box_shadow,
            border_color: formStyle.border_color,
            title_color: formStyle.title_color,
            description_color: formStyle.description_color,
            title_align: formStyle.title_align,
            description_align: formStyle.description_align,
            Field_Color: formStyle.Field_Color,
          });
          setShowFormStyle(false);
        }}
      />



      <ShowSuccessModal
        open={showSuccessModal}
        title={tempSuccessTitle}
        description={tempSuccessDescription}
        onTitleChange={setTempSuccessTitle}
        onDescriptionChange={setTempSuccessDescription}
        onClose={() => setShowSuccessModal(false)}
        onSave={handleSaveSuccessMessage}
      />



      <EmbedScriptModal
        open={showEmbedModal}
        embedScript={embedScript}
        onClose={() => setShowEmbedModal(false)}
        onCopy={handleCopy}
        copied={copybtn}
      />


    </div>
  );
}
