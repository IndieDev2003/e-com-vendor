import { ethers } from "ethers";
import crypto from "crypto";
import Client from "bitcoin-core";

const ENCRYPTION_KEY = process.env.PRIVATE_KEY_SECRET!;

// Ethereum wallet
export const generateETHWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
  return { address: wallet.address, encryptedPrivateKey };
};

// Bitcoin wallet via RPC
const btcClient = new Client({
  network: "mainnet",
  username: process.env.BTC_RPC_USER!,
  password: process.env.BTC_RPC_PASSWORD!,
  host: process.env.BTC_RPC_HOST!,
  port: parseInt(process.env.BTC_RPC_PORT!),
});

export const generateBTCWallet = async () => {
  const address = await btcClient.getNewAddress();
  return { address, encryptedPrivateKey: "" };
};

// Encryption
export const encryptPrivateKey = (key: string) => {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    Buffer.alloc(16, 0),
  );
  let encrypted = cipher.update(key, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

export const decryptPrivateKey = (encryptedKey: string) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    Buffer.alloc(16, 0),
  );
  let decrypted = decipher.update(encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
