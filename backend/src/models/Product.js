const { Schema, model } = require("mongoose");
const { CATEGORIES, TAGS } = require("../constants");

const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, match: /^[a-z0-9-]+$/i, maxlength: 40 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0, max: 1000000 },
    category: { type: String, required: true, enum: CATEGORIES },
    tags: [{ type: String, enum: TAGS }],
    // "isNew" is reserved by Mongoose
    newArrival: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    description: { type: String, default: "", maxlength: 2000 },
    specs: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    placeholder: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.isNew = !!ret.newArrival;
        delete ret.newArrival;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = model("Product", productSchema);
