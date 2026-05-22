<div align="center">

# 💡 LUMEN

### Plataforma de e-commerce premium full-stack

Curadoria de produtos com design moderno, fluxos completos de compra, venda e administração — inspirado em Apple, Linear e Stripe.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-rodrigoruan2.github.io%2Flumen--ecommerce-18181b?style=for-the-badge)](https://rodrigoruan2.github.io/lumen-ecommerce/)
[![Deploy](https://img.shields.io/github/actions/workflow/status/RodrigoRuan2/lumen-ecommerce/deploy-pages.yml?branch=main&style=for-the-badge&label=Deploy)](https://github.com/RodrigoRuan2/lumen-ecommerce/actions)
[![License](https://img.shields.io/badge/license-MIT-3B9FD4?style=for-the-badge)](LICENSE)

![Hero](docs/screenshots/home-light.png)

</div>

---

## ✨ Highlights

<table>
  <tr>
    <td width="50%">
      <h4>🎨 Design system completo</h4>
      <p>Tipografia <code>Inter</code> com letter-spacing negativo, paleta neutra zinc com acentos tonais, gradient mesh, sombras quase imperceptíveis e ícones SVG inline. Tema light/dark com transições suaves.</p>
    </td>
    <td width="50%">
      <h4>🛒 Carrinho persistente por usuário</h4>
      <p>Cada conta tem seu próprio carrinho mantido entre sessões — armazenado em <code>localStorage</code> namespaceado por user ID. Eventos custom sincronizam entre abas.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h4>👑 Workflow de aprovação de vendedores</h4>
      <p>Cadastros de seller ficam <code>pending</code> com flag em JSONB. Middleware <code>isSeller</code> bloqueia criação de produtos. Admin aprova/rejeita em fila dedicada.</p>
    </td>
    <td>
      <h4>💳 Pagamento PCI-safe</h4>
      <p>Cartão salvo armazena apenas <strong>últimos 4 dígitos + bandeira + nome + validade</strong>. PAN completo e CVV nunca tocam o backend. Sanitização forçada server-side.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h4>📍 Loja física com mapa</h4>
      <p>Vendedores cadastram endereço da loja com CEP autocompletado via ViaCEP. Geocoding via Nominatim/OpenStreetMap exibe localização na página do produto.</p>
    </td>
    <td>
      <h4>🛡️ Segurança em camadas</h4>
      <p>Helmet, rate limiting (10 logins/15min), CORS allowlist, política de senha forte, whitelist de campos em PUT, logs sem PII, regex Unicode anti-injection no search.</p>
    </td>
  </tr>
</table>

---

## 📸 Showcase

### Home — light vs dark

| Light | Dark |
|:-----:|:----:|
| ![Home Light](docs/screenshots/home-light.png) | ![Home Dark](docs/screenshots/home-dark.png) |

### Grid de produtos
![Products](docs/screenshots/products-grid.png)

### Página do produto
![Product Detail](docs/screenshots/product-detail.png)

### Carrinho com mini-thumbs e preview de PIX
![Cart](docs/screenshots/cart.png)

### Painel do Administrador
![Admin](docs/screenshots/admin-dashboard.png)

### Mobile
<p align="center">
  <img src="docs/screenshots/mobile-menu.png" alt="Mobile" width="320" />
</p>

---

## 🧪 Contas de teste

> Já estão criadas no ambiente público. Acesse o [Live Demo](https://rodrigoruan2.github.io/lumen-ecommerce/) e use:

| Papel | Email | Senha |
|:------|:------|:------|
| 👤 **Cliente** | `cliente-teste@lumen.test` | `Senha12345` |
| 🏪 **Vendedor (aprovado)** | `vendedor-teste@lumen.test` | `Senha12345` |
| 👑 **Admin** | `admin-teste@lumen.test` | `Senha12345` |

**Roteiro sugerido:**

1. Entre como **Cliente** → adicione produtos → checkout completo (use endereço real, cartão `4111 1111 1111 1111`, marque "Salvar cartão")
2. Saia e entre como **Admin** → aba "Aprovações" → veja a fila de vendedores pendentes
3. Entre como **Vendedor** → tab "Minha Loja" → cadastre endereço da loja e veja aparecer na página dos seus produtos
4. **Cadastre uma conta nova de vendedor** → observe que o app bloqueia criação de produtos até aprovação admin

> ⚠️ Backend roda no free tier do Render — primeira request após 15min de idle leva ~50s pra acordar (cold start). Normal.

---

## 🧱 Stack

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <a href="https://react.dev/">React 18</a> ·
      <a href="https://vitejs.dev/">Vite 5</a> ·
      <a href="https://reactrouter.com/">React Router 6</a> ·
      <a href="https://react-leaflet.js.org/">React Leaflet</a> ·
      CSS puro com variáveis
    </td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <a href="https://nodejs.org/">Node.js 18+</a> ·
      <a href="https://expressjs.com/">Express 4</a> ·
      <a href="https://helmetjs.github.io/">Helmet</a> ·
      <a href="https://github.com/express-rate-limit/express-rate-limit">express-rate-limit</a>
    </td>
  </tr>
  <tr>
    <td><strong>Database & Auth</strong></td>
    <td>
      <a href="https://supabase.com/">Supabase</a> (Postgres + Auth JWT)
    </td>
  </tr>
  <tr>
    <td><strong>APIs externas</strong></td>
    <td>
      <a href="https://viacep.com.br/">ViaCEP</a> (autocompletar CEP) ·
      <a href="https://nominatim.openstreetmap.org/">Nominatim</a> (geocoding)
    </td>
  </tr>
  <tr>
    <td><strong>Hosting</strong></td>
    <td>
      <a href="https://pages.github.com/">GitHub Pages</a> (frontend) ·
      <a href="https://render.com/">Render</a> (backend)
    </td>
  </tr>
</table>

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com/) (free tier)

### 1. Clone
```bash
git clone https://github.com/RodrigoRuan2/lumen-ecommerce.git
cd lumen-ecommerce
```

### 2. Configure o Supabase
- Crie um projeto novo em [supabase.com/dashboard](https://supabase.com/dashboard)
- No **SQL Editor**, rode o conteúdo de [`supabase/migrations.sql`](./supabase/migrations.sql)
- Em **Settings → API**, copie:
  - **Project URL**
  - **Anon (public) key**
  - **Service role key** ⚠️ secreta

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edite .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm run dev
```
API disponível em `http://localhost:5000`.

### 4. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edite .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```
App disponível em `http://localhost:3000`.

---

## 📁 Estrutura

```
lumen-ecommerce/
├── backend/
│   └── src/
│       ├── controllers/      # Lógica de negócio (auth, product, order)
│       ├── routes/           # Endpoints REST
│       ├── middleware/       # authenticate, isAdmin, isSeller
│       ├── services/         # supabaseClient, mockData
│       └── index.js
│
├── frontend/
│   └── src/
│       ├── pages/            # Home, ProductDetail, Cart, Checkout, Profile…
│       ├── components/       # Header, ProductCard, Icon, Skeleton, DeliveryMap
│       ├── context/          # CartContext (per-user storage)
│       ├── utils/            # formatters, pricing, helpers
│       └── styles/           # CSS por componente
│
├── supabase/
│   └── migrations.sql        # Schema das tabelas
│
├── docs/screenshots/         # Imagens deste README
│
├── .github/workflows/
│   └── deploy-pages.yml      # CI/CD do frontend
│
└── render.yaml               # Blueprint do backend
```

---

## 🛡️ Decisões de segurança

- **JWT via Supabase Auth** verificado a cada request no middleware `authenticate`
- **Role-based access control** com middlewares `isAdmin` e `isSeller`
- **Whitelist em `PUT /auth/profile`** — usuário não consegue alterar `role`, `sellerApplication` nem expandir `savedCard` para guardar PAN
- **Sanitização Unicode no search** — `[^\p{L}\p{N}\s]` previne PostgREST injection
- **Rate limiting** em `/login` (10/15min) e `/register` (5/h) por IP
- **Política de senha** — mínimo 8 caracteres, com letra e número
- **Helmet** com `X-Frame-Options`, `X-Content-Type-Options`, etc
- **CORS allowlist** via env var `FRONTEND_URL`
- **Logs sem PII** — só `error.name` e mensagem, nunca request body, headers ou stack completo
- **PCI-safe card storage** — `savedCard` é forçado a `{last4, brand, holderName, expiry}` server-side

---

## 📜 Licença

MIT © [Rodrigo Ruan](https://github.com/RodrigoRuan2)

---

<div align="center">
  <sub>Construído com 💡 como projeto de portfólio.</sub>
  <br />
  <sub>
    <a href="https://rodrigoruan2.github.io/lumen-ecommerce/">Live Demo</a> ·
    <a href="https://github.com/RodrigoRuan2/lumen-ecommerce/issues">Reportar bug</a> ·
    <a href="https://github.com/RodrigoRuan2/lumen-ecommerce/issues">Sugerir feature</a>
  </sub>
</div>
