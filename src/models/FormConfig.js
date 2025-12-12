const mongoose = require("mongoose");

const formConfigSchema = new mongoose.Schema({
  formId:{type:String , required:true ,unique:true},
  definition:{type:Object,required:true},
},{timestamps:true})

module.exports = mongoose.model("FormConfig", formConfigSchema);
