const mongoose = require("mongoose");
const config = require("./src/config");
const { createApp } = require("./src/app");

async function main() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  } catch (e) {
    console.error("\nCould not connect to MongoDB at " + config.mongoUri.replace(/\/\/[^@]*@/, "//***@"));
    console.error("Is MongoDB running? (Windows: open Services and start 'MongoDB Server'.) Then try again.\n");
    console.error(e.message);
    process.exit(1);
  }
  const server = createApp().listen(config.port, () => {
    console.log(`\nBreatheClo is running:  http://localhost:${config.port}`);
    console.log(`Admin page:             http://localhost:${config.port}/admin.html`);
    if (!config.adminUids.length) console.log("Note: ADMIN_UIDS is empty, so nobody can use the admin page yet (see backend/README.md).");
  });
  const stop = async () => { server.close(); await mongoose.disconnect(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
main();
