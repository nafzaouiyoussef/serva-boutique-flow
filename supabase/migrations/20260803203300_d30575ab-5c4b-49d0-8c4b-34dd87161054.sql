create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  price numeric not null,
  compare_at_price numeric,
  images jsonb not null default '[]',
  variants jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid references public.products(id),
  product_name text,
  variant text,
  quantity int not null default 1,
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  total_price numeric not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','returned','cancelled')),
  locale text not null default 'fr',
  notes text,
  source text
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "products public read"
  on public.products for select
  to anon, authenticated
  using (active = true);

create policy "products admin write"
  on public.products for all
  to authenticated
  using (true) with check (true);

create policy "public can create orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "admins can read orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "admins can update orders"
  on public.orders for update
  to authenticated
  using (true) with check (true);

alter publication supabase_realtime add table public.orders;

insert into public.products (slug, name_fr, name_ar, description_fr, description_ar, price, compare_at_price, variants)
values (
  'serva-signature',
  'Sac Serva Signature',
  'حقيبة سيرفا سيغنتشر',
  'Cuir vegan premium, finitions dorées, doublure satinée.',
  'جلد نباتي فاخر، تشطيبات ذهبية، بطانة من الساتان.',
  399, 599,
  '[{"key":"burgundy","fr":"Bordeaux","ar":"عنابي"},{"key":"sand","fr":"Sable","ar":"رملي"},{"key":"black","fr":"Noir","ar":"أسود"}]'::jsonb
);