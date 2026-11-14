const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { start, goodOrder, addProduct, Product } = require("./helpers");
const Order = require("../src/models/Order");
const Message = require("../src/models/Message");
const Subscriber = require("../src/models/Subscriber");

let t;
before(async () => { t = await start(); });
after(async () => { await t.stop(); });
beforeEach(async () => {
  await Promise.all([Product.deleteMany({}), Order.deleteMany({}), Message.deleteMany({}), Subscriber.deleteMany({})]);
  await addProduct("a1", { price: 2295, stock: 5, position: 0 });
  await addProduct("a2", { price: 1000, stock: 2, position: 1, title: "Second" });
  await addProduct("hidden", { active: false });
});

test("products: list shows only active products and exposes isNew", async () => {
  const r = await t.call("GET", "/api/products");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((p) => p.id), ["a1", "a2"]);
  assert.equal(r.body[0].isNew, false);
  assert.equal(r.body[0]._id, undefined);
});
test("products: single, missing and hidden", async () => {
  assert.equal((await t.call("GET", "/api/products/a1")).body.price, 2295);
  assert.equal((await t.call("GET", "/api/products/nope")).status, 404);
  assert.equal((await t.call("GET", "/api/products/hidden")).status, 404);
});

test("orders: server recalculates the total and ignores prices sent by the browser", async () => {
  const body = { ...goodOrder([{ id: "a1", size: "M", qty: 2 }]), total: 1, items: [{ id: "a1", size: "M", qty: 2, price: 1 }] };
  const r = await t.call("POST", "/api/orders", { body });
  assert.equal(r.status, 201);
  assert.match(r.body.id, /^BC[0-9A-F]{8}$/);
  assert.equal(r.body.total, 4590);
  const saved = await Order.findOne({ orderId: r.body.id });
  assert.equal(saved.items[0].price, 2295);
  assert.equal(saved.customer.email, "test@example.com");
  assert.equal(saved.uid, null);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 3);
});
test("orders: same product+size lines are merged, different sizes kept", async () => {
  const r = await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a1", size: "M", qty: 1 }, { id: "a1", size: "M", qty: 1 }, { id: "a1", size: "L", qty: 1 }]) });
  assert.equal(r.status, 201);
  const o = await Order.findOne({ orderId: r.body.id });
  assert.deepEqual(o.items.map((i) => `${i.size}x${i.qty}`).sort(), ["Lx1", "Mx2"]);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 2);
});
test("orders: validation errors return 400 with a readable message", async () => {
  const bad = async (mut) => { const b = goodOrder([{ id: "a1", size: "M", qty: 1 }]); mut(b); return t.call("POST", "/api/orders", { body: b }); };
  assert.equal((await bad((b) => (b.customer.phone = "12345"))).status, 400);
  assert.equal((await bad((b) => (b.address.pin = "0123"))).status, 400);
  assert.equal((await bad((b) => (b.items[0].size = "XXL"))).status, 400);
  assert.equal((await bad((b) => (b.items[0].qty = 0))).status, 400);
  assert.equal((await bad((b) => (b.items[0].qty = 11))).status, 400);
  assert.equal((await bad((b) => (b.items = []))).status, 400);
  assert.equal((await bad((b) => (b.payment = "card"))).status, 400);
  const r = await bad((b) => (b.customer.email = "nope"));
  assert.match(r.body.error, /email/i);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 5, "stock untouched by rejected orders");
});
test("orders: unknown or hidden product is rejected", async () => {
  assert.equal((await t.call("POST", "/api/orders", { body: goodOrder([{ id: "zzz", size: "M", qty: 1 }]) })).status, 400);
  assert.equal((await t.call("POST", "/api/orders", { body: goodOrder([{ id: "hidden", size: "M", qty: 1 }]) })).status, 400);
});
test("orders: not enough stock returns 409 and rolls back earlier reservations", async () => {
  const r = await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a1", size: "M", qty: 2 }, { id: "a2", size: "M", qty: 3 }]) });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Second/);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 5, "a1 stock restored");
  assert.equal((await Product.findOne({ id: "a2" })).stock, 2);
  assert.equal(await Order.countDocuments(), 0);
});
test("orders: two buyers racing for the last item, exactly one wins", async () => {
  await Product.updateOne({ id: "a1" }, { stock: 1 });
  const results = await Promise.all(Array.from({ length: 6 }, () => t.call("POST", "/api/orders", { body: goodOrder([{ id: "a1", size: "M", qty: 1 }]) })));
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 5);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 0);
  assert.equal(await Order.countDocuments(), 1);
});
test("orders: a logged-in order is linked to the account and shows in /mine", async () => {
  await t.call("POST", "/api/orders", { token: "user:alice", body: goodOrder([{ id: "a1", size: "M", qty: 1 }]) });
  await t.call("POST", "/api/orders", { token: "user:bob", body: goodOrder([{ id: "a2", size: "S", qty: 1 }]) });
  await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a2", size: "S", qty: 1 }]) });
  const mine = await t.call("GET", "/api/orders/mine", { token: "user:alice" });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.length, 1);
  assert.equal(mine.body[0].items[0].id, "a1");
  assert.equal((await t.call("GET", "/api/orders/mine")).status, 401);
  assert.equal((await t.call("GET", "/api/orders/mine", { token: "garbage" })).status, 401);
  assert.equal((await t.call("POST", "/api/orders", { token: "garbage", body: goodOrder([{ id: "a1", size: "M", qty: 1 }]) })).status, 401);
});

test("contact and newsletter", async () => {
  assert.equal((await t.call("POST", "/api/contact", { body: { name: "T", email: "a@b.com", message: "hello there" } })).status, 400);
  assert.equal((await t.call("POST", "/api/contact", { body: { name: "Tanu", email: "a@b.com", message: "hello there" } })).status, 201);
  assert.equal(await Message.countDocuments(), 1);
  assert.equal((await t.call("POST", "/api/subscribe", { body: { email: "bad" } })).status, 400);
  assert.equal((await t.call("POST", "/api/subscribe", { body: { email: "Me@X.com" } })).status, 201);
  assert.equal((await t.call("POST", "/api/subscribe", { body: { email: "me@x.com" } })).status, 201);
  assert.equal(await Subscriber.countDocuments(), 1, "duplicate email stored once");
});

test("admin: needs login and admin UID", async () => {
  assert.equal((await t.call("GET", "/api/admin/orders")).status, 401);
  const r = await t.call("GET", "/api/admin/orders", { token: "user:alice" });
  assert.equal(r.status, 403);
  assert.equal(r.body.uid, "alice", "returns the UID so the owner can add it to ADMIN_UIDS");
  assert.equal((await t.call("GET", "/api/admin/orders", { token: "admin" })).status, 200);
  assert.equal((await t.call("POST", "/api/admin/products", { token: "user:alice", body: {} })).status, 403);
});
test("admin: order status flow and cancelling restocks", async () => {
  const o = (await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a1", size: "M", qty: 2 }]) })).body;
  assert.equal((await Product.findOne({ id: "a1" })).stock, 3);
  const s = await t.call("PATCH", `/api/admin/orders/${o.id}`, { token: "admin", body: { status: "shipped" } });
  assert.equal(s.body.status, "shipped");
  assert.equal((await t.call("PATCH", `/api/admin/orders/${o.id}`, { token: "admin", body: { status: "bogus" } })).status, 400);
  assert.equal((await t.call("PATCH", `/api/admin/orders/${o.id}`, { token: "admin", body: { status: "cancelled" } })).status, 200);
  assert.equal((await Product.findOne({ id: "a1" })).stock, 5, "stock returned");
  assert.equal((await t.call("PATCH", `/api/admin/orders/${o.id}`, { token: "admin", body: { status: "shipped" } })).status, 409);
  assert.equal((await t.call("PATCH", "/api/admin/orders/BCNOPE", { token: "admin", body: { status: "shipped" } })).status, 404);
  const d = (await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a2", size: "S", qty: 1 }]) })).body;
  await t.call("PATCH", `/api/admin/orders/${d.id}`, { token: "admin", body: { status: "delivered" } });
  assert.equal((await t.call("PATCH", `/api/admin/orders/${d.id}`, { token: "admin", body: { status: "cancelled" } })).status, 409);
});
test("admin: product create, update, hide, delete", async () => {
  const good = { id: "new-tee", title: "New Tee", price: 1999, category: "tshirt", tags: ["puff"], isNew: true, images: ["images/new.jpg"], description: "d", specs: ["100% cotton"], stock: 10 };
  const c = await t.call("POST", "/api/admin/products", { token: "admin", body: good });
  assert.equal(c.status, 201);
  assert.equal(c.body.isNew, true);
  assert.equal((await t.call("POST", "/api/admin/products", { token: "admin", body: good })).status, 409, "duplicate id");
  assert.equal((await t.call("POST", "/api/admin/products", { token: "admin", body: { ...good, id: "x", images: ["javascript:alert(1)"] } })).status, 400, "unsafe image path rejected");
  assert.equal((await t.call("POST", "/api/admin/products", { token: "admin", body: { ...good, id: "y", price: -5 } })).status, 400);
  assert.equal((await t.call("POST", "/api/admin/products", { token: "admin", body: { ...good, id: "z", category: "hats" } })).status, 400);
  const u = await t.call("PUT", "/api/admin/products/new-tee", { token: "admin", body: { price: 1799, stock: 3, isNew: false } });
  assert.equal(u.body.price, 1799); assert.equal(u.body.isNew, false); assert.equal(u.body.stock, 3);
  assert.equal(u.body.title, "New Tee", "fields not sent are unchanged");
  await t.call("PUT", "/api/admin/products/new-tee", { token: "admin", body: { active: false } });
  assert.equal((await t.call("GET", "/api/products/new-tee")).status, 404, "hidden from shop");
  assert.ok((await t.call("GET", "/api/admin/products", { token: "admin" })).body.some((p) => p.id === "new-tee"), "still visible to admin");
  assert.equal((await t.call("DELETE", "/api/admin/products/new-tee", { token: "admin" })).status, 200);
  assert.equal((await t.call("DELETE", "/api/admin/products/new-tee", { token: "admin" })).status, 404);
});
test("admin: stats, messages, subscribers", async () => {
  await t.call("POST", "/api/orders", { body: goodOrder([{ id: "a1", size: "M", qty: 1 }]) });
  await t.call("POST", "/api/contact", { body: { name: "Tanu", email: "a@b.com", message: "hello there" } });
  const s = (await t.call("GET", "/api/admin/stats", { token: "admin" })).body;
  assert.equal(s.orders, 1); assert.equal(s.revenue, 2295); assert.equal(s.newMessages, 1);
  const msgs = (await t.call("GET", "/api/admin/messages", { token: "admin" })).body;
  assert.equal(msgs.length, 1);
  assert.equal((await t.call("PATCH", `/api/admin/messages/${msgs[0]._id}`, { token: "admin", body: { handled: true } })).body.handled, true);
});

test("misc: bad JSON, unknown API route, security headers", async () => {
  const bad = await t.call("POST", "/api/contact", { body: undefined });
  assert.equal(bad.status, 400);
  assert.equal((await t.call("GET", "/api/nothing")).status, 404);
});
