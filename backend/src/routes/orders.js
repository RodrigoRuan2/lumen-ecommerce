import express from 'express';
import {
  createOrder,
  getOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/seller', authenticate, getSellerOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, updateOrderStatus);

export default router;
