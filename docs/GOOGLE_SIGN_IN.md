# Google workspace sign-in

The browser uses Google OAuth through Supabase Auth, with PKCE and server-managed HttpOnly/Secure/SameSite=Lax cookies. The Worker validates the current user through Supabase `getUser()` and permits only the configured `ALLOWED_LOGIN_EMAIL` with a confirmed email and Google identity. It never authorizes using editable `user_metadata`.

The operator requested `dgeorgenyc@gmail.com` as the sole authorized Google account. Signing in successfully with a different account does not grant access to the workspace, database or files. Existing private-workspace database policies still apply behind the Worker. Individual workspace memberships remain a future build step.

Machine integrations continue to use `CASEVAULT_API_TOKEN`. That token no longer creates a browser session: `/api/session` returns 410. Old `cv2_session` cookies are no longer accepted. Google callback failures grant no access, and browser mutations still require an exact matching Origin. Sign out uses a POST route and revokes the local Supabase session.

## Provider configuration

Google Cloud requires a Web application OAuth client for CaseVault 2:

- Authorized origin: `https://casevault-2.dan-2eb.workers.dev`
- Authorized redirect URI: `https://lrollxodgqswpylzulpu.supabase.co/auth/v1/callback`
- Requested scopes: `openid email profile`; no Drive access is requested by workspace login.

Store the Google client ID and secret in the Supabase Google provider settings. The secret does not belong in the browser bundle, Worker vars, or GitHub. Keep nonce checks enabled and require an email.

Supabase URL Configuration must allow `https://casevault-2.dan-2eb.workers.dev/auth/callback`. Preserve any existing redirects needed by other applications sharing this Supabase project. The sign-in start route passes this exact callback; the callback redirects only to the workspace root, never a caller-provided URL.

Dependencies: `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.2, pinned with the lockfile. Supabase cookie refresh headers are propagated and private responses are not cacheable. Sessions are refreshed and checked on each authenticated browser request; the old fixed eight-hour service-key session is retired.

References: [Supabase Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google), [server-side auth client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
