-- Orders of the GradientWall web store (packs bought through Lemon Squeezy).
--
-- Mirrors `OrderRecord` in netlify/functions/_lib/orders-store.ts. The app
-- only talks to this table through the functions below, called with the
-- project's secret key from server code. The browser keys (anon /
-- authenticated) get no access at all: RLS is on with no policies and the
-- functions are not executable by them.
--
-- Times are passed in by the caller as epoch seconds (the app's injected
-- clock), so the deadline here is exactly the JWT `exp` of the download link.

create table public.orders (
  order_id            text primary key,
  pack_slug           text        not null,
  email               text        not null,
  downloads_remaining integer     not null check (downloads_remaining >= 0),
  expires_at          timestamptz not null,
  created_at          timestamptz not null,
  updated_at          timestamptz not null default now()
);

create index orders_email_idx on public.orders (lower(email));

alter table public.orders enable row level security;
revoke all on public.orders from public, anon, authenticated;
grant select, insert, update, delete on public.orders to service_role;

-- The record as the app sees it (epoch seconds, camelCase keys).
create function public.order_json(o public.orders)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'orderId', o.order_id,
    'packSlug', o.pack_slug,
    'email', o.email,
    'downloadsRemaining', o.downloads_remaining,
    'expiresAt', extract(epoch from o.expires_at)::bigint,
    'createdAt', extract(epoch from o.created_at)::bigint
  );
$$;

-- Insert or fully overwrite an order (a re-delivered webhook resets it).
create function public.put_order(
  p_order_id text,
  p_pack_slug text,
  p_email text,
  p_downloads_remaining integer,
  p_expires_at bigint,
  p_created_at bigint
)
returns void
language sql
set search_path = ''
as $$
  insert into public.orders as o
    (order_id, pack_slug, email, downloads_remaining, expires_at, created_at)
  values
    (p_order_id, p_pack_slug, p_email, p_downloads_remaining,
     to_timestamp(p_expires_at), to_timestamp(p_created_at))
  on conflict (order_id) do update set
    pack_slug = excluded.pack_slug,
    email = excluded.email,
    downloads_remaining = excluded.downloads_remaining,
    expires_at = excluded.expires_at,
    created_at = excluded.created_at,
    updated_at = now();
$$;

create function public.get_order(p_order_id text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select public.order_json(o) from public.orders o where o.order_id = p_order_id;
$$;

-- Why an order cannot be spent or extended right now, or null if it can.
-- Same rule as `isExpired` / `isExhausted` in orders-store.ts.
create function public.order_rejection(o public.orders, p_now bigint)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when o.order_id is null then 'not_found'
    when o.expires_at <= to_timestamp(p_now) then 'expired'
    when o.downloads_remaining <= 0 then 'exhausted'
  end;
$$;

-- Spend one download. The row lock makes N parallel calls on an order with K
-- downloads left grant exactly min(N, K) of them.
create function public.consume_download(p_order_id text, p_now bigint)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o public.orders;
  rejection text;
begin
  select * into o from public.orders where order_id = p_order_id for update;
  rejection := public.order_rejection(o, p_now);
  if rejection is not null then
    return jsonb_build_object('ok', false, 'reason', rejection);
  end if;

  update public.orders
     set downloads_remaining = downloads_remaining - 1, updated_at = now()
   where order_id = p_order_id
  returning downloads_remaining into o.downloads_remaining;

  return jsonb_build_object('ok', true, 'remaining', o.downloads_remaining);
end;
$$;

-- Push the deadline out to at least now + ttl, never pulling it in (ADR-0001).
-- Leaves the download allowance as it is now in the table.
create function public.extend_deadline(p_order_id text, p_now bigint, p_ttl_seconds bigint)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o public.orders;
  rejection text;
begin
  select * into o from public.orders where order_id = p_order_id for update;
  rejection := public.order_rejection(o, p_now);
  if rejection is not null then
    return jsonb_build_object('ok', false, 'reason', rejection);
  end if;

  update public.orders
     set expires_at = greatest(expires_at, to_timestamp(p_now + p_ttl_seconds)),
         updated_at = now()
   where order_id = p_order_id
  returning * into o;

  return jsonb_build_object('ok', true, 'order', public.order_json(o));
end;
$$;

-- Functions are executable by PUBLIC by default, and PostgREST exposes the
-- public schema to the browser keys. Only the server (secret key) may call them.
revoke execute on function
  public.order_json(public.orders),
  public.put_order(text, text, text, integer, bigint, bigint),
  public.get_order(text),
  public.order_rejection(public.orders, bigint),
  public.consume_download(text, bigint),
  public.extend_deadline(text, bigint, bigint)
from public, anon, authenticated;

grant execute on function
  public.order_json(public.orders),
  public.order_rejection(public.orders, bigint),
  public.put_order(text, text, text, integer, bigint, bigint),
  public.get_order(text),
  public.consume_download(text, bigint),
  public.extend_deadline(text, bigint, bigint)
to service_role;
