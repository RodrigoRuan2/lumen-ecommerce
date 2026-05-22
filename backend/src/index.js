import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

// Load environment variables immediately
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// FRONTEND_URL aceita múltiplas origens separadas por vírgula
// (ex: "https://rodrigoruan2.github.io,https://lumen.vercel.app")
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean) : [])
]

// Headers de segurança HTTP (X-Frame-Options, X-Content-Type-Options, etc).
// crossOriginResourcePolicy desativado pois o frontend consome em outra origem.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origem não permitida: ${origin}`))
    }
  }
  // credentials removido: autenticação é via header Authorization, não cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar ao banco de dados
connectDB();

// Rotas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando corretamente' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Tratamento de erros — log compacto sem expor request body/headers
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err?.name || 'Error', err?.message || 'unknown')
  // Em produção, mensagem genérica. Em dev, expõe a real para facilitar debug.
  const isProd = process.env.NODE_ENV === 'production'
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Erro interno do servidor' : (err.message || 'Erro interno do servidor')
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

export default app;
