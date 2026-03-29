import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";
import { Vendor } from "../models/Vendor.ts";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Verify JWT token and authenticate user
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as { id: string; username: string; role: string };

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token, authorization denied",
    });
  }
};

/**
 * Check if user is Admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

/**
 * Check if user is Vendor
 */
export const isVendor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "Vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Vendor privileges required.",
    });
  }
  next();
};

/**
 * Check if user is Admin or Vendor
 */
export const isAdminOrVendor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "Admin" && req.user?.role !== "Vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Vendor privileges required.",
    });
  }
  next();
};
