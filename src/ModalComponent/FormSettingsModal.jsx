export default function FormSettingsModal({
  open,
  formSettings,
  setFormSettings,
  onClose,
  onDisplayModeChange,
  onPopupTriggerChange,
  updateSettingsWithAlert,
  updateSettingsSilent,
  toMs,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[420px] rounded-xl shadow-lg p-5 relative">

        {/* Close */}
        <button
          className="group absolute top-3 right-3 text-black"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 
            bg-black text-white text-xs px-2 py-1 rounded
            opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Close
          </span>
        </button>

        <h3 className="text-lg font-semibold mb-4">Form Settings</h3>

        {/* Display Mode */}
        <Section title="Display Mode">
          <Radio
            checked={formSettings.display_mode === "inline"}
            onChange={() => onDisplayModeChange("inline")}
            label="Inline (Embed in page)"
          />
          <Radio
            checked={formSettings.display_mode === "popup"}
            onChange={() => onDisplayModeChange("popup")}
            label="Popup"
          />
          <Radio
            checked={formSettings.display_mode === "slide_in"}
            onChange={() => onDisplayModeChange("slide_in")}
            label="Slide-in"
          />
        </Section>

        {/* Popup Trigger */}
        {formSettings.display_mode === "popup" && (
          <Section title="Popup Trigger">
            <Radio
              checked={formSettings.popup_trigger === "delay"}
              onChange={() => onPopupTriggerChange("delay")}
              label="After delay"
            />
            <Radio
              checked={formSettings.popup_trigger === "scroll"}
              onChange={() => onPopupTriggerChange("scroll")}
              label="On scroll"
            />
          </Section>
        )}

        {/* Popup Delay */}
        {formSettings.display_mode === "popup" &&
          formSettings.popup_trigger === "delay" && (
            <Input
              label="Popup Delay (seconds)"
              type="number"
              value={formSettings.delay_sec ?? ""}
              onChange={(v) =>
                updateSettingsSilent({
                  delay_sec: v,
                  delay_ms: v === "" ? 0 : Number(v) * 1000,
                })
              }
            />
          )}

        {/* Scroll Trigger */}
        {formSettings.display_mode === "popup" &&
          formSettings.popup_trigger === "scroll" && (
            <Select
              label="Show popup after scroll"
              value={formSettings.scroll_percent}
              options={[
                { label: "50% page scroll", value: 50 },
                { label: "75% page scroll", value: 75 },
              ]}
              onChange={(v) =>
                updateSettingsWithAlert({ scroll_percent: Number(v) })
              }
            />
          )}

        {/* Slide-in Position */}
        {formSettings.display_mode === "slide_in" && (
          <Select
            label="Slide-in Position"
            value={formSettings.slide_position || "bottom-right"}
            options={[
              { label: "Bottom Right", value: "bottom-right" },
              { label: "Bottom Left", value: "bottom-left" },
              { label: "Top Right", value: "top-right" },
              { label: "Top Left", value: "top-left" },
            ]}
            onChange={(v) =>
              updateSettingsWithAlert({ slide_position: v })
            }
          />
        )}

        {/* Cancel Button */}
        <div className="mt-4">
          <label className="flex items-center justify-between text-sm font-medium">
            <span>Show Cancel Button</span>
            <input
              type="checkbox"
              checked={formSettings.show_cancel_button ?? true}
              onChange={(e) => {
                const value = e.target.checked;
                setFormSettings((p) => ({
                  ...p,
                  show_cancel_button: value,
                }));
                updateSettingsWithAlert({ show_cancel_button: value });
              }}
            />
          </label>
          <p className="mt-1 text-xs text-gray-500">
            If disabled, users must submit the form to close it.
          </p>
        </div>

        {/* Reshow delay */}
        <div className="mt-5">
          <label className="block text-sm font-medium mb-2">
            Show form again after submission
          </label>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              className="w-24 border rounded px-2 py-1"
              value={formSettings.reshow_delay_value ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                const unit = formSettings.reshow_delay_unit;
                updateSettingsWithAlert({
                  reshow_delay_value: value,
                  reshow_delay_unit: unit,
                  reshow_delay_ms: toMs(value, unit),
                });
              }}
            />

            <select
              className="border rounded px-2 py-1"
              value={formSettings.reshow_delay_unit}
              onChange={(e) => {
                const unit = e.target.value;
                const value = formSettings.reshow_delay_value;
                updateSettingsWithAlert({
                  reshow_delay_value: value,
                  reshow_delay_unit: unit,
                  reshow_delay_ms: toMs(value, unit),
                });
              }}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </div>


         <div className="mt-4">
          <label className="text-sm font-medium block mb-1">
          </label>
          <Select
              label="Is Lead Form"
              value={formSettings.is_lead_form}
              options={[
                { label: "Yes", value: 1 },
                { label: "No", value: 0 },
              ]}
              onChange={(v) =>
                updateSettingsWithAlert({ is_lead_form: Number(v) })
              }
            />
        </div>
      </div>
    </div>
  );
}

/* Small helpers */

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{title}</label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Radio({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2">
      <input type="radio" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function Input({ label, type, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
