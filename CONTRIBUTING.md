# Contributing

Thanks for your interest in contributing to **صاحبك** (Quran Learning Platform)! This guide covers
local setup, the workflow, and conventions.

## Prerequisites
- **Node ≥ 20** and npm
- **Expo Go** (SDK 54) on a phone for dev, or **JDK 17** + Android SDK to build an APK
- A **Supabase** project (free tier is fine) — you run against **your own** backend, not the maintainer's

## 1. Set up your own backend
1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema: run every file in `supabase/migrations/` **in order** against your project
   — via the Supabase SQL editor, or the CLI (`supabase db push` / `supabase migration up`).
3. In **Authentication → Sign In/Providers → Email**, turn **off "Confirm email"** (so test emails
   can sign in without an inbox).
4. Copy `.env.example` → `.env` and fill in your project's URL + anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   > Only the **anon** key goes here (it's client-safe; RLS protects data). Never commit `.env` or put
   > the `service_role` key / a personal access token in the repo.

## 2. Run it
```bash
npm install
npx expo start        # scan the QR with Expo Go
```
Tip: push notifications only deliver in a real build (APK), not in Expo Go.

## 3. Verify before opening a PR
```bash
npx tsc --noEmit                      # types must pass
npx expo export --platform android    # must bundle cleanly
```
CI runs both on every PR.

## Conventions
- **Arabic, full RTL.** No hardcoded user-facing text — all copy lives in `src/i18n/ar.ts` and is read
  via `t("...")`. (Exception: the audio seek bar stays LTR.)
- **TypeScript** everywhere; data access goes through the typed Supabase layer (`src/config/supabase.ts`)
  and **TanStack Query**; UI reads theme colors via `useColors()` (never the static import).
- Keep DB changes as **new migration files** in `supabase/migrations/` (never edit applied ones), with
  RLS policies for any new table.
- **Commits:** one concise, conventional-prefixed line (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## PR workflow
1. Fork → branch off `master` (`feat/...`, `fix/...`).
2. Make the change; keep it focused. Update docs/diagrams if you change structure.
3. Ensure `tsc` + `expo export` pass.
4. Open a PR using the template; describe what/why and how you tested it.

## Where things live
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design, data model, and screen map.

## A charity project — non-commercial only
This app is a **sadaqah (صدقة جارية)**: it exists for good deeds, not money. Under the
[PolyForm Noncommercial License](LICENSE.md), **commercial use is not allowed** — no selling, charging,
paywalls, or advertising/monetization. Please keep contributions in that spirit: free for everyone.
By contributing, you agree your work is released under that same license.
