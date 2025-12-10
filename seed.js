const mongoose = require("mongoose");
const FormConfig = require("./src/models/FormConfig"); // correct path if seed.js is root

mongoose.connect("mongodb://localhost:27017/webform");

async function seed() {
  try {
    await FormConfig.deleteMany();

    await FormConfig.create({
      form_id: "12345",
      title: "Demo Form With All Fields",
      fields: [
        {
          type: "text",
          name: "name",
          label: "Name",
          placeholder: "Enter your name",
          required: true
        },
        {
          type: "textarea",
          name: "message",
          label: "Message",
          placeholder: "Enter your message",
          required: false
        },
        {
          type: "select",
          name: "country",
          label: "Country",
          placeholder: "Select a country",
          options: [
            { label: "India", value: "in" },
            { label: "USA", value: "us" },
            { label: "Canada", value: "ca" }
          ],
          required: true
        },
        {
          type: "radio",
          name: "gender",
          label: "Gender",
          options: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" }
          ],
          required: true
        },
        {
          type: "checkbox_group",
          name: "interests",
          label: "Interests",
          options: [
            { label: "Sports", value: "sports" },
            { label: "Music", value: "music" },
            { label: "Travel", value: "travel" }
          ]
        },
        {
          type: "hidden",
          name: "source",
          value: "webform-embed"
        },
        {
          type: "email",
          name: "email",
          label: "Email Address",
          placeholder: "Enter your email",
          required: true
        }
      ],
      settings: {
        theme_color: "#2563eb"
      }
    });

    console.log("Dummy form created with ALL fields!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    process.exit();
  }
}

seed();
