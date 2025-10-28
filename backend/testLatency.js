// testLatency.js
import mongoose from "mongoose";

const start = Date.now();

const MONGO_URI = "mongodb://localhost:27017/nbkyouth";

console.log("⏳ Connecting to MongoDB...");

mongoose.connect(MONGO_URI)
  .then(() => {
    const ms = Date.now() - start;
    console.log(`✅ Connected in ${ms} ms`);
    return mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ Error connecting:", err);
  });
