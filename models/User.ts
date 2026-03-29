import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface
export interface IUser extends Document {
  username: string;
  password: string;
  role: "Admin" | "Vendor" | "User";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      default: "User",
      enum: {
        values: ["Admin", "User"],
        message: "{VALUE} is not a valid role",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true, // Index for queries filtering by verification status
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    minimize: false,
  },
);


export const User = mongoose.model<IUser>("User", UserSchema);
