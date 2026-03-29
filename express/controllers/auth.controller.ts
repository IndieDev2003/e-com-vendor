import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../../models/User.ts";
import { Vendor } from "../../models/Vendor.ts";
import { validatePasswordStrength,validateUsername,hashPassword,generateToken,comparePassword } from "../../utils/passwordUtils.ts";

export const Register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ succes: false, message: "All fields required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User Exists" });
    }

    const user = await new User({
      username,
      password,
    });

    user.save();
    console.log(user);

    return res.status(201).json({ success: true, message: "Login Please" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};


/**
 * Vendor Registration
 */
export const VendorRegistration = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: usernameValidation.message 
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check if vendor username exists
    const existingVendor = await Vendor.findOne({ username: trimmedUsername });
    if (existingVendor) {
      return res.status(409).json({ 
        success: false, 
        message: "Username already taken" 
      });
    }

    // Hash password using utility function
    const hashedPassword = await hashPassword(password);

    // Create new vendor with hashed password
    const vendor = new Vendor({
      username: trimmedUsername,
      password: hashedPassword,
    });

    await vendor.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Vendor registration successful, please login',
      data: {
        id: vendor._id,
        username: vendor.username,
        isVerified: vendor.isVerified
      }
    });
    
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map((e: any) => e.message).join(', ')
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

/**
 * Vendor Login
 */
export const VendorLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Find vendor and include password field
    const vendor = await Vendor.findOne({ 
      username: trimmedUsername
    }).select('+password');

    if (!vendor) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Compare password using utility function
    const isPasswordValid = await comparePassword(password, vendor.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if vendor is verified
    if (!vendor.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Please verify your account first" 
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: vendor._id.toString(),
      username: vendor.username,
      role: 'Vendor'
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      data: {
        token,
        vendor: {
          id: vendor._id,
          username: vendor.username,
          isVerified: vendor.isVerified
        }
      }
    });
    
  } catch (error: any) {
    console.error('Vendor login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

// ==================== USER CONTROLLERS ====================

/**
 * User Registration
 */
export const UserRegistration = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log(username,"  ",password)

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: usernameValidation.message 
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check if user username exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Username already taken" 
      });
    }

    // Hash password using utility function
    const hashedPassword = await hashPassword(password);

    // Create new user with hashed password
    const user = new User({
      username: trimmedUsername,
      password: hashedPassword,
      
    });

    await user.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'User registration successful, please login',
      data: {
        id: user._id,
        username: user.username,
        
        isVerified: user.isVerified
      }
    });
    
  } catch (error: any) {
    console.error('User registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map((e: any) => e.message).join(', ')
      });
    }
    
    console.log(error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

/**
 * User Login
 */
export const UserLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Find user and include password field
    const user = await User.findOne({ 
      username: trimmedUsername
    }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Compare password using utility function
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Please verify your account first" 
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
    
  } catch (error: any) {
    console.error('User login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

/**
 * Change Password (for both Vendor and User)
 */
export const ChangePassword = async (req: Request, res: Response) => {
  try {
    const { userId, userType, currentPassword, newPassword } = req.body;

    // Validation
    if (!userId || !userType || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }

    // Find user based on type
    let account;
    if (userType === 'Vendor') {
      account = await Vendor.findById(userId).select('+password');
    } else {
      account = await User.findById(userId).select('+password');
    }

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found" 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, account.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    account.password = hashedNewPassword;
    await account.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};