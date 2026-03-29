import mongoose from "mongoose";
import dotenv from "dotenv";
import { configureRedis } from "./config/redis.ts";
import "./workers/paymentWorker.ts";

dotenv.config();



// ==================== START WORKER ====================

async function startWorker() {
  try {
    console.log("🚀 Starting payment worker...");

    // ✅ 1. Configure Redis (IMPORTANT)
    await configureRedis();

    // ✅ 2. Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URL!);
    console.log("✅ Worker connected to MongoDB");

    console.log("👷 Payment worker is running...");
  } catch (err) {
    console.error("❌ Worker startup error:", err);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

async function shutdown() {
  console.log("🛑 Shutting down worker...");

  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB disconnected");
  } catch (err) {
    console.error("❌ Shutdown error:", err);
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ==================== START ====================

startWorker();
