import { useEffect, useState } from "react";
import { LOCAL_FORM_API } from '@config/config';


export function useFormId() {
  const [formId, setFormId] = useState(null);
  const [isNewForm, setIsNewForm] = useState(false);

  useEffect(() => {
    async function init() {
      const forceNew = localStorage.getItem("forceNewForm") === "true";

      if (forceNew) {
        setIsNewForm(true);
        return;
      }

      const localId = localStorage.getItem("formId");
      if (localId) {
        setFormId(localId);
        return;
      }

      try {
        const res = await fetch(`${LOCAL_FORM_API}/forms/last`);
        const data = await res.json();

        if (data?.formId) {
          setFormId(data.formId);
          localStorage.setItem("formId", data.formId);
        }
      } catch (e) {
        console.log("Backend unavailable");
      }
    }

    init();
  }, []);

  return {
    formId,
    setFormId,
    isNewForm,
    setIsNewForm,
  };
}
