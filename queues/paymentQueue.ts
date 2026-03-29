import Redis from "ioredis";
import { Queue } from "bullmq";

// Create connection
const connection = new Redis({
  host: "redis-16387.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  port: 16387,
  username: "default",
  password: "AAXcIX1B1ziZTgGqUSw8rf8Dd4mtVNWD",
});


// ==================== CONFIG SETUP ====================

export async function configureRedis() {
  try {
    console.log("⚙️ Configuring Redis...");

    // ✅ Set eviction policy
    await connection.config("SET", "maxmemory-policy", "noeviction");

    // ✅ Optional: set memory limit (adjust as needed)
    await connection.config("SET", "maxmemory", "256mb");

    console.log("✅ Redis configured: noeviction policy set");
  } catch (error: any) {
    console.error("❌ Redis config failed:", error.message);
  }
}



// Error handling
connection.on("error", (err) => {
  console.log("Redis Client Error", err);
});


// BullMQ Queue
export const paymentQueue = new Queue("payment-check", {
  connection,
});
