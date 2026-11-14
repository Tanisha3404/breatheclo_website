// Admin-only API
const router = require("express").Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const Message = require("../models/Message");
const Subscriber = require("../models/Subscriber");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { HttpError, parse } = require("../middleware/errors");
const { productSchema, productUpdateSchema, statusSchema } = require("../validation");
const { restock } = require("./orders");

router.use(requireAuth, requireAdmin);

router.get("/me", (req, res) => res.json({ uid: req.user.uid, email: req.user.email || null, admin: true }));

/* dashboard numbers */
router.get("/stats", async (_req, res) => {
  const [orders, revenueAgg, products, lowStock, messages, subscribers] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Product.countDocuments(),
    Product.countDocuments({ active: true, stock: { $lte: 5 } }),
    Message.countDocuments({ handled: false }),
    Subscriber.countDocuments(),
  ]);
  res.json({ orders, revenue: revenueAgg[0] ? revenueAgg[0].total : 0, products, lowStock, newMessages: messages, subscribers });
});

/* orders */
router.get("/orders", async (req, res) => {
  const filter = {};
  if (typeof req.query.status === "string" && req.query.status) filter.status = req.query.status;
  res.json(await Order.find(filter).sort({ createdAt: -1 }).limit(200));
});

router.patch("/orders/:orderId", async (req, res) => {
  const { status } = parse(statusSchema, req.body);
  const order = await Order.findOne({ orderId: String(req.params.orderId) });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status === "cancelled") throw new HttpError(409, "A cancelled order cannot be changed.");
  if (order.status === "delivered" && status === "cancelled") throw new HttpError(409, "A delivered order cannot be cancelled.");
  if (status === "cancelled") await restock(order.items);
  order.status = status;
  await order.save();
  res.json(order);
});

/* products */
const toDoc = (p) => {
  const { isNew, ...rest } = p;
  return { ...rest, ...(isNew !== undefined ? { newArrival: isNew } : {}) };
};

router.get("/products", async (_req, res) => {
  res.json(await Product.find().sort({ position: 1, createdAt: 1 }));
});

router.post("/products", async (req, res) => {
  const data = parse(productSchema, req.body);
  if (await Product.exists({ id: data.id })) throw new HttpError(409, `A product with id "${data.id}" already exists.`);
  const last = await Product.findOne().sort({ position: -1 });
  const created = await Product.create({ ...toDoc(data), position: last ? last.position + 1 : 0 });
  res.status(201).json(created);
});

router.put("/products/:id", async (req, res) => {
  const data = parse(productUpdateSchema, req.body);
  const updated = await Product.findOneAndUpdate({ id: String(req.params.id) }, { $set: toDoc(data) }, { new: true, runValidators: true });
  if (!updated) throw new HttpError(404, "Product not found");
  res.json(updated);
});

router.delete("/products/:id", async (req, res) => {
  const r = await Product.deleteOne({ id: String(req.params.id) });
  if (!r.deletedCount) throw new HttpError(404, "Product not found");
  res.json({ ok: true });
});

/* messages and subscribers */
router.get("/messages", async (_req, res) => res.json(await Message.find().sort({ createdAt: -1 }).limit(200)));
router.patch("/messages/:id", async (req, res) => {
  const m = await Message.findByIdAndUpdate(req.params.id, { handled: !!req.body.handled }, { new: true });
  if (!m) throw new HttpError(404, "Message not found");
  res.json(m);
});
router.get("/subscribers", async (_req, res) => res.json(await Subscriber.find().sort({ createdAt: -1 }).limit(500)));

module.exports = router;
