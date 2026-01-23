/*!
 * Webtrix24 Webform Embed v1.0
 * Lightweight embeddable form renderer
 * Usage:
 * <script src="https://yourcrm.com/webform/embed.js" data-form-id="123"></script>
 */


(function () {
  "use strict";


  // ===================== CONFIG: CHANGE THIS TO YOUR BASE URL ==========================
  // var BASE_URL = "https://webtrix-backend.onrender.com"; 
   var BASE_URL = "http://192.168.0.106/CRUD_CI3"; 
    //  var BASE_URL = "https://ci3apitest.ct.ws"; 

  var FORM_API_URL = BASE_URL + "/formconfig";
  var SUBMIT_API_URL = BASE_URL + "/form/submit";


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

    function addHoneypotField(formEl) {
      console.log("inside honeypot field addHoneypotField");
  var honeypot = document.createElement("input");

  honeypot.type = "text";
  honeypot.name = "company_website";
  honeypot.value = "";
  honeypot.autocomplete = "off";
  honeypot.tabIndex = "-1";

  // Hide from humans
  honeypot.style.position = "absolute";
  honeypot.style.left = "-9999px";
  honeypot.style.top = "-9999px";

  formEl.appendChild(honeypot);
}

  function serializeForm(form) {
    var formData = new FormData(form);
    return formData;
  }

// validation fields starts from here 

  function allowOnlyNumbers(input, maxLength) {
  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "");
    if (maxLength) {
      input.value = input.value.slice(0, maxLength);
    }
  });
}

function allowOnlyText(input) {
  input.addEventListener("input", function () {
    input.value = input.value.replace(/[^a-zA-Z\s]/g, "");
  });
}

function isValidGST(gst) {
  if (!gst) return false;

  // Uppercase for consistency
  gst = gst.toUpperCase();

  // GST regex
  var gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return gstRegex.test(gst);
}

function isValidPAN(pan) {
  if (!pan) return false;

  pan = pan.toUpperCase();

  // PAN format: ABCDE1234F
  var panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  return panRegex.test(pan);
}

function isValidAadhaar(aadhaar) {
  if (!aadhaar) return false;

  // Aadhaar must be exactly 12 digits
  var aadhaarRegex = /^[0-9]{12}$/;

  return aadhaarRegex.test(aadhaar);
}



// ===================================================
// CENTRAL FIELD VALIDATION REGISTRY
// ===================================================

var FIELD_VALIDATORS = {

  office_land_line: {
  input: function (el) {
    // Allow digits only
    el.addEventListener("input", function () {
      el.value = el.value.replace(/\D/g, "").slice(0, 11);
    });
  },

  submit: function (formEl, showStatus) {
    var el = formEl.querySelector('[name="office_land_line"]');
    if (!el) return true;

    var value = el.value.trim();

    // ✅ Optional field → skip if empty
    if (!value && !el.required) {
      return true;
    }

    // ✅ India landline formats:
    // 8 digits (local) OR 10–11 digits (STD + number)
    var valid =
      /^\d{8}$/.test(value) ||        // local landline
      /^\d{10,11}$/.test(value);      // STD + landline

    if (!valid) {
      showStatus(
        "error",
        "Please enter a valid office landline number"
      );
      el.focus();
      return false;
    }

    return true;
  }
},

  email: {
  input: function (el) {
    // normalize email while typing
    el.addEventListener("input", function () {
      el.value = el.value.trim();
    });
  },

  submit: function (formEl, showStatus) {
    var el = formEl.querySelector(
      'input[type="email"], input[name*="email"]'
    );

    if (!el) return true;

    var value = el.value.trim();

    // ✅ Optional field → skip if empty
    if (!value && !el.required) {
      return true;
    }

    // ✅ Simple & safe email regex
    // var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
     var emailRegex =
      /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(value)) {
      showStatus("error", "Please enter a valid email address");
      el.focus();
      return false;
    }

    return true;
  }
},


  mobile: {
    input: function (el) {
      el.addEventListener("input", function () {
        el.value = el.value.replace(/\D/g, "").slice(0, 10);
      });
    },
    submit: function (form, showStatus) {
      var el = form.querySelector(
        'input[name*="mobile"], input[name*="phone"], input[name="wa_number"]'
      );
      if (!el) return true;

        var value = el.value.trim();

  // ✅ If empty AND not required → skip validation
  if (!value && !el.required) {
    return true;
  }

      if (value.length !== 10) {
        showStatus("error", "Mobile number must be 10 digits");
        el.focus();
        return false;
      }
      return true;
    }
  },

  name: {
    input: function (el) {
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^a-zA-Z\s]/g, "");
      });
    },
    submit: function () {
      return true; // typing validation is enough
    }
  },
   state: {
    input: function (el) {
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^a-zA-Z\s]/g, "");
      });
    },
    submit: function () {
      return true; // typing validation is enough
    }
  },
   country: {
    input: function (el) {
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^a-zA-Z\s]/g, "");
      });
    },
    submit: function () {
      return true; // typing validation is enough
    }
  },
   city: {
    input: function (el) {
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^a-zA-Z\s]/g, "");
      });
    },
    submit: function () {
      return true; // typing validation is enough
    }
  },

  
  zipcode: {
    input: function (inputEl) {
      inputEl.addEventListener("input", function () {
        inputEl.value = inputEl.value.replace(/\D/g, "");
      });
    },
    submit: function (formEl, showStatus) {
      var zipInput = formEl.querySelector('[name="zipcode"]');
      if (!zipInput || !zipInput.value) return true;

      

      var zip = zipInput.value.trim();

      if(!zip && !zip.required)
      {
        return true;
      }

      var countryCodeEl = formEl.querySelector('[name$="_country"]');
      var countryCode = countryCodeEl ? countryCodeEl.value : "";

      var valid =
        countryCode === "+91"
          ? /^\d{6}$/.test(zip)
          : countryCode === "+1"
          ? /^\d{5}(\d{4})?$/.test(zip)
          : /^\d{4,10}$/.test(zip);

      if (!valid) {
        showStatus("error", "Please enter a valid zip code");
        zipInput.focus();
        return false;
      }
      return true;
    },
  },

  pan_number: {
    input: function (inputEl) {
      inputEl.addEventListener("input", function (e) {
        e.target.value = e.target.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 10);
      });
    },
    submit: function (formEl, showStatus) {
      var el = formEl.querySelector('[name="pan_number"]');
      if (!el) return true;

        var value = el.value.trim();

  // ✅ If empty AND not required → skip validation
  if (!value && !el.required) {
    return true;
  }


      if (!isValidPAN(value)) {
        showStatus("error", "Please enter a valid PAN number");
        el.focus();
        return false;
      }
      return true;
    },
  },

  gst_no: {
    input: function (inputEl) {
      inputEl.addEventListener("input", function (e) {
        e.target.value = e.target.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 15);
      });
    },
    submit: function (formEl, showStatus) {
      var el = formEl.querySelector('[name="gst_no"]');
      if (!el) return true;

      var value = el.value.trim();

  // ✅ If empty AND not required → skip validation
  if (!value && !el.required) {
    return true;
  }

      if (!isValidGST(value)) {
        showStatus("error", "Please enter a valid GST number");
        el.focus();
        return false;
      }
      return true;
    },
  },

  adhar_number: {
    input: function (inputEl) {
      inputEl.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 12);
      });
    },
    submit: function (formEl, showStatus) {
      var el = formEl.querySelector('[name="adhar_number"]');
      if (!el) return true;

      var value = el.value.trim();

  // ✅ If empty AND not required → skip validation
  if (!value && !el.required) {
    return true;
  }

      if (!isValidAadhaar(value)) {
        showStatus("error", "Please enter a valid 12-digit Aadhaar number");
        el.focus();
        return false;
      }
      return true;
    },
  },
};

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
          return val !== expected;
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




  function renderForm(config, scriptEl) {

  // Or log with JSON formatting
  console.log('Form Config (JSON):', JSON.stringify(config, null, 2));

    var displayMode = safeGet(config, "definition.settings.display_mode", "inline");
var popupDelay = safeGet(config, "definition.settings.delay_ms", 0);
var popupTrigger = safeGet(config, "definition.settings.popup_trigger", "delay");
var scrollPercent = safeGet(config, "definition.settings.scroll_percent", 50);
var showCancelButton = safeGet(config,"definition.settings.show_cancel_button",true);



    function renderInline(container, wrapper, scriptEl) {
  scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);
  container.appendChild(wrapper);
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
  safeGet(config, "definition.settings.background_color",
    safeGet(config, "theme.bgColor", "#ffffff")
  );
    var textColor = safeGet(config, "theme.textColor", "#222222");
    var borderRadius = safeGet(
  config,
  "definition.settings.border_radius",
  "0px"
);

var boxShadow = safeGet(
  config,
  "definition.settings.box_shadow",
  "0 8px 20px rgba(0,0,0,0.08)"
);

var borderColor = safeGet(
  config,
  "definition.settings.border_color",
  "rgba(0,0,0,0.08)"
);

var titleColor = safeGet(
  config,
  "definition.settings.title_color",
  "#111827"
);

var descriptionColor = safeGet(
  config,
  "definition.settings.description_color",
  "#111827"
);

var aligntextTitle = safeGet(
  config,
  "definition.settings.title_align",
  "left"
);
var aligntextDescription = safeGet(
  config,
  "definition.settings.description_align",
  "left"
);

var fieldLabelColor = safeGet(
  config,
  "definition.settings.Field_Color",
  "#111827"
);

console.log("description color is"+descriptionColor)

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

    var title = config.name;
    if (title) {
      var h3 = createElement("h3", {
        class: "w24-form-title",
        text: title,
        style: {
          margin: "0 0 6px 0",
          fontSize: "18px",
          fontWeight: "600",
          color:titleColor,
          textAlign:aligntextTitle,
        },
      });
      wrapper.appendChild(h3);
    }

    var description = config.description;
    if (description) {
      var p = createElement("p", {
        class: "w24-form-description",
        text: description,
        style: {
          margin: "0 0 16px 0",
          fontSize: "13px",
          opacity: "0.9",
          color:descriptionColor,
          textAlign:aligntextDescription,
        },
      });
      wrapper.appendChild(p);
    }

    var formEl = createElement("form", {
      id: formDomId,
      class: "w24-form",
      novalidate: "novalidate",
    });

    addHoneypotField(formEl);

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
    (config.definition.fields || []).forEach(function (field) {
  
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
            color:fieldLabelColor,
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

      // 🔥 Handle Salutation based on field name (semantic override)
if ((field.nameKey || "").toLowerCase() === "salutation") {
  inputEl = createElement("select", {
    name: field.nameKey,
    id: formDomId + "_" + field.id,
    style: commonInputStyle,
  });

  // Placeholder option
  var placeholderOpt = createElement("option", {
    value: "",
    text: "Select salutation",
    disabled: "disabled",
    selected: "selected",
  });
  inputEl.appendChild(placeholderOpt);

  // Salutation options
  ["Mr", "Mrs", "Ms", "Dr"].forEach(function (val) {
    var opt = createElement("option", {
      value: val,
      text: val,
    });
    inputEl.appendChild(opt);
  });

  if (field.required) inputEl.required = true;

  fieldWrapper.appendChild(inputEl);
  formEl.appendChild(fieldWrapper);

  return; // ⛔ stop default rendering
}

// 🔹 Country Code dropdown
if (field.nameKey === "country_code") {
  var selectEl = createElement("select", {
    name: field.nameKey,
    id: formDomId + "_" + field.id,
    style: commonInputStyle,
  });

  // Placeholder
  selectEl.appendChild(
    createElement("option", {
      value: "",
      text: "Select country code",
      disabled: true,
      selected: true,
    })
  );

  [
    { value: "+91", label: "🇮🇳 India (+91)" },
    { value: "+1", label: "🇺🇸 USA (+1)" },
    { value: "+44", label: "🇬🇧 UK (+44)" },
  ].forEach(function (c) {
    selectEl.appendChild(
      createElement("option", {
        value: c.value,
        text: c.label,
      })
    );
  });

  fieldWrapper.appendChild(selectEl);
  formEl.appendChild(fieldWrapper);
  return; // ⛔ stop further processing
}

// 🔹 GST State dropdown
if (field.nameKey === "gst_state") {
  var selectEl = createElement("select", {
    name: field.nameKey,
    id: formDomId + "_" + field.id,
    style: commonInputStyle,
  });

  // Placeholder
  selectEl.appendChild(
    createElement("option", {
      value: "",
      text: "Select state",
      disabled: true,
      selected: true,
    })
  );

 [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
].forEach(function (state) {
    selectEl.appendChild(
      createElement("option", {
        value: state,
        text: state,
      })
    );
  });

  fieldWrapper.appendChild(selectEl);
  formEl.appendChild(fieldWrapper);
  return; // ⛔ stop here
}


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

      // =======================
// 🔥 Custom validations by field name
// =======================

var fieldKey = (field.nameKey || "").toLowerCase();

if (fieldKey.includes("mobile") || fieldKey.includes("phone") || fieldKey.includes("wa_number")) {

  var wrapperDiv = document.createElement("div");
  wrapperDiv.style.display = "flex";
  wrapperDiv.style.gap = "6px";

  // Country code select
  var countrySelect = document.createElement("select");
  countrySelect.name = field.nameKey + "_country";
  Object.assign(countrySelect.style, {
    padding: "9px",
    borderRadius: "6px",
    border: "1px solid rgba(148,163,184,0.9)",
    fontSize: "13px",
  });

  [
    { code: "+91", label: "🇮🇳 +91" },
    { code: "+1", label: "🇺🇸 +1" },
    { code: "+44", label: "🇬🇧 +44" },
  ].forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = c.label;
    countrySelect.appendChild(opt);
  });

  // Mobile input
  var mobileInput = document.createElement("input");
  mobileInput.type = "text";
  mobileInput.name = field.nameKey;
  mobileInput.placeholder = field.placeholder || "Enter mobile number";
  Object.assign(mobileInput.style, commonInputStyle);

  allowOnlyNumbers(mobileInput, 10);

  wrapperDiv.appendChild(countrySelect);
  wrapperDiv.appendChild(mobileInput);

  fieldWrapper.appendChild(wrapperDiv);
  formEl.appendChild(fieldWrapper);

  return; // ⛔ IMPORTANT: skip default rendering
}

// 🔥 ZIP / Postal Code handling (semantic by field name)
// if ((field.nameKey || "").toLowerCase() === "zipcode") {

//   // Allow only numbers
//   inputEl.addEventListener("input", function () {
//     inputEl.value = inputEl.value.replace(/\D/g, "");
//   });

// }


if (fieldKey.includes("name")) {
  allowOnlyText(inputEl);
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

      // 🔥 Apply centralized input validation
var validator = FIELD_VALIDATORS[field.nameKey];
if (validator && validator.input) {
  validator.input(inputEl);
}


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

         if (showCancelButton) {
  var cancelBtn = createElement("button", {
    type: "button",
    style: {
      marginLeft: "10px",
      backgroundColor: "#fc8181",
      color: "#ffffff",
      border: "1px solid #d1d5db",
      padding: "10px 14px",
      borderRadius: "999px",
      fontWeight:"500",
      fontSize:"14px",
      width:"25%",
      cursor: "pointer",
    },
    text: "Cancel",
  });

  cancelBtn.onclick = function () {
    // close popup / slide-in
    var overlay = wrapper.closest("div[style*='position: fixed']");
    if (overlay) overlay.remove();

    var slide = wrapper.closest(".w24-slide-in");
    if (slide) slide.classList.remove("active");
  };

  buttonWrapper.appendChild(cancelBtn);
}


//  Different display modes starts here 

function renderPopup(wrapper, delay) 
{
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
      opacity: "0",
      transition: "opacity 500ms cubic-bezier(.16,1,.3,1)"
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

         opacity: "0",
      transform: "translateY(24px) scale(0.96)",
      transition:
        "opacity 500ms cubic-bezier(.16,1,.3,1), " +
        "transform 550ms cubic-bezier(.16,1,.3,1)",
      willChange: "transform, opacity"
    });

    // Close button
  if (showCancelButton) {
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

  popup.appendChild(closeBtn);

  overlay.onclick = function () {
    overlay.remove();
  };
} else {
  // ❌ disable overlay close
  overlay.onclick = null;
}


    popup.onclick = function (e) {
      e.stopPropagation();
    };

    // popup.appendChild(closeBtn);
    popup.appendChild(wrapper);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

        /* 🔥 THIS LINE FIXES IT */
    popup.getBoundingClientRect();

    
    /* animate in */
    overlay.style.opacity = "1";
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0) scale(1)";

      popup.addEventListener(
  "transitionend",
  function (e) {
    // Only clean up once transform animation ends
    if (e.propertyName === "transform") {
      popup.style.willChange = "auto";
    }
  },
  { once: true }
);

  }, delay);


  
}


function injectSlideInCSS(borderRadius) {
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
    border-radius: ${borderRadius};
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

`;

  document.head.appendChild(style);
}

function renderSlideIn(wrapper, delay) 
{
  injectSlideInCSS(borderRadius);

  var position =
    safeGet(config, "definition.settings.slide_position", "bottom-right");

  var slideContainer = document.createElement("div");
  slideContainer.className = "w24-slide-in " + position;

  // Close button
 if (showCancelButton) {
  var closeBtn = document.createElement("button");
  closeBtn.className = "w24-slide-in-close";
  closeBtn.innerHTML = "✕";

  closeBtn.onclick = function () {
    slideContainer.classList.remove("active");
  };

  slideContainer.appendChild(closeBtn);
}

  slideContainer.appendChild(wrapper);
  document.body.appendChild(slideContainer);

  setTimeout(function () {
    slideContainer.classList.add("active");
  }, delay || 0);
}

function setupPopupTriggers(wrapper)
 {
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

    // Attach form to wrapper
    wrapper.appendChild(formEl);

    // start form render timer here 
    var formRenderedAt = Date.now();

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

    function showSuccessAlert(message,Title, onClose) {
      console.log("inside of showSuccessAlert")
  // Overlay
  var overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.45)",
    zIndex: "1000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  // Modal
  var modal = document.createElement("div");
  Object.assign(modal.style, {
    background: "#fff",
    padding: "24px 28px",
    borderRadius: "12px",
    maxWidth: "360px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    animation: "w24FadeIn 0.3s ease",
  });

  modal.innerHTML = `
    <div style="font-size:42px;margin-bottom:10px;">✅</div>
    <h3 style="margin:0 0 8px;font-size:18px;">${Title}</h3>
    <p style="margin:0 0 18px;font-size:14px;color:#555;">
      ${message}
    </p>
    <button style="
      background:#4f46e5;
      color:#fff;
      border:none;
      padding:10px 18px;
      border-radius:999px;
      font-size:14px;
      cursor:pointer;
    ">OK</button>
  `;

  var style = document.createElement("style");
style.textContent = `
@keyframes w24FadeIn {
  from { opacity:0; transform: scale(0.95); }
  to { opacity:1; transform: scale(1); }
}`;

  modal.querySelector("button").onclick = function () {
    overlay.remove();
    if (typeof onClose === "function") onClose();
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.head.appendChild(style)
}

function closeFormUI(wrapper) {
  // Popup
  var overlay = wrapper.closest("div[style*='position: fixed']");
  if (overlay) overlay.remove();

  // Slide-in
  var slide = wrapper.closest(".w24-slide-in");
  if (slide) slide.classList.remove("active");

  // Inline (just hide it)
  if (!overlay && !slide) {
    wrapper.style.display = "none";
  }
}

    var settings = config.definition.settings || {};
var enableRecaptcha = !!settings.enable_recaptcha;
var siteKey = settings.recaptcha_site_key;

    var redirectUrl = settings.redirect_url || null;
    


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


// =======================
// CENTRAL FIELD SUBMIT VALIDATION
// =======================
for (var key in FIELD_VALIDATORS) {
  var validator = FIELD_VALIDATORS[key];
  if (validator.submit) {
    var valid = validator.submit(formEl, showStatus);
    if (!valid) {
      setLoading(false);
      return;
    }
  }
}


      setLoading(true);

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

      var submitWithToken = function (token) {

        var submitDurationMs = Date.now() - formRenderedAt;

        console.log("inside submitWithToekn to check cache issue")
        // Append token if provided
        console.log("inside of submitWithToken")
        if (token) {
          console.log(" inside token exist token value is"+token)
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

        // ✅ ADD THIS LINE
formData.append("_form_render_time", submitDurationMs);

        fetch(SUBMIT_API_URL, {
          method: "POST",
          body: formData,
          // credentials: "include",
        })
          .then(function (res) {
            if (!res.ok) {
              throw new Error("Network error, status " + res.status);
            }
            return res.json();
          })

          .then(function (data) {
            console.log("form submited in embed.js",data)
            var isSuccess =
              data.success === true ||
              data.status === "success" ||
              data.statusCode === 200;

            if (isSuccess) {
              
              console.log("inside of isSuccess succesful")
              
  var ttlMs= safeGet(config,"definition.settings.reshow_delay_ms",0)
  var successMessage= safeGet(config,"definition.settings.success_title","Thank You")
  var successDescription= safeGet(config,"definition.settings.success_description","Will Contact You")
  console.log("value of showtimer is "+ttlMs)

                markFormSubmitted(formId, ttlMs); //10 seconds

              if (redirectUrl) {
                window.location.href = redirectUrl;
                return;
              }
              formEl.reset();

  showSuccessAlert (successDescription,successMessage,function () {
    closeFormUI(wrapper);
  });
  return
              // showStatus("success", successMessage);
              // formEl.reset();

              // if (successMessageDuration > 0) {
              //   setTimeout(clearStatus, successMessageDuration);
              // }
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

//        function loadTurnstile() {
//   if (window.turnstile) return Promise.resolve();

//   return new Promise(function (resolve, reject) {
//     var script = document.createElement("script");
//     script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
//     script.async = true;
//     script.defer = true;

//     script.onload = resolve;
//     script.onerror = reject;

//     document.head.appendChild(script);
//   });
// }

// async function executeTurnstile(siteKey) {
//   await loadTurnstile();

//   return new Promise(function (resolve) {
//     var widgetId = window.turnstile.render(document.body, {
//       sitekey: siteKey,
//       size: "invisible",
//       callback: function (token) {
//         window.turnstile.remove(widgetId); // 🔥 cleanup
//         resolve(token);
//       },
//     });
//   });
// }


  //     if (executeRecaptcha && siteKey) {
  //       console.log("inside of embed.js executeTurnstile && siteKey condition ")
  //      executeTurnstile(siteKey)
  // .then(function (token) {
  //   console.log("inside token exists function")
  //   submitWithToken(token);
  // })
  // .catch(function () {
  //   showStatus("error", "Security verification failed");
  //   setLoading(false);
  // });
  //     } 

  if (enableRecaptcha && siteKey)
     {
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
        }
  else {
        console.log("token is null")
        submitWithToken(null);
      }
    });
  }

  // when to show the form logic 

  function markFormSubmitted(formId, ttlMs) {

    ttlMs = Number(ttlMs) || 0;
    
    console.log("value of ttlMs in markFormSubmitted is"+ttlMs)
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
    console.log("value of raw is inside isFormrecentlySubmitted",raw)
    if (!raw) return false;

    var data = JSON.parse(raw);
    console.log("value of data inside isFormRecentlySubmitted",data)
    if (!data.expiresAt) return false;

    if (Date.now() > data.expiresAt) {
      console.log("inside of isFormRecentlySubmitted greater than")
      localStorage.removeItem("w24_form_submitted_" + formId);
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
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

      // 🚫 BLOCK rendering if already submitted in last 24 hours
  if (isFormRecentlySubmitted(formId)) {
    console.log("[Webtrix24 Form] Form already submitted recently, skipping render.");
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
      // credentials: "include",
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

    
        renderForm(config.data, scriptEl);
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
