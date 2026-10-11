-- Email addresses of people who asked to hear about new packs and Studio
-- features (the capture form under the Studio and in the footer).
--
-- Same access model as `orders`: the browser keys (anon / authenticated) get
-- nothing at all (RLS on, no policies, function not executable by them); only
-- server code with the secret key (`service_role`) can call `subscribe_email`.
--
-- `consent_text` keeps the exact wording the person saw next to the button, as
-- proof of what they agreed to. Nothing sends email from here: this is the list.
-- To unsubscribe someone, set `unsubscribed_at` (or delete the row).

create table public.subscribers (
  id               bigint generated always as identity primary key,
  email            text        not null check (length(email) <= 254),
  source           text        not null,
  consent_text     text        not null,
  created_at       timestamptz not null default now(),
  unsubscribed_at  timestamptz
);

-- One row per address, whatever the capitalisation.
create unique index subscribers_email_key on public.subscribers (lower(email));

alter table public.subscribers enable row level security;
revoke all on public.subscribers from public, anon, authenticated;
grant select, insert, update, delete on public.subscribers to service_role;

-- Add an address. Returns nothing and does not say whether it was already there,
-- so the endpoint cannot be used to probe the list. A person who unsubscribed
-- and signs up again is subscribed again.
create function public.subscribe_email(p_email text, p_source text, p_consent_text text)
returns void
language sql
set search_path = ''
as $$
  insert into public.subscribers as s (email, source, consent_text)
  values (btrim(p_email), p_source, p_consent_text)
  on conflict (lower(email)) do update
    set unsubscribed_at = null,
        source = excluded.source,
        consent_text = excluded.consent_text,
        created_at = now()
    where s.unsubscribed_at is not null;
$$;

revoke execute on function public.subscribe_email(text, text, text) from public, anon, authenticated;
grant execute on function public.subscribe_email(text, text, text) to service_role;
