const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const FormConfig = require("./models/FormConfig");

const app = express();

// =========================================================
// ⭐ 1. FIRST — Add manual CORS override (fixes all errors)
// =========================================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// =========================================================
// ⭐ 2. THEN — Normal CORS middleware
// =========================================================
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use(express.json());

// =========================================================
// ⭐ 3. Connect MongoDB
// =========================================================
mongoose.connect("mongodb://localhost:27017/webform");

// =========================================================
// ⭐ 4. Your API routes
// =========================================================
app.get("/api/webform/getForm", async (req, res) => {
  try {
    const formId = req.query.form_id;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: "Missing form_id",
      });
    }

    const config = await FormConfig.findOne({ form_id: formId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json(config);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =========================================================
// ⭐ 5. Start server
// =========================================================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
