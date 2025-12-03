export const defaultFormTemplate = {
      customer_id: null,
      salutation: null,
      first_name: null,
      name:null,
      record_type:"individual",
      middle_name: null,
      last_name: null,
      mobile_no: null,
      wa_number:null,
      birth_date: null,
      note: null,
      email: null,
      address: null,
      customer_image: null,
      billing_name: null,
      billing_address: null,
      branch_id: null,
      gst_no: null,
      adhar_number: null,
      website: null,
      countryCode:null,
      country: null,
      state: null,
      city:null,
      latitude: null,
      longitude: null,
      zipcode: null,
      assignee: null,
      assigneeName: null,
      office_land_line: null,
      stages: null,
      lead_source: null,
      gst_state: null,
      lead_priority: null,
      type: 'lead',
      status: 'active',
      enquiry_for:null,
      additional_contacts:'',
      preferred_communication:'email',
};
export const validationRules = {
  name: { required: true, maxLength: 100 },
};
 
export const  skipFields=['password','assigneename','user_name','is_password_update','salutation','birth_date','type','mailing_address','latitude','longitude','office_land_line','preferred_communication','contact_type','additional_contacts','customer_image','company_name','country','state','city','branch_id','country_code','remark','one_drive_folder','customer_portal_access','company_id','record_type','countryCode','first_name','middle_name','last_name','note','assigneeName','adhar_number','pan_number'];
export const  filterSkipFields=['password','assigneename','user_name','is_password_update','salutation','birth_date','type','mailing_address','latitude','longitude','office_land_line','preferred_communication','contact_type','additional_contacts','customer_image','company_name','country','state','city','branch_id','country_code','remark','one_drive_folder','customer_portal_access','company_id','record_type','countryCode','first_name','middle_name','last_name','note','assigneeName','adhar_number','pan_number'];

export const defaultColumns = [
  {"fieldID":"","fieldLabel":"","fieldType":"varchar(200)","column_name":"customer_id","linkedWith":"","fieldOptions":"","dateFormat":"","displayFormat":"","parentCategory":""},
 
  {"fieldID":"","fieldLabel":"","fieldType":"varchar(200)","column_name":"name","linkedWith":"","fieldOptions":"","dateFormat":"","displayFormat":"","parentCategory":""},
 
  {"fieldID":"","fieldLabel":"","fieldType":"varchar(200)","column_name":"email","linkedWith":"","fieldOptions":"","dateFormat":"","displayFormat":"","parentCategory":""},
 
  {"fieldID":"","fieldLabel":"","fieldType":"varchar(200)","column_name":"mobile_no","linkedWith":"","fieldOptions":"","dateFormat":"","displayFormat":"","parentCategory":""},
];
export const columnLabels = {
  customer_id: 'Lead ID',
  email: 'Lead Email',
  company_id: 'Company Name',
  project_id: 'Project',
  name: 'Lead Name',
  wa_number:'Whatsapp Number',
  lead_source:"Lead Source",
  follow_up_date:"Followup Date",
  enquiry_for:"Service Looking For"
 };
export  const fieldOverrides = {
            lead_source: {
              type: 'smartSelectInput',
              config:{label: '',type: 'category',source: 'lead_source',placeholder: 'Source',allowAddNew: true,preload: true,cache: true,showRecent: true,getLabel: (item) => `${item.categoryName}`,
                getValue: (item) => item.category_id,}
            },
            stages: {
              type: 'smartSelectInput',
              config:{label: '',type: 'category',source: 'lead_stages',placeholder: 'Lead Stage',allowAddNew: true,preload: true,cache: true,showRecent: true,getLabel: (item) => `${item.categoryName}`,
                getValue: (item) => item.category_id,}
            },
            lead_priority: {
              type: 'smartSelectInput',
              config:{label: '',type: 'category',source: 'lead_priority',placeholder: 'Priority',allowAddNew: true,preload: true,cache: true,showRecent: true,getLabel: (item) => `${item.categoryName}`,
                getValue: (item) => item.category_id,}
            },
            enquiry_for: {
              type: 'smartSelectInput',
              config:{label: '',type: 'category',source: 'enquiry_list',placeholder: 'Enquiry For',allowAddNew: true,preload: true,cache: true,showRecent: true,getLabel: (item) => `${item.categoryName}`,
                getValue: (item) => item.category_id,}
            },
            assignee: {
              type: 'smartSelectInput',
              config: { label: '',type: 'admin',
                source: 'admin',
                valueKey:'adminID',
                placeholder: 'Select Assignee',
                check: 'name',
                getLabel: (item) => `${item.name}`,
                getValue: (item) => item.adminID,
                allowAddNew: true,preload: true,cache: true,showRecent: true,multi:false,
                list: 'name,adminID'
              }
            },
            status: {
              type: 'radio',
              label: 'Status',
              options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'In Active' }
                ]
              },
          };
export const directSchemaTemplate = [
  { Field: 'customer_id', Type: 'int' },
  { Field: 'salutation', Type: 'smartSelectInput' },
  { Field: 'name', Type: 'varchar' },
  { Field: 'first_name', Type: 'varchar' },
  { Field: 'middle_name', Type: 'varchar' },
  { Field: 'last_name', Type: 'varchar' },
  { Field: 'mobile_no', Type: 'varchar' },
  { Field: 'wa_number', Type: 'varchar' },
  { Field: 'birth_date', Type: 'date' },
  { Field: 'note', Type: 'varchar' },
  { Field: 'email', Type: 'email' },
  { Field: 'record_type', Type: 'enum' },
  { Field: 'address', Type: 'varchar' },
  { Field: 'customer_image', Type: 'varchar' },
  { Field: 'billing_name', Type: 'varchar' },
  { Field: 'billing_address', Type: 'varchar' },
  { Field: 'branch_id', Type: 'int' },
  { Field: 'gst_no', Type: 'varchar' },
  { Field: 'adhar_number', Type: 'varchar' },
  { Field: 'website', Type: 'varchar' },
  { Field: 'countryCode', Type: 'varchar' },
  { Field: 'country', Type: 'varchar' },
  { Field: 'state', Type: 'varchar' },
  { Field: 'city', Type: 'varchar' },
  { Field: 'latitude', Type: 'varchar' },
  { Field: 'longitude', Type: 'varchar' },
  { Field: 'zipcode', Type: 'varchar' },
  { Field: 'assignee', Type: 'int' },
  { Field: 'assigneeName', Type: 'varchar' },
  { Field: 'office_land_line', Type: 'varchar' },
  { Field: 'stages', Type: 'smartSelectInput' },
  { Field: 'lead_source', Type: 'smartSelectInput' },
  { Field: 'gst_state', Type: 'int' },
  { Field: 'lead_priority', Type: 'smartSelectInput' },
  { Field: 'enquiry_for', Type: 'smartSelectInput' },
  { Field: 'type', Type: 'int' },
  { Field: 'status', Type: 'enum' },
  { Field: 'pan_number', Type: 'varchar' },
  { Field: 'additional_contacts', Type: 'varchar' },
  { Field: 'preferred_communication', Type: 'varchar' },
  { Field: 'follow_up_date', Type: 'date' },
  
];
export const layout = [
    {
      label: 'Basic Info',
      row: [
     { field: 'name',colSize:'w-full mb-3 md:w-1/3' },
     { field: 'assignee' ,colSize:'w-full mb-3 md:w-1/3'},
     { field: 'billing_name'},
      ]
    },
    {
      row: [
        { field: 'email',colSize:'w-full mb-3 md:w-1/3'},
        { custom: 'mobile_no' ,colSize:'w-full mb-3 md:w-1/3'},
        { custom: 'wa_number'},
      ]
    },
      {
      row: [
        { field: 'lead_source',colSize:'w-full mb-3 md:w-1/3' },
        { field: 'lead_priority',colSize:'w-full mb-3 md:w-1/3' },
        { field: 'stages'},
        
        
      ]
    },
     {
      row: [
        { field: 'enquiry_for',colSize:'w-full mb-3 md:w-1/3'},
        { field: 'website',colSize:'w-full mb-3 md:w-1/3'},
        { field: 'billing_address'},
        
        // { field: 'mailing_address' ,colSize:'w-full mb-3 md:w-1/3'},
      ]
    },
    {
      row: [
        { field: 'gst_no',colSize:'w-full mb-3 md:w-1/3' },
        { field: 'gst_state',colSize:'w-full mb-3 md:w-1/3' },
        { field: 'zipcode'},
      ]
    },
    
     {
      row: [
       { custom:'additional_contacts'},
      ]
    },
    // {
    //   row: [
    //     { field: 'zipcode',colSize:'w-full mb-3 md:w-1/3'},
    //   ]
    // },
    {
      row: [
       { addcustomFieldBtn: true },{ customFieldsPlaceholder: true }
      ]
    },
  ];
  export const infoIcons = {
  //status: { show: true, text: 'Select how often this task should repeat. Useful for automating follow-ups, reports, or routine actions.' },
  //due_date: { show: true, text: 'Select the final deadline for this task.' },
  // ...
};