# Canteen QR Ordering — Project Plan (Supabase Version)

**Overview**
A web application that allows students to scan table-specific QR codes to order from the canteen, pay (UPI or COD), receive an order token, and track order status. Admins can manage menu items, orders, students, and payments. The entire backend and authentication will be powered by **Supabase**, simplifying setup and deployment.

---

## Tech Stack (Simplified with Supabase)

* **Frontend:** React (Vite or Create React App) + Tailwind CSS for a modern UI
* **Backend:** Supabase (Postgres DB + Edge Functions + Auth + Storage)
* **Auth:** Supabase Auth (email/password)
* **Database:** Supabase Postgres (with RLS for security)
* **Realtime updates:** Supabase Realtime for order status tracking
* **QR generation:** `qrcode` npm package
* **Payment:** Razorpay / Paytm / PhonePe integrated via Supabase Edge Functions
* **Deployment:** Vercel (frontend) + Supabase (backend and DB)

---

## Architecture (Simplified)

1. Each table/counter has a unique QR code linked to a `qr_id`.
2. Scanning QR opens `https://canteen.app/order/{qr_id}`.
3. Student selects menu items → adds to cart → checkout.
4. Payment handled via UPI gateway → confirmation triggers Supabase Edge Function.
5. Token generated, order saved, and status updated in realtime.
6. Admin dashboard manages menu, orders, and payments.

---

## Database Schema (Supabase SQL)

Run these scripts in Supabase SQL editor:

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  phone text,
  role text not null default 'student',
  created_at timestamptz default now()
);

create table canteens (
  id bigserial primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table qr_codes (
  id bigserial primary key,
  qr_id text not null unique,
  canteen_id bigint references canteens(id),
  table_no text,
  created_at timestamptz default now()
);

create table menu_items (
  id bigserial primary key,
  canteen_id bigint references canteens(id),
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text,
  is_available boolean default true,
  prep_time_minutes int default 10,
  image_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table orders (
  id bigserial primary key,
  order_number text unique,
  token text,
  user_id uuid references auth.users(id),
  canteen_id bigint references canteens(id),
  total_amount numeric(10,2) not null,
  tax numeric(10,2) default 0,
  payment_method text,
  payment_status text default 'PENDING',
  order_status text default 'NEW',
  estimated_ready_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id bigserial primary key,
  order_id bigint references orders(id) on delete cascade,
  menu_item_id bigint references menu_items(id),
  name text,
  qty int not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create table payments (
  id bigserial primary key,
  order_id bigint references orders(id),
  gateway text,
  gateway_payment_id text,
  amount numeric(10,2),
  status text,
  metadata jsonb,
  created_at timestamptz default now()
);
```

---

## Supabase Features Used

* **Auth:** Handles login/register for admins and students.
* **Row Level Security (RLS):** Ensures students can only see their own orders.
* **Edge Functions:** Used for payment verification and token generation.
* **Storage:** Used for uploading menu item images.
* **Realtime:** Pushes order status updates to the frontend instantly.

---

## API & Edge Functions (Serverless Backend)

**Edge Functions:**

* `/create-order` — creates an order & related items.
* `/payment-webhook` — verifies payment and updates order status.
* `/generate-token` — generates unique token after payment.

**Client-side Queries:**

* Fetch menu items: `supabase.from('menu_items').select('*').eq('canteen_id', id)`
* Create order: `supabase.functions.invoke('create-order', { body: {...} })`
* Track order status: `supabase.from('orders').on('UPDATE', ...).subscribe()`

---

## Frontend Structure

**Pages**

* `/login` and `/register`
* `/order/:qrId` — show menu for that QR
* `/cart` and `/checkout`
* `/student/dashboard` — order history
* `/admin/dashboard` — manage menu, orders, students, payments

**Core Components**

* `MenuCard`, `CartDrawer`, `QuantitySelector`, `OrderStatus`, `AdminTable`, `PaymentModal`

---

## Payment Flow

1. User confirms cart → calls Edge Function `/create-order`.
2. Payment initiated via Razorpay/Paytm SDK.
3. On success, webhook `/payment-webhook` updates Supabase `orders` table → triggers Realtime updates.
4. Frontend receives update → shows token + preparation time.

---

## Security & RLS Policies

* Enable **RLS** on all major tables (`orders`, `order_items`, `menu_items`).
* Policies:

  * Students: can `SELECT` and `INSERT` into `orders` if `user_id = auth.uid()`.
  * Admins: can `SELECT`, `UPDATE`, and `DELETE` (role check from `profiles.role`).

---

## QR Module Implementation

1. Add records to `qr_codes` table for each table/counter.
2. Generate QR code with `qrcode` npm package → encode URL `/order/{qr_id}`.
3. On scan, app fetches canteen info and menu from Supabase.

---

## Milestones

**Milestone 1 — Setup**

* Connect Supabase project & configure tables.
* Setup auth & RLS.

**Milestone 2 — Frontend (Menu & Cart)**

* Create React components for menu, cart, checkout.

**Milestone 3 — Edge Functions**

* Implement order creation & payment verification functions.

**Milestone 4 — Admin Panel**

* Build order & menu management dashboards.

**Milestone 5 — Realtime & Notifications**

* Add Realtime updates for order tracking.

**Milestone 6 — Polish & Deployment**

* Deploy frontend on Vercel and connect with Supabase project.

---

## Acceptance Criteria

* Students can register/login via Supabase Auth.
* Menu fetched by scanning QR.
* Orders created and tracked via Supabase Realtime.
* Payments verified and tokens generated by Edge Functions.
* Admins manage menu, orders, and payments.

---

## Next Steps (Easy Implementation Path)

* ✅ Create Supabase project & run SQL schema.
* ✅ Enable Auth & RLS.
* ✅ Build frontend routes with React.
* ✅ Implement `/create-order` and `/payment-webhook` Edge Functions.
* ✅ Add QR code generation and connect to menus.

---

## Production Hardening Additions

### Admin Provisioning & Roles

- Use `profiles.role` values: `student`, `staff`, `admin`.
- Seed an initial admin by inserting a row in `profiles` (service key) after sign-up.
- Optionally add `profiles.canteen_id` for staff/admin scoping when multiple canteens exist.

### Database Enhancements (SQL)

Run after the existing schema to add enums, indexes, triggers, and integrity constraints.

```sql
-- Enums
do $$ begin
  create type order_status as enum ('NEW','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('PENDING','SUCCESS','FAILED','REFUNDED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('UPI','COD');
exception when duplicate_object then null; end $$;

-- Migrations for existing text columns (safe if fresh schema)
alter table orders alter column order_status type order_status using order_status::order_status;
alter table orders alter column payment_status type payment_status using payment_status::payment_status;
alter table orders alter column payment_method type payment_method using payment_method::payment_method;

-- Additional columns
alter table orders add column if not exists source_qr_id text;
alter table orders add column if not exists cancel_reason text;
alter table orders add column if not exists notes text;
alter table payments add column if not exists signature_valid boolean default false;

-- Token safeguards and idempotency
create unique index if not exists payments_gateway_unique on payments(gateway, gateway_payment_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_canteen on orders(canteen_id);
create index if not exists idx_menu_items_canteen on menu_items(canteen_id);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
for each row execute function set_updated_at();

drop trigger if exists trg_menu_items_updated on menu_items;
create trigger trg_menu_items_updated before update on menu_items
for each row execute function set_updated_at();

-- Optional: cascade payments on order delete
alter table payments drop constraint if exists payments_order_id_fkey;
alter table payments add constraint payments_order_id_fkey
  foreign key (order_id) references orders(id) on delete cascade;
```

### Row Level Security (RLS) — Concrete Policies

Enable RLS and apply explicit policies. Adjust if you use `profiles.canteen_id` for scoping.

```sql
-- Enable RLS
alter table orders enable row level security;
alter table order_items enable row level security;
alter table menu_items enable row level security;
alter table payments enable row level security;

-- Helper: is_admin()
create or replace function is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles p where p.id = uid and p.role = 'admin'
  );
$$;

-- orders
drop policy if exists orders_student_select on orders;
create policy orders_student_select on orders
  for select using (user_id = auth.uid());

drop policy if exists orders_student_insert on orders;
create policy orders_student_insert on orders
  for insert with check (user_id = auth.uid());

drop policy if exists orders_admin_all on orders;
create policy orders_admin_all on orders
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- order_items (via parent ownership)
drop policy if exists order_items_student_select on order_items;
create policy order_items_student_select on order_items
  for select using (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists order_items_student_insert on order_items;
create policy order_items_student_insert on order_items
  for insert with check (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists order_items_admin_all on order_items;
create policy order_items_admin_all on order_items
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- menu_items (public read, admin manage). If menu should be public unauthenticated, use anon key at API layer.
drop policy if exists menu_items_read_all on menu_items;
create policy menu_items_read_all on menu_items
  for select using (true);

drop policy if exists menu_items_admin_write on menu_items;
create policy menu_items_admin_write on menu_items
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- payments (students see their own; admins all; inserts via service role/edge fn)
drop policy if exists payments_student_select on payments;
create policy payments_student_select on payments
  for select using (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists payments_admin_all on payments;
create policy payments_admin_all on payments
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
```

### Token Generation Strategy

- Generate per-canteen, per-day incremental tokens for kitchen display: `001, 002, ...`.
- Implement with a small `order_counters` table or compute using `orders` for current day within a transaction.
- Store `orders.token` and ensure uniqueness with `(canteen_id, token, date_trunc('day', created_at))` logic at application level.

### Payments & Idempotency

- Choose Razorpay for first release (best docs + test mode). Map states to `payment_status`.
- Webhook must validate signature; upsert `payments` by `(gateway, gateway_payment_id)` and set `signature_valid`.
- All webhook handlers must be idempotent; ignore duplicate events once processed.
- COD flow: create order with `payment_method = 'COD'`, `payment_status = 'PENDING'`; allow admins to accept/reject; upon accept, generate token without webhook.

### Realtime Channels

- Students: subscribe to their `orders` by `id` or `user_id = auth.uid()`.
- Admins: subscribe to `orders` filtered by `canteen_id` for kitchen screen.
- Use Supabase Row Level Realtime aligned with RLS policies above.

### Edge Functions — Specifications

- `/create-order`
  - Validate `qr_id` → `canteen_id` mapping, validate items availability and prices from DB.
  - Calculate totals server-side; insert `orders` and `order_items` in one transaction.
  - If `payment_method = 'COD'`, mark `payment_status='PENDING'` and return order; token can be generated immediately or after admin acceptance.

- `/payment-webhook`
  - Verify Razorpay signature; upsert `payments` by `(gateway, gateway_payment_id)` with `signature_valid=true`.
  - If payment success and not previously processed, set `orders.payment_status='SUCCESS'` and advance `orders.order_status='NEW'`.

- `/generate-token`
  - In a transaction, compute next token for the canteen for today and set `orders.token`.
  - Set `estimated_ready_at` based on max of `(item.prep_time_minutes × qty)` or a canteen default.

### Observability & Storage

- Log structured JSON from Edge Functions; include `order_id`, `gateway_payment_id`, and outcomes.
- Store menu images in Supabase Storage; serve via signed URLs with short TTL or public bucket with cache-control.

---

## Updated Acceptance Criteria

* RLS prevents cross-user access; admins can manage all data.
* Webhook processing is idempotent and verifies signatures.
* Token numbers are unique per canteen per day under concurrency.
* Realtime updates reflect order status changes within 2 seconds.
* COD path functions end-to-end without payment gateway.

---

## Updated Milestones

**Milestone 1 — Setup & Security**

* Supabase project, schema, enums, indexes, triggers.
* Auth + RLS policies + seed initial admin.

**Milestone 2 — Frontend (Menu, Cart, Checkout)**

* React routes and components; QR flow; local cart; Supabase client.

**Milestone 3 — Edge Functions & Payments**

* Implement `/create-order`, `/payment-webhook`, `/generate-token` with Razorpay.
* Idempotency + signature verification + logs.

**Milestone 4 — Admin Panel & Realtime**

* Manage menu and orders; kitchen screen with realtime.

**Milestone 5 — Polish & Deployment**

* Images via Storage; accessibility; deploy on Vercel; environment config.

---

## Next Steps (Actionable)

* Apply the Database Enhancements and RLS SQL blocks above in Supabase.
* Scaffold Edge Functions (`create-order`, `payment-webhook`, `generate-token`).
* Initialize React app with routes and Supabase client; implement the QR → menu → cart flow.
