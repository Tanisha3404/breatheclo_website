// Loads the catalogue from frontend/js/data.js into MongoDB

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const mongoose = require("mongoose");
const config = require("../src/config");
const Product = require("../src/models/Product");

const DEFAULT_STOCK = parseInt(process.env.SEED_STOCK || "50", 10);

function readCatalogue() {
  const file = path.resolve(__dirname, "../../frontend/js/data.js");
  const ctx = {};
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  return ctx.BC.products;
}

(async () => {
  const force = process.argv.includes("--force");
  const list = readCatalogue();
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  let added = 0, updated = 0;
  for (const [i, p] of list.entries()) {
    const fields = {
      title: p.title, price: p.price, category: p.category, tags: p.tags, newArrival: !!p.isNew,
      images: p.images, description: p.description, specs: p.specs, placeholder: !!p.placeholder, position: i,
    };
    const exists = await Product.exists({ id: p.id });
    if (!exists) {
      await Product.create({ id: p.id, ...fields, stock: DEFAULT_STOCK, active: true });
      added++;
    } else if (force) {
      await Product.updateOne({ id: p.id }, { $set: fields });
      updated++;
    }
  }
  console.log(`Seed done: ${added} added, ${updated} updated, ${list.length - added - updated} left as they were.`);
  if (added) console.log(`New products start with stock ${DEFAULT_STOCK}. Change it in the admin page.`);
  await mongoose.disconnect();
})().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
