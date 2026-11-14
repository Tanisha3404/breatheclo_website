const { Schema, model } = require("mongoose");

module.exports = model(
  "Message",
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      message: { type: String, required: true },
      handled: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
