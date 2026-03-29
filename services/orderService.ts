import mongoose from "mongoose";
import { Order} from "../models/Order.ts";
import type { IOrder, IOrderItem, IShippingAddress } from "../models/Order.ts"
import { Product } from "../models/Product.ts";
import { paymentQueue } from "../queues/paymentQueue.ts";
import {
  getCryptoExchangeRate,
  calculateCryptoAmount,
  getRequiredConfirmations,
  getVendorWalletAddress,
} from "./cryptoRateService.ts";

// ==================== TYPES ====================

type SupportedCrypto = "BTC" | "ETH" | "USDT" | "USDC" | "XMR" | "LTC";

interface CreateOrderDTO {
  customer: string | mongoose.Types.ObjectId;
  vendor: string | mongoose.Types.ObjectId;
  items: { product: string | mongoose.Types.ObjectId; quantity: number }[];
  shippingAddress: IShippingAddress;
  cryptocurrency: SupportedCrypto;
  taxRate?: number;
  shippingCost?: number;
  notes?: string;
  isAnonymous?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== HELPERS ====================

const validateObjectId = (id: string | mongoose.Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid ID");
  }
};

const ensurePositiveNumber = (value: number, field: string) => {
  if (value < 0) {
    throw new Error(`${field} must be positive`);
  }
};

// ==================== CREATE ====================

export async function createOrder(data: CreateOrderDTO): Promise<IOrder> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    validateObjectId(data.customer);
    validateObjectId(data.vendor);

    if (!data.items || data.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    const productIds = data.items.map((i) => i.product);

    const products = await Product.find({ _id: { $in: productIds } }).session(
      session,
    );

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const orderItems: IOrderItem[] = [];

    // ==================== PROCESS ITEMS ====================

    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      const product = productMap.get(item.product.toString());

      if (!product) throw new Error(`Product not found: ${item.product}`);
      if (!product.isActive)
        throw new Error(`Inactive product: ${product.name}`);
      if (product.stock < item.quantity)
        throw new Error(`Insufficient stock for ${product.name}`);

      const itemSubtotal = product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      } as IOrderItem);

      subtotal += itemSubtotal;

      // 🔥 Atomic stock update
      product.stock -= item.quantity;
      await product.save({ session });
    }

    ensurePositiveNumber(subtotal, "Subtotal");

    const tax = subtotal * (data.taxRate || 0);
    const shippingCost = data.shippingCost || 0;
    const totalAmount = subtotal + tax + shippingCost;

    // ==================== CRYPTO ====================

    const exchangeRate = await getCryptoExchangeRate(data.cryptocurrency);

    const amountInCrypto = calculateCryptoAmount(totalAmount, exchangeRate);

    const walletAddress = await getVendorWalletAddress(
      data.vendor.toString(),
      data.cryptocurrency,
    );

    // ==================== CREATE ORDER ====================

    const order = await Order.create(
      [
        {
          customer: data.customer,
          vendor: data.vendor,
          items: orderItems,
          shippingAddress: data.shippingAddress,
          subtotal,
          tax,
          shippingCost,
          totalAmount,
          orderStatus: "pending",
          isAnonymous: data.isAnonymous || false,
          cryptoPayment: {
            cryptocurrency: data.cryptocurrency,
            walletAddress,
            amountInCrypto,
            amountInUSD: totalAmount,
            exchangeRate,
            status: "pending",
            confirmations: 0,
            requiredConfirmations: getRequiredConfirmations(
              data.cryptocurrency,
            ),
            paymentDeadline: new Date(Date.now() + 30 * 60 * 1000),
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();

    // ==================== QUEUE JOB ====================

    await paymentQueue.add(
      "check-payment",
      {
        orderId: order[0]._id.toString(),
      },
      {
        repeat: { every: 30000 }, // 30 sec
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return order[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ==================== READ ====================

export async function getOrderById(id: string) {
  validateObjectId(id);

  return Order.findById(id)
    .populate("customer", "name email")
    .populate("vendor", "name email")
    .populate("items.product")
    .lean();
}

export async function getOrders(
  filters: FilterQuery<IOrder> = {},
  pagination: PaginationOptions = {},
) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filters),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ==================== UPDATE ====================

export async function updateOrderStatus(orderId: string, status: string) {
  validateObjectId(orderId);

  return Order.findByIdAndUpdate(
    orderId,
    { orderStatus: status },
    { new: true },
  );
}

export async function confirmPayment(orderId: string, txHash: string) {
  validateObjectId(orderId);

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.cryptoPayment.status === "confirmed") {
    throw new Error("Already confirmed");
  }

  order.cryptoPayment.transactionHash = txHash;
  order.cryptoPayment.status = "confirming";

  await order.save();
  return order;
}

// ==================== DELETE ====================

export async function deleteOrder(orderId: string) {
  validateObjectId(orderId);

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.cryptoPayment.status === "confirmed") {
    throw new Error("Cannot delete paid order");
  }

  await Order.findByIdAndDelete(orderId);
  return true;
}

// ==================== ANALYTICS ====================

export async function getOrderStats() {
  const [totalOrders, revenue] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { "cryptoPayment.status": "confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    totalOrders,
    totalRevenue: revenue[0]?.total || 0,
  };
}

export default {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  confirmPayment,
  deleteOrder,
  getOrderStats,
};
