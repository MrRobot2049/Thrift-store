const mongoose = require("mongoose");
const Report = require("../models/Report");

async function ensureReportIndexes() {
  try {
    const indexes = await Report.collection.indexes().catch(() => []);

    // Remove legacy unique index patterns that block multiple users from reporting the same listing.
    const legacyIndexes = indexes.filter(
      (index) =>
        index?.name &&
        index.unique &&
        index.name !== "_id_" &&
        index.key &&
        index.key.item === 1 &&
        index.key.status === 1 &&
        index.key.reporter !== 1
    );

    for (const index of legacyIndexes) {
      await Report.collection.dropIndex(index.name);
      console.log(`Dropped legacy Report index: ${index.name}`);
    }

    await Report.syncIndexes();
    console.log("Report indexes synchronized");
  } catch (error) {
    console.error("Report index synchronization warning:", error.message);
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    await ensureReportIndexes();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;