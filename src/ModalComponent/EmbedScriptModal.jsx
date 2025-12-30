export default function EmbedScriptModal({
  open,
  embedScript,
  onClose,
  onCopy,
  copied,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[520px] p-6">
        <h2 className="text-lg font-semibold mb-3">Embed Your Form</h2>

        <pre className="bg-gray-100 text-sm p-3 rounded overflow-x-auto">
          <code>{embedScript}</code>
        </pre>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Close
          </button>

          <button
            onClick={onCopy}
            disabled={copied}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {copied ? "Copied" : "Copy Script"}
          </button>
        </div>
      </div>
    </div>
  );
}
