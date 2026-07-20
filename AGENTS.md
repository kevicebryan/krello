<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Krello — Agent Guide

Gamified Trello-style kanban (lists, cards, categories, points/streak, redeem). Product details live in `Krello PRD Kanban Gamifikasi Desain.md`. Follow the PRD phases; don't skip ahead unless asked.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript in `src/` |
| UI | MantineUI (`@mantine/core`, `@mantine/hooks`) + Tabler icons |
| Data / BaaS | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Server state | TanStack Query |
| Forms | TanStack Form + Zod |
| Drag-and-drop | `@dnd-kit` (core / sortable / utilities) |

## Project layout

- `src/app/` — routes, layouts
- `src/components/` — UI components
- `src/providers/` — Mantine + QueryClient providers
- `src/lib/supabase/` — browser (`client.ts`) and server (`server.ts`) clients
- `src/theme.ts` — Mantine theme (primary: light blue)

## Conventions

### Supabase & secrets
- Use **Project URL** + **publishable key** only in the browser/SSR clients.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Never commit real keys. Copy `.env.example` → `.env.local`. Never use `service_role` in client code.
- Prefer `@/lib/supabase/client` in Client Components and `@/lib/supabase/server` in Server Components / Route Handlers.
- Enable RLS on every public table; policies must match the real access model.

### UI (Mantine)
- Wrap UI through existing `AppProviders` / `MantineProvider`. Don't add a second provider tree.
- Support light **and** dark mode; use `ColorSchemeToggle` patterns already in the repo.
- Prefer Mantine components over custom CSS. Theme overrides go in `src/theme.ts`.
- Design direction (later phases): glassmorphism + soft pastel gradients; rounded corners; light-blue CTAs. Avoid generic purple-gradient AI look.

### Data & forms
- Fetch/mutate remote data with TanStack Query — not ad-hoc `useEffect` + `fetch` for Supabase reads.
- Validate forms with Zod schemas; wire them through TanStack Form.
- Keep query keys stable and colocated near the feature that uses them.

### Kanban DnD
- Use `@dnd-kit` for moving cards between lists. Persist list/position changes via Supabase + Query invalidation/optimistic updates.

### Next.js / React
- Default to Server Components; add `"use client"` only when needed (hooks, DnD, Mantine interactive bits).
- Path alias: `@/*` → `src/*`.
- Match existing file style; don't add drive-by refactors or unsolicited docs.

## Out of scope unless asked
- Committing, pushing, or deploying
- Database schema / migrations (Fase 2+) before Fase 1 setup is confirmed
- Service-role keys, or putting secrets in tracked files
