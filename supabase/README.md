# Supabase (냥냥수첩)

Project: `dvrznqbtjwksthzqxnpq` — https://dvrznqbtjwksthzqxnpq.supabase.co

- `migrations/` deploy automatically via the Supabase GitHub integration when merged to `main`.
- `functions/recognize/` (ticket recognition, Claude `claude-sonnet-5-5`) must be deployed manually (below).

## One-time setup

1. **Enable anonymous sign-ins** — Dashboard → Authentication → Sign In / Providers → *Allow anonymous sign-ins* → ON → Save.
   (Recommended: also enable CAPTCHA / Turnstile under Authentication → Attack Protection to limit anonymous-account abuse.)
2. **Set the Anthropic key as a function secret** (never commit it):
   ```sh
   npx supabase login
   npx supabase link --project-ref dvrznqbtjwksthzqxnpq
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   (or Dashboard → Edge Functions → Secrets → add `ANTHROPIC_API_KEY`.)
3. **Deploy the function** (JWT verification stays on; the app sends the anonymous user's JWT):
   ```sh
   npx supabase functions deploy recognize --project-ref dvrznqbtjwksthzqxnpq
   ```
4. Merge the PR to `main` so the migration runs (tables, RLS, `tickets` storage bucket, signup trigger, `claim_invite`).
   To apply without merging: `npx supabase db push`.

## App config

`.env` (copy from `.env.example`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (publishable key, public).
`EXPO_PUBLIC_USE_LOCAL=1` switches to the on-device `localRepo` (offline/dev). If the function errors, the app falls back to mock recognition.

## TODO
- Account linking for anonymous users (email / Sign in with Apple via `supabase.auth.linkIdentity`). Apple Sign In is required on iOS if other social logins are offered.
