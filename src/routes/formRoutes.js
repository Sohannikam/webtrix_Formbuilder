const express = require('express');
const router = express.Router();
const FormConfig = require('../models/FormConfig');
const FormSubmission = require('../models/FormSubmission');
const multer = require('multer');
const upload = multer(); // stores files in memory

// Save form definition
router.post('/saveDefinition', async (req, res) => {
  try {
    const { formId, definition } = req.body;

    if (!formId || !definition) {
      return res.status(400).json({
        success: false,
        message: "Missing formId or definition",
      });
    }

    const saved = await FormConfig.findOneAndUpdate(
      { formId },
      { definition },
      { upsert: true, new: true }
    );

    res.json({ success: true, 
        message:"form definition saved successfully",
        data: saved 
    });
  } catch (err) {
    console.error("Save form error:", err);
    res.status(500).json({ 
        success:false,
        message: "Server error while saving form definition", });
  }
});

// // Get form config (embed.js uses this)
router.get('/form/:formId', async (req, res) => {

  try {
    console.log("api called succesfully")
    const record = await FormConfig.findOne({ formId: req.params.formId });

    if (!record) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(record.definition);   // IMPORTANT!!
  } catch (err) {
    console.error("Get form error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// // Submit form
router.post('/submit', upload.any(), async (req, res) => {
  try {
    const formId = req.body.form_id;
    if (!formId) {
      return res.status(400).json({ success: false, message: "Missing form_id" });
    }

    const submission = new FormSubmission({
      form_id: formId,
      fields: req.body,
      files: req.files,
      submitted_at: new Date(),
    });

    await submission.save();

    res.json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error("submit api error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
