import type { Request, Response } from "express";
import { generateETHWallet, generateBTCWallet } from "../../utils/walletUtils.ts";
import { VerificationPayment } from "../../models/VerificationPayment.ts";

export const initiateVerification = async (req: Request, res: Response) => {
  const { userId, amount, currency } = req.body;
  if (!userId || !amount || !currency)
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });

  let wallet;
  if (currency === "ETH" || currency === "USDT") wallet = generateETHWallet();
  else if (currency === "BTC") wallet = await generateBTCWallet();

  const payment = await VerificationPayment.create({
    userId,
    walletAddress: wallet.address,
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    amount,
    currency,
    confirmationsRequired: currency === "BTC" ? 3 : 1,
  });

  res.status(200).json({
    success: true,
    message: "Send the required amount to this wallet address",
    data: { walletAddress: wallet.address, amount, currency },
  });
};
