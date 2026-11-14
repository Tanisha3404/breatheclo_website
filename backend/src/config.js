require("dotenv").config({ quiet: true });

const env = process.env;
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

module.exports = {
  isProd: env.NODE_ENV === "production",
  port: parseInt(env.PORT || "5000", 10),
  mongoUri: env.MONGODB_URI || "mongodb://127.0.0.1:27017/breatheclo",
  firebaseProjectId: env.FIREBASE_PROJECT_ID || "breathecloauth",
  adminUids: list(env.ADMIN_UIDS),
  clientOrigins: list(env.CLIENT_ORIGINS),
  serveFrontend: env.SERVE_FRONTEND !== "false",
};
