const fetch = require("node-fetch"); // or built-in fetch in Node 18+

async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET; // Google secret key
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  // For v3, you can also check the score
  return data.success && (data.score || 0) >= 0.5;
}



router.post('/submit', upload.any(), async (req, res) => {
  try {
    const formId = req.body.form_id;
    const token = req.body["g-recaptcha-response"];

    if (!formId) {
      return res.status(400).json({ success: false, message: "Missing form_id" });
    }

    // Verify reCAPTCHA if token exists
    if (token) {
      const isHuman = await verifyRecaptcha(token);
      if (!isHuman) {
        return res.status(403).json({ success: false, message: "Failed security check" });
      }
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
