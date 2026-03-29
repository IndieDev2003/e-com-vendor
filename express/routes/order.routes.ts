import express from "express";
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  confirmPayment,
  deleteOrder,
  getOrderStats,
} from "../../services/orderService.ts";

const OrderRouter = express.Router();

// ==================== HELPERS ====================

const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ==================== ROUTES ====================

// 🚀 CREATE ORDER
OrderRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await createOrder(req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  }),
);

// 📦 GET ORDER BY ID
OrderRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  }),
);

// 📋 GET ALL ORDERS (PAGINATION + FILTERS)
OrderRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sortBy, sortOrder, ...filters } = req.query;

    const result = await getOrders(filters as any, {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.json({
      success: true,
      ...result,
    });
  }),
);

// 🔄 UPDATE ORDER STATUS
OrderRouter.patch(
  "/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updated = await updateOrderStatus(req.params.id, status);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: updated,
    });
  }),
);

// 💰 CONFIRM PAYMENT (MANUAL)
OrderRouter.post(
  "/:id/confirm",
  asyncHandler(async (req: Request, res: Response) => {
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash required",
      });
    }

    const order = await confirmPayment(req.params.id, txHash);

    res.json({
      success: true,
      message: "Payment marked as confirming",
      data: order,
    });
  }),
);

// ❌ DELETE ORDER
OrderRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await deleteOrder(req.params.id);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  }),
);

// 📊 ORDER STATS
OrderRouter.get(
  "/stats/overview",
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await getOrderStats();

    res.json({
      success: true,
      data: stats,
    });
  }),
);

export default OrderRouter;
