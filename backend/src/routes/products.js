const router = require("express").Router();
const Product = require("../models/Product");
const { HttpError } = require("../middleware/errors");

// GET /api/products: every active product, in shop order
router.get("/", async (_req, res) => {
  const list = await Product.find({ active: true }).sort({ position: 1, createdAt: 1 });
  res.json(list);
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const p = await Product.findOne({ id: String(req.params.id), active: true });
  if (!p) throw new HttpError(404, "Product not found");
  res.json(p);
});

module.exports = router;
