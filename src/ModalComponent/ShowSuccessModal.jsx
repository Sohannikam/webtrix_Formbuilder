export default function ShowSuccessModal({
  open,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onClose,
  onSave,
}) {
  if (!open) return null;

  return (
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
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
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
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Thank you for contacting us. We will get back to you shortly."
          />
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-4 py-2 border rounded"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
