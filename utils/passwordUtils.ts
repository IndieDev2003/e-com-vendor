import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Error hashing password");
  }
};

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Boolean indicating if passwords match
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message
 */
export const validatePasswordStrength = (
  password: string,
): {
  isValid: boolean;
  message?: string;
} => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return {
      isValid: false,
      message:
        "Password must contain at least one special character (!@#$%^&*)",
    };
  }

  return { isValid: true };
};

/**
 * Validate username
 */export const validateUsername = (
   username: string,
 ): {
   isValid: boolean;
   message?: string;
 } => {
   if (!username) {
     return {
       isValid: false,
       message: "Username is required",
     };
   }

   const trimmedUsername = username.trim();

   // Length check
   const MIN = 5;
   const MAX = 30;
   if (trimmedUsername.length < MIN) {
     return {
       isValid: false,
       message: `Username must be at least ${MIN} characters`,
     };
   }

   if (trimmedUsername.length > MAX) {
     return {
       isValid: false,
       message: `Username cannot exceed ${MAX} characters`,
     };
   }

   // Allowed characters
   if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
     return {
       isValid: false,
       message: "Only letters, numbers, and underscores are allowed",
     };
   }

   // Cannot start or end with underscore
   if (/^_|_$/.test(trimmedUsername)) {
     return {
       isValid: false,
       message: "Username cannot start or end with underscore",
     };
   }

   // No multiple consecutive underscores
   if (/__/.test(trimmedUsername)) {
     return {
       isValid: false,
       message: "Username cannot contain consecutive underscores",
     };
   }

   // Reserved usernames (important for marketplace)
   const reserved = ["admin", "root", "support", "vendor", "user"];
   if (reserved.includes(trimmedUsername.toLowerCase())) {
     return {
       isValid: false,
       message: "This username is not allowed",
     };
   }

   return { isValid: true };
 };
/**
 * Generate JWT token
 */
export const generateToken = (payload: { id: string; username: string; role: string }): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};
