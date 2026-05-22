import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { listProfiles, updateProfileRole, listAllOrders, listPendingSellerApplications, reviewSellerApplication } from '../services/supabaseClient.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await listProfiles()
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, users: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    const allowed = ['customer', 'seller', 'admin']
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role inválida' })
    }
    const { data, error } = await updateProfileRole(req.params.id, role)
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, user: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await listAllOrders()
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, orders: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/seller-applications', async (req, res) => {
  try {
    const { data, error } = await listPendingSellerApplications()
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, applications: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/seller-applications/:id/approve', async (req, res) => {
  try {
    const { data, error } = await reviewSellerApplication(req.params.id, 'approved', req.user.id)
    if (error) return res.status(400).json({ success: false, message: error.message })
    res.json({ success: true, user: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/seller-applications/:id/reject', async (req, res) => {
  try {
    const { data, error } = await reviewSellerApplication(req.params.id, 'rejected', req.user.id)
    if (error) return res.status(400).json({ success: false, message: error.message })
    res.json({ success: true, user: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router;
