# Saif Fantasy — Web

Browser version of the Saif Fantasy gaming-center management app. Same
Supabase backend as the Android app, same login credentials, same
license keys — this is the `assets/web/` layer from the Flutter app,
served directly as a static site, with a new login/license gate
(`js/18_web_gate.js`) replacing the job `main.dart` does natively.

## ✅ Repo is complete

All 17 original app modules (`js/01_config.js` … `js/17_sync.js`),
`dexie.js`, `supabase.js`, and `bcrypt.js` are copied **unchanged** from
the Flutter app's `assets/web/` folder — none of the app logic knows or
cares whether it's running inside a WebView or a browser tab, so nothing
needed editing there.

## What's actually new here (vs. the Android app)

### `js/18_web_gate.js`
Reimplements, in plain browser JS, what `main.dart` does natively:

- **License activation** — same 3-day period math, same secret salt
  (`GrandDimension2026`), same deterministic key-hash algorithm as the
  app, so a key generated for one is valid on the other in the same
  window. Same anti-reuse/anti-rewind watermark logic, same Supabase
  `license_keys`/`license_key_devices` calls enforcing the 5-devices-
  per-key cap (identical schema/RLS to the app — no database changes
  needed).
- **Login** — calls the same `verifyAppCredential()` already in
  `01_config.js` (bcrypt against the Supabase-synced `app_credentials`
  cache), then hands off to the same
  `window.initializeAuthenticatedSession(username, role)` entry point
  the Android app already calls. Nothing downstream needed to change.
- **Logout** — `03_ui_core.js`'s `logout()` only ever messages
  `FlutterAuthBridge`, which doesn't exist on web. `18_web_gate.js`
  monkey-patches `window.logout` (same convention `14_language.js`
  already uses elsewhere in this codebase) to also hide `#main-app` and
  re-show the gate at the login step after the original logout logic
  runs.
- **Persistence** — `localStorage` instead of `flutter_secure_storage` +
  vault file. This is a **weaker** device fingerprint than the app's
  (clearing browser data resets it) — an inherent web-platform
  limitation, not a bug.

### `style.css` — responsive layout section (bottom of file)
The original CSS is completely mobile-first with zero media queries —
a fixed 480px-max-width single column. Added, purely additive:

- `@media (min-width: 641px)`: the app becomes a centered floating card
  (like WhatsApp Web) instead of a phone-width strip on a laptop
  screen. Fixed-position elements (`.bottom-nav`, modals) re-center to
  align under the card instead of pinning to the true browser edge.
  Mouse-appropriate hover states added.
- `@media (min-width: 1100px)`: slightly wider card for large monitors.
- Per-view/module layout logic is **unchanged** — this is a shell-level
  adaptation, not a redesign of every screen. Deeper per-view desktop
  layouts (e.g. multi-column Finance tables) would be a follow-up if
  wanted.

### `index.html`
- New `#web-gate-overlay` markup (top of `<body>`, above the splash
  screen, z-index above everything).
- Two new `<script>` tags at the end: `bcrypt.js` and `js/18_web_gate.js`,
  loaded last (after `17_sync.js`, so `window.supabaseClient` exists).

## Deployment (GitHub Pages)

1. Push this repo to GitHub.
2. Repo → Settings → Pages → Deploy from branch → `main` (or `/docs` if
   you prefer) → root.
3. No build step — static files, script-tag-only, same as the app's
   `assets/web/` folder.

## Database

Same Supabase project as the Android app — no new tables, no new RLS
policies. The website reads the same `app_credentials`, `license_keys`,
`license_key_devices`, and all 13 app-data tables via the same anon key
already used by `17_sync.js`.

## Testing checklist before going live

- [ ] Load the site fresh (private/incognito window) — should show the
      **License Activation** step first.
- [ ] Enter today's activation key (same one the Android app uses) —
      should move to the **Sign In** step.
- [ ] Log in with an existing password — should reach the app.
- [ ] Confirm the app renders sensibly at a phone width, a tablet
      width, and a full laptop window (resize the browser or use
      DevTools' device toolbar).
- [ ] Log out — should return cleanly to the Sign In step (not a blank
      screen).
- [ ] Activate the same key on a 6th browser/device — should be
      rejected once 5 are registered (check `license_key_devices` in
      the Supabase table editor to confirm).
- [ ] Confirm data (sessions, finance, stock, etc.) syncs correctly
      between the website and the Android app, since both hit the same
      Supabase project.

