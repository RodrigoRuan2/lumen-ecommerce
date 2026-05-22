# E-commerce Platform

Estrutura profissional de plataforma e-commerce com backend Node.js/Express e frontend React/Vite.

## Instruções para Desenvolvimento

### Instalação Inicial

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Executar em Desenvolvimento

Execute em dois terminais separados:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Variáveis de Ambiente

**Backend (.env):**
- PORT=5000
- NODE_ENV=development
- MONGODB_URI=mongodb://localhost:27017/ecommerce
- JWT_SECRET=sua_chave_secreta
- STRIPE_SECRET_KEY=sua_chave_stripe

### Estrutura de Pastas

- `backend/src/` - Código fonte do backend
  - `models/` - Schemas do MongoDB
  - `controllers/` - Lógica de negócio
  - `routes/` - Endpoints
  - `middleware/` - Middlewares
  - `services/` - Serviços
  - `config/` - Configurações

- `frontend/src/` - Código fonte do frontend
  - `components/` - Componentes reutilizáveis
  - `pages/` - Páginas
  - `services/` - Serviços de API
  - `styles/` - CSS
  - `store/` - Redux store
  - `hooks/` - Custom hooks

### Ferramentas Recomendadas

- **VS Code Extensions:**
  - ES7+ React/Redux/React-Native snippets
  - Thunder Client (testes de API)
  - MongoDB for VS Code

- **Ferramentas Externas:**
  - MongoDB Compass (gerenciador DB)
  - Postman (testes de API)

### Checklist de Desenvolvimento

- [ ] Instalar dependências (backend e frontend)
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexão com MongoDB
- [ ] Testar endpoints da API
- [ ] Validar componentes React
- [ ] Implementar carrinho de compras
- [ ] Implementar checkout
- [ ] Adicionar autenticação no frontend
- [ ] Integrar Stripe
- [ ] Testes e QA

### Scripts Disponíveis

**Backend:**
- `npm run dev` - Dev server com watch
- `npm start` - Iniciar servidor
- `npm test` - Rodar testes

**Frontend:**
- `npm run dev` - Dev server
- `npm run build` - Build para produção
- `npm run preview` - Preview do build

### Troubleshooting

**Porta já em uso?**
```bash
# Mude a porta no vite.config.js ou .env
```

**MongoDB não conecta?**
```bash
# Certifique-se que MongoDB está rodando
# Windows: mongod
# Mac: brew services start mongodb-community
```

**CORS Error?**
```bash
# Verifique se FRONTEND_URL está correto em backend/.env
```
