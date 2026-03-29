import mongoose, { Schema, Document} from "mongoose";

// TypeScript interface
export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  category: string;
  vendor: mongoose.Types.ObjectId;
  stock: number;
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: "Price must be a valid positive number",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "Uncategorized",
      enum: {
        values: [
         "Electronics ",
         "Household",
         "Office",
         
        ],
        message: "{VALUE} is not a valid category",
      },
      index: true, // Index for filtering by category
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
      index: true, // Index for querying products by vendor
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            // Basic URL validation
            return /^https?:\/\/.+/.test(url);
          },
          message: "Invalid image URL",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
export const Product = mongoose.model<IProduct>("Product", ProductSchema);

