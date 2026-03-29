import express from "express";
import {
  addProduct,
  addProducts,
  getProductById,
  getProducts,
  searchProducts,
  getProductsByVendor,
  getProductsByCategory,
  getLowStockProducts,
  getOutOfStockProducts,
  updateProduct,
  updateStock,
  updatePrice,
  toggleProductStatus,
  addProductImage,
  removeProductImage,
  deleteProduct,
  softDeleteProduct,
  deleteProductsByVendor,
  getProductStats,
  getTopProductsByPrice,
  getProductsWithMostStock,
  getAveragePriceByCategory,
  bulkUpdatePricesByCategory,
  bulkDeactivateProducts,
} from "../controllers/products.contorller.ts";

export const ProductRouter = express.Router();

// ==================== MIDDLEWARE ====================

// Error handler wrapper
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Validation middleware (you can expand this with express-validator)
const validateProductId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }
  next();
};

// ==================== CREATE ROUTES ====================

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Vendor)
 */
ProductRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;

    // Add vendor from authenticated user (assuming auth middleware)
    // productData.vendor = req.user.vendorId;

    const product = await addProduct(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }),
);

/**
 * @route   POST /api/products/bulk
 * @desc    Create multiple products
 * @access  Private (Vendor/Admin)
 */
ProductRouter.post(
  "/bulk",
  asyncHandler(async (req: Request, res: Response) => {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required",
      });
    }

    const createdProducts = await addProducts(products);

    res.status(201).json({
      success: true,
      message: `${createdProducts.length} products created successfully`,
      data: createdProducts,
    });
  }),
);

// ==================== READ ROUTES ====================

/**
 * @route   GET /api/products
 * @desc    Get all products with filters and pagination
 * @access  Public
 */
ProductRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      vendor,
      minPrice,
      maxPrice,
      isActive,
      inStock,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const filters: any = {};
    if (category) filters.category = category;
    if (vendor) filters.vendor = vendor;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (inStock !== undefined) filters.inStock = inStock === "true";

    const pagination: any = {};
    if (page) pagination.page = Number(page);
    if (limit) pagination.limit = Number(limit);
    if (sortBy) pagination.sortBy = sortBy as string;
    if (sortOrder) pagination.sortOrder = sortOrder as "asc" | "desc";

    const result = await getProducts(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  }),
);

/**
 * @route   GET /api/products/search
 * @desc    Search products by name or description
 * @access  Public
 */
ProductRouter.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const pagination: any = {};
    if (page) pagination.page = Number(page);
    if (limit) pagination.limit = Number(limit);

    const result = await searchProducts(q as string, pagination);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  }),
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
ProductRouter.get(
  "/:id",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  }),
);

/**
 * @route   GET /api/products/vendor/:vendorId
 * @desc    Get products by vendor
 * @access  Public
 */
ProductRouter.get(
  "/vendor/:vendorId",
  asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { activeOnly } = req.query;

    const products = await getProductsByVendor(
      vendorId,
      activeOnly === "false" ? false : true,
    );

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
ProductRouter.get(
  "/category/:category",
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const products = await getProductsByCategory(category);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

/**
 * @route   GET /api/products/inventory/low-stock
 * @desc    Get low stock products
 * @access  Private (Vendor/Admin)
 */
ProductRouter.get(
  "/inventory/low-stock",
  asyncHandler(async (req: Request, res: Response) => {
    const { threshold } = req.query;
    const products = await getLowStockProducts(
      threshold ? Number(threshold) : 10,
    );

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

/**
 * @route   GET /api/products/inventory/out-of-stock
 * @desc    Get out of stock products
 * @access  Private (Vendor/Admin)
 */
ProductRouter.get(
  "/inventory/out-of-stock",
  asyncHandler(async (req: Request, res: Response) => {
    const products = await getOutOfStockProducts();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

// ==================== UPDATE ROUTES ====================

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Vendor)
 */
ProductRouter.put(
  "/:id",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const product = await updateProduct(id, updateData);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }),
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Vendor)
 */
ProductRouter.patch(
  "/:id/stock",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    const product = await updateStock(id, Number(quantity), operation || "set");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  }),
);

/**
 * @route   PATCH /api/products/:id/price
 * @desc    Update product price
 * @access  Private (Vendor)
 */
ProductRouter.patch(
  "/:id/price",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { price } = req.body;

    if (price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    const product = await updatePrice(id, Number(price));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Price updated successfully",
      data: product,
    });
  }),
);

/**
 * @route   PATCH /api/products/:id/toggle-status
 * @desc    Toggle product active status
 * @access  Private (Vendor)
 */
ProductRouter.patch(
  "/:id/toggle-status",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await toggleProductStatus(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: product,
    });
  }),
);

/**
 * @route   POST /api/products/:id/images
 * @desc    Add image to product
 * @access  Private (Vendor)
 */
ProductRouter.post(
  "/:id/images",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const product = await addProductImage(id, imageUrl);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image added successfully",
      data: product,
    });
  }),
);

/**
 * @route   DELETE /api/products/:id/images
 * @desc    Remove image from product
 * @access  Private (Vendor)
 */
ProductRouter.delete(
  "/:id/images",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const product = await removeProductImage(id, imageUrl);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      data: product,
    });
  }),
);

// ==================== DELETE ROUTES ====================

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (hard delete)
 * @access  Private (Vendor/Admin)
 */
ProductRouter.delete(
  "/:id",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }),
);

/**
 * @route   DELETE /api/products/:id/soft
 * @desc    Soft delete product
 * @access  Private (Vendor)
 */
ProductRouter.delete(
  "/:id/soft",
  validateProductId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await softDeleteProduct(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      data: product,
    });
  }),
);

/**
 * @route   DELETE /api/products/vendor/:vendorId
 * @desc    Delete all products by vendor
 * @access  Private (Admin)
 */
ProductRouter.delete(
  "/vendor/:vendorId",
  asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const deletedCount = await deleteProductsByVendor(vendorId);

    res.status(200).json({
      success: true,
      message: `${deletedCount} products deleted successfully`,
      deletedCount,
    });
  }),
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @route   GET /api/products/analytics/stats
 * @desc    Get product statistics
 * @access  Private (Admin)
 */
ProductRouter.get(
  "/analytics/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await getProductStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  }),
);

/**
 * @route   GET /api/products/analytics/top-by-price
 * @desc    Get top products by price
 * @access  Public
 */
ProductRouter.get(
  "/analytics/top-by-price",
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const products = await getTopProductsByPrice(limit ? Number(limit) : 10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

/**
 * @route   GET /api/products/analytics/most-stock
 * @desc    Get products with most stock
 * @access  Private (Admin)
 */
ProductRouter.get(
  "/analytics/most-stock",
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const products = await getProductsWithMostStock(limit ? Number(limit) : 10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  }),
);

/**
 * @route   GET /api/products/analytics/avg-price-by-category
 * @desc    Get average price by category
 * @access  Public
 */
ProductRouter.get(
  "/analytics/avg-price-by-category",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getAveragePriceByCategory();

    res.status(200).json({
      success: true,
      data,
    });
  }),
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @route   PATCH /api/products/bulk/update-prices
 * @desc    Bulk update prices by category
 * @access  Private (Admin)
 */
ProductRouter.patch(
  "/bulk/update-prices",
  asyncHandler(async (req: Request, res: Response) => {
    const { category, priceChange, operation } = req.body;

    if (!category || priceChange === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category and priceChange are required",
      });
    }

    const result = await bulkUpdatePricesByCategory(
      category,
      Number(priceChange),
      operation || "increase",
    );

    res.status(200).json({
      success: true,
      message: "Prices updated successfully",
      data: result,
    });
  }),
);

/**
 * @route   PATCH /api/products/bulk/deactivate
 * @desc    Bulk deactivate products
 * @access  Private (Admin)
 */
ProductRouter.patch(
  "/bulk/deactivate",
  asyncHandler(async (req: Request, res: Response) => {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const result = await bulkDeactivateProducts(productIds);

    res.status(200).json({
      success: true,
      message: "Products deactivated successfully",
      data: result,
    });
  }),
);

// ==================== ERROR HANDLING ====================

// 404 handler for undefined routes
ProductRouter.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
ProductRouter.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err);

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);


