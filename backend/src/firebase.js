//verifies Firebase ID tokens sent by the website
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const config = require("./config");

function auth() {
  const app = getApps()[0] || initializeApp({ projectId: config.firebaseProjectId });
  return getAuth(app);
}

/* resolves to the decoded token ({ uid, email, name, ... }) or throws if invalid/expired */
async function verifyIdToken(token) {
  return auth().verifyIdToken(token);
}

module.exports = { verifyIdToken };
