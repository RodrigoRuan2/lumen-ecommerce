-- ============================================================
-- Tabela: products
-- ============================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  price           numeric(10,2) not null,
  original_price  numeric(10,2),
  category        text not null,
  images          jsonb not null default '[]',
  stock           integer not null default 0,
  rating          numeric(3,2) not null default 0,
  num_reviews     integer not null default 0,
  seller_id       uuid references public.profiles(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Índices úteis para listagem e busca
create index if not exists products_category_idx    on public.products(category);
create index if not exists products_is_active_idx   on public.products(is_active);
create index if not exists products_seller_id_idx   on public.products(seller_id);
create index if not exists products_created_at_idx  on public.products(created_at desc);

-- RLS: leitura pública, escrita autenticada
alter table public.products enable row level security;

create policy "Produtos visíveis a todos" on public.products
  for select using (is_active = true);

create policy "Usuário autenticado pode inserir produto" on public.products
  for insert with check (auth.uid() = seller_id);

create policy "Dono ou admin pode atualizar" on public.products
  for update using (auth.uid() = seller_id);

create policy "Dono ou admin pode deletar" on public.products
  for delete using (auth.uid() = seller_id);

-- ============================================================
-- Tabela: orders
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  items            jsonb not null default '[]',
  total_price      numeric(10,2) not null,
  shipping_address jsonb not null default '{}',
  payment_method   text not null default 'credit_card',
  status           text not null default 'pending',
  created_at       timestamptz not null default now()
);

create index if not exists orders_user_id_idx    on public.orders(user_id);
create index if not exists orders_status_idx     on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- RLS: usuário vê apenas os próprios pedidos
alter table public.orders enable row level security;

create policy "Usuário vê próprios pedidos" on public.orders
  for select using (auth.uid() = user_id);

create policy "Usuário cria próprio pedido" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Admin atualiza status" on public.orders
  for update using (true);
