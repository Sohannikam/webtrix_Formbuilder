/*!
 * Webtrix24 Webform Embed v1.0
 * Lightweight embeddable form renderer
 * Usage:
 * <script src="https://yourcrm.com/webform/embed.js" data-form-id="123"></script>
 */


(function () {
  "use strict";

  // ===================== CONFIG: CHANGE THIS TO YOUR BASE URL ==========================
  var BASE_URL = "https://webtrix-backend.onrender.com"; // TODO: update
  var FORM_API_URL = BASE_URL + "/api/webform";
  var SUBMIT_API_URL = BASE_URL + "/api/webform/submit";

  // ===================================================================
  // Utilities
  // ===================================================================

  function safeGet(obj, path, defaultValue) {
    try {
      return path.split(".").reduce(function (acc, key) {
        return acc && acc[key] !== undefined ? acc[key] : undefined;
      }, obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function createElement(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "style") {
          Object.assign(el.style, attrs.style);
        } else if (key === "class") {
          el.className = attrs[key];
        } else if (key === "text") {
          el.textContent = attrs[key];
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });
    }
    return el;
  }

  function serializeForm(form) {
    var formData = new FormData(form);
    return formData;
  }

  function getUTMParams() {
    var params = {};
    if (!window.location || !window.location.search) return params;

    var searchParams = new URLSearchParams(window.location.search);
    var keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
    ];

    keys.forEach(function (key) {
      var val = searchParams.get(key);
      if (val) params[key] = val;
    });

    return params;
  }


  function getLeadSourceData() {
    return {
      page_url: window.location.href,
      page_title: document.title || "",
      referrer: document.referrer || "",
    };
  }

  // ===================================================================
  // reCAPTCHA v3 Loader (global, guarded)
  // ===================================================================

  var recaptchaScriptLoading = false;
  var recaptchaReadyPromise = null;

  function loadRecaptcha(siteKey) {
    if (!siteKey) return Promise.resolve(null);

    if (window.grecaptcha && window.grecaptcha.execute) {
      return Promise.resolve(window.grecaptcha);
    }

    if (recaptchaReadyPromise) {
      return recaptchaReadyPromise;
    }

    recaptchaReadyPromise = new Promise(function (resolve, reject) {
      if (recaptchaScriptLoading) return;

      recaptchaScriptLoading = true;
      var script = document.createElement("script");
      script.src =
        "https://www.google.com/recaptcha/api.js?render=" +
        encodeURIComponent(siteKey);
      script.async = true;
      script.defer = true;

      script.onload = function () {
        if (window.grecaptcha) {
          window.grecaptcha.ready(function () {
            resolve(window.grecaptcha);
          });
        } else {
          reject(new Error("reCAPTCHA failed to load"));
        }
      };

      script.onerror = function () {
        reject(new Error("Failed to load reCAPTCHA script"));
      };

      document.head.appendChild(script);
    });

    return recaptchaReadyPromise;
  }

  function executeRecaptcha(siteKey) {
    if (!siteKey) return Promise.resolve(null);

    return loadRecaptcha(siteKey).then(function (grecaptcha) {
      if (!grecaptcha || !grecaptcha.execute) return null;
      return grecaptcha.execute(siteKey, { action: "submit" });
    });
  }

  // ===================================================================
  // Field Show/Hide Logic
  // - backend can send rules like:
  //   field.show_when = { field: "lead_type", operator: "equals", value: "Business" }
  // ===================================================================

  function applyFieldVisibility(formEl, rules) {
    if (!rules || !rules.length) return;

    function evalRule(rule) {
      var controller = formEl.querySelector(
        '[name="' + rule.field + '"]'
      );
      if (!controller) return false;

      var val =
        controller.type === "checkbox"
          ? controller.checked
          : controller.value;

      var expected = rule.value;
      switch (rule.operator) {
        case "equals":
        default:
          return val == expected;
        case "not_equals":
          return val != expected;
        case "contains":
          return (val || "").toString().indexOf(expected) !== -1;
        case "checked":
          return !!val;
      }
    }

    function updateVisibility() {
      rules.forEach(function (rule) {
        var fieldWrapper = formEl.querySelector(
          '[data-w24-field-wrapper="' + rule.target + '"]'
        );
        if (!fieldWrapper) return;

        var shouldShow = evalRule(rule);
        fieldWrapper.style.display = shouldShow ? "" : "none";

        // Optional: clear value when hidden
        if (!shouldShow) {
          var input = fieldWrapper.querySelector("[name='" + rule.target + "']");
          if (input) input.value = "";
        }
      });
    }

    // Bind change events on all controller fields
    rules.forEach(function (rule) {
      var controller = formEl.querySelector(
        '[name="' + rule.field + '"]'
      );
      if (!controller) return;

      var events = ["change", "keyup"];
      events.forEach(function (e) {
        controller.addEventListener(e, updateVisibility);
      });
    });

    // Initial run
    updateVisibility();
  }

  // ===================================================================
  // Form Rendering
  // Expected JSON structure (example, adapt in backend):
  //
  // {
  //   form_id: 123,
  //   title: "Book Free Demo",
  //   description: "Short text",
  //   theme: {
  //     primaryColor: "#1a73e8",
  //     bgColor: "#ffffff",
  //     textColor: "#222222",
  //     borderRadius: "8px",
  //     fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  //   },
  //   custom_css: ".w24-form-container { max-width: 480px; }",
  //   fields: [
  //     { name, label, type, placeholder, required, hidden, options, show_when: { field, operator, value } }
  //   ],
  //   settings: {
  //     enable_recaptcha: true,
  //     recaptcha_site_key: "...",
  //     success_message: "Thank you! We have received your request.",
  //     redirect_url: "https://your-site.com/thank-you",
  //     success_message_duration: 5000
  //   }
  // }
  // ===================================================================


  function renderForm(config, scriptEl) {

    var displayMode = safeGet(config, "settings.display_mode", "inline");
var popupDelay = safeGet(config, "settings.delay_ms", 0);
var popupTrigger = safeGet(config, "settings.popup_trigger", "delay");
var scrollPercent = safeGet(config, "settings.scroll_percent", 50);


    function renderInline(container, wrapper, scriptEl) {
  scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);
  container.appendChild(wrapper);
}



function renderPopup(wrapper, delay) {
  setTimeout(function () {
    // Overlay
    var overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.45)",
      zIndex: "999999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    // Popup box
    var popup = document.createElement("div");
    Object.assign(popup.style, {
      background: "#fff",
      width: "420px",
      maxHeight: "90vh",
      overflowY: "auto",    
      position: "relative",
       borderRadius: borderRadius,
    });

    // Close button
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "10px",
      right: "12px",
      border: "none",
      background: "transparent",
      fontSize: "18px",
      cursor: "pointer",
    });

    closeBtn.onclick = function () {
      overlay.remove();
    };

    overlay.onclick = function () {
      overlay.remove();
    };

    popup.onclick = function (e) {
      e.stopPropagation();
    };

    popup.appendChild(closeBtn);
    popup.appendChild(wrapper);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }, delay);
}


function injectSlideInCSS() {
  if (document.getElementById("w24-slide-in-css")) return;

  var style = document.createElement("style");
  style.id = "w24-slide-in-css";
  style.textContent = `
  .w24-slide-in {
    position: fixed;
    width: 420px;
    max-height: 85vh;
    background: #fff;
    box-shadow: 0 10px 40px rgba(0,0,0,0.25);
    border-radius: 12px;
    overflow-y: auto;
    z-index: 999999;
    transition: transform 0.4s ease;
  }

  /* ===================== POSITIONS ===================== */

  /* Bottom Right */
  .w24-slide-in.bottom-right {
    bottom: 20px;
    right: 20px;
    transform: translateX(120%);
  }

  /* Bottom Left */
  .w24-slide-in.bottom-left {
    bottom: 20px;
    left: 20px;
    transform: translateX(-120%);
  }

  /* Top Right */
  .w24-slide-in.top-right {
    top: 20px;
    right: 20px;
    transform: translateX(120%);
  }

  /* Top Left */
  .w24-slide-in.top-left {
    top: 20px;
    left: 20px;
    transform: translateX(-120%);
  }

  /* ===================== ACTIVE ===================== */

  .w24-slide-in.active {
    transform: translateX(0);
  }

  /* ===================== CLOSE BUTTON ===================== */

  .w24-slide-in-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    color: #111;
  }

  .w24-slide-in-close:hover::after {
    content: " Close";
    font-size: 12px;
    margin-left: 4px;
  }
`;

  document.head.appendChild(style);
}

function renderSlideIn(wrapper, delay) 
{
  injectSlideInCSS();

  var position =
    safeGet(config, "settings.slide_position", "bottom-right");

  var slideContainer = document.createElement("div");
  slideContainer.className = "w24-slide-in " + position;

  // Close button
  var closeBtn = document.createElement("button");
  closeBtn.className = "w24-slide-in-close";
  closeBtn.innerHTML = "✕";

  closeBtn.onclick = function () {
    slideContainer.classList.remove("active");
  };

  slideContainer.appendChild(closeBtn);
  slideContainer.appendChild(wrapper);
  document.body.appendChild(slideContainer);

  setTimeout(function () {
    slideContainer.classList.add("active");
  }, delay || 0);
}

function setupPopupTriggers(wrapper) {
  var opened = false;

  function openPopup() {
    if (opened) return;
    opened = true;
    renderPopup(wrapper, 0);
    removeListeners();
  }

  function onScroll() {
    var scrollTop = window.scrollY;
    var docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    var percent = (scrollTop / docHeight) * 100;
    if (percent >= scrollPercent) {
      openPopup();
    }
  }

  function removeListeners() {
    window.removeEventListener("scroll", onScroll);
  }

  // Delay trigger
  if (popupTrigger === "delay") {
    setTimeout(openPopup, popupDelay || 0);
  }

  // Scroll trigger
  if (popupTrigger === "scroll") {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}


    var formId = config.form_id || scriptEl.getAttribute("data-form-id");
    var containerId = "w24_form_container_" + formId;
    var formDomId = "w24_form_" + formId;

    // --- Insert container after script tag ---
    var container = createElement("div", {
      id: containerId,
      class: "w24-form-container",
      style: {
        fontFamily:
          safeGet(config, "theme.fontFamily", "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"),
        maxWidth: "100%",
        boxSizing: "border-box",
      },
    });

    scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);

    // --- Optional custom CSS from backend ---
    var customCss = config.custom_css;
    if (customCss) {
      var styleTag = createElement("style");
      styleTag.type = "text/css";
      styleTag.appendChild(document.createTextNode(customCss));
      document.head.appendChild(styleTag);
    }

    // --- Default theme values ---
    var primaryColor = safeGet(config, "theme.primaryColor", "#1a73e8");
var bgColor =
  safeGet(config, "settings.background_color",
    safeGet(config, "theme.bgColor", "#ffffff")
  );
    var textColor = safeGet(config, "theme.textColor", "#222222");
    var borderRadius = safeGet(
  config,
  "settings.border_radius",
  "0px"
);

var boxShadow = safeGet(
  config,
  "settings.box_shadow",
  "0 8px 20px rgba(0,0,0,0.08)"
);

var borderColor = safeGet(
  config,
  "settings.border_color",
  "rgba(0,0,0,0.08)"
);

var titleColor = safeGet(
  config,
  "settings.title_color",
  "#111827"
);


    // --- Build form HTML ---

    var wrapper = createElement("div", {
      class: "w24-form-wrapper",
      style: {
        backgroundColor: bgColor,
        color: textColor,
            border: "1px solid " + borderColor,
        borderRadius: borderRadius,
        padding: "16px 20px",
        boxSizing: "border-box",
        boxShadow:
          boxShadow,
      },
    });

    var title = config.meta.name;
    if (title) {
      var h3 = createElement("h3", {
        class: "w24-form-title",
        text: title,
        style: {
          margin: "0 0 6px 0",
          fontSize: "18px",
          fontWeight: "600",
          color:titleColor
        },
      });
      wrapper.appendChild(h3);
    }

    var description = config.meta.description;
    if (description) {
      var p = createElement("p", {
        class: "w24-form-description",
        text: description,
        style: {
          margin: "0 0 16px 0",
          fontSize: "13px",
          opacity: "0.9",
        },
      });
      wrapper.appendChild(p);
    }

    var formEl = createElement("form", {
      id: formDomId,
      class: "w24-form",
      novalidate: "novalidate",
    });

    // STATUS area (success/error)
    var statusBox = createElement("div", {
      class: "w24-form-status",
      style: {
        display: "none",
        marginBottom: "12px",
        fontSize: "13px",
        padding: "8px 10px",
        borderRadius: "6px",
      },
    });
    formEl.appendChild(statusBox);

    // Field-level show/hide rules
    var visibilityRules = [];

    // --- Render fields from config ---
    (config.fields || []).forEach(function (field) {
  
      if (field.hidden) {
        // still include as hidden input
        var hiddenInput = createElement("input", {
          type: "hidden",
          name: field.name,
          value: field.value || "",
        });
        formEl.appendChild(hiddenInput);
        return;
      }

      var fieldWrapper = createElement("div", {
        class: "w24-form-field",
        "data-w24-field-wrapper": field.name,
        style: {
          marginBottom: "12px",
        },
      });

      if (field.label && field.type !== "hidden") {
        var label = createElement("label", {
          class: "w24-form-label",
          style: {
            display: "block",
            marginBottom: "4px",
            fontSize: "13px",
            fontWeight: "500",
          },
        });
        label.textContent =
          field.label + (field.required ? " *" : "");
        label.setAttribute("for", formDomId + "_" + field.id);
        fieldWrapper.appendChild(label);
      }

      var inputEl;

      var commonInputStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "9px 10px",
        fontSize: "13px",
        borderRadius: "6px",
        border: "1px solid rgba(148, 163, 184, 0.9)",
        outline: "none",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      };

      var createTextLike = function (type) {
        return createElement("input", {
          type: type,
          name: field.nameKey,
          id: formDomId + "_" + field.id,
          placeholder: field.placeholder || "",
          value: field.value || "",
          style: commonInputStyle,
        });
      };

      switch (field.type) {
        case "textarea":
          inputEl = createElement("textarea", {
            name: field.nameKey,
            id: formDomId + "_" + field.id,
            placeholder: field.placeholder || "",
            style: Object.assign({}, commonInputStyle, {
              minHeight: "70px",
              resize: "vertical",
            }),
          });
          inputEl.value = field.value || "";
          break;

        case "dropdown":
          inputEl = createElement("select", {
            name: field.nameKey,
            id: formDomId + "_" + field.id,
            style: commonInputStyle,
          });
          if (field.placeholder) {
            var phOpt = createElement("option", {
              value: "",
              text: field.placeholder,
            });
            inputEl.appendChild(phOpt);
          }
          (field.options || []).forEach(function (opt) {
            var optionEl = createElement("option", {
              value: opt.label,
              text: opt.label,
            });
            if (field.value && field.value == opt.value) {
              optionEl.selected = true;
            }
            inputEl.appendChild(optionEl);
          });
          break;

        case "radio":
        case "checkbox_group":
          // Radio/Checkbox group
          inputEl = createElement("div", {
            class: "w24-multi-input",
          });
          (field.options || []).forEach(function (opt, index) {
            var wrapperInline = createElement("label", {
              class: "w24-inline-option",
              style: {
                display: "inline-flex",
                alignItems: "center",
                marginRight: "12px",
                fontSize: "13px",
                cursor: "pointer",
              },
            });
            var inputInner = createElement("input", {
              type: field.type === "radio" ? "radio" : "checkbox",
              name: field.nameKey + (field.type === "checkbox_group" ? "[]" : ""),
              value: opt.value,
              style: {
                marginRight: "5px",
              },
            });
            if (Array.isArray(field.value) && field.value.indexOf(opt.value) !== -1) {
              inputInner.checked = true;
            } else if (field.value && field.value == opt.value) {
              inputInner.checked = true;
            }
            wrapperInline.appendChild(inputInner);
            wrapperInline.appendChild(document.createTextNode(opt.label));
            inputEl.appendChild(wrapperInline);
          });
          break;

        case "hidden":
          inputEl = createElement("input", {
            type: "hidden",
            name: field.nameKey,
            value: field.value || "",
          });
          break;

        default:
          // text, email, tel, number, url, etc.
          inputEl = createTextLike(field.type || "text");
      }

      if (field.required && field.type !== "hidden") {
        inputEl.required = true;
      }

      if (field.readonly) {
        inputEl.readOnly = true;
      }

      // Basic focus styles via inline style
      inputEl.addEventListener("focus", function () {
        inputEl.style.borderColor = primaryColor;
        inputEl.style.boxShadow = "0 0 0 1px " + primaryColor + "1A";
      });
      inputEl.addEventListener("blur", function () {
        inputEl.style.borderColor = "rgba(148, 163, 184, 0.9)";
        inputEl.style.boxShadow = "none";
      });

      fieldWrapper.appendChild(inputEl);
      formEl.appendChild(fieldWrapper);

      // Register visibility rule if provided
      if (field.show_when && field.show_when.field) {
        visibilityRules.push({
          field: field.show_when.field,
          operator: field.show_when.operator || "equals",
          value: field.show_when.value,
          target: field.nameKey,
        });
      }
    });

    // --- Auto UTM + lead source hidden fields ---
    var utmParams = getUTMParams();
    Object.keys(utmParams).forEach(function (key) {
      var hidden = createElement("input", {
        type: "hidden",
        name: key,
        value: utmParams[key],
      });
      formEl.appendChild(hidden);
    });

    var leadSource = getLeadSourceData();
    Object.keys(leadSource).forEach(function (key) {
      var hidden = createElement("input", {
        type: "hidden",
        name: "w24_" + key,
        value: leadSource[key],
      });
      formEl.appendChild(hidden);
    });

    // --- Submit button ---
    var buttonWrapper = createElement("div", {
      style: { marginTop: "12px",textAlign:"center" },
    });
    var submitBtn = createElement("button", {
      type: "submit",
      class: "w24-form-submit",
      style: {
        width: "31%",
        backgroundColor: "rgb(79 70 229)",
        color: "#ffffff",
        border: "none",
        padding: "10px 14px",
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      },
    });
    submitBtn.textContent =
      (config.submit_button && config.submit_button.label) ||
      "Submit";

    buttonWrapper.appendChild(submitBtn);
    formEl.appendChild(buttonWrapper);

   

    // Attach form to wrapper
    wrapper.appendChild(formEl);
 if (displayMode === "popup") {
  setupPopupTriggers(wrapper);
}

  else if (displayMode === "slide_in") {
  renderSlideIn(wrapper, popupDelay);
}
 else {
  renderInline(container, wrapper, scriptEl);
}





    // Apply field visibility rules if any
    if (visibilityRules.length) {
      applyFieldVisibility(formEl, visibilityRules);
    }

    // --- Handle form submit ---
    var settings = config.settings || {};
    var enableRecaptcha = !!settings.enable_recaptcha;
    var siteKey = settings.recaptcha_site_key || null;
    var redirectUrl = settings.redirect_url || null;
    var successMessage =
      settings.success_message ||
      "Thank you! Your details have been submitted.";
    var successMessageDuration =
      settings.success_message_duration || 5000;

    function showStatus(type, message) {
      statusBox.style.display = "block";
      statusBox.textContent = message;
      if (type === "error") {
        statusBox.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
        statusBox.style.color = "#b91c1c";
        statusBox.style.border = "1px solid rgba(248, 113, 113, 0.5)";
      } else {
        statusBox.style.backgroundColor = "rgba(34, 197, 94, 0.08)";
        statusBox.style.color = "#15803d";
        statusBox.style.border = "1px solid rgba(74, 222, 128, 0.5)";
      }
    }

    function clearStatus() {
      statusBox.style.display = "none";
      statusBox.textContent = "";
    }

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      submitBtn.style.opacity = isLoading ? "0.7" : "1";
      submitBtn.style.cursor = isLoading ? "default" : "pointer";
      if (isLoading) {
        submitBtn.setAttribute("data-original-text", submitBtn.textContent);
        submitBtn.textContent = "Submitting...";
      } else {
        var original = submitBtn.getAttribute("data-original-text");
        if (original) submitBtn.textContent = original;
      }
    }

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();

      // Simple client-side validation
    var invalid = formEl.querySelector(":invalid");
if (invalid) {
  invalid.focus();

  // Try to find label text
  var fieldLabel = "";
  if (invalid.id) {
    var labelEl = formEl.querySelector(
      'label[for="' + invalid.id + '"]'
    );
    if (labelEl) {
      fieldLabel = labelEl.textContent.replace("*", "").trim();
    }
  }

  // Fallback if label not found
  if (!fieldLabel) {
    fieldLabel = invalid.name || "This field";
  }

  showStatus("error", fieldLabel + " is required.");
  return;
}


      setLoading(true);

      var submitWithToken = function (token) {
        // Append token if provided
        if (token) {
          var recInput = formEl.querySelector(
            'input[name="g-recaptcha-response"]'
          );
          if (!recInput) {
            recInput = createElement("input", {
              type: "hidden",
              name: "g-recaptcha-response",
            });
            formEl.appendChild(recInput);
          }
          recInput.value = token;
        }

        var formData = serializeForm(formEl);
        formData.append("form_id", formId);

        fetch(SUBMIT_API_URL, {
          method: "POST",
          body: formData,
          credentials: "include",
        })
          .then(function (res) {
            if (!res.ok) {
              throw new Error("Network error, status " + res.status);
            }
            return res.json();
          })

          .then(function (data) {
            console.log("form submited in embed.js")
            var isSuccess =
              data.success === true ||
              data.status === "success" ||
              data.code === 200;

            if (isSuccess) {
              if (redirectUrl) {
                window.location.href = redirectUrl;
                return;
              }

              showStatus("success", data.message || successMessage);
              formEl.reset();

              if (successMessageDuration > 0) {
                setTimeout(clearStatus, successMessageDuration);
              }
            } else {
              showStatus(
                "error",
                data.message || "Something went wrong. Please try again."
              );
            }
          })
          .catch(function (err) {
            console.error("Submit error", err);
            showStatus(
              "error",
              "Unable to submit form at the moment. Please try again later."
            );
          })
          .finally(function () {
            setLoading(false);
          });
      };

      if (enableRecaptcha && siteKey) {
        executeRecaptcha(siteKey)
          .then(function (token) {
            submitWithToken(token);
          })
          .catch(function (err) {
            console.error("reCAPTCHA error", err);
            showStatus(
              "error",
              "Security check failed. Please refresh the page and try again."
            );
            setLoading(false);
          });
      } else {
        submitWithToken(null);
      }
    });
  }

  // ===================================================================
  // Main Entry: run once per <script src="...embed.js" data-form-id="">
  // document.currentScript is unique to each script tag
  // ===================================================================

  function init() {
    var scriptEl = document.currentScript;
    if (!scriptEl) return;

    var formId =
      scriptEl.getAttribute("data-form-id") ||
      scriptEl.getAttribute("data-w24-form-id");

    if (!formId) {
      console.error(
        "[Webtrix24 Form] Missing data-form-id attribute on script tag."
      );
      return;
    }

    var existingContainer = document.getElementById("w24_form_container_" + formId);
  if (existingContainer) {
    console.warn("Form already rendered, skipping duplicate render.");
    return;
  }

    var url = FORM_API_URL + "/form/" + encodeURIComponent(formId);

    // Optional: allow passing API key or tenant from data attributes
    var companyId = scriptEl.getAttribute("data-company-id");
    var publicKey = scriptEl.getAttribute("data-public-key");
    if (companyId) url += "&company_id=" + encodeURIComponent(companyId);
    if (publicKey) url += "&key=" + encodeURIComponent(publicKey);

    fetch(url, {
      method: "GET",
      credentials: "include",
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load form config, status " + res.status);
        }
        return res.json();
      })
      .then(function (config) {


        if (!config || typeof config !== "object") {
          throw new Error("Invalid form config received");
        }

    
        renderForm(config, scriptEl);
      })

      .catch(function (err) {
        console.error("[Webtrix24 Form] Error:", err);
        var errorDiv = createElement("div", {
          class: "w24-form-error",
          style: {
            color: "#b91c1c",
            fontSize: "13px",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        });
        errorDiv.textContent =
          "Sorry, the form could not be loaded at the moment.";
        if (scriptEl.parentNode) {
          scriptEl.parentNode.insertBefore(errorDiv, scriptEl.nextSibling);
        }
      });
  }

  // Run immediately
  init();
})();
