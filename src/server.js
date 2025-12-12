const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const FormConfig = require("./models/FormConfig");
const FormSubmission = require("./models/FormSubmission");
const formRoutes = require("./routes/formRoutes"); // import routes



const app = express();

const multer = require("multer");
const upload = multer(); // stores data in memory

// =========================================================
// ⭐ 1. FIRST — Add manual CORS override (fixes all errors)
// =========================================================a
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

//=========================================================
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
mongoose.connect("mongodb://localhost:27017/webform")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

app.use("/api/webform", formRoutes); // all routes prefixed with /api/webform


// =========================================================
// ⭐ 4. Your API routes
// =========================================================
// app.get("/api/webform/getForm", async (req, res) => {
//   try {
//     const formId = req.query.form_id;

//     if (!formId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing form_id",
//       });
//     }

//     const config = await FormConfig.findOne({ form_id: formId });

//     if (!config) {
//       return res.status(404).json({
//         success: false,
//         message: "Form not found",
//       });
//     }

//     res.json(config);
//   } catch (error) {
//     console.error("API Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });

// app.post("/api/webform/submit",upload.any(), async(req, res)=>{
//   try{
//     const formId= req.body.form_id;
//     if(!formId)
//     {
//       return res.status(400).json({
//         success:false,
//         message: "Missing form_id",
//       })
//     }

//         // Log submitted values (for testing)
//     console.log("📩 New Form Submission");
//     console.log("Form ID:", formId);
//     console.log("Fields:", req.body);
//     console.log("Files:", req.files);

//     // Save to MongoDB 

//     const submission = new FormSubmission({
//       form_id:formId,
//       fields:req.body,
//       files:req.files,
//       submitted_at:new Date(),
//     })

//     await submission.save();
//     res.json({
//       success:true,
//       message:"Form submitted successfully",
//     })
//   }
//   catch(error){
//     console.error("submit api error",error);

//     res.status(500).json({
//       success: false,
//       message:"Internal server error",
//     })
//   }
// })

// =========================================================
// ⭐ 5. Start server
// =========================================================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
