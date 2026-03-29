import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  username: string;
  password: string;
  products: mongoose.Types.ObjectId[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Exclude from queries by default for security
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);



export const Vendor = mongoose.model<IVendor>("Vendor", VendorSchema);
