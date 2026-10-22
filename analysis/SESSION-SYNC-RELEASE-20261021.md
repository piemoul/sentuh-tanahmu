# Session synchronization and genuine Berkas read — 2026-10-21

The frontend now recovers the authoritative same-origin session when another tab logs in or out, or when the user returns to a tab. It also retires private source contexts when the same username obtains a new CSRF token. This resolves a reproduced stale-tab failure mechanism; it does not establish that every previously reported login mismatch had that cause.

## Product change

- `webapp/assets/session-sync.js` coalesces local `GET /api/state` reads on focus, pageshow, visibility and an opaque BroadcastChannel notice. It defers while hidden or while local authentication/bootstrap owns state, aborts stale reads and guards response ownership.
- `webapp/app.js` installs the module, signals completed login/logout rotation, and clears private contexts on critical authentication/account/CSRF change. The same-name rotation check also applies to manual bootstrap. An unchanged session preserves the current form and does not reread the provider profile.
- A typed local `CSRF_REQUIRED`/`CSRF_REJECTED` POST failure schedules local state recovery and reports that the original request was not sent upstream. It does not replay the login, upload or other POST. The user retains control of a subsequent submission.
- Broadcast notices contain only protocol type, version and an opaque event nonce. Credentials, tokens, account details and CSRF values are neither broadcast nor persisted. No polling interval, longer expiry, weaker origin check or backend change was introduced.

## Verification scope

The source-pinned full Node run passed **2,335/2,335** tests across **138** test files, with zero failures, cancellations, skips or todo cases. The 44 added cases cover the module and its actual app integration, including revoked responses, same-user cookie rotation, manual bootstrap, unchanged drafts, local CSRF recovery without replay, and stale profile failures. All 208 historical test/helper sources remain byte-identical.

Evidence: [`session-sync-node-final.json`](webapp/session-sync-node-final.json), its [TAP](webapp/session-sync-node-final.tap), and [`verify_session_sync_runtime.mjs`](rea/verify_session_sync_runtime.mjs). The authored runtime changes from 132 to 133 files: only the existing `app.js` changes, and one public module is added. All backend and catalog bytes remain identical; the catalog still has 176 operations, 92 enabled (74 reads and 18 writes).

The two-tab browser run uses the actual app, HTTP handler, SessionStore, registry and shared HttpOnly cookie, with explicitly synthetic sign-in/profile transports. It observes login/logout propagation, same-name cookie rotation, unchanged raw form values and local points, typed CSRF rejection with only state recovery, revoked old state, late profile 401, idle expiry and a 390-pixel receiving tab. The browser run does not test preservation of an open submission dialog; those ownership cases have focused automated coverage.

The fixture was stopped through its visible control and both temporary tabs were closed. The retained transport reports no pending holds or unexpected requests. A subsequent process-handle poll reported the handle missing, and Windows reported no listener on port 4224. Its fixed server clock and synthetic transports are test adaptations, not Android or current provider acceptance.

Raw evidence: [`session-sync-browser-transport-fidelity.json`](webapp/session-sync-browser-transport-fidelity.json). Screenshots: [desktop synthetic account](webapp/session-sync-account-synthetic.png), [mobile synthetic account](webapp/session-sync-mobile-synthetic.png). The label `mobile-login-source` was recorded on the 1280-pixel source tab; the receiving tab and its account screen were actually 390 pixels wide. No hardware permission was granted.

The bounded [browser outcome verifier](rea/verify_session_sync_browser_outcomes.mjs) passed **10/10 groups: nine functional scenarios and one integrity group**. Its [summary](webapp/session-sync-browser-summary-final.json) selects 43 retained DOM observations against 45 aggregate local HTTP requests and 19 synthetic upstream calls (six sign-ins and 13 profile reads). No original provider request, production mutation, JavaScript error, CSP violation or image failure was observed. HTTP rows are aggregate across both tabs; the verifier does not invent exclusive per-tab request attribution. Hardware attempts were not separately instrumented; the fixture's Permissions-Policy denies grants, and the exercised controls do not invoke hardware APIs.

## Genuine account check

After the user's latest login, the primary HTTPS preview visibly displayed an authenticated account. The following read-only checks then completed:

1. Berkasku → Dalam proses returned an empty list.
2. Berkasku → Selesai returned an empty list.
3. Koleksi → Berkas displayed its empty state.
4. Aktivitas contained existing Berkas entries. Opening one existing entry loaded its actual detail; **Lihat Perjalanan Berkas** displayed eight rows, seven previous and one current.
5. **Kembali ke detail berkas** restored the detail and its journey button. The dialog was closed, the preview returned to Profil, and a deliberate reload of the latest frontend retained authentication without another sign-in.

The sanitized [live DOM receipt](webapp/session-sync-live-read-20261021.json) omits account identifiers, selected document number and private detail values. The [local journey screenshot](webapp/session-sync-live-journey.png) contains the selected document's display number and is private QA material, not a publication artifact. No rating, collection save/delete, activity creation/deletion, document upload, geotag or booking action was performed by this check. Read-only provider operations may use POST as their native HTTP method.

This is genuine browser/account evidence for the inspected read path. It does not prove all records, every menu, mutations or Android device behavior.

## Delivery

Delivery uses the existing read-only frontend bind mounts. The backend is deliberately kept in the already running container; this frontend fix does not require rebuilding or replacing that process. The delivery verifier checks 128 delivered files (85 public and 43 backend), exact localhost/HTTPS static hashes, and unchanged container identity, image, start time, security settings and mounts against the preceding Swaplotting deployment.

The [delivery receipt](webapp/session-sync-delivery-final.json) passed: **128/128 container files, 85/85 localhost public files and 85/85 HTTPS public files** match the source. The same serving container, image and start time survived the check; its read-only root, loopback binding, dropped capabilities, no-new-privileges and 13 read-only mounts remain unchanged. The verifier made zero application API/provider requests and performed zero builds, restarts, recreations or retags. It checks live bind delivery, not a rebuilt standalone image.

## Remaining full-goal gates

The complete application-parity goal remains active. The current [menu audit](MENU-GAP-AFTER-SWAPLOTTING-SUBMIT-20261021.md) records remaining Berkas Rating, final Buku Tamu, genuine FCM-backed final booking and selected-Berkas map-binding work. The newly closed [native Berkas Rating contract](BERKAS-RATING-FOLLOWUP-20261021.md) is static evidence for a future implementation; its writer remains disabled.

The [geotag contract recheck](GEOTAG-REMOTE-CONTRACT-RECHECK-20261021.md) establishes the native device-to-pin distance check of at most 10 metres and finds no declared survey/manual/GNSS remote mode in its six-field upload contract. Server-side enforcement and accepted current behavior are not established. Personal Swaplotting and local survey-coordinate comparison are separate flows and do not prove a waiver of the visit requirement. No remote geotag acceptance, spoofed presence or integrity bypass is claimed.

The unavailable genuine Android device acceptance, remaining writers and inline map binding cannot be replaced by this successful session/browser/read test. This release is concrete progress, not full-goal completion.
