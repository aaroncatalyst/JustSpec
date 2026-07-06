# CLAUDE.md — JustSpec

## Standing rules for this repo (Aaron's Operating Protocol — condensed)

- **Model + effort:** Default Opus 4.8 @ xhigh for feature builds and debugging; Sonnet 4.6 @ medium–high for routine edits; Haiku 4.5 @ low for classification/extraction. State the choice + one-line reason; pin model and effort together. (Persist defaults in `.claude/settings.json` — see below.)
- **Data work → code, not context.** Never read a large CSV/catalog/export/scrape into context. Write and run code over the file and surface only what's needed. Flag it if I ask for the dumping approach.
- **Recurring workflow → Skill.** If something here is done repeatedly, propose packaging it as a Skill instead of re-explaining it.
- **Prompt-driven feature → eval.** Before changing any prompt that powers a feature, offer to write the eval cases + a deterministic grader; hill-climb against a baseline.
- **Big task → pre-flight.** Before a large job, check: Dynamic Workflow (`ultracode`, sample-test 10% first)? Advisor pattern (cheap executor + Opus on hard cases)? Caching set up? Model/effort sized to the job?
- **Cache:** at the start of big builds, prompt me to run "improve my cache hit rate."
- **On model upgrades:** scan this file + prompts for stale defensive patches and one-sided guardrails; flag for removal.
- **UI work:** ask for / propose an explicit color palette up front (don't default to the cream-and-serif house style).

---

## Pair it with `.claude/settings.json` (per repo)

`CLAUDE.md` carries the *behavioral* rules above. The actual model + effort defaults are best pinned in the repo's `.claude/settings.json` so they travel with the codebase and apply automatically:

```json
{
  "model": "<your Opus 4.8 model id>",
  "effortLevel": "xhigh"
}
```

- `effortLevel` accepts `low | medium | high | xhigh` and persists across sessions (`max`/`ultracode` are session-only).
- This is a frontend/product repo where most work is feature builds and UI — default `xhigh`; let routine copy/styling edits drop to Sonnet @ medium per the rules above.
- Verify the exact model id / schema against `https://code.claude.com/docs/en/model-config` when you set this up, since Claude Code's config evolves.

---

## What This Project Is

JustSpec (justspec.co) is the **customer-facing web app for the SourcePilot sourcing product** — the self-serve front door where importers submit a product spec and quantity, pay, and receive supplier quotes. It is the marketing site, auth/account system, billing layer, RFQ intake form, customer dashboard, SEO blog, and internal admin console all in one Next.js app.

The heavy lifting (supplier discovery, RFQ email generation, response parsing, negotiation, landed-cost reports) is **not** done here — it lives in the separate **SourcePilot FastAPI backend**. JustSpec stores RFQs/quotes in Supabase and triggers that backend over HTTP. Think of this repo as the "thin product shell" and SourcePilot as the "engine."

**Relationship to other repos:** JustSpec is the productized UI for `sourcepilot` (see `C:\Users\aaron\sourcepilot`). They share the same Supabase database and the same RFQ/Quote data model. SourcePilot, in turn, draws demand/pricing data from PackageHub. When changing the RFQ or Quote shape here, check `sourcepilot` for the matching reader/writer.

## Owner

Aaron — co-founder of Diversified Product Solutions, LLC (Berkland Goods on Amazon). Finance/PE background, not a developer. Claude writes the code; Aaron runs/tests it and applies domain judgment. Speak to product/business trade-offs in plain English; give exact PowerShell commands rather than "run the migration."

## Tech Stack

- **Framework:** Next.js 16.1.7 (App Router) + React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Database / Auth / Storage:** Supabase (PostgreSQL) via `@supabase/ssr` + `@supabase/supabase-js`. RLS on all tables; Google + email auth.
- **Payments:** Stripe (`stripe` SDK, API version pinned `2026-02-25.clover`) — subscriptions + one-time credit purchases
- **Email:** Resend (transactional — RFQ-complete notifications)
- **Blog:** MDX files on disk parsed with `gray-matter` + rendered with `next-mdx-remote`
- **Analytics:** GA4 + Google Ads conversion events (client-side via `gtag`)
- **Hosting:** Vercel (this app). The pipeline backend (SourcePilot) runs separately on Railway.
- **Path alias:** `@/*` → `./src/*`

## Project Structure

```
src/
  app/
    page.tsx                  # Marketing landing + RFQ "get started" CTA
    layout.tsx, globals.css   # Root layout, global styles
    sitemap.ts                # Dynamic sitemap (includes blog posts)
    login/, signup/           # Auth pages
    auth/callback/            # Supabase OAuth callback handler
    dashboard/
      page.tsx                # Customer RFQ list (auth-gated)
      rfq/[id]/page.tsx       # Single RFQ detail + quotes view
    admin/page.tsx            # Internal ops console (password-gated)
    blog/
      page.tsx, BlogIndexClient.tsx
      [slug]/                 # MDX post renderer
    api/
      checkout/               # Create Stripe Checkout session
      stripe-webhook/         # Stripe events → update plan/credits (service role)
      trigger-pipeline/       # Hand an RFQ to the SourcePilot FastAPI backend
      admin/
        rfqs/                 # List RFQs awaiting work
        quotes/               # List quotes for an RFQ
        parse-response/       # Send raw supplier email to backend for parsing
        complete-rfq/         # Mark RFQ complete + email the customer (Resend)
  components/                 # SpecForm, PricingSection, RfqStatusPoller, Navbar, etc.
  content/blog/               # 15 .mdx SEO posts (sourcing, tariffs, landed cost)
  lib/
    supabase/{client,server,middleware}.ts   # SSR-safe Supabase clients
    stripe.ts                 # Stripe singleton
    blog.ts                   # MDX loading + Category typing
    gtag.ts                   # GA4 / Google Ads event helpers
middleware.ts                 # Calls updateSession; redirects /dashboard if no user
supabase/migrations/          # SQL schema (001–005)
```

## Architecture & Key Data Flow

1. **Customer submits an RFQ** via `SpecForm` → row inserted into `public.rfqs` (RLS-scoped to the user).
2. **Payment / credits:** Checkout route creates a Stripe session; the **stripe-webhook** route (service-role client) updates the user's `plan` and `rfq_credits`. `decrement_credits(uid)` RPC burns a credit when an RFQ is processed.
3. **Processing:** `ProcessRfqButton` → `POST /api/trigger-pipeline`. That route verifies the RFQ belongs to the caller, then **fire-and-forgets** a request to `PIPELINE_API_URL` (`/api/process-rfq`) on the SourcePilot backend, passing the Supabase URL + **service role key** so the backend can write quotes back. It aborts the fetch after 5s on purpose (Vercel's 60s function limit can't wait for the ~90s pipeline).
4. **Results:** SourcePilot writes `quotes` rows; the customer dashboard polls (`RfqStatusPoller`) and renders them on `dashboard/rfq/[id]`.
5. **Manual ops:** `/admin` (password-gated) lets Aaron list in-flight RFQs, paste raw supplier emails for parsing, and mark RFQs complete (which emails the customer via Resend).

## Database Schema (Supabase / Postgres)

Migrations live in `supabase/migrations/` (apply in order 001→005).

- **`users`** — extends `auth.users`. `plan` (`free`/`starter`/`pro`), `rfq_credits` (int), `company_name`. Auto-created on signup by the `handle_new_user` trigger (coalesces email from OAuth metadata).
- **`rfqs`** — `status` (`draft` → `rfqs_sent` → `awaiting_responses` → `complete`), `product_description`, `product_category`, `material`, `quantities int[]`, `destination_country`, `compliance text[]`, `reference_links text[]`, `file_urls text[]`, `is_free bool`.
- **`quotes`** — FK to `rfqs`. `supplier_name/email`, `price_tiers jsonb`, `moq`, `lead_time_days`, `payment_terms`, `sample_available/cost`, `tooling_fee`, `existing_mold`, `fda_compliant`, `landed_cost_estimate jsonb`, `raw_email`.
- **RLS** is enabled on all three. Users only see their own `users`/`rfqs`, and `quotes` only through a join to their own RFQ. Admin and webhook routes deliberately use the **service-role** client to bypass RLS.
- **Plan → credits:** subscription `starter` = 2 credits, `pro` = 10; a one-time `payment` adds 1 credit; subscription cancellation resets to `free`/0.
- **`is_free`:** free RFQs are limited to 5 US suppliers in the pipeline; paid RFQs get up to 15 (US + China) with landed-cost estimates.

## Key Conventions

- **Three Supabase clients, don't mix them:** `lib/supabase/server.ts` (RLS, server components/route handlers), `lib/supabase/client.ts` (browser), and direct `createClient(url, SERVICE_ROLE_KEY)` only in webhook/admin routes that must bypass RLS. Never import the service-role client into anything that reaches the browser bundle.
- **Heavy work goes to the backend, not Vercel.** Anything long-running (AI calls, scraping, parsing) is the SourcePilot FastAPI backend's job. API routes here should stay well under Vercel's 60s function timeout — trigger async, don't block.
- **Server Components by default;** add `'use client'` only for interactivity (forms, pollers, analytics).
- **Money:** Stripe is source of truth; mirror `plan`/`rfq_credits` into `users` via the webhook, never trust the client.
- **Blog posts** are MDX files in `src/content/blog/` with frontmatter (`title`, `slug`, `description`, `publishedAt`, `category`, `keywords`). `category` must be one of the `Category` union in `lib/blog.ts`. Adding a post = adding a file; it auto-appears in the index and sitemap.
- **Auth gating:** `middleware.ts` protects `/dashboard`. Admin is gated separately (see gotcha below).

## Environment Variables

See `.env.local.example`. Key ones:

```
NEXT_PUBLIC_SUPABASE_URL=            # public
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # public
SUPABASE_SERVICE_ROLE_KEY=           # SERVER ONLY — never expose to browser
PIPELINE_API_URL=                    # SourcePilot FastAPI base (local: http://localhost:8000)
NEXT_PUBLIC_ADMIN_PASSWORD=          # gates /admin (see gotcha — this is client-exposed)
RESEND_API_KEY=                      # transactional email
NEXT_PUBLIC_GA4_ID=                  # analytics
NEXT_PUBLIC_GOOGLE_ADS_ID=           # conversion tracking
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=
NEXT_PUBLIC_MANAGED_SOURCING_URL=    # Calendly/mailto CTA
```

Stripe also needs (server-only, not in the example file): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` (and the starter price id used by the checkout flow).

## Known Gotchas

- **The admin gate is weak by design (tech debt).** `NEXT_PUBLIC_ADMIN_PASSWORD` is a `NEXT_PUBLIC_*` var, so it ships to the browser, and admin API routes compare against it with a hardcoded fallback of `justspec2026`. This is fine for a solo internal console but should be replaced with a real server-side secret / role check before exposing admin to anyone else. Don't treat it as secure.
- **Pipeline trigger is fire-and-forget.** `trigger-pipeline` intentionally aborts after 5s and returns `processing`; a failure *after* the request is sent won't surface here. Watch the SourcePilot backend logs to confirm completion.
- **Service-role key crosses the wire.** `trigger-pipeline` sends the Supabase service key in the request body to the backend so it can write quotes. Keep `PIPELINE_API_URL` pointed only at the trusted SourcePilot server.
- **Stripe API version is pinned** (`2026-02-25.clover`). Upgrading the `stripe` package may require bumping this and reviewing webhook payload shapes.
- **Schema is shared with SourcePilot.** Changing `rfqs`/`quotes` columns here can break the backend's reader/writer. Coordinate migrations across both repos.
- **`tsconfig.tsbuildinfo` and `.next/`** are build artifacts — don't hand-edit or commit noise from them.

## Running Locally (Windows / PowerShell)

```powershell
cd $HOME\justspec
npm install
Copy-Item .env.local.example .env.local   # then fill in real values
npm run dev        # http://localhost:3000
```

- `npm run build` / `npm run start` for a production build; `npm run lint` for ESLint.
- For end-to-end RFQ processing, also run the SourcePilot FastAPI backend locally and set `PIPELINE_API_URL=http://localhost:8000`.
- Apply Supabase migrations (`supabase/migrations/*.sql`) in order against your Supabase project before testing auth/RFQ flows.

## Git Workflow

- Commit after each working feature with a descriptive message; keep `main` deployable (Vercel auto-deploys from it).
- Use `feature/<desc>` and `fix/<desc>` branch names.
- Never commit `.env.local`.
