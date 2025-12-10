const mongoose = require("mongoose");

const formConfigSchema = new mongoose.Schema({
  form_id: { type: String, required: true, unique: true },
  title: String,
  fields: Array,
  settings: Object
});

module.exports = mongoose.model("FormConfig", formConfigSchema);
