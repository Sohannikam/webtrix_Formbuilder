import React from "react";
import FormBuilder from "@ws-utils/ws-integrations/forms/views/FormBuilder";
import { FormBuilderProvider } from "@context/FormBuilderContext";

export default function LeadFormDesigner({
  initialConfig,
  fieldDefs = [],
  onSave,
}) {
  return (
    <FormBuilderProvider>
      <FormBuilder />
    </FormBuilderProvider>
  );
}
