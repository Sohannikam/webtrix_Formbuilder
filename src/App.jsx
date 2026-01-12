import React, { useEffect } from 'react'
import './App.css'
import LeadFormDesigner from './Forms/LeadFormDesigner'

import Cookies from "js-cookie";

const App = () => {

    useEffect(() => {
    Cookies.set("_bb_key", "00f4486c391a2fae438f45c43c9f9bbc", { expires: 7 });  // expires in 7 days 
    Cookies.set("authid", "1", { expires: 7 });
  }, []);

  return (
    <>
    <LeadFormDesigner/>
    </>
  )
}

export default App