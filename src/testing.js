import React, { createContext, useContext, useState, useMemo } from "react";

const FormBuilderContext = createContext(null);

export function FormBuilderProvider({ children }) {
  const [form, setForm] = useState({
    name: "Untitled form",
    description: "",
  });

  const [fields, setFields] = useState([]);
  const [formSettings, setFormSettings] = useState({});
  const [formStyle, setFormStyle] = useState({});

  const patchField = (patch) => {
    setFields((prev) =>
      prev.map((f) => (f.id === patch.id ? { ...f, ...patch } : f))
    );
  };

  const value = useMemo(
    () => ({
      form,
      setForm,
      fields,
      setFields,
      formSettings,
      setFormSettings,
      formStyle,
      setFormStyle,
      patchField,
    }),
    [form, fields, formSettings, formStyle]
  );

  return (
    <FormBuilderContext.Provider value={value}>
      {children}
    </FormBuilderContext.Provider>
  );
}

export function useFormBuilder() {
  const ctx = useContext(FormBuilderContext);
  if (!ctx) {
    throw new Error("useFormBuilder must be used inside FormBuilderProvider");
  }
  return ctx;
}
