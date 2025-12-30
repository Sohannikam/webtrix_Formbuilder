import { fetchJson } from "@utils/fetchJson";
import { API_BASE_URL } from "@config/config";
import { LOCAL_FORM_API } from "@config/config";


export async function fetchDropdownOptionsApi(slug) {
  try {
    const response = await fetchJson(`${API_BASE_URL}/categorySlugList`, {
      method: "POST",
      body: JSON.stringify({ status: "active", slug }),
    });

    const list = response?.data?.[0]?.sublist || [];

    return list.map(item => ({
      label: item.categoryName,
      value: item.category_id,
    }));
  } catch (err) {
    console.error("Dropdown fetch error:", err);
    return [];
  }
}

export async function fetchMenuDefinitions(menuID) {
  return fetchJson(`${API_BASE_URL}/getDefinations`, {
    method: "POST",
    body: JSON.stringify({ menuID }),
  });
}

/**
 * Save or update form definition
 */
export async function saveFormDefinitionApi({ formId, compiled }) {
  return fetchJson(`${LOCAL_FORM_API}/saveDefinition`, {
    method: "POST",
    body: JSON.stringify({
      formId,
      definition: compiled,
    }),
  });
}

/**
 * Save form settings
 */
export async function saveFormSettingsApi({ formId, patch }) {
  return fetch(`${LOCAL_FORM_API}/${formId}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patch }),
  });
}

/**
 * Fetch form definition
 */
export async function fetchFormDefinitionApi(formId) {
  const res = await fetch(`${LOCAL_FORM_API}/form/${formId}`);
  return res.json();
}
