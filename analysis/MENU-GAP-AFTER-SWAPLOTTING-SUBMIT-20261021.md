# Current menu/function gaps after personal Swaplotting submission

This is an offline, read-only audit of the current worktree after the Swaplotting submit deployment. It does not repeat the older 77/84/86/90-enabled snapshots as current requirements. No provider, account, browser, APK, GPS, OTP, camera, API, Docker, test suite, commit or deployment was invoked. Only this new report was written.

## Baseline checked now

- The local Graphify report was read first: `environment/publish/sentuh-tanahmu/.graphify/GRAPH_REPORT.md:1–25`. Its 20 October corpus of105 files/1200 nodes/2857 edges is useful for locating `render`, `api`, private operations and map boundaries; it is not the current runtime inventory.
- Direct import of current `webapp/private/operations.mjs` gives **176 records,92 enabled:74 read and18 write;84 disabled**. Disabled records are not84 missing menu functions: sign-in/refresh already have dedicated handlers, Bhumi has a scoped reader, and several records are duplicate callsites or non-menu internals.
- All **132 authored-runtime paths and SHA256 values** in `analysis/webapp/swaplotting-submit-node-fidelity.json` match the current files. Current `webapp/app.js` SHA256 is `288c974ed11be11e5f929f07486f735ad9c4806536efb747fdf47c94d7f51e30`. This is a source-integrity comparison, not a test rerun.
- The retained latest full suite is **2291/2291**,136 test files; retained browser result15/15 groups and deployment127/127 delivered files are documented by `SWAPLOTTING-SUBMIT-RELEASE-20261021.md`. Those are synthetic/source/deployment evidence with the limits stated there, not whole-APK or genuine-account acceptance.
- Native menu scope is the retained original6.1.5 evidence:29 navigation items, maximum5 primary tabs,7 home services, and170 original audited request shapes (`official-menu-map.json`, `OFFICIAL-MENU-FINDINGS.md:5–21`). Additional catalog records do not imply additional top-level menus.

## Existing functionality that must not be rebuilt from old gap reports

| Native surface | Current implementation evidence | What this proves / does not prove |
|---|---|---|
| Beranda, Laci, seven Layanan, six Informasi entries, five primary tabs and profile menu destinations | `webapp/app.js:53–95`, `162`, `187`, `418`, `420`, `425` | Current entry surface and account-summary menu predicate exist. It does not prove every role or every destination's transaction. |
| Home banners/YouTube, news and announcements | `app.js:40–50`, `168–187`; `assets/home-media/*` | Dedicated lifecycle and rendering exist. No need for another banner-only task. |
| Koleksi Berkas/Bidang, groups, caption edit, move/remove/delete, Berkas/Persil save and map actions | `app.js:253–314`, `330–340`, `353–367`; corresponding enabled catalog writers | These are actual wired workflows, not merely enabled operation flags. `PersilSave` is already integrated. Genuine mutation acceptance remains a separate test. |
| Berkasku/Cari Berkas, detail, parties, SOP/print/SPS/contact and full Perjalanan Berkas destination | `app.js:315–348`, `543–565`; `assets/berkas-journey/*`; `BERKAS-JOURNEY-RELEASE-20261021.md` | Journey mount at324 replaces the fallback section with the dedicated host. The older `berkasJourney` details renderer alone is not evidence that the full destination is absent. Current-account Journey read is still pending per the latest release. |
| Sertipikatku analog/electronic, nested detail/date/document views, Aktaku and Rating PPAT read+submit | `app.js:369–450`, `752–764`; `assets/certificate-date/*`, `assets/rating-ppat/*`; `RATING-PPAT-WRITE-RELEASE-20261021.md` | Rating PPAT final writer is implemented. It must not be confused with the separate missing Berkas rating writer. |
| Scan classifier, document/PBT/KKPR location, document metadata/PDF and map controls | `app.js:479–516`; `webapp/scan-*.js` | Scoped document workflows and maps exist. Identity/kiosk verification QR and Buku Tamu QR are separate workflows. |
| Aktivitas list/categories/delete and typed Berkas/Persil/document/antrian targets | `app.js:451–478`, `599–600` | Delete and detail routing are wired. Empty or non-actionable native activity types do not justify inventing a detail endpoint. |
| Info Layanan detail and six simulation types; Mitra; Kantor map/list and calendar | `app.js:189–215`, `401–417`, `524–541`; `OFFICE-MAP-RELEASE-20261021.md`, `MITRA-READ-RELEASE-20261021.md` | Current feature implementations exist. Recent public live evidence is only57 services, one detail and one Tipe4 simulation (`webapp/post-queue-public-live-summary.json`), not all6 live branches. |
| Sertipikat Hilang list/detail/map/reviews+write and Yuridis | `app.js:766–837`; `assets/lost-certificate/*`, `assets/lost-review/*`, `assets/yuridis/*`; respective release reports | These previously selected gaps have already been implemented; do not select them again from `MENU-COMPLETION-AUDIT` or `CURRENT-MENU-GAP-DELTA`. |
| Personal Swaplotting two forms, map/manual/survey coordinate entry, real retained photo bytes, local review, submit and post-OK Activity chain | `app.js:657–750`; `assets/swaplotting/*`; `private/swaplotting-post.mjs`, `private/swaplotting-submit-session.mjs`; `SWAPLOTTING-SUBMIT-RELEASE-20261021.md` | Personal final writers are now wired. This is not managed-user/instansi parity, legal registration acceptance, or visit-geotag exemption. |
| Login, refresh, own account summary/status, verification methods and initial Daring form/validation | `app.js:108–138`, `218–240`, `419–425`; `private/api-client.mjs:747–764` | Dedicated login/refresh exist even though their generic catalog records are disabled. Daring stops explicitly before OTP/liveness completion. |

The matrix identifies implemented surfaces, not an end-to-end pass for all screens. No original Android session has reached these menus in the retained emulator runs.

## Positive remaining functional gaps

### 1. Berkas-specific actions are absent; inline map remains a separate unresolved binding

Current `berkasDetailView` at **`app.js:341`** renders summary, read supplements, parties, Journey, conditional SPS, contacts, bookmark and a technical preview. It does **not** render or dispatch the native Berkas rating, Tanya Berkas, Bagikan Berkas, or Unduh Berkas actions.

This is a positive native-to-current comparison, not an endpoint-name inference:

- `BERKAS-NESTED-MAP-FOLLOWUP.md:24–36` binds rating child `89aa1c → 8a92e8 → 8a9400`, state build `81befc`, click `81c134 → 81c1b0`, modal builder `81c278 → gBb`, and visible **Berikan Rating untuk Berkas ini**.
- The same report binds **Tanya Berkas** `8a9b80 → 8a9bfc → aBb` carrying selected Berkas ID and number/year, and **Bagikan Berkas** `8a9d68 → 8a9da0 → 8a9f04/8a9f44` with a recipient dialog. Their deeper submit/result contracts remain unclosed by that report.
- `request-contracts.md:122,152,155` retains the request shapes `TanyaJawab/SubmitPertanyaan {berkasid,content}`, `berkas/BagikanBerkas {Berkasid,EmailPenerima}` and `berkas/postratingberkas {Berkasid,rating,userComment}`. Request field names alone do not prove dialog validation, model types, ownership, auth, response semantics or refresh/back behavior.
- Exact catalog records remain disabled: rating **`operations.mjs:3720`**, share **3454**, question **3504**. Current app contains no implementation of those three request paths.
- Native **Unduh Berkas → Unduh Peta** and downloaded/offline variants are positively distinct (`BERKAS-NESTED-MAP-FOLLOWUP.md:37–55`). They have not been reconstructed as an offline download/draft workflow. Generic JSON/PDF download support is not that feature.

The user-observed **map directly in Koleksi/Aktivitas → Berkas detail** is still absent at `app.js:341`. Its native selected-Berkas→request/geometry/camera binding is still unknown. Latest `BERKAS-DRAFT-CALLBACKS-FOLLOWUP-20261021.md:9–21` positively resolves the two previously unknown delegates as local `geotag_drafts.db` restoration and the UAb destination, not a parcel boundary source. Do not repeat the same negative map search or fabricate `berkasId → persilId`, document q, camera point, or polygon. A correlated accepted-device observation or a new positive route/state binding is needed.

### 2. Buku Tamu stops before the native Simpan transaction

- Current `assets/guestbook/view.js:14` permanently disables **Simpan**; `model.js:7` declares the boundary. `app.js:649–656` wires only QR parsing, metadata GET, form editing and local validation. There is no submit adapter.
- Catalog **`post-bukutamu-d99dd8`** is disabled (`operations.mjs:4739`). GET metadata has its dedicated standalone application-authorized profile; reusing the account bearer or Directus profile would be a regression.
- Native `GUESTBOOK-FOLLOWUP.md:5–11` proves own cached-user entry, nine displayed fields, local validation, busy→POST, inverse error bool, then **Terimakasih / Buku Tamu Sudah Terisi / Kembali**.
- `GUESTBOOK-SERVICE-FOLLOWUP.md:9–23,47–77` positively proves the standalone client, fixed `/bukutamu`, application Authorization source, ordered12 fields, no explicit file, and **HTTP200→error false**, other returned status/catch→error true. Lookup `kantorId/unitKerjaId/userId` must come from the QR-bound server context. The shared multipart finalizer now has later positive proof from LOST, but this audit did not newly compose/verify it against this service.
- Final implementation still needs server-owned QR/read context, immutable raw form snapshot, native field/date handoff and result/return proof, scoped single-attempt standalone writer, typed uncertainty handling, tests and real on-site acceptance. It must not manufacture a QR or remote arrival. A QR parser/metadata200 is not proof of a completed visit or visitor-card verification.

### 3. Antrian final create, notifications and additional identities are incomplete

- Current own-applicant→office→location→date→availability→quota→native gate→review exists. **Quota is already enabled and implemented**, so the older “quota disabled” gap is stale.
- Current `app.js:611` supplies `notificationAvailable:()=>false` and a `createBooking` callback that throws `NOTIFICATION_UNAVAILABLE`. `assets/queue/booking-controller.js:12–14,48–73` correctly prevents final confirmation without that dependency. Catalog **`post-api-booking-d8b640`** remains disabled at `operations.mjs:2401`.
- `QUEUE-BOOKING-WIRE-FOLLOWUP-20261021.md:9–41` closes Map→JSON UTF8 and the bounded create response converter; `QUEUE-BOOKING-REVIEW-RELEASE-20261021.md:7–11` states the current production boundary. Real browser notification provisioning is still unavailable. Android key reuse or invented/null/`-` token is not a valid fix.
- Final create ownership/context, result→official detail/list refresh, timeout reconciliation, notification lifecycle/realtime socket, and additional-applicant identity/OTP flows are not current end-to-end features. POST redirect parity/idempotency also remain unproven. These are deeper gaps than the existing non-operational callback scaffolding suggests.

### 4. Account/security/settings and identity completion are partial

`app.js:138` provides only existing-account login. `profileSection` at **425** explicitly says password/identity changes are unavailable and presents browser/session/version information for Settings; this is not the complete native security/settings workflow. Corresponding signup/activation/reset-password/change-password/PIN/change-phone/delete/reset-identity and preference catalog operations remain disabled. Their request shapes are not enough to enable mutations without caller/model/response evidence.

Status and method-choice display are already implemented. Daring initial5-field form and `ValidateKTPDataV2` are already wired (`app.js:229–239`); do not propose the initial form again. The explicit **daring-otp-boundary** at233 stops before WhatsApp OTP, liveness/camera and final verification. Luring and IKD **Mulai Verifikasi** are disabled in223. Native evidence `VERIFICATION-DARING-FORM-FOLLOWUP.md:57–88` and `ACCOUNT-VERIFICATION-FOLLOWUP.md:43–62` separates these actions from passive status reads. Provider/device SDK, identity proof and actual messages cannot be replaced with local success states.

### 5. Non-personal plotting, certificate sharing and specialist request families are not covered

- `assets/swaplotting/view.js:59` and `app.js:747` provide own-profile contacts only. `SWAPLOTTING-OWNER-FOLLOWUP.md:15–61` proves native persisted managed-user schema, selected-user contacts and AddUser/identity boundaries. Those routes/edit/remove/persistence/OTP and authority/delegation are not implemented. Two `PlotBidang/Instansi*` writers remain disabled. Personal submit success is not parity for these variants.
- Certificate sharing, recipient preview, outbox/history/revoke operations (`legacy/BagiSertifikat`, `PratinjauPengguna`, `KotakKeluarSertifikat`, `HapusKotakKeluar`) remain disabled and have no current share/outbox UI in `certificateDetailView`399 or `electronicCertificateDetailView`385. `request-contracts.md:81–82,175–176` proves retained request shapes, not their complete native workflow.
- Specialist survey/road/facility/risk/photo/agricultural and ancillary API request families remain inspect-only. The bounded29-menu map does not prove their role-specific native entry, so they are **unmapped scope**, not a claim of29 extra user-facing menu gaps or an immediate implementation-ready contract.

### 6. Visit geotag is not a completed or interchangeable function

`app.js:100`, `private/http-api.mjs:78,124`, and catalog `post-geotag-uploadgeotag-d96b98` (`operations.mjs:692`) preserve the official-app visit boundary. Local coordinate comparison is local-only; personal Swaplotting accepts an explicitly declared map/measurement coordinate under its separate native plotting contract. Neither is proof of physical presence, device-GPS freshness, a radius exception, or server approval of an unattended visit. The requested all-functions-plus-visit-geotag outcome therefore remains incomplete. No checksum/attestation/GPS/OTP/FCM bypass was inferred or added by this audit.

## Recommended next implementation work

1. **Berkas rating workflow, then Tanya/share as separately proven actions.** This is a substantial gap in the central authenticated Berkas detail and is independent of booking FCM or biometric SDK. First follow `81c278/gBb` through exact inputs, validators, caller→selected Berkas, writer/auth, helper result, feedback and refresh/back. Reuse the newly closed shared multipart evidence only after composing it with this writer; keep the operation disabled until those positive bindings and snapshot/ownership/uncertainty tests exist. Do not substitute Rating PPAT or a generic star widget. This is the best immediate bounded native-audit→implementation candidate.
2. **Finish Buku Tamu for genuine on-site QR use.** Most of the dedicated form and service proof already exists; final submit/feedback/return closes an entire otherwise truncated menu. Freeze source context and final result/UI contracts, add a scoped standalone writer and synthetic transport/browser tests, then leave a real office QR/arrival acceptance check for the user. No GPS or invented remote-arrival feature is needed.
3. **Finish Antrian final create when genuine browser notification provisioning is available.** Existing quota/review and closed wire/model proof make this important, but the current FCM dependency is an external prerequisite. In parallel, close only the remaining native result/notification/lifecycle/redirect/reconciliation contracts; do not turn the hard-false token gate into a fabricated success or spend another increment rebuilding the chooser.

The user-specific inline Berkas map remains high priority but is not yet an implementation-ready coordinate binding. The next useful evidence is a positive accepted-device/state correlation, not another generic vector map, regional WMS panel or guessed identifier.

## Acceptance and external barriers remain separate

- **Authenticated read:** latest deployment report says the preview still showed the login form after reload. A user login reply must be followed immediately by one current-session read-only Journey/Berkas check before any next backend replacement. This audit neither inspected nor invalidated a session.
- **Original APK runtime:** retained API30 run terminates in `libndk_translation` SIGILL; API36 reaches S5 refusal before accepted menus/login (`analysis/runtime/README.md`, `runtime/emulator/api30-observation.json`, `runtime/emulator/api36/observation.json`). No native end-to-end/device pass is available; do not repeat an unchanged blocked emulator as new evidence or bypass refusal.
- **Notifications:** genuine browser FCM configuration/token lifecycle is missing for final Antrian. It is distinct from main-account credentials and quota.
- **Identity/device:** OTP/liveness/IKD/kiosk/face flows and real camera/GNSS/browser permissions need their proper provider/device evidence and user actions. Manual coordinates cannot replace those attestations.
- **Account role/transaction/server/UI:** populated/error/empty/role branches, all original post-login visual comparisons and genuine mutation acceptance are not proved by2291 synthetic tests or a92-enabled catalog. Retained public reads and older account/tile observations have their own dates/builds/limits; they must not be silently promoted to current whole-app acceptance.

This report changes the next action by identifying the remaining **Berkas rating/Tanya/share**, **Buku Tamu submit** and **Antrian create/dependency** workflows against current sources. It does not mark the overall goal achieved.
