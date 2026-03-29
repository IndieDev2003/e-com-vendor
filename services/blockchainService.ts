// services/blockchainService.ts
import { ethers } from "ethers";
import { VerificationPayment } from "../models/VerificationPayment";
import { User } from "../models/User";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);

export async function checkBitcoinPayment(address: string) {
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    return {
      received: data.final_balance > 0,
      confirmations: data.n_tx || 0,
      txHash: data.txrefs?.[0]?.tx_hash || null,
    };
  } catch (err) {
    console.error("Blockchain error:", err);
    return { received: false };
  }
}

import { ethers } from "ethers";
import { VerificationPayment } from "../models/VerificationPayment";
import { User } from "../models/User";
import { notifyUser } from "./notificationService";
import Client from "bitcoin-core";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);
const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS!;
const btcClient = new Client({
  network: "mainnet",
  username: process.env.BTC_RPC_USER!,
  password: process.env.BTC_RPC_PASSWORD!,
  host: process.env.BTC_RPC_HOST!,
  port: parseInt(process.env.BTC_RPC_PORT!),
});

const verifyUser = async (payment: any, txHash: string) => {
  payment.status = "confirmed";
  payment.txHash = txHash;
  await payment.save();

  await User.findByIdAndUpdate(payment.userId, { isVerified: true });
  notifyUser(payment.userId, "Your account has been verified successfully!");
};

export const monitorPayments = async () => {
  const pendingPayments = await VerificationPayment.find({ status: "pending" });

  for (const payment of pendingPayments) {
    if (payment.currency === "ETH") {
      provider.on(payment.walletAddress, async (tx) => {
        const value = Number(ethers.formatEther(tx.value));
        if (value >= payment.amount) {
          const receipt = await provider.waitForTransaction(
            tx.hash,
            payment.confirmationsRequired,
          );
          if (
            receipt &&
            receipt.confirmations >= payment.confirmationsRequired
          ) {
            await verifyUser(payment, tx.hash);
          }
        }
      });
    }

    if (payment.currency === "USDT") {
      const abi = [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ];
      const usdtContract = new ethers.Contract(
        usdtContractAddress,
        abi,
        provider,
      );

      usdtContract.on("Transfer", async (from, to, value, event) => {
        if (
          to.toLowerCase() === payment.walletAddress.toLowerCase() &&
          Number(ethers.formatUnits(value, 6)) >= payment.amount
        ) {
          const receipt = await provider.waitForTransaction(
            event.transactionHash,
            payment.confirmationsRequired,
          );
          if (
            receipt &&
            receipt.confirmations >= payment.confirmationsRequired
          ) {
            await verifyUser(payment, event.transactionHash);
          }
        }
      });
    }

    if (payment.currency === "BTC") {
      setInterval(async () => {
        const txs = await btcClient.listTransactions("*", 100);
        for (const tx of txs) {
          if (
            tx.address === payment.walletAddress &&
            tx.category === "receive" &&
            tx.amount >= payment.amount &&
            tx.confirmations >= payment.confirmationsRequired
          ) {
            await verifyUser(payment, tx.txid);
          }
        }
      }, 10000); // every 10 seconds
    }
  }
};