<!-- Thanks for contributing! Keep PRs focused and small where possible. -->

## What & why
<!-- What does this change and why? Link any related issue: Closes #123 -->

## How I tested
<!-- Steps you ran. At minimum: -->
- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo export --platform android` bundles cleanly
- [ ] Tried it on a device / Expo Go (describe the flow)

## Checklist
- [ ] No hardcoded user-facing text — strings added to `src/i18n/ar.ts`
- [ ] New DB tables/columns ship as a **new** migration in `supabase/migrations/` with RLS
- [ ] No secrets committed (`.env`, keys, `service_role`, tokens)
- [ ] Docs/diagrams updated if structure changed
- [ ] Commit messages are one-line, conventional (`feat:` / `fix:` / `chore:` …)

## Screenshots / notes
<!-- Optional: screenshots for UI changes, or anything reviewers should know. -->
