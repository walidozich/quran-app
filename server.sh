#!/usr/bin/env bash
# Start the local self-hosted Supabase stack and seed demo data.
# Run this once before launching the app (./dev.sh). Idempotent.
set -e
cd "$(dirname "$0")"

echo "→ Starting Supabase (Docker)…"
npx supabase start

DBC="$(docker ps --format '{{.Names}}' | grep -i supabase_db | head -1)"
echo "→ Granting service_role access (needed for seeding; survives restarts but not db reset)…"
docker exec -i "$DBC" psql -U postgres -d postgres -q <<'SQL'
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
SQL

SVC="$(npx supabase status 2>/dev/null | grep -oP '"SERVICE_ROLE_KEY":\s*"\K[^"]+')"
echo "→ Seeding demo users + class…"
SUPABASE_URL=http://127.0.0.1:54321 SERVICE_ROLE_KEY="$SVC" node supabase/seed.mjs

echo
echo "✓ Server ready."
echo "  Studio:  http://127.0.0.1:54323"
echo "  The app reads EXPO_PUBLIC_SUPABASE_URL from .env (currently the PC's LAN IP)."
echo "  Next:  ./dev.sh   (or ./dev.sh --lan once the firewall is open)"
