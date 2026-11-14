const { Schema, model } = require("mongoose");

module.exports = model(
  "Subscriber",
  new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true } }, { timestamps: true })
);
