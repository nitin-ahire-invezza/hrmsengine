// migrate-halfday.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Leave = require("../model/leaveApplicationModel");

const DB_CONNECT = process.env.DB_CONNECT;

if (!DB_CONNECT) {
  console.error("DB_CONNECT is not defined in environment variables.");
  process.exit(1);
}

async function run() {
  try {
    mongoose.connect(DB_CONNECT);
    console.log("Connected to database");

    // 1) Add field if missing
    await Leave.updateMany(
      { halfday_post_lunch: { $exists: false } },
      { $set: { halfday_post_lunch: false } }
    );

    // 2) Force false where halfday is false
    await Leave.updateMany(
      { halfday: false },
      { $set: { halfday_post_lunch: false } }
    );

    console.log("Migration complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

run();
