# Security Policy

## Reporting a vulnerability
**Please do not open a public issue for security problems.**

Report privately via GitHub's **"Report a vulnerability"** (the repository's **Security** tab →
Advisories), or email the maintainer at **cherchalimohamedwalid@gmail.com**.

Include: a description, steps to reproduce, affected version/commit, and any relevant logs. We aim to
acknowledge reports within a few days and will coordinate a fix and disclosure with you.

## Scope notes for this project
- The Supabase **anon key** (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) is a client key and is safe to ship in
  the app — data is protected by **Row Level Security (RLS)**. Report any query/policy that returns
  data a user shouldn't see (an RLS gap) as a vulnerability.
- The **`service_role` key** and any **personal access token** must never appear in the repo, the
  client bundle, or logs. If you find one committed, treat it as a vulnerability and report it.
- `.env`, `.mcp.json`, `google-services.json`, and keystores are gitignored — never commit them.
