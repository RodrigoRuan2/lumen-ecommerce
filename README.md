# EcommercePro - Plataforma de E-commerce Completa

Uma plataforma de e-commerce moderna e escalável com backend Node.js/Express e frontend React/Vite, inspirada em Amazon e Mercado Livre.

## 📁 Estrutura do Projeto

```
ecommerce/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── models/         # Schemas MongoDB
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Endpoints da API
│   │   ├── middleware/     # Middlewares customizados
│   │   ├── services/       # Serviços reutilizáveis
│   │   ├── utils/          # Funções auxiliares
│   │   ├── config/         # Configurações
│   │   └── index.js        # Servidor principal
│   ├── .env.example
│   └── package.json
│
├── frontend/                # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilitários
│   │   ├── styles/         # CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── README.md               # Este arquivo
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure o .env com suas credenciais
npm run dev
```

Backend rodará em: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend rodará em: `http://localhost:3000`

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação segura
- **Bcryptjs** - Hash de senhas
- **Stripe** - Processamento de pagamentos

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool ultra-rápido
- **React Router** - Roteamento
- **Zustand/Redux** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **CSS3** - Estilos responsivos

## 📊 Funcionalidades Principais

### ✅ Implementadas
- [x] Autenticação de usuários (Register/Login)
- [x] Catálogo de produtos com categorias
- [x] Modelos de dados (User, Product, Order)
- [x] API REST completa
- [x] Layout responsivo
- [x] Sistema de roteamento

### 🚧 Em Desenvolvimento
- [ ] Carrinho de compras
- [ ] Página de detalhes do produto
- [ ] Sistema de checkout
- [ ] Integração com Stripe
- [ ] Perfil de usuário
- [ ] Painel administrativo
- [ ] Sistema de avaliações
- [ ] Filtros avançados

### 📋 Próximos
- [ ] Sistema de wishlist
- [ ] Recomendações personalizadas
- [ ] Chat de suporte ao cliente
- [ ] Relatórios e analytics
- [ ] App mobile (React Native)

## 🔐 Segurança

- Autenticação com JWT
- Hash de senhas com Bcryptjs
- CORS configurado
- Validação de entrada
- Proteção contra XSS

## 📱 Responsividade

A plataforma é totalmente responsiva e funciona em:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)

## 🗄️ Banco de Dados

### Modelos Principais

#### User
```javascript
- name: String
- email: String (único)
- password: String (hashed)
- phone: String
- address: Object
- role: String (customer, seller, admin)
- isActive: Boolean
- timestamps
```

#### Product
```javascript
- name: String
- description: String
- price: Number
- category: String
- images: Array
- stock: Number
- rating: Number
- reviews: Array
- sellerId: ObjectId
- isActive: Boolean
- timestamps
```

#### Order
```javascript
- userId: ObjectId
- items: Array
- totalPrice: Number
- shippingAddress: Object
- status: String (pending, processing, shipped, delivered)
- paymentMethod: String
- paymentStatus: String
- trackingNumber: String
- timestamps
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil (auth)
- `PUT /api/auth/profile` - Atualizar (auth)

### Produtos
- `GET /api/products` - Listar
- `GET /api/products/:id` - Detalhes
- `POST /api/products` - Criar (auth)
- `PUT /api/products/:id` - Atualizar (auth)
- `DELETE /api/products/:id` - Deletar (auth)

### Pedidos
- `POST /api/orders` - Criar (auth)
- `GET /api/orders` - Listar (auth)
- `GET /api/orders/:id` - Detalhes (auth)
- `PUT /api/orders/:id` - Atualizar (auth)

## 🔄 Fluxo de Desenvolvimento

1. **Ambiente Local** - Desenvolva e teste localmente
2. **Git** - Commit das alterações
3. **Staging** - Deploy em ambiente de teste
4. **Produção** - Deploy em produção

## 📚 Documentação

Cada pasta contém seu próprio README.md:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Commit suas mudanças
3. Push para a branch
4. Abra um Pull Request

## 📄 Licença

MIT

## 👨‍💻 Autor

EcommercePro Team - 2026

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para criar a melhor experiência de e-commerce**
