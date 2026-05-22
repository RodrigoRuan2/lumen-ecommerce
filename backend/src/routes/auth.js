import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Limita tentativas de login para mitigar força bruta: 10 por IP a cada 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Aguarde alguns minutos.' }
});

// Limita registros: 5 por IP por hora (anti-spam)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Muitos cadastros recentes. Tente novamente em 1 hora.' }
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
