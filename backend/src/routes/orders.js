const crypto = require("crypto");
const router = require("express").Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");
const { HttpError, parse } = require("../middleware/errors");
const { orderSchema } = require("../validation");
const { MAX_QTY_PER_LINE } = require("../constants");

const newOrderId = () => "BC" + crypto.randomBytes(4).toString("hex").toUpperCase();

/* gives stock back */
async function restock(lines) {
  for (const l of lines) await Product.updateOne({ id: l.id }, { $inc: { stock: l.qty } });
}

// POST /api/orders: place an order (login required)
router.post("/", requireAuth, async (req, res) => {
  const input = parse(orderSchema, req.body);

  // merge duplicate lines
  const merged = new Map();
  for (const it of input.items) {
    const key = `${it.id}|${it.size}`;
    const prev = merged.get(key);
    const qty = (prev ? prev.qty : 0) + it.qty;
    if (qty > MAX_QTY_PER_LINE) throw new HttpError(400, `You can order at most ${MAX_QTY_PER_LINE} of one item.`);
    merged.set(key, { ...it, qty });
  }
  const lines = [...merged.values()];

  // prices and titles
  const ids = [...new Set(lines.map((l) => l.id))];
  const products = await Product.find({ id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [p.id, p]));
  if (ids.some((id) => !byId.has(id))) {
    throw new HttpError(400, "Some items in your cart are no longer available. Please refresh your cart.");
  }

  // reserve stock automically, one product at a time; undo everything if any item is short
  const needed = new Map();
  for (const l of lines) needed.set(l.id, (needed.get(l.id) || 0) + l.qty);
  const reserved = [];
  for (const [id, qty] of needed) {
    const ok = await Product.findOneAndUpdate({ id, active: true, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (!ok) {
      await restock(reserved);
      throw new HttpError(409, `Sorry, ${byId.get(id).title} is out of stock (or not enough left).`, { productId: id });
    }
    reserved.push({ id, qty });
  }

  const items = lines.map((l) => {
    const p = byId.get(l.id);
    return { id: p.id, title: p.title, price: p.price, size: l.size, qty: l.qty, image: p.images[0] || "" };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  try {
    let order;
    for (let attempt = 0; ; attempt++) {
      try {
        order = await Order.create({
          orderId: newOrderId(),
          uid: req.user.uid,
          customer: input.customer,
          address: input.address,
          items,
          subtotal,
          total: subtotal, // shipping is free
          payment: input.payment,
        });
        break;
      } catch (e) {
        if (e.code === 11000 && attempt < 3) continue; // order-number
        throw e;
      }
    }
    res.status(201).json({ id: order.orderId, total: order.total, status: order.status });
  } catch (e) {
    await restock(reserved);
    throw e;
  }
});

// GET /api/orders/mine: the logged-in customer's orders
router.get("/mine", requireAuth, async (req, res) => {
  const orders = await Order.find({ uid: req.user.uid }).sort({ createdAt: -1 }).limit(50);
  res.json(orders);
});

// POST /api/orders/:orderId/cancel: a customer cancels their own order, only until it ships
router.post("/:orderId/cancel", requireAuth, async (req, res) => {
  const orderId = String(req.params.orderId);
  const order = await Order.findOneAndUpdate(
    { orderId, uid: req.user.uid, status: { $in: ["placed", "confirmed"] } },
    { $set: { status: "cancelled" } },
    { new: true }
  );
  if (!order) {
    const existing = await Order.findOne({ orderId, uid: req.user.uid });
    if (!existing) throw new HttpError(404, "Order not found");
    if (existing.status === "cancelled") throw new HttpError(409, "This order is already cancelled.");
    throw new HttpError(409, "This order has already been shipped, so it can no longer be cancelled. Please contact us.");
  }
  await restock(order.items);
  res.json(order);
});

module.exports = router;
module.exports.restock = restock;
