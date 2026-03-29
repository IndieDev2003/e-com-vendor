import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationPayment extends Document {
  userId: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  amount: number;
  currency: "ETH" | "USDT" | "BTC";
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  confirmationsRequired: number;
}

const VerificationPaymentSchema = new Schema<IVerificationPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    walletAddress: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ["ETH", "USDT", "BTC"], required: true },
    txHash: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    confirmationsRequired: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const VerificationPayment = mongoose.model<IVerificationPayment>(
  "VerificationPayment",
  VerificationPaymentSchema,
);
