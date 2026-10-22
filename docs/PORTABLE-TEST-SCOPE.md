# Portable source test scope

`npm run test:portable` runs an explicitly narrower subset of the unchanged local artifact-backed tests. All 149 `.test.mjs` files are published. The runner includes 147 files and excludes 19 exact named callbacks in those files. Two whole-file exclusions omit another 13 callbacks, including implementation checks. This is not a claim that all implementation tests run in a source-only checkout, nor a repeat of the full local 2,520-test native-evidence suite.

The machine-readable [PORTABLE-TEST-SCOPE.json](PORTABLE-TEST-SCOPE.json) is the runner's exclusion source. The runner verifies inventory and exact callback declarations before starting Node. It does not alter tests or product code, fabricate substitute evidence, or copy private APK artifacts, recovered output, historical preimages, and local runtime logs into the publication. An assertion mixing evidence and implementation is omitted as one complete callback; its implementation assertions are not counted as covered. Node v24.21.0 filters the 19 named callbacks without emitting Node SKIP records; the 13 callbacks in unloaded files are also absent from the execution total.

The public `analysis/request-contracts.json`, synthetic fixtures, shipped formatter vendors, and `analysis/rea/review*.mjs` source harnesses remain available. Their dependent tests remain included unless explicitly listed below. Missing-artifact configuration behavior remains tested. Browser/manual acceptance and real provider behavior are outside this command's scope.

## Whole files excluded at module initialization

### `webapp/tests/certificate-date-display.test.mjs` (5 callbacks)

Reads a private historical app preimage at module initialization, before callback filtering. This also omits four implementation checks.

Dependency: `environment/certificate-date-runtime/app-before.js`.

- three analog fields render Indonesian dates and keep year9999 without electronic sentinel
- invalid, missing, null and offset date strings render a dash in analog date fields
- loose parse is still strict about a valid calendar date and uses the recovered pattern order
- no type coercion or HTML input reaches certificate display
- analog date callsites retain their formatter and unrelated date renderers stay unchanged

### `webapp/tests/swaplotting-model.test.mjs` (8 callbacks)

Reads recovered APK form copy at module initialization, before callback filtering. This also omits seven other model checks.

Dependency: `analysis/recovered/swaplotting-followup/public-copy.json`.

- public form copy and literal choice order match the independently frozen APK fixture
- all three reads match the actual public catalog rather than synthesized endpoint metadata
- disclaimer is direct nullable text, with only one conditional JSON String decode
- full office typing precedes two-field projection and preserves IDs, ordering and duplicates
- desa picks WilayahId and validates all Cyb fields without Kode substitution
- own candidate is exclusively the level2/3 non-IKD account-summary contact projection
- registered nine and unregistered fourteen predicates are raw nonempty/non-null only
- camera retains fractional zoom; browser URL policy never turns arbitrary text into navigation

## Exact callbacks excluded in retained files

1. `webapp/tests/berkas-journey-integration.test.mjs` — **legacy detail/collapsed renderers remain byte-identical to the preserved preimage**. Historical renderer/preimage comparison. Dependencies: `environment/berkas-journey-runtime/app-before.js`, `analysis/webapp/berkas-journey-baseline.json`.

2. `webapp/tests/berkas-journey-time-display.test.mjs` — **the new library differs only by names and HH:mm output; existing patterns/order stay exact**. Private Dart oracle source comparison; actual shipped formatter cases remain included. Dependencies: `environment/certificate-date-oracle/lib/native_journey_time.dart`, `environment/certificate-date-oracle/lib/native_certificate_date.dart`, `environment/certificate-date-oracle/web/journey_time_main.dart`, `environment/certificate-date-oracle/web/main.dart`, `environment/certificate-date-oracle/bin/journey_time_oracle.dart`, `environment/certificate-date-oracle/bin/oracle.dart`.

3. `webapp/tests/berkas-rating-post.test.mjs` — **Berkas Rating catalog record and later Buku Tamu delta remain exact; rawclientIDs stay unavailable**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/berkas-rating-runtime-baseline.json`.

4. `webapp/tests/collection-save-activity.test.mjs` — **save/activity batch keeps original corpus, six prior ledgers and 225 historical JSON byte-identical**. Baseline references omitted recovered ledgers and historical local JSON receipts. Dependencies: `analysis/webapp/collection-save-activity-baseline.json`, `baseline-referenced private native ledgers and historical JSON receipts`.

5. `webapp/tests/collection-save-persil-ui.test.mjs` — **native canonical ledger remains pinned and staged UI imports no transport or document surface**. Recovered ledger hash and implementation source assertions share one callback. Dependencies: `analysis/recovered/collection-save-persil/flow.json`.

6. `webapp/tests/operations.test.mjs` — **170 audited shapes plus the separate SPS viewer, two group DELETE and three item helpers remain distinct, immutable and explicit about readiness**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/yuridis-runtime-baseline.json`.

7. `webapp/tests/office-configuration.test.mjs` — **verified artifact configuration binds the native calendar literals privately**. Requires verified private APK binary and recovered literal pool. Dependencies: `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, `analysis/recovered/blutter-unique/pp.txt`.

8. `webapp/tests/lost-review-post.test.mjs` — **extension MIME matches all996 recovered defaults, with lookup-only trim/case and exact unknown fallback**. Exhaustive comparison against omitted recovered MIME evidence. Dependencies: `analysis/recovered/lost-review-post-protocol/mime-table.json`.

9. `webapp/tests/lost-review-post.test.mjs` — **catalog retains the audited post and later Yuridis delta against the96-file baseline with session and confirmation**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/lost-review-post-baseline.json`.

10. `webapp/tests/queue-booking-backend.test.mjs` — **quota registry changes only its existing record and retains all171 other records including disabled create beside later personal Swaplotting, Berkas Rating and Buku Tamu writers**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/queue-booking-runtime-baseline.json`.

11. `webapp/tests/mitra-response.test.mjs` — **catalog retains five Mitra records plus later Rating and Yuridis deltas with prior write IDs plus the selected Rating writer**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/mitra-read-baseline.json`.

12. `webapp/tests/queue-models.test.mjs` — **all 1079 frozen C++ reference vectors match queue raw-double conversion**. Recovered native C++ reference-vector comparison. Dependencies: `analysis/recovered/queue-model-followup/double-vectors.json`.

13. `webapp/tests/rating-ppat-response.test.mjs` — **catalog retains the Rating GET plus later Yuridis delta and prior write IDs plus the separately enabled Rating POST**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/rating-ppat-read-baseline.json`.

14. `webapp/tests/rating-ppat-post.test.mjs` — **catalog enables only the selected Rating writer, corrects GET reason only and keeps other169 records/prior14 write IDs intact beside later quota, personal Swaplotting, Berkas Rating and Buku Tamu deltas**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/rating-ppat-write-baseline.json`, `environment/rating-ppat-write-before/webapp/private/operations.mjs`.

15. `webapp/tests/scan-controller.test.mjs` — **Scan native ledger stays pinned and standalone module has no provider/profile/activation dependency**. Recovered ledger hash and implementation source assertions share one callback. Dependencies: `analysis/recovered/scan-flow.json`.

16. `webapp/tests/swaplotting-read-backend.test.mjs` — **catalog retains the office correction plus separately audited lost-review, Rating and Yuridis deltas**. Historical operation-registry preimage comparison. Dependencies: `environment/swaplotting-read/operations-before.json`.

17. `webapp/tests/swaplotting-submit-backend.test.mjs` — **catalog enables only the two scoped personal uploads and keeps172 other records including the prior generic Activity unchanged beside later Berkas Rating and Buku Tamu**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/swaplotting-submit-runtime-baseline.json`.

18. `webapp/tests/tls-configuration.test.mjs` — **verified APK TLS context stays private and is restricted to the exact production origin**. Requires verified private APK TLS material; missing-artifact behavior remains included. Dependencies: `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, `analysis/recovered/blutter-unique/pp.txt`.

19. `webapp/tests/yuridis-backend.test.mjs` — **catalog retains the Yuridis read/feed/post plus later Rating writer and GET reason deltas**. Historical catalog delta and implementation assertions share one callback; the entire callback is omitted. Dependencies: `analysis/webapp/yuridis-runtime-baseline.json`.

## Validation

The publication checkout was tested with `node webapp/tests/run-portable.mjs` using Node v24.21.0 on 22 October 2026: **2,488 tests passed, zero failures, zero cancelled, zero Node skips, zero todo**, exit code 0, duration 6,910.9854 ms. The 32 omitted callbacks comprise 13 in the two unloaded files and 19 exact named callback filters. The total reconciles with the separate 2,520-test full local native-evidence suite; this command does not reproduce that wider proof.

The TAP and detailed run summary are local publication receipts stored outside the checkout at `environment/publish/checkpoint-20261022-portable.tap` and `environment/publish/checkpoint-20261022-portable-summary.json`. The repository validation summary can report these totals without publishing the raw TAP. The test files were unchanged. No production fetch, provider call, browser session, hardware permission, or Docker operation was performed by this validation task.
