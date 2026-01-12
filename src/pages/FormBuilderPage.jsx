import { FormBuilderProvider } from "@context/FormBuilderContext";
import FormBuilder from '@ws-utils/ws-integrations/forms/views/FormBuilder';

export default function FormBuilderPage(){
    return (
        <FormBuilderProvider>
            
            <FormBuilder />
        </FormBuilderProvider>
    );
}

