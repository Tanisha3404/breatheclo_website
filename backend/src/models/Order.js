const { Schema, model } = require("mongoose");
const { SIZES, ORDER_STATUSES } = require("../constants");

const itemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, enum: SIZES, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    uid: { type: String, default: null, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pin: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    payment: { type: String, enum: ["cod"], default: "cod" },
    status: { type: String, enum: ORDER_STATUSES, default: "placed", index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.orderId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = model("Order", orderSchema);
