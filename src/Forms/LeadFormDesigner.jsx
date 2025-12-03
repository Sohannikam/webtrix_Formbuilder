import FormBuilder from '@ws-utils/ws-integrations/forms/views/FormBuilder';
import React, { useMemo, useState } from 'react';
// -------------------- Main Component --------------------
export default function LeadFormDesigner({
  initialConfig,
  fieldDefs = [], // [{key:'name', label:'Name'}, ...]
  onSave,
}) {
  return (
    <FormBuilder></FormBuilder>
  );
}
