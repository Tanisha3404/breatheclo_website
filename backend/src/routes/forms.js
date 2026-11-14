const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const Message = require("../models/Message");
const Subscriber = require("../models/Subscriber");
const { parse } = require("../middleware/errors");
const { contactSchema, subscribeSchema } = require("../validation");

const limiter = (limit, what) =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: `Too many ${what}. Please try again later.` },
  });

// POST /api/contact
router.post("/contact", limiter(10, "messages"), async (req, res) => {
  const data = parse(contactSchema, req.body);
  await Message.create(data);
  res.status(201).json({ ok: true });
});

// POST /api/subscribe
router.post("/subscribe", limiter(20, "sign-ups"), async (req, res) => {
  const { email } = parse(subscribeSchema, req.body);
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.status(201).json({ ok: true });
});

module.exports = router;
