# Berkas Rating workflow — 2026-10-21

The web client now implements the original 6.1.5 **Berikan Rating untuk Berkas ini** workflow from a selected eligible **Berkasku** row. This is the Berkas-specific rating, separate from Rating PPAT and application reviews. No production rating was submitted during implementation or testing.

## Native contract and corrected eligibility

The retained [main native audit](BERKAS-RATING-FOLLOWUP-20261021.md), [catch refinement](recovered/berkas-rating-followup/catch-followup.json), and additive [entry correction](BERKAS-RATING-ENTRY-REFINEMENT-20261021.md) must be read together. The earlier main note misidentified `MAb+2f` as a rating gate. The independent correction proves that this is `isPPAT`; the eligibility chain is original-row `readyToRating` → `EAb+43` → `MAb+33`. Only exact true exposes the rating entry. Missing, null, false and a string `"true"` do not. An eligible PPAT row is not suppressed merely because `isPPAT` is true. The original evidence files remain unchanged.

The inspected native workflow has five tappable integer stars, an initially empty comment, native whitespace trimming and a nonempty-comment/positive-rating gate. It submits three ordered multipart fields, **`Berkasid`, `rating`, `userComment`**, to the fixed main-service `POST berkas/postratingberkas`. The identifier is the original selected list identifier, not a displayed number, document code, collection ID or manually supplied ID.

The service model requires typed error/message fields, with missing/null error defaulting to true and message to `Terjadi kesalahan`; an empty string is retained. The controller exception branch uses error false with `Terjadi kesalahan saat mengirimkan Rating Berkas`. That native false value does not establish acceptance. The browser preserves the native feedback text but separately warns when delivery is unknown. Only a valid received error-false service response starts the forced completed-Berkasku read. It does not await that read before the nominal 300 ms feedback transition. The original evidence does not identify the final named navigation destination beyond the inspected parent pop.

All three native verifiers passed again against the retained APK ELF/pool. This is static native evidence; no original Android session or current provider acceptance was obtained by these checks.

## Product implementation

- `assets/berkas-rating/{model,controller,view,host}.js` implement the native form, busy state, cancellation and typed received/unknown/not-sent handling. The host uses the existing modal and preserves the exact retained detail DOM nodes when returning. It does not receive raw IDs, source tokens, credentials, storage access or its own transport.
- `app.js` mounts the entry only from the original currently owned Berkasku list/detail chain, retires it on navigation/session/source changes, restores the Journey destination on cancellation or received rejection, and owns the result delay and completed-list refresh. It does not expose this writer from Koleksi, Aktivitas or arbitrary search results.
- `private/berkas-rating-session.mjs` binds an opaque list source and detail context to the same authenticated session, current original eligible row and original ID. The HTTP writer accepts only context, integer rating and comment. A typed local expired source can fall back to the ordinary primary **read** without rating metadata, so it cannot prevent opening read-only detail. This is not a writer retry.
- `private/berkas-rating-post.mjs` and the fixed ApiClient profile encode the native multipart bytes and decode the bounded typed service response. Raw UTF-8 and embedded LF are preserved after native trimming. No caller-controlled destination, authorization, extra fields, query, file or raw ID can enter this writer.
- Ready contexts expire after 120 seconds and are bounded; pending, accepted and unknown attempts are guarded per original ID for the session lifetime. A new context or list refresh cannot replay an accepted/unknown submission. A complete received error-true response permits a new explicit user attempt. No automatic POST replay occurs. These are documented browser adaptations, not claims about server idempotency.

The catalog remains 176 records and now enables **93 operations: 74 reads and 19 writes**. Only the Berkas Rating record changed. Visit geotag and final Antrian create remain disabled under their existing prerequisites.

## Automated verification

The source-pinned [full Node receipt](webapp/berkas-rating-node-final.json) and [TAP](webapp/berkas-rating-node-final.tap) pass **2,423/2,423 tests**, across **144 test files**, with zero failures, cancellations, skips or todo cases. The new coverage consists of 34 backend and 54 form/host/actual-app cases. It includes original-row ownership, PPAT eligibility, exact payloads, nullable/invalid responses, unknown delivery, explicit retry, expired contexts, real retained DOM identity, 300 ms ownership, nonawaited refresh, navigation and late authentication failures.

The runtime inventory changes from 133 to **139 authored files**: six new modules and seven bounded existing-file changes. The [verifier](rea/verify_berkas_rating_runtime_20261021.mjs) checks 900 input pins before/after, 127 JavaScript syntax checks, read-only generator replay and the exact single-record catalog delta. Docker source/security configuration is unchanged.

Twenty-one historical test files needed exact catalog-count/ID expectations and their corresponding source-bound fixture updates. The [migration receipt](webapp/berkas-rating-catalog-test-migration.json) records **57 exact contexts**, no removed test definitions and assertion count 2,344 → 2,365; 191 historical test/helper sources remain byte-identical. The migration replay is checked against retained preimages. The focused retry passed 402/402. Initial failed runs and their corrections remain retained rather than overwritten.

## Browser verification

The actual app, modules, HTTP handler, SessionStore, registry, scoped ownership chain and ApiClient were exercised in the browser with fixed synthetic accounts and an injected upstream. The upstream parser independently checks the three ordered multipart fields and comment UTF-8/LF bytes. This test does not contact BPN or submit a real rating.

The raw [browser transport receipt](webapp/berkas-rating-browser-transport-final.json) records 140 DOM observations, including deliberate labelled results after the 100-edge automatic observer limit. Later settled eligibility observations supersede an early isPPAT observation captured before the rating entry had mounted. Closed modals can retain hidden detail/result nodes; node presence alone is not a claim of visibility.

Desktop and 390-pixel mobile cases exercise initial stars, cancellation, pending double-click/Escape lock, normal acceptance with a still-held completed-list response, literal markup rejection and explicit retry, malformed/timeout/non-2xx/header-oversize unknown outcomes, local replay rejection, missing defaults, empty message, context expiry and cancellation, expired-source read fallback, stale detail navigation and a late 401 after synthetic session rotation. The oversize mode proves the declared-length guard, not streamed-body exhaustion. Actual browser DOM timestamps, not queued server observation arrival, measure the feedback delay.

Synthetic screenshots: [mobile form](webapp/berkas-rating-mobile.jpg), [desktop accepted result](webapp/berkas-rating-success-desktop.jpg). The browser returned JPEG bytes despite the initial `.png` filenames; those original files remain retained, with byte-identical copies under the correct `.jpg` extension. No private user-account screenshot is needed for this feature.

The fixture was stopped through its visible control; both temporary tabs were closed and the viewport override reset. Its receipt reports the listener closed, no pending holds and no unexpected requests. The process handle subsequently no longer existed, and Windows reported no listener on port 4225. The final session cleanup is expected to clear the fixture accounts.

The authoritative [browser outcome summary](webapp/berkas-rating-browser-summary-final-delivery.json) passes **17/17 checks: 15 functional outcomes, one quiet/layout check and one shutdown check**. It binds 140 DOM observations to 122 local HTTP requests and 111 synthetic upstream calls, including ten rating handoffs and two completed-list reads. JavaScript errors, unhandled rejections, CSP violations, image failures and injected event attributes are all zero. The first browser-summary attempt failed only because its image-format assertion expected PNG while the captured bytes were JPEG. That failure, the first passing retry and their verifier preimages remain retained; the final delivery summary handles the actual JPEG format and publishes the explicit compatibility counters required by delivery validation.

## Docker and HTTPS delivery

Root built the frozen Docker image once. The [isolated image proof](webapp/berkas-rating-image-final.json) matched **134/134 delivered files** while the predecessor backend continued serving. Its probe overrides the image entrypoint with a file hasher under user `node`, read-only root, no network, no bind mounts or published ports, dropped capabilities and no-new-privileges. It does not start the application or access APK-derived configuration.

Root then performed one `docker compose up -d --no-build --wait --wait-timeout 60 webapp` with the existing public origin. The [deployment proof](webapp/berkas-rating-deployment-final.json) confirms the new image, **134/134 container files**, **89/89 localhost public files**, **89/89 HTTPS public files**, and healthy localhost/HTTPS endpoints. Sanitized Docker events in the interval after the image proof show exactly one replacement created/started and only the predecessor destroyed. The 13 read-only mounts, read-only root, loopback port publication, dropped capabilities, no-new-privileges and non-root user are preserved.

The delivery verifier performs no build/restart/recreate itself, makes no application API/provider request, and does not read environment variables or credentials. Root's one backend replacement clears the in-memory sessions. The main HTTPS preview was returned to the account page, deliberately reloaded, observed with an enabled login form and marked for handoff. The user subsequently logged in on this build. No current real-account rating acceptance is claimed.

## Genuine authenticated read on this build

After the user's new login, the current preview visibly showed an authenticated account with no login form. The [sanitized DOM receipt](webapp/berkas-rating-live-read-20261021.json) records the following actual reads, separately from the synthetic Rating tests:

1. Berkasku → Dalam proses returned four rendered items; Berkasku → Selesai also returned four. This is the observed result for each tab, not a claim that the two results are disjoint or that every server status is complete.
2. One selected Dalam proses item opened its actual primary detail and successfully loaded SOP, print status and SPS. All three retry buttons were hidden after loading; no visible supplement error appeared. Their hidden button text is not evidence of failure. The selected detail did not expose a Rating entry.
3. Its dedicated Perjalanan Berkas destination displayed the actual empty state **Belum ada aktivitas**. Returning restored the detail and Journey button.
4. Aktivitas → Berkas rendered 18 existing entries. One existing entry opened its actual detail and full Journey destination, which displayed **eight rows: seven past, one current**. Returning restored the detail, and the dialog was closed.
5. The preview returned to Profil and remained authenticated with no open dialog. No further backend restart or deliberate reload was performed after this login.

The retained receipt omits raw account/document identifiers and private detail values. It does not establish eligibility for other records or current provider acceptance of the writer. No real rating, mutation, document, coordinates or identity transaction was submitted. The preview is marked for continuing work with the current login.

## Full-goal status

This release is progress toward the full parity goal, not proof that every function works against the official service. The genuine read-only Journey check retained in [the preceding release](SESSION-SYNC-RELEASE-20261021.md) remains separate evidence. No production rating, collection mutation, upload, coordinate submission, booking, OTP, identity or hardware action was performed in this feature test.

Remaining work includes native Tanya/Bagikan/Unduh Berkas, the selected-Berkas inline-map binding, Buku Tamu final submit, genuine browser notification provisioning for final Antrian, account/identity completion, non-personal plotting and other role-specific workflows. The previous [menu audit](MENU-GAP-AFTER-SWAPLOTTING-SUBMIT-20261021.md) is historical: its missing-Rating and pending-Journey-read statements are superseded by this release and the session-sync release respectively; its other gaps are not thereby closed.

The [visit-geotag contract recheck](GEOTAG-REMOTE-CONTRACT-RECHECK-20261021.md) still finds a native device-to-pin proximity requirement and no declared remote survey/GNSS waiver. This release does not fake presence, bypass proximity/integrity controls or establish remote geotag acceptance. Personal Swaplotting and local coordinate comparison remain separate functions. Original-device execution and current production mutation acceptance remain unverified.
