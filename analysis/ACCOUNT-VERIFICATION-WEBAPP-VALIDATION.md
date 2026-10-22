# Account verification status: endpoint and owned dialogs

Recorded 2026-10-20. This release corrects the existing account-status read and adds the bounded native message/role dialogs. It does not verify an identity or implement the full Daring, Luring or IKD workflow. The release binding is `webapp/account-verification-summary.json` under this analysis directory.

## Resulting behavior

The fixed main/session `GET account/CheckVerifStatusPerorangan` accepts only its original empty caller input. Its already transformed response must be a direct object with nullable `error:bool`, `message:String` and `data:String`; wrong nonnull field/root types fail, missing fields become null and unrelated fields are discarded. There is no second String-to-JSON decode in this model. A successful transport's `error:true` is preserved and no longer blocks business message dispatch. HTTP failures, authentication, origin/CSRF checks, session ownership and error handling on other operations retain their existing boundaries. The helper does not introduce a new HTTP200-only rule over the shared successful 2xx range.

After an explicit owned status read, the dialogs follow the recovered consumer:

| Exact message | Native gate | Dialog/action |
| --- | --- | --- |
| `-1`, `3` | Before cached role is read | Show the **Metode verifikasi** destination shell. These codes are not verified/unverified claims. |
| `0` | Existing cached sign-in user with nullable integer `userLevel != 2` | Exact processing message and **Ok**. |
| `1` | Same gate | Exact approval/login-again message and **Batal / Logout**. |
| `2` | Same gate | Exact rejection message, newline and `data ?? ''`, with **Batal / Verifikasi**. |
| Other/null | No mapped normal dialog | Browser status information remains neutral. |

An existing user with an absent/null level differs from a missing user. Nonnull malformed levels are not coerced. The gate uses `state.user` restored from the login session, never summary verification status or summary userLevel. The persistent status card and modal title/layout are browser adaptations; the role gate governs automatic normal dialogs, not an invented account authorization rule.

**Logout** is explicit and reuses the existing local web-session logout. The UI states that it ends this webapp session; this is not a claim to reproduce the unaudited deeper Android credential helper. A status read never invokes Logout automatically. **Verifikasi**, `-1` and `3` show Daring/Luring/IKD names with a direction to continue identity verification in Android. They do not initialize child identity, OTP, scanner or submission services, choose a fabricated cached default or claim success.

The response owner captures session epoch, route/navigation sequence and current request. Dialog actions additionally bind the actual current modal element, action stage and clicked descendant. A dismissed/Escape-closed dialog does not reopen through rendering or cached-route revisit. Replaced requests, navigation away and back, logout, replaced modal content and detached controls cannot act on a newer owner. Rendering remains free of dialog side effects.

## Tests and deployment

| Evidence | Result |
| --- | --- |
| Full Node suite | **1,031/1,031 pass**, including 21 new backend and 44 new actual-source UI tests; upstream responses are mocked. |
| Actual-function VM regressions | **1,190 checks / 23 suites pass**. Twenty-two predecessor harnesses are unchanged; a successor to the 25-check verification harness corrects its deliberately obsolete error-flag assertion. |
| Actual browser fixture | **25/25 checks pass**, including the source-stability check. Actual webapp and private API run against injected synthetic transport; no console warning/error. |
| Browser transport receipt | **23 calls**: 16 status reads and seven account-summary reads; one explicit local `/api/logout`. Zero unexpected or pending responses, production/provider requests or identity submissions. |
| Deployed local hashes | **22 frontend and 23 backend files** match. |
| Standalone image | **14 hashes** match without bind mounts and with network disabled. |
| Public HTTPS static assets | **14 hashes** match over normal DNS/TLS; no account or classifier call in this check. |

The browser exercised error true/false/null, processing/approval/rejection, escaped multiline reasons, sign-in level2 suppression, absent sign-in level with contradictory cached summary level2, both method-routing codes, unknown/prototype message, malformed envelope, HTTP503, HTTP401, cancellation/Escape, cached revisit, delayed response after navigation away/back and explicit local Logout. The initial page and fresh desktop pending dialog were observed at 1280×720; most interaction and the approval dialog were at 558×668. The report records these mixed observed sizes rather than labeling every check desktop. Both screenshots contain conspicuous synthetic fixture labels; desktop control select values are uncommitted defaults, while the shown pending dialog comes from the server's applied `pending/error:false` scenario.

The first full run exposed a generic catalog fixture that returned a non-BCb body, plus a writer that still selected the historical verification harness. Those failed results are retained separately. The catalog fixture now returns and asserts a valid strict BCb status envelope, and the current regression writer selects the successor harness. A second run exposed the catalog fixture's generic result assertion, which was also updated to the endpoint's typed output. No production/model guard was relaxed to satisfy these failures. The final runs pass and retain stable inputs.

One Docker recreation applies the changed private API client. The backend remains image-only, public mounts and root filesystem remain read-only, the port stays loopback-bound and Cloudflare routing is unchanged. That recreation ends the old in-memory session. The separate public pre-login preview confirms the current login form is visible and enabled; it is not authenticated acceptance. Subsequent own-account results, if recorded, must have their own source/time/transport binding. Reloading the existing dashboard may automatically read its two anonymous public feeds; those are outside the synthetic fixture's zero-production-call count.

## Evidence and remaining work

The inherited account status and follow-up ledgers remain unchanged. A new independently checked static method-screen supplement resolves Daring/Luring/IKD initial content, assets, cached-login reads and explicit next-widget allocations: see [VERIFICATION-METHODS-FOLLOWUP.md](VERIFICATION-METHODS-FOLLOWUP.md). Its verifier checks **1,597 unique ELF instructions, 70 new pool bindings, 80 markers, ten classes, seven dispatches, ten allocator headers and three image hashes**. These initial screens and deeper identity/scanner/OTP/liveness/IKD child workflows are not implemented by this release. Static allocation evidence is not server or Android runtime acceptance.

The prebatch protects **50 runtime files, 19 native ledgers, 304 historical receipts and the original 170-record request corpus**. Only `webapp/app.js`, `webapp/styles.css` and `webapp/private/api-client.mjs` changed within that runtime inventory. The new tests and successor harness are separate inputs; all protected historical JSON/native hashes remain identical.

The user confirmed the Oppo app is also version **6.1.5**. Version mismatch therefore does not explain the missing inline Berkas map source binding; that remains a separate investigation. Existing emulator and map-provider limits remain open. This release has not been pushed after checkpoint `f2ea136a368f8614960b3b58169acf7e2c3cfd7d`. Complete application/native/OS/server/device parity is unproven. Geotag upload and substitution of document coordinates for required physical-presence evidence remain disabled. The overall goal remains open.
