# E-commerce Backend

API RESTful completa para plataforma de e-commerce com autenticação, gerenciamento de produtos e pedidos.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Stripe** - Pagamentos (integração futura)

## 📋 Estrutura

```
backend/
├── src/
│   ├── models/          # Schemas do MongoDB
│   ├── controllers/     # Lógica de negócio
│   ├── routes/          # Endpoints da API
│   ├── middleware/      # Middlewares customizados
│   ├── services/        # Serviços reutilizáveis
│   ├── utils/           # Funções auxiliares
│   ├── config/          # Configurações
│   └── index.js         # Arquivo principal
├── .env.example         # Variáveis de ambiente
└── package.json
```

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```bash
cp .env.example .env
```

4. Inicie o servidor:
```bash
npm run dev
```

## 📚 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obter perfil (requer token)

### Produtos
- `GET /api/products` - Listar todos os produtos
- `GET /api/products/:id` - Obter produto específico
- `POST /api/products` - Criar novo produto (requer autenticação)
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Pedidos
- `POST /api/orders` - Criar novo pedido
- `GET /api/orders` - Listar pedidos do usuário
- `GET /api/orders/:id` - Obter detalhes do pedido
- `PUT /api/orders/:id` - Atualizar status do pedido

## 🔐 Variáveis de Ambiente

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=sua_chave_secreta_aqui
STRIPE_SECRET_KEY=sua_chave_stripe
FRONTEND_URL=http://localhost:3000
```

## 📝 Próximos Passos

- [ ] Implementar integração com Stripe
- [ ] Adicionar validação de entrada com express-validator
- [ ] Implementar paginação avançada
- [ ] Adicionar sistema de categorias
- [ ] Implementar reviews e ratings
- [ ] Adicionar testes unitários
- [ ] Documentação com Swagger
