// Test setup: real MongoDB (a throwaway database), fake Firebase tokens, the real Express app on a random port.
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

process.env.ADMIN_UIDS = "admin-uid";
process.env.SERVE_FRONTEND = "false";

// Fake Firebase: tokens look like "user:<uid>" or "admin". Anything else is rejected.
require.cache[require.resolve("../src/firebase")] = {
  id: "firebase-stub", filename: "firebase-stub", loaded: true,
  exports: {
    async verifyIdToken(t) {
      if (t === "admin") return { uid: "admin-uid", email: "admin@example.com" };
      if (t.startsWith("user:")) return { uid: t.slice(5), email: t.slice(5) + "@example.com" };
      throw new Error("bad token");
    },
  },
};

const { createApp } = require("../src/app");
const Product = require("../src/models/Product");

const baseUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = "breatheclo_test_" + crypto.randomBytes(4).toString("hex");

async function start() {
  await mongoose.connect(`${baseUri.replace(/\/$/, "")}/${dbName}`, { serverSelectionTimeoutMS: 5000 });
  await Product.init();
  const server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, url, { body, token } = {}) {
    const res = await fetch(base + url, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* no body */ }
    return { status: res.status, body: json };
  }
  async function stop() {
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  return { call, stop };
}

const goodOrder = (items) => ({
  customer: { name: "Test User", email: "Test@Example.com", phone: "9876543210" },
  address: { line1: "12 MG Road", city: "Ahmedabad", state: "Gujarat", pin: "380001" },
  payment: "cod",
  items,
});

async function addProduct(id, extra = {}) {
  return Product.create({ id, title: "Test " + id, price: 1000, category: "tshirt", images: ["images/x.jpg"], stock: 5, ...extra });
}

module.exports = { start, goodOrder, addProduct, Product };
