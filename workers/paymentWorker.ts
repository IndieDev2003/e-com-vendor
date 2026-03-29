import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { Order } from "../models/Order";
import { checkBitcoinPayment } from "../services/blockchainService";

const connection = new IORedis({
  host: "redis-16387.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  port: 16387,
  username: "default",
  password: "AAXcIX1B1ziZTgGqUSw8rf8Dd4mtVNWD",
});


export const paymentWorker = new Worker(
  "payment-check",
  async (job) => {
    const { orderId } = job.data;

    console.log(`🔍 Checking payment for order: ${orderId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      console.log("⚠️ Order not found");
      return;
    }

    if (order.cryptoPayment.status === "confirmed") {
      console.log("✅ Already confirmed");
      return;
    }

    // 🔥 Simulated logic (replace with real blockchain check)
    const randomConfirmations = Math.floor(Math.random() * 5);

    order.cryptoPayment.confirmations = randomConfirmations;

    if (randomConfirmations >= order.cryptoPayment.requiredConfirmations) {
      order.cryptoPayment.status = "confirmed";
      order.orderStatus = "confirmed";
      order.cryptoPayment.paidAt = new Date();

      console.log(`💰 Payment confirmed for order ${orderId}`);
    }

    await order.save();
  },
  {
    connection: redis,
  },
);

// ==================== EVENTS ====================

paymentWorker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

paymentWorker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job?.id}`, err);
});

paymentWorker.on("error", (err) => {
  console.error("🚨 Worker error:", err);
});