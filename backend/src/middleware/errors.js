const { ZodError } = require("zod");

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** validates data with a zod schema and returns the cleaned result or throws a 400 */
function parse(schema, data) {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const first = r.error.issues[0];
  const field = first.path.join(".");
  throw new HttpError(400, field ? `${field}: ${first.message}` : first.message, {
    fields: r.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  });
}

function notFound(_req, _res, next) {
  next(new HttpError(404, "Not found"));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.extra || {}) });
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues[0].message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON in request body." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (err.code === 11000) return res.status(409).json({ error: "That value already exists." });
  if (err.name === "ValidationError" || err.name === "CastError") return res.status(400).json({ error: err.message });
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
}

module.exports = { HttpError, parse, notFound, errorHandler };
