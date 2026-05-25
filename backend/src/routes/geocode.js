import express from 'express'
import rateLimit from 'express-rate-limit'
import { geocode } from '../controllers/geocodeController.js'

const router = express.Router()

// Rate limit pro IP do cliente — 30 req/min por usuario (mais que suficiente com debounce)
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisicoes de mapa, aguarde um momento.' }
})

router.get('/', geocodeLimiter, geocode)

export default router
