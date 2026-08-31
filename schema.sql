-- ============================================================
-- AyanaExpress — esquema da base de dados (Supabase / PostgreSQL)
-- ============================================================
-- Como usar:
-- 1. Crie um projeto gratuito em https://supabase.com
-- 2. Abra "SQL Editor" no painel do projeto
-- 3. Cole este ficheiro inteiro e clique em "Run"
-- 4. Em Project Settings → API, copie a "Project URL" e a chave
--    "anon public" para dentro dos dois ficheiros da loja e do
--    dashboard admin (constantes SUPABASE_URL / SUPABASE_ANON_KEY)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Categorias ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null unique,
  image text,
  created_at timestamptz default now()
);

-- ---------- Zonas de entrega ----------
create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee numeric not null default 0,
  created_at timestamptz default now()
);

-- ---------- Produtos ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  sku text unique,
  description text,
  price numeric not null,
  old_price numeric,
  stock integer not null default 0,
  status text not null default 'active', -- 'active' | 'inactive'
  image text,
  images jsonb default '[]',
  features jsonb default '[]',
  variants text,
  tag text,             -- ex: 'Mais vendido', 'Novo', 'Promoção'
  rating numeric default 4.5,
  reviews integer default 0,
  sold integer default 0,
  created_at timestamptz default now()
);

-- ---------- Encomendas ----------
-- Os itens ficam em JSONB (simplificação deliberada para lançar
-- rápido). Se o catálogo crescer muito, considere depois uma
-- tabela order_items separada com chave estrangeira para orders.
create table if not exists orders (
  id text primary key,               -- ex: "AE12345678"
  created_at timestamptz default now(),
  status text not null default 'Pedido recebido',
  customer_name text not null,
  phone text not null,
  whatsapp text,
  province text,
  municipality text,
  neighborhood text,
  address text,
  reference text,
  zone text,
  payment text,
  notes text,
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null
);

-- ============================================================
-- Segurança (Row Level Security)
-- ============================================================
-- Por omissão: qualquer pessoa pode LER produtos, categorias e
-- zonas (é uma loja pública), e qualquer pessoa pode CRIAR uma
-- encomenda (é o cliente a finalizar a compra).
--
-- IMPORTANTE — antes de lançar a loja a sério:
-- As políticas abaixo permitem que o dashboard admin escreva
-- (inserir/editar/apagar produtos, mudar estado de encomendas)
-- usando a mesma chave "anon" pública, o que é aceitável apenas
-- enquanto o link do dashboard não é partilhado publicamente.
-- Para produção, troque estas políticas de escrita para exigirem
-- autenticação (Supabase Auth) e uma tabela `admins` — a secção
-- comentada no fim mostra como.
-- ============================================================

alter table categories enable row level security;
alter table delivery_zones enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

-- Leitura pública
create policy "categorias visiveis a todos" on categories for select using (true);
create policy "zonas visiveis a todos" on delivery_zones for select using (true);
create policy "produtos visiveis a todos" on products for select using (true);

-- Escrita pública (loja + admin, versão de lançamento rápido)
create policy "categorias editaveis" on categories for all using (true) with check (true);
create policy "zonas editaveis" on delivery_zones for all using (true) with check (true);
create policy "produtos editaveis" on products for all using (true) with check (true);

-- Encomendas: qualquer cliente pode criar; leitura/edição também
-- aberta aqui para simplificar o mockup do admin dashboard.
create policy "qualquer pessoa cria encomendas" on orders for insert with check (true);
create policy "encomendas visiveis e editaveis" on orders for select using (true);
create policy "encomendas atualizaveis" on orders for update using (true);

-- ============================================================
-- PRÓXIMO PASSO RECOMENDADO — restringir a escrita ao admin
-- ============================================================
-- 1. Ative Supabase Auth e crie o seu utilizador admin (email/password).
-- 2. Corra:
--
--    create table admins (user_id uuid primary key references auth.users(id));
--    insert into admins (user_id) values ('COLE-AQUI-O-UUID-DO-SEU-UTILIZADOR');
--
-- 3. Substitua as políticas de escrita acima por, por exemplo:
--
--    drop policy "produtos editaveis" on products;
--    create policy "só admin edita produtos" on products for all
--      using (auth.uid() in (select user_id from admins))
--      with check (auth.uid() in (select user_id from admins));
--
--    (repita para categories, delivery_zones, e para update/delete
--    em orders — mantenha o insert de orders aberto para clientes)
-- 4. No dashboard admin, adicione um ecrã de login com Supabase
--    Auth para obter uma sessão autenticada antes de escrever.
-- ============================================================

-- ---------- Dados de demonstração (opcional) ----------
insert into categories (slug, name, image) values
  ('smartphones', 'Smartphones', 'https://picsum.photos/seed/ayana-smartphones/400/300'),
  ('eletronica', 'Eletrónica', 'https://picsum.photos/seed/ayana-eletronica/400/300'),
  ('relogios', 'Relógios', 'https://picsum.photos/seed/ayana-relogios/400/300'),
  ('perfumes', 'Perfumes', 'https://picsum.photos/seed/ayana-perfumes/400/300'),
  ('beleza', 'Beleza', 'https://picsum.photos/seed/ayana-beleza/400/300'),
  ('moda-homem', 'Moda Homem', 'https://picsum.photos/seed/ayana-modahomem/400/300'),
  ('moda-mulher', 'Moda Mulher', 'https://picsum.photos/seed/ayana-modamulher/400/300'),
  ('acessorios', 'Acessórios', 'https://picsum.photos/seed/ayana-acessorios/400/300'),
  ('casa', 'Casa', 'https://picsum.photos/seed/ayana-casa/400/300')
on conflict do nothing;

insert into delivery_zones (name, fee) values
  ('Luanda Centro', 1500), ('Talatona', 2000), ('Viana', 2500),
  ('Kilamba', 2000), ('Benfica', 2000), ('Cacuaco', 3000), ('Outras zonas', 3500)
on conflict do nothing;

insert into products (name, category, sku, description, price, old_price, stock, status, image, images, features, tag, rating, reviews, sold)
values
  ('Smartphone Redora X12 128GB', 'Smartphones', 'SM-X12-128',
   'Ecrã de 6.5", câmara tripla 50MP, bateria 5000mAh.', 385000, 450000, 14, 'active',
   'https://picsum.photos/seed/ayana-p1a/600/600',
   '["https://picsum.photos/seed/ayana-p1a/600/600","https://picsum.photos/seed/ayana-p1b/600/600"]',
   '["6.5\" FHD+","128GB / 6GB RAM","Câmara 50MP","Bateria 5000mAh"]', 'Mais vendido', 4.6, 128, 63),
  ('Auscultadores Bluetooth PulseAir Pro', 'Eletrónica', 'AC-PA-PRO',
   'Som limpo e até 30h de autonomia.', 28000, 38000, 32, 'active',
   'https://picsum.photos/seed/ayana-p2a/600/600',
   '["https://picsum.photos/seed/ayana-p2a/600/600"]',
   '["Bluetooth 5.3","30h de autonomia","IPX4"]', 'Promoção', 4.4, 76, 41)
on conflict do nothing;
