import express from 'express'
import {VendorLogin,VendorRegistration,UserLogin,UserRegistration,ChangePassword } from '../controllers/auth.controller.ts'
import {authMiddleware} from '../../middleware/authMiddleware.ts'

export const AuthRouter = express.Router();

// ==================== VENDOR AUTH ROUTES ====================
AuthRouter.post('/vendor/register', VendorRegistration);
AuthRouter.post('/vendor/login', VendorLogin);

// ==================== USER AUTH ROUTES ====================
AuthRouter.post('/user/register', UserRegistration);
AuthRouter.post('/user/login', UserLogin);

// ==================== COMMON AUTH ROUTES ====================
AuthRouter.post('/change-password', authMiddleware, ChangePassword);
