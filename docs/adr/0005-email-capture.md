# Email capture (replaces ADR-0004)

Superseded: [0004-newsletter-removed.md](0004-newsletter-removed.md). The owner decided on 2026-10-11 to collect emails: the web had two touch points (anonymous Studio, post-purchase email) and no way to reach a visitor again.

## Decision

- **One field, no account, never blocking.** The form sits beside the free download (under the Studio and in the footer), not in front of it. Gating a free tool that arrives from search sends people to the next result.
- **Loops is the only store.** It keeps the contact, sends the unsubscribe link and runs the double opt-in. Nothing is copied to Supabase: two places with personal data double the deletion and access-request work.
- **Through a Loops form endpoint, not the contacts API.** Double opt-in only applies to contacts created via form endpoints (Loops docs, 2026-10); the contacts API is not covered yet. The browser calls our `subscribe` Function, which calls the form (`LOOPS_FORM_ID`). `source` is `studio`, `footer` or `pack`, to learn which spot works.
- **Double opt-in is required** (Loops → Settings → Sending). Nothing is pre-ticked; the text next to the button says what is sent and that confirmation comes first.
- **Off by default.** `VITE_NEWSLETTER_ENABLED=true` shows the forms. Turn it on only when the Loops form exists, double opt-in is on, and a privacy page naming the controller, purpose, legal basis and rights is live.

## Consequences

- `LOOPS_API_KEY` is still only used for the transactional email; the form endpoint needs no key.
- Loops rate-limits form endpoints per IP. Calling it from the Function means every visitor shares Netlify's IP; fine at this volume. If the limit bites, call the form straight from the browser (needs a CORS check, not documented by Loops).
- Addresses are never written to logs.
