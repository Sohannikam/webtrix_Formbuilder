import { useEffect } from "react";
import { fetchFormDefinitionApi } from "@api/allApi";

/**
 * Loads form-related settings when formId changes
 */
export function useHydratedValue({
  formId,
  setFormSettings,
}) {
  useEffect(() => {
    if (!formId) return;

    let isMounted = true;

    async function load() {
      try {
        const response = await fetchFormDefinitionApi(formId);

        const rawShowCancel =
          response?.data?.definition?.settings?.show_cancel_button;

        const isLeadForm = response?.data?.is_lead_form;

        if (!isMounted) return;

        setFormSettings((prev) => {
          const next = { ...prev };

          if (rawShowCancel !== undefined) {
            next.show_cancel_button = Boolean(Number(rawShowCancel));
          }

          if (isLeadForm !== undefined) {
            next.is_lead_form = Number(isLeadForm); // 0 | 1
          }

          return next;
        });
      } catch (err) {
        console.error("Failed to fetch form settings", err);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [formId, setFormSettings]);
}
