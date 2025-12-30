export default function FormStyleModal({
  open,
  formStyle,
  setFormStyle,
  onSave,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[360px] rounded-xl shadow-lg p-5 relative">

        {/* Close */}
        <button
          className="absolute top-3 right-3"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold mb-4">Form Style</h3>

        {/* Background Color */}
        <StyleColor
          label="Background Color"
          value={formStyle.background_color}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, background_color: v }))
          }
        />

        <StyleColor
          label="Title Color"
          value={formStyle.title_color}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, title_color: v }))
          }
        />

        <StyleColor
          label="Description Color"
          value={formStyle.description_color}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, description_color: v }))
          }
        />

        <StyleColor
          label="Form Field Color"
          value={formStyle.Field_Color}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, Field_Color: v }))
          }
        />

        <StyleSelect
          label="Title Alignment"
          value={formStyle.title_align}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, title_align: v }))
          }
          options={["left", "center", "right"]}
        />

        <StyleSelect
          label="Description Alignment"
          value={formStyle.description_align}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, description_align: v }))
          }
          options={["left", "center", "right"]}
        />

        <StyleColor
          label="Border Color"
          value={formStyle.border_color}
          onChange={(v) =>
            setFormStyle((p) => ({ ...p, border_color: v }))
          }
        />

        {/* Border Radius */}
        <div className="mt-4">
          <label className="text-sm font-medium block mb-1">
            Border Radius
          </label>
          <input
            type="range"
            min="0"
            max="32"
            value={parseInt(formStyle.border_radius)}
            onChange={(e) =>
              setFormStyle((p) => ({
                ...p,
                border_radius: `${e.target.value}px`,
              }))
            }
            className="w-full"
          />
        </div>

        {/* Box Shadow */}
        <div className="mt-4">
          <label className="text-sm font-medium block mb-1">
            Box Shadow
          </label>
          <select
            className="w-full border rounded px-2 py-1"
            value={formStyle.box_shadow}
            onChange={(e) =>
              setFormStyle((p) => ({
                ...p,
                box_shadow: e.target.value,
              }))
            }
          >
            <option value="none">None</option>
            <option value="0 4px 12px rgba(0,0,0,0.08)">Soft</option>
            <option value="0 8px 20px rgba(0,0,0,0.12)">Medium</option>
            <option value="0px 5px 15px rgba(0, 0, 0, 0.35)">Strong</option>
          </select>
        </div>

        {/* Save */}
        <div className="mt-5 text-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* Small reusable helpers */
function StyleColor({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-8 cursor-pointer"
      />
    </div>
  );
}

function StyleSelect({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="border rounded px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
