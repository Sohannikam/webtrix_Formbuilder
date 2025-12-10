import React, { useEffect } from 'react'
import './App.css'
import LeadFormDesigner from './Forms/LeadFormDesigner'
import LeadFormDesigner_ from './Forms/LeadFormDesigner_'
import PublicLeadForm from './Forms/PublicLeadForm'
import CreateLead from './Forms/CreateLead'
import Cookies from "js-cookie";

const App = () => {

    useEffect(() => {
    Cookies.set("_bb_key", "00f4486c391a2fae438f45c43c9f9bbc", { expires: 7 });
    Cookies.set("authid", "1", { expires: 7 });
  }, []);

  return (
    <>
    <LeadFormDesigner/>
    {/* <LeadFormDesigner_/>
    <PublicLeadForm/> */}
    </>
  )
}

export default App