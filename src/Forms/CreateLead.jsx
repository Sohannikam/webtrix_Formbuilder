import OneColumnLeadFormDesigner from '../Forms/LeadFormDesigner';
import { directSchemaTemplate, columnLabels, skipFields } from '@plugin/leads/API/LeadSchema';
import { makeFieldDefs } from '@utils/fieldDefs';
import { fetchJson } from '@utils/fetchJson';

const CreateLead = ({ onClose, onSave }) => {
// wherever you have dynamic fields (from fetchCustomFieldsByMenuId or similar)
const fieldDefs1 = makeFieldDefs({  
  baseSchema: directSchemaTemplate,
  dynamicSchema: {},   // array with {Field/Type or key/type}
  labels: columnLabels,
  skip: skipFields,
});
const formId =1;
return (
<OneColumnLeadFormDesigner
  initialConfig={directSchemaTemplate}   // { items, formImage } or undefined
  fieldDefs={fieldDefs1}
  onSave={(cfg) => {
    // cfg = { items:[...], formImage:{ url, position, sideSpan, ... } }
    // persist with your form ID
    fetchJson(`/api/forms/${formId ?? ''}`, {
      method: formId ? 'PUT' : 'POST',
      body: JSON.stringify({ form_id: formId, layout_json: cfg })
    });
  }}
/>
)

};
export default CreateLead;

