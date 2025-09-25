// 60 days of inactivity sleeps the free-tier MongoDB Atlas cluster
// This script pings the database to keep it alive

import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const result = await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Atlas ping result:", result);
  } catch (error) {
    console.error("MongoDB ping failed:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
