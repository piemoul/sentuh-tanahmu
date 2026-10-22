# Native verification method instruction screens

Recorded 2026-10-20. The release summary is `webapp/verification-methods-summary.json` under this analysis directory. This adds the initial Daring/Luring/IKD screens and explicit local selection. It does not implement identity validation, OTP, scanning, liveness or verification submission.

## Implemented scope

The method destination now presents Daring, Luring and IKD in native order. No initial choice is invented: the APK's cached static selection initializer remains unbound. An explicit choice shows the original public illustration and exact native text. Daring has two warnings about e-KTP/account linkage; Luring has all seven numbered APS/e-KTP/QR instructions; IKD has both Dukcapil account prerequisites.

The three illustrations match the APK bytes. The original `ikd.png` actually contains WebP VP8L bytes; the web copy uses `.webp` and is served as `image/webp`. The APS image follows the recovered viewport-height quarter. Other image caps, group buttons, headings, modal layout and explicit initial choice are browser adaptations. **Mulai Verifikasi** retains its native label but is disabled with a visible direction to continue identity verification in Android. Local selection performs no API or identity action.

Session/route/navigation/request/response/modal ownership is inherited from the account-status release. Method selection additionally requires the current method stage, exact current descendant target and an integer index0..2. Repeating a selection preserves its node; changing it restores focus to the replacement choice. Stale, detached, replaced, wrong-stage or invalid actions cannot alter a new dialog. Closing/Escape and a fresh explicit read retire the selection rather than fabricate the native cached default.

## Verification

| Evidence | Result and boundary |
| --- | --- |
| Full Node suite | **1,070/1,070 pass**, including 39 new method tests and the existing44 account tests. Only two obsolete one-button chooser expectations changed. |
| VM regressions | **1,190 checks / 23 suites pass**. A successor verification harness supplies the new helper dependencies; the other22 predecessor harnesses are unchanged. |
| Independent bounded review | Eight checks / five actual-function VM groups, eleven initially stable inputs, no material findings. Reviewer authored the separate Berkas proof, not the method ledger, runtime or tests. |
| Final browser fixture | **25/25 pass**, fourteen start/end source hashes stable, no console warnings/errors. Actual webapp/private API with injected synthetic responses. |
| Local/container | **25 frontend and23 backend hashes** match; same backend container retained. |
| Standalone image | **17 hashes** match, no mounts, network disabled. |
| Public HTTPS static assets | **17 hashes** match over normal DNS/TLS; no account/classifier/provider request. |

The public proof fixture for Node tests contains only fixed native copy, asset provenance and pinned ledger/artifact/pool hashes. Its one-time exporter independently checks the frozen ledger and original/public asset bytes. New tests need no unpacked APK or private analysis directory. The worker also ran the focused83 cases with filesystem access to analysis/unpacked paths blocked. Six static GET/HEAD requests in the new suite use a temporary loopback server and zero business transport.

The browser checks all three screens, exact copy/order, image decoding/dimensions, keyboard choice, focus, repeated choices without extra business requests, disabled deeper identity actions, closing/Escape/reopening, both method-routing codes and the rejected-status Verifikasi entry. The final validated run makes six synthetic calls. The complete fixture receipt includes fifteen calls across draft/setup/final observations: nine status reads and six account-summary reads, all complete; zero unexpected/pending or identity/provider/production calls.

Only **1280×720** was available for the new screens. A draft assertion assumed558px and was excluded after the DOM showed1280px. The browser capabilities exposed no viewport resize. Previous mobile status/contact checks do not establish mobile acceptance for these newly added screens; that remains open.

Visual inspection found white selected text on a pale background after a repeated click left the pointer hovering over the same choice. The selected rule now also wins the secondary-button hover rule. The actual repeated-hover foreground/background yield contrast **7.457:1**. The earlier source-bound tests/browser/screenshot are retained; the final full suites and25 browser checks were rerun after the correction. The independent review predates this one logical CSS rule change and Windows LF-to-CRLF serialization. A separate delta receipt proves that normalizing line endings and reversing the rule exactly recovers its reviewed stylesheet, with every other review input unchanged. A browser evidence-helper draft retained its prior object; final assertions were rerun with an explicit report argument and the tool note is retained.

The first17-way public static probe timed out on `scan-controller.js` before it wrote individual results. Its other outcomes remain unknown. A recorded second probe limits concurrency to4, retains every result and allows one retry only for curl timeout28. All17 final hashes match; no origin override, TLS weakening, tunnel change or container restart was used.

## Deployment and remaining work

Existing read-only app/style/public-assets mounts apply the change. The standalone image was rebuilt for future starts, but the running backend was not recreated and its session store remains intact. The main preview was left untouched while the prior login question remains pending. Current-source own-account acceptance is not claimed. The catalog remains176 operations /76 enabled; geotag upload remains disabled.

Two new static supplements are independently verified:

- [Daring form](VERIFICATION-DARING-FORM-FOLLOWUP.md): 4,367 instructions bind the next five-field identity form, its explicit ValidateKTPDataV2 action and OTP/liveness boundaries. This is future implementation evidence, not an action executed by this release. The year2008 value initializes a date picker; it does not establish an age18 upper bound.
- [Berkas synchronous child](BERKAS-INLINE-SOURCE-FOLLOWUP.md): 892 instructions resolve a journey-summary selector that already matches the browser. It supplies no map geometry/source ID. The same installed version6.1.5 and the user's direct-map observation remain valid; no invented Berkas-to-parcel mapping was added.

The prebatch protects50 runtime files,20 native ledgers,317 historical receipts and the original170-record corpus. Only app.js/styles.css differ within its runtime inventory; all protected evidence remains unchanged. A metadata mistake in the prior baseline's predecessor field is documented without rewriting that baseline; this baseline correctly binds the prior account release.

This batch is not pushed after checkpoint `f2ea136a368f8614960b3b58169acf7e2c3cfd7d`. Full native/default/OS/mobile/server/hardware parity and the complete application remain unverified. Required physical-presence evidence is not replaced with document coordinates. The overall goal remains open.
