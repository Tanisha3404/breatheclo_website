const { z } = require("zod");
const { SIZES, CATEGORIES, TAGS, ORDER_STATUSES, MAX_QTY_PER_LINE } = require("./constants");

const text = (min, max, label) =>
  z.string({ error: `${label} is required` }).trim().min(min, `${label} is too short`).max(max, `${label} is too long`);

const email = z.string({ error: "Email is required" }).trim().toLowerCase().max(120).pipe(z.email("Enter a valid email address"));

const orderSchema = z.object({
  customer: z.object({
    name: text(2, 80, "Name"),
    email,
    phone: z.string({ error: "Phone is required" }).trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  }),
  address: z.object({
    line1: text(5, 150, "Address"),
    line2: z.string().trim().max(150).optional().default(""),
    city: text(2, 60, "City"),
    state: text(2, 60, "State"),
    pin: z.string({ error: "PIN code is required" }).trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  }),
  payment: z.literal("cod", { error: "Only cash on delivery is available right now" }),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        size: z.enum(SIZES, { error: "Choose a valid size" }),
        qty: z.number({ error: "Quantity must be a number" }).int().min(1).max(MAX_QTY_PER_LINE),
      })
    )
    .min(1, "Your cart is empty")
    .max(30, "Too many items in one order"),
});

const contactSchema = z.object({
  name: text(2, 80, "Name"),
  email,
  phone: z.string().trim().max(20).regex(/^[0-9+\-\s]*$/, "Enter a valid phone number").optional().default(""),
  message: text(5, 2000, "Message"),
});

const subscribeSchema = z.object({ email });

const imagePath = z
  .string()
  .trim()
  .max(300)
  .refine((s) => /^(https:\/\/|images\/)/.test(s) && !/[<>"'\s]/.test(s), "Use a path like images/photo.jpg or an https:// URL");

const productSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]+$/i, "Use letters, numbers and dashes only").max(40),
  title: text(2, 120, "Title"),
  price: z.number({ error: "Price must be a number" }).min(0).max(1000000),
  category: z.enum(CATEGORIES, { error: "Choose a valid category" }),
  tags: z.array(z.enum(TAGS)).default([]),
  isNew: z.boolean().default(false),
  images: z.array(imagePath).min(1, "Add at least one image").max(10),
  description: z.string().trim().max(2000).default(""),
  specs: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  stock: z.number({ error: "Stock must be a number" }).int().min(0).max(100000).default(0),
  active: z.boolean().default(true),
});

const productUpdateSchema = productSchema.omit({ id: true }).partial();

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES, { error: "Invalid status" }) });

module.exports = { orderSchema, contactSchema, subscribeSchema, productSchema, productUpdateSchema, statusSchema };
