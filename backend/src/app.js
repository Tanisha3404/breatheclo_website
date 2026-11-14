const path = require("path");
const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const config = require("./config");
const { notFound, errorHandler } = require("./middleware/errors");

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (config.isProd) app.set("trust proxy", 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));

  const localDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  app.use(
    "/api",
    cors({
      origin(origin, cb) {
        if (!origin || config.clientOrigins.includes(origin) || (!config.isProd && localDev.test(origin))) return cb(null, true);
        cb(null, false);
      },
    })
  );
  app.use(express.json({ limit: "50kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/products", require("./routes/products"));
  app.use("/api/orders", require("./routes/orders"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api", require("./routes/forms"));
  app.use("/api", notFound);

  const frontend = path.resolve(__dirname, "../../frontend");
  if (config.serveFrontend && fs.existsSync(frontend)) {
    app.use(express.static(frontend));
    app.use((_req, res) => res.status(404).sendFile(path.join(frontend, "404.html")));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
