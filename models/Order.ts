// models/Order.ts
import mongoose, { Schema, Document } from "mongoose";

// TypeScript interfaces
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ICryptoPayment {
  cryptocurrency: "BTC" | "ETH" | "USDT" | "USDC" | "XMR" | "LTC";
  walletAddress: string;
  transactionHash?: string;
  amountInCrypto: number;
  amountInUSD: number;
  exchangeRate: number;
  status: "pending" | "confirming" | "confirmed" | "failed" | "refunded";
  confirmations?: number;
  requiredConfirmations: number;
  paymentDeadline: Date;
  paidAt?: Date;
  network?: string; // e.g., "mainnet", "polygon", "bsc"
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  cryptoPayment: ICryptoPayment;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  trackingNumber?: string;
  notes?: string;
  cancelReason?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  addressLine1: {
    type: String,
    required: [true, "Address line 1 is required"],
    trim: true,
  },
  addressLine2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
  },
  postalCode: {
    type: String,
    required: [true, "Postal code is required"],
    trim: true,
  },
  country: {
    type: String,
    required: [true, "Country is required"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },
});

const CryptoPaymentSchema = new Schema<ICryptoPayment>({
  cryptocurrency: {
    type: String,
    required: [true, "Cryptocurrency is required"],
    enum: {
      values: ["BTC", "ETH", "USDT", "USDC", "XMR", "LTC"],
      message: "{VALUE} is not a supported cryptocurrency",
    },
  },
  walletAddress: {
    type: String,
    required: [true, "Wallet address is required"],
    trim: true,
  },
  transactionHash: {
    type: String,
    trim: true,
    sparse: true,
  },
  amountInCrypto: {
    type: Number,
    required: [true, "Crypto amount is required"],
    min: 0,
  },
  amountInUSD: {
    type: Number,
    required: [true, "USD amount is required"],
    min: 0,
  },
  exchangeRate: {
    type: Number,
    required: [true, "Exchange rate is required"],
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirming", "confirmed", "failed", "refunded"],
    default: "pending",
  },
  confirmations: {
    type: Number,
    default: 0,
    min: 0,
  },
  requiredConfirmations: {
    type: Number,
    required: true,
    default: 3,
    min: 1,
  },
  paymentDeadline: {
    type: Date,
    required: true,
  },
  paidAt: {
    type: Date,
  },
  network: {
    type: String,
    trim: true,
  },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    cryptoPayment: {
      type: CryptoPaymentSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Generate order number before saving
OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
