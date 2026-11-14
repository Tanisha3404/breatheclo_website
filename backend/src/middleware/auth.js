const config = require("../config");
const firebase = require("../firebase");

function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

async function load(req, res, token) {
  try {
    req.user = await firebase.verifyIdToken(token);
    return true;
  } catch (e) {
    res.status(401).json({ error: "Your login has expired. Please log in again." });
    return false;
  }
}

/** attaches req.user when a valid token is sent; guests (no token) pass through */
async function optionalAuth(req, res, next) {
  const token = bearer(req);
  if (!token) return next();
  if (await load(req, res, token)) next();
}

/** requires a valid Firebase login */
async function requireAuth(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Please log in to continue." });
  if (await load(req, res, token)) next();
}

/** use after requireAuth */
function requireAdmin(req, res, next) {
  if (!config.adminUids.includes(req.user.uid)) {
    // The UID is returned so the owner can copy it into ADMIN_UIDS
    return res.status(403).json({ error: "This account is not an admin.", uid: req.user.uid });
  }
  next();
}

module.exports = { optionalAuth, requireAuth, requireAdmin };
