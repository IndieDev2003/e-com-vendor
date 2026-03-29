import { Product } from '../../models/Product.ts';
import type { IProduct } from '../../models/Product.ts';
import mongoose from "mongoose";

// ==================== INTERFACES ====================

interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  category: "Drugs" | "Weapons" | "Data";
  vendor: string | mongoose.Types.ObjectId;
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  category?: "Drugs" | "Weapons" | "Data";
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

interface ProductFilters {
  category?: string;
  vendor?: string | mongoose.Types.ObjectId;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  inStock?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== CREATE OPERATIONS ====================

/**
 * Add a new product
 */
export async function addProduct(
  productData: CreateProductDTO,
): Promise<IProduct> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productData.vendor)) {
      throw new Error("Invalid vendor ID");
    }

    const product = new Product(productData);
    const savedProduct = await product.save();

    return savedProduct;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      throw new Error(`Validation failed: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Add multiple products in bulk
 */
export async function addProducts(
  productsData: CreateProductDTO[],
): Promise<IProduct[]> {
  try {
    for (const product of productsData) {
      if (!mongoose.Types.ObjectId.isValid(product.vendor)) {
        throw new Error(`Invalid vendor ID: ${product.vendor}`);
      }
    }

    const products = await Product.insertMany(productsData);
    return products;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      throw new Error(`Validation failed: ${messages.join(", ")}`);
    }
    throw error;
  }
}

// ==================== READ OPERATIONS ====================

/**
 * Get product by ID
 */
export async function getProductById(
  productId: string,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId).populate("vendor");
    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all products with filters and pagination
 */
export async function getProducts(
  filters: ProductFilters = {},
  pagination: PaginationOptions = {},
) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;

    // Build query
    const query: FilterQuery<IProduct> = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.vendor) {
      query.vendor = filters.vendor;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    if (filters.inStock) {
      query.stock = { $gt: 0 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("vendor")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Search products by name or description
 */
export async function searchProducts(
  searchTerm: string,
  pagination: PaginationOptions = {},
) {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
      isActive: true,
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("vendor")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get products by vendor
 */
export async function getProductsByVendor(
  vendorId: string,
  activeOnly: boolean = true,
): Promise<IProduct[]> {
  try {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error("Invalid vendor ID");
    }

    const query: FilterQuery<IProduct> = { vendor: vendorId };
    if (activeOnly) {
      query.isActive = true;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  category: string,
): Promise<IProduct[]> {
  try {
    const products = await Product.find({
      category,
      isActive: true,
    })
      .populate("vendor")
      .sort({ createdAt: -1 });

    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  threshold: number = 10,
): Promise<IProduct[]> {
  try {
    const products = await Product.find({
      stock: { $lte: threshold, $gt: 0 },
      isActive: true,
    })
      .populate("vendor")
      .sort({ stock: 1 });

    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get out of stock products
 */
export async function getOutOfStockProducts(): Promise<IProduct[]> {
  try {
    const products = await Product.find({
      stock: 0,
      isActive: true,
    })
      .populate("vendor")
      .sort({ updatedAt: -1 });

    return products;
  } catch (error) {
    throw error;
  }
}

// ==================== UPDATE OPERATIONS ====================

/**
 * Update product by ID
 */
export async function updateProduct(
  productId: string,
  updateData: UpdateProductDTO,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("vendor");

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      throw new Error(`Validation failed: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Update product stock
 */
export async function updateStock(
  productId: string,
  quantity: number,
  operation: "add" | "subtract" | "set" = "set",
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    let updateOperation: any;

    if (operation === "add") {
      updateOperation = { $inc: { stock: quantity } };
    } else if (operation === "subtract") {
      updateOperation = { $inc: { stock: -quantity } };
    } else {
      updateOperation = { $set: { stock: quantity } };
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateOperation,
      { new: true, runValidators: true },
    );

    if (!product) {
      throw new Error("Product not found");
    }

    // Ensure stock doesn't go negative
    if (product.stock < 0) {
      product.stock = 0;
      await product.save();
    }

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Update product price
 */
export async function updatePrice(
  productId: string,
  newPrice: number,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    if (newPrice < 0) {
      throw new Error("Price cannot be negative");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { price: newPrice } },
      { new: true, runValidators: true },
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(
  productId: string,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    product.isActive = !product.isActive;
    await product.save();

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Add image to product
 */
export async function addProductImage(
  productId: string,
  imageUrl: string,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $push: { images: imageUrl } },
      { new: true, runValidators: true },
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Remove image from product
 */
export async function removeProductImage(
  productId: string,
  imageUrl: string,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { images: imageUrl } },
      { new: true },
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
}

// ==================== DELETE OPERATIONS ====================

/**
 * Delete product by ID (hard delete)
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const result = await Product.findByIdAndDelete(productId);

    if (!result) {
      throw new Error("Product not found");
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Soft delete product (set isActive to false)
 */
export async function softDeleteProduct(
  productId: string,
): Promise<IProduct | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { isActive: false } },
      { new: true },
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete all products by vendor
 */
export async function deleteProductsByVendor(
  vendorId: string,
): Promise<number> {
  try {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new Error("Invalid vendor ID");
    }

    const result = await Product.deleteMany({ vendor: vendorId });
    return result.deletedCount || 0;
  } catch (error) {
    throw error;
  }
}

// ==================== ANALYTICS & STATISTICS ====================

/**
 * Get product statistics
 */
export async function getProductStats() {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalValue,
      outOfStock,
      lowStock,
      categoryStats,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$price", "$stock"] } },
          },
        },
      ]),
      Product.countDocuments({ stock: 0, isActive: true }),
      Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
          },
        },
      ]),
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStock,
      lowStock,
      totalInventoryValue: totalValue[0]?.total || 0,
      categoryBreakdown: categoryStats,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get top products by price
 */
export async function getTopProductsByPrice(
  limit: number = 10,
): Promise<IProduct[]> {
  try {
    const products = await Product.find({ isActive: true })
      .populate("vendor")
      .sort({ price: -1 })
      .limit(limit);

    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get products with most stock
 */
export async function getProductsWithMostStock(
  limit: number = 10,
): Promise<IProduct[]> {
  try {
    const products = await Product.find({ isActive: true })
      .populate("vendor")
      .sort({ stock: -1 })
      .limit(limit);

    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Get average price by category
 */
export async function getAveragePriceByCategory() {
  try {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);

    return result;
  } catch (error) {
    throw error;
  }
}

// ==================== BULK OPERATIONS ====================

/**
 * Bulk update product prices by category
 */
export async function bulkUpdatePricesByCategory(
  category: string,
  priceChange: number,
  operation: "increase" | "decrease" | "multiply" = "increase",
) {
  try {
    let updateOperation: any;

    if (operation === "increase") {
      updateOperation = { $inc: { price: priceChange } };
    } else if (operation === "decrease") {
      updateOperation = { $inc: { price: -priceChange } };
    } else {
      updateOperation = { $mul: { price: priceChange } };
    }

    const result = await Product.updateMany(
      { category, isActive: true },
      updateOperation,
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk deactivate products
 */
export async function bulkDeactivateProducts(productIds: string[]) {
  try {
    const validIds = productIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    const result = await Product.updateMany(
      { _id: { $in: validIds } },
      { $set: { isActive: false } },
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    throw error;
  }
}

export default {
  // Create
  addProduct,
  addProducts,

  // Read
  getProductById,
  getProducts,
  searchProducts,
  getProductsByVendor,
  getProductsByCategory,
  getLowStockProducts,
  getOutOfStockProducts,

  // Update
  updateProduct,
  updateStock,
  updatePrice,
  toggleProductStatus,
  addProductImage,
  removeProductImage,

  // Delete
  deleteProduct,
  softDeleteProduct,
  deleteProductsByVendor,

  // Analytics
  getProductStats,
  getTopProductsByPrice,
  getProductsWithMostStock,
  getAveragePriceByCategory,

  // Bulk
  bulkUpdatePricesByCategory,
  bulkDeactivateProducts,
};
