# Orders in Supabase

The web store can keep its orders (pack, buyer email, downloads left, deadline)
in Supabase Postgres instead of Netlify Blobs. Nothing changes until the two
environment variables below are set: without them the functions keep using Blobs.

## What lives where

- `supabase/migrations/20261011000000_orders.sql` — the `orders` table and the
  SQL functions the app calls (`put_order`, `get_order`, `consume_download`,
  `extend_deadline`). The download count and the deadline are decided inside
  Postgres under a row lock, so parallel downloads never exceed the allowance.
- `netlify/functions/_lib/supabase-orders.ts` — calls those functions through
  the PostgREST RPC endpoint (`/rest/v1/rpc/<name>`) with the secret key.
- The browser keys (`anon`, `authenticated`) have no access: RLS is on with no
  policies, and the functions are revoked from them.

## Setting it up

1. Create a Supabase project (pick an EU region).
2. Apply the migration: paste the SQL file into the dashboard's SQL Editor and
   run it, or with the Supabase CLI: `supabase link` then `supabase db push`.
3. In Netlify → Site configuration → Environment variables, set:
   - `SUPABASE_URL` — the project URL, e.g. `https://abcd.supabase.co`
   - `SUPABASE_SECRET_KEY` — a secret key (`sb_secret_…`). Server only.
4. Redeploy. From then on new orders go to Supabase.

Orders already in Blobs are not copied over. Switch before the store sells its
first order, or copy them first.

## Things to know

- Free-plan projects are paused after a period without activity. A paused
  database makes the webhook answer 500 (Lemon Squeezy retries) and downloads
  fail until it is resumed. Check the current plan limits before relying on
  the free plan for a store that takes payments.
- Viewing sales: Table Editor → `orders`, or SQL such as
  `select pack_slug, count(*) from orders group by 1;`.

## Email list

The same project holds the list of people who asked for news (`subscribers`,
migration `supabase/migrations/20261011080000_subscribers.sql`; see
ADR-0005). Same access model as orders: browser keys have no access, only
`subscribe_email` called with the secret key. `/subscribe` requires
`SUPABASE_URL` and `SUPABASE_SECRET_KEY` (no Blobs fallback).

- See the list: Table Editor → `subscribers`, or
  `select email, source, created_at from subscribers where unsubscribed_at is null;`
- Unsubscribe someone: `update subscribers set unsubscribed_at = now() where lower(email) = lower('x@y.com');`
- Supabase does not send email. Sending needs another tool, and a decision on
  confirming existing addresses first (ADR-0005).
