import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { provider } from "../config/eth";
import { Order } from "../models/Order";
import { sweepFunds } from "../services/sweepService";

new Worker(
  "confirmations",
  async (job) => {
    const { orderId } = job.data;
    const order = await Order.findById(orderId);
    if (!order) return;

    const receipt = await provider.getTransactionReceipt(
      order.cryptoPayment.transactionHash,
    );
    if (!receipt) throw new Error("Waiting for tx");

    const confirmations = receipt.confirmations;
    order.cryptoPayment.confirmations = confirmations;

    if (
      confirmations >= order.cryptoPayment.requiredConfirmations &&
      order.cryptoPayment.status !== "confirmed"
    ) {
      order.cryptoPayment.status = "confirmed";
      order.orderStatus = "confirmed";
      order.cryptoPayment.paidAt = new Date();
      console.log("✅ PAYMENT CONFIRMED");

      await sweepFunds(
        order.cryptoPayment.walletIndex,
        order.cryptoPayment.currency,
      );
    }

    await order.save();
    if (confirmations < order.cryptoPayment.requiredConfirmations)
      throw new Error("Still confirming");
  },
  { connection: redis },
);
