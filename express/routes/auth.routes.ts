import express from 'express'

import { Register, VendorRegistration } from '../controllers/auth.controller.ts'

export const AuthRouter = express.Router();

AuthRouter.post('/register',Register)
AuthRouter.post('/register-vendor',VendorRegistration)
