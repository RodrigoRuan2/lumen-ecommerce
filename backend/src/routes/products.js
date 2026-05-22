import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticate, isSeller } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, isSeller, createProduct);
router.put('/:id', authenticate, isSeller, updateProduct);
router.delete('/:id', authenticate, isSeller, deleteProduct);

export default router;
