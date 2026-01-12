import React, { createContext, useContext, useState, useMemo } from "react";

console.log("📦 FormBuilderContext file loaded");

const FormBuilderContext= createContext(null);

export function FormBuilderProvider({children})
{
  console.log("🟢 FormBuilderProvider rendered");


  const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;


  const defaultForm = () => ({
  formId: null,
  companyId: null,
  name: "Untitled form",
  description: "",
  status: "draft",
  settings: {
    acceptResponses: true,
    captcha: false,
    domainAllowlist: [],
  },
  theme: { brand: "#1a73e8" },
});


    const [form, setForm] = useState(defaultForm());
  

   const [fields, setFields] = useState(() => [
      // Starter fields (can remove)
      {
        id: uid("fld"),
        type: "short_text",
        label: "Full Name",
        nameKey: "full_name",
        placeholder: "Your name",
        required: true,
        sort: 0,
      },
      {
        id: uid("fld"),
        type: "email",
        label: "Email",
        nameKey: "email",
        placeholder: "name@example.com",
        required: true,
        sort: 1,
      },
    ]);
  const [formSettings, setFormSettings] = useState({
    display_mode: "inline",
    delay_ms: 0,
    popup_trigger: "delay",
    slide_position: "bottom-right",
    scroll_percent: 50,
    background_color: "#ffffff",
    border_radius: 8,
    box_shadow: "0 4px 10px rgba(0,0,0,0.08)",
    title_color: "#111827",
    description_color: "#111827",
    Field_Color:"#111827",
    title_align:"left",
    description_align:"left",
    border_color: "#e5e7eb",
    show_cancel_button: null,
    enable_recaptcha: true,
    // recaptcha_site_key: "6LeunDEsAAAAAHKh03CuWp_IEYJLW9uPT3BaJYE0"

    reshow_delay_value: 0,
    reshow_delay_unit: "seconds", // "seconds" | "minutes" | "hours"
    reshow_delay_ms: 0,
      success_title: "Thank You",
  success_description: "",
  });


 const [formStyle, setFormStyle] = useState({
    background_color: "#ffffff",
    border_radius: "12px",
    box_shadow: "0 8px 20px rgba(0,0,0,0.08)",
    border_color: "rgba(0,0,0,0.08)",
    title_color: "#111827",
    description_color: "#111827",
    title_align:"left",
    description_align:"left",
    Field_Color:"#111827"
  });

  const patchField = (patch) =>{
    setFields((prev)=> prev.map((f)=> (f.id === patch.id ?{...f,...patch}:f)));
  };

  const value= useMemo(()=>(
    {
      
      form,
      setForm,
      fields,
      setFields,
      formSettings,
      setFormSettings,
      formStyle,
      setFormStyle,
      patchField,
  }),[form,fields,formSettings,formStyle]);

  return(
    <FormBuilderContext.Provider value={value}>
        {children}
    </FormBuilderContext.Provider>
  )
}

export function useFormBuilder(){
    const ctx= useContext(FormBuilderContext);
    console.log("value of ctx is",ctx)
    if (!ctx) {
  throw new Error("useFormBuilder must be used inside FormBuilderProvider man");
}

    return ctx;
}