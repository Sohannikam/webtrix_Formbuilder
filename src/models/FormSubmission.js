const mongoose = require("mongoose");

const FormSubmissionSchema = new mongoose.Schema(
  {
    form_id: { type: String, required: true },
    fields: { type: Object, required: true },
    files: { type: Array, default: [] },
    submitted_at: { type: Date, default: Date.now }
  },
  { strict: false }
);

module.exports = mongoose.model("FormSubmission", FormSubmissionSchema);
