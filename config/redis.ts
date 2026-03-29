import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// ==================== REDIS CONNECTION ====================

const redis = new IORedis({
  host: `${process.env.REDIS_HOST}`,
  port: 16387,
  username: "default",
  password: `${process.env.REDIS_PASSWORD}`,
});


// ==================== EVENTS ====================

redis.on("connect", () => {
  console.log("🔗 Redis connected");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.log("🔌 Redis connection closed");
});

// ==================== CONFIGURATION ====================

export async function configureRedis() {
  try {
    console.log("⚙️ Configuring Redis...");

    // ✅ Enforce NO EVICTION (critical for BullMQ)
    await redis.config("SET", "maxmemory-policy", "noeviction");

    // ✅ Optional memory cap (adjust based on VPS)
    if (process.env.REDIS_MAX_MEMORY) {
      await redis.config("SET", "maxmemory", process.env.REDIS_MAX_MEMORY);
    }

    console.log("✅ Redis configured (noeviction policy applied)");
  } catch (error: any) {
    console.warn(
      "⚠️ Could not configure Redis (likely managed service):",
      error.message,
    );
  }
}

// ==================== HEALTH CHECK ====================

export async function checkRedisHealth() {
  try {
    const response = await redis.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

export async function closeRedis() {
  try {
    await redis.quit();
    console.log("🛑 Redis connection closed gracefully");
  } catch (err) {
    console.error("❌ Error closing Redis:", err);
  }
}

// ==================== EXPORT ====================

export default redis;
