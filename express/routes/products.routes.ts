import express from 'express';
import { AddProduct } from '../controllers/products.contorller.ts';

export const ProductRouter = express.Router();

ProductRouter.post('/list-new-product',AddProduct)
