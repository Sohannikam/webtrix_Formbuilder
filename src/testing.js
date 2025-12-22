function markFormSubmitted(formId, ttlMs) {
  try {
    var now = Date.now();
    var record = {
      submittedAt: now,
      expiresAt: now + ttlMs,
    };
    localStorage.setItem(
      "w24_form_submitted_" + formId,
      JSON.stringify(record)
    );
  } catch (e) {
    // fail silently (private mode, storage blocked, etc.)
  }
}

function isFormRecentlySubmitted(formId) {
  try {
    var raw = localStorage.getItem("w24_form_submitted_" + formId);
    if (!raw) return false;

    var data = JSON.parse(raw);
    if (!data.expiresAt) return false;

    if (Date.now() > data.expiresAt) {
      localStorage.removeItem("w24_form_submitted_" + formId);
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}


function init() {
  var scriptEl = document.currentScript;
  if (!scriptEl) return;

  var formId =
    scriptEl.getAttribute("data-form-id") ||
    scriptEl.getAttribute("data-w24-form-id");

  if (!formId) {
    console.error("[Webtrix24 Form] Missing data-form-id");
    return;
  }

  // 🚫 BLOCK rendering if already submitted in last 24 hours
  if (isFormRecentlySubmitted(formId)) {
    console.log("[Webtrix24 Form] Form already submitted recently, skipping render.");
    return;
  }

  if (isSuccess) {
  // ✅ Mark submission for 24 hours
  markFormSubmitted(formId, 24 * 60 * 60 * 1000);

  formEl.reset();

  showSuccessAlert(successMessage, function () {
    closeFormUI(wrapper);
  });
  return;
}