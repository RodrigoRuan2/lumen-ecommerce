# E-commerce Frontend

Frontend React com Vite para plataforma de e-commerce completa.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Redux** - Gerenciamento de estado (setup inicial)
- **Axios** - Cliente HTTP

## 📋 Estrutura

```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Serviços de API
│   ├── store/           # Redux store (quando implementado)
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Funções auxiliares
│   ├── styles/          # CSS modular
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
├── package.json
└── index.html
```

## 🔧 Instalação

1. Navegue para pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o dev server:
```bash
npm run dev
```

4. Acesse em `http://localhost:3000`

## 🏗️ Build para Produção

```bash
npm run build
```

## 📱 Páginas Implementadas

- ✅ Home - Listagem de produtos
- ✅ Login - Autenticação
- ✅ Register - Novo usuário
- 🚧 Detalhes do Produto
- 🚧 Carrinho de Compras
- 🚧 Checkout
- 🚧 Perfil do Usuário
- 🚧 Painel Admin

## 🎨 Componentes

- Header - Navegação principal
- Footer - Rodapé
- ProductCard - Card de produto
- (Mais em desenvolvimento)

## 📦 Próximos Passos

- [ ] Integração com Redux para estado global
- [ ] Carrinho de compras funcional
- [ ] Integração com Stripe para pagamentos
- [ ] Perfil de usuário completo
- [ ] Painel administrativo
- [ ] Sistema de reviews
- [ ] Testes unitários
- [ ] Otimização de performance
