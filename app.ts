import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import basicAuth from "express-basic-auth";

import { swaggerSpec } from "./config/swagger.ts";
import { serverAdapter } from "./config/bullBoard.ts";
import { configureRedis } from "./config/redis.ts";
import { applySecurity } from "./config/security.ts";

import { AuthRouter } from "./express/routes/auth.routes.ts";
import { ProductRouter } from "./express/routes/products.routes.ts";
import OrderRouter from "./express/routes/order.routes.ts";
import VerificationRouter from "./express/routes/verification.routes.ts";

const app = express();

// ==================== SECURITY ====================

applySecurity(app);

// ==================== ROOT ====================

app.get("/", (_req, res) => {
  res.send("🚀 API Running Securely");
});

// ==================== SWAGGER ====================

app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ROUTES ====================

app.use("/api/auth", AuthRouter);
app.use("/api/product", ProductRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/verify",VerificationRouter)

// ==================== BULL BOARD (PROTECTED) ====================

app.use(
  "/admin/queues",
  basicAuth({
    users: {
      admin: process.env.BULL_BOARD_PASS || "admin123",
    },
    challenge: true,
  }),
  serverAdapter.getRouter(),
);

// ==================== 404 HANDLER ====================

// app.all((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`,
//   });
// });

// ==================== GLOBAL ERROR HANDLER ====================

app.use(
  (err: any, _req: express.Request, res: express.Response, _next: any) => {
    console.error("❌ Error:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  },
);

// ==================== START SERVER ====================

async function startServer() {
  try {
    console.log("🚀 Starting server...");

    // ✅ Configure Redis
    await configureRedis();

    // ✅ Connect MongoDB
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Bull Board: http://localhost:${PORT}/admin/queues`);
      console.log(`📘 Swagger: http://localhost:${PORT}/api/api-docs`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

startServer();
