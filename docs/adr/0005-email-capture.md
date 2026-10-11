# Email capture (replaces ADR-0004)

Superseded: [0004-newsletter-removed.md](0004-newsletter-removed.md). The owner decided on 2026-10-11 to collect emails: the web had two touch points (anonymous Studio, post-purchase email) and no way to reach a visitor again.

## Decision

- **One field, no account, never blocking.** The form sits beside the free download (under the Studio and in the footer), not in front of it. Gating a free tool that arrives from search sends people to the next result.
- **The list lives in Supabase** (`public.subscribers`, migration `20261011080000_subscribers.sql`), in the same project as the orders and behind the same access model: RLS on, no browser access, one `subscribe_email` SQL function callable only with the secret key. Chosen by the owner over Loops (first draft of this ADR), who wanted one familiar tool and no new account.
- **Each row keeps `source`** (`studio`, `footer`, `pack`: which spot works) **and `consent_text`** (the exact wording shown next to the button, as proof of what was agreed). Re-subscribing an address that had unsubscribed clears `unsubscribed_at`.
- **No double opt-in, and no sending.** Supabase stores addresses; it does not send marketing email. So there is no confirmation email: anyone can type someone else's address. Accepted for now because nothing is sent yet. Before the first mailing, pick a sending tool (Loops, which the transactional order email already uses, or another) and decide whether to ask existing rows to confirm.
- **Unsubscribing is manual** until a sending tool exists: set `unsubscribed_at` (or delete the row). Every mailing must carry an unsubscribe link.
- **Off by default.** `VITE_NEWSLETTER_ENABLED=true` shows the forms. Turn it on only when a privacy page naming the controller, purpose, legal basis and rights is live.

## Consequences

- `/subscribe` needs `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (already set for orders). Unlike orders there is no Blobs fallback.
- Addresses are never written to logs or error messages.
- Spam control is a honeypot field and shape validation only. If the table fills with junk, add a rate limit or a captcha.
