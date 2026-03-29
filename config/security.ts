import   Express  from "express";
import express from 'express'
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cors from "cors";

// ==================== SECURITY CONFIG ====================

export function applySecurity(app: Express) {
  // 🔐 Trust proxy (important for VPS / nginx)
  app.set("trust proxy", 1);

  // 🛡️ Secure HTTP headers
  app.use(helmet());

  // 🌍 CORS Configuration
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    }),
  );

  // 📦 Body parser with limit
  app.use(
    express.json({
      limit: "10kb",
    }),
  );

  // 🚫 Prevent NoSQL Injection
  app.use(mongoSanitize());

  // ❌ Prevent XSS
  app.use(xss());

  // 🧱 Prevent HTTP Parameter Pollution
  app.use(hpp());

  // 🚦 Global Rate Limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  });

  app.use("/api", apiLimiter);

  // 🔐 Strong limiter for auth routes
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: {
      success: false,
      message: "Too many login attempts, try again later",
    },
  });

  app.use("/api/auth", authLimiter);
}
