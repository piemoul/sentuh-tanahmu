# Scan special maps — bounded webapp validation

Status: **bounded implementation and synthetic validation complete**. This document records the current bounded scope. It does not certify production acceptance or complete native map parity. Existing release receipts and native ledgers remain unchanged. The current PBT integration is local workspace/deployment progress and has not been pushed to GitHub since checkpoint `f2ea`.

## Implementation scope

| Area | Current scope | Limit |
|---|---|---|
| PBT backend | `apis/GetPBTElDetail`, POST form with sole String `q`; typed PBT envelope/model | Exact HTTP 200, direct decoded map; not a generic JSON/String decoder |
| KKPR backend | `apis/GetKKPRDetail`, POST form with sole String `q`; typed root, textual models and geometry models | Independent KKPR detail model; never reuse the KKPR list `gyb` model |
| Scan context | Existing opaque session context permits these two special reads, with the same original `q` | Empty `q` only through validated Scan context; no browser name override or general trusted flag |
| PBT frontend | Source-row panel/search/selection, projected reference centers and approved OSM + Bhumi raster host | Browser/platform differences below remain explicit |
| KKPR frontend | Explicitly unavailable in the Scan host | Backend/model proof does not silently enable a generic map fallback |
| Bhumi logging | Default structured sink records sanitized tile outcomes | Diagnostics improvement; not evidence that an earlier upstream 502 is fixed |

The PBT native viewer starts its special destination and then falls through to generic document location without awaiting the first navigation result. The browser implementation represents both destinations as independent panes, with generic location initially in front. One branch's ordinary failure must not discard the other branch's successful read. Session/route/modal ownership and cancellation are browser lifecycle guards. This representation is an adaptation of the proved navigation order, not a claim about Android route stacking or animation timing.

## Native evidence

- Initial Scan routing, special requests and root parsers: [SCAN-LOCATION-FOLLOWUP.md](SCAN-LOCATION-FOLLOWUP.md), ledger `f99ec732ea7c09684a34522c9b79667f08695c236f0fb8c5cf04e97eb07ff5c9`.
- PBT projection, source-index panel/search, default/selected camera and external directions: [SCAN-PBT-MAP-FOLLOWUP.md](SCAN-PBT-MAP-FOLLOWUP.md), ledger `d62a880cf8940e871e98be6954327ab0bbf494540362b7e8c3aa2eb33f002e93`.
- KKPR nested models, numeric rings, bounded map controls and feature panel: [SCAN-KKPR-MAP-FOLLOWUP.md](SCAN-KKPR-MAP-FOLLOWUP.md), ledger `8aec89dbd6c36b0aba47caf0c880aec5f1fbf83b58963e1eed3579f316301d24`.
- Both use ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` and pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

The native verifiers are independent raw-ELF/pool/dispatch/class checks. They establish the recorded source behavior; they do not execute the APK or certify a current server response.

## Backend decoding and request boundary

`webapp/private/scan-map-response.mjs` keeps `error` and the typed model together. Missing/null envelope `error` becomes true; missing/null envelope `data` is parsed from an empty map. Known nullable model fields stay null when absent. Wrong nonnull known types fail the read. No second JSON decode is applied to a String body. A typed `error:true` is retained, and the frontend must publish a map only for `error === false`; it is not a generic business-error exception that should erase a valid native tuple.

PBT `luas` is String?, and coordinate callbacks preserve nested values. KKPR has 94 nullable leaf fields across properties, pemohon, berkas and detail models. Its 51 detail fields were mapped through the shuffled constructor. `individual_areas` is String?. Nullable `num` fields convert to double; integer and string fields are not coerced. Browser finite-number and safe-integer restrictions are explicit JSON/JavaScript representation guards rather than newly inferred native limits.

KKPR `pertimbangan` uses a direct native `List<jEb>?` runtime cast. There is no JSON child mapper and no empty-list exemption. Ordinary decoded `List<dynamic>` incompatibility follows generic-cast semantics; it has not been observed on an original device. No accepted nonnull JSON representation is certified. The browser conservatively rejects every nonnull JSON value for this field, including `[]`, rather than using a vacuous per-item check.

`api-client.mjs` confines special reads to main/session auth, exact POST/form/path, one String field `q`, no files or query parameters and exact HTTP 200. Its private `scanMapContextValidated` flag applies only to the two special paths; the generic document-geo flag is separate. `operations-runtime.mjs` and the HTTP API validate the opaque context against the current session/user and exact original `q`, including after awaits. Same-account token refresh preserves the context for an intentional retry. Expiry, logout and account replacement invalidate ownership; no automatic replay of a write is introduced.

The persisted independent review is [scan-special-maps-backend-review.json](webapp/scan-special-maps-backend-review.json). It records start/end hashes for the exact four reviewed runtime inputs plus the native ledger. Its direct-codec probe passed **107 assertion groups** using synthetic data: four full leaf projections with exact key order, wrong-type checks for all 94 leaves, envelope defaults, nonnull `pertimbangan`, no second decode, retained `error:true`, and uncoerced unused nested coordinates. That probe made no HTTP, provider, account or device calls. Broader final test totals belong in the final evidence section below.

## PBT frontend behavior and declared adaptations

The PBT host uses original source rows and source indices. The native action index is the first original row whose `batas?.id` equals the visible row's boundary ID; duplicate and null IDs can select an earlier source row. It does not use NIB identity or filtered-list position. Search trims the query and uses substring matching against the original cached rows; the displayed count remains the original source-list length. Trim follows the proved shared `0x447974` whitespace set, including U+0085; JavaScript `trim()` alone would omit that character. The browser's lowercase/case tables and complete native Unicode runtime equivalence remain unproved.

The native projection traverses exact `MultiPolygon` geometry as polygons → rings → vertices. It requires numeric ordinates, ignores extra ordinates and computes a center from the raw vertex sums divided by the full count, including a duplicated closing point. The mean is normalized by clamping latitude and wrapping longitude. The **last nonempty ring** supplies a feature's center; only source index 0 may replace the initial camera. This is not a geometric centroid or fit-to-bounds algorithm. Unsupported/absent geometry preserves a null source center rather than assigning another row's coordinate.

The browser uses the fixed native fallback (-6.2, 106.816666) at zoom 19 because the native cached global coordinate has unproved provenance and age and is unavailable to this web host. It must not replace that global with fresh device GPS or another supplied coordinate. The native cached-coordinate control stays unavailable unless separately proved. Selected source centers may recenter to zoom 19, and an explicit external directions link uses the selected document reference point.

Native model/list publication occurs before projection, so malformed traversed geometry can leave a partially changed native controller. The browser retains valid textual source rows and reports a projection warning; it does not pretend that a failed projection produced invented or complete coordinates. Atomic browser projection, finite/array/point/row work bounds and omission of partial native camera effects are declared adaptations. Unused malformed coordinate content remains a backend model value until the UI actually traverses it.

The map host uses the user-approved OpenStreetMap base with the official Bhumi raster overlay and a selected reference pin. It adds no custom parcel vector. It does not reproduce native Google polygons, holes, duplicate polygon-ID rendering or SDK layer widgets. Native raster/provider parity, all RDTR/RTRW source endpoints and layer access conditions remain unproved. A successful fixture tile is not proof that live Bhumi currently accepts a request.

The normal Scan PDF remains visible when a location read fails. KKPR stays explicitly blocked in the host for this batch; no generic fallback or PERSIL collection-save action is inferred for a special document map.

## Bhumi diagnostic sink

The Bhumi client now has a default structured log sink when a caller supplies none. Emitted fields are fixed event/service/method/path, attempt, HTTP status, outcome and a sanitized error code where applicable. Tile coordinates, BBOX/query strings, tokens, keys, image bytes and arbitrary upstream text are excluded. A throwing sink cannot change tile behavior. The dedicated test covers the default sink's successful and HTTP 502 outcomes and is included in the final Node pass below.

This adds observability for a subsequent failure investigation. It does not establish the cause of a previous 502, change provider acceptance, or claim that a historical production failure has been repaired.

## Source-bound final evidence

The release owner supplied these final results. The named receipts bind their own inputs and preserve their earlier diagnostic counterparts; the totals describe separate test layers and must not be added into a count of end-to-end production features.

| Evidence | Final result | Receipt |
|---|---|---|
| Complete Node suite | **871/871 PASS**, zero failures, skipped, cancelled or todo; unchanged inputs | [backend-tests](webapp/scan-special-maps-backend-tests.json) and [text output](webapp/scan-special-maps-backend-tests.txt) |
| Legacy actual-function VM regressions | **1,190 PASS across 23 suites**; no failed suites, changed inputs or historical artifact changes | [regressions](webapp/scan-special-maps-regressions.json) |
| Desktop synthetic browser | **26/26 PASS**; nine input hashes identical at start/end, console empty | [browser](webapp/scan-special-maps-browser.json) and [transport](webapp/scan-special-maps-browser-transport.json) |
| Narrow synthetic browser | **7/7 PASS** at actual 558×668 browser viewport; nine start/end inputs unchanged, console empty | [mobile](webapp/scan-special-maps-mobile.json) and [mobile transport](webapp/scan-special-maps-mobile-transport.json) |
| Independent KKPR backend review | **107 synthetic assertion groups PASS**, no material mismatch at recorded hashes | [backend review](webapp/scan-special-maps-backend-review.json) |
| Independent location-module review | No material finding at the recorded stable inputs; declared limits retained | [module review](webapp/scan-special-maps-module-review.json) |
| Independent final host review | Eight actual source inputs stable at start/end/current, zero material findings; actual U+0085 trim probes | [host review](webapp/scan-special-maps-host-review.json) |
| Standalone Docker image | **6/6 file hashes match**, zero bind mounts and network `none` | [image](webapp/scan-special-maps-image.json) |
| Public static assets | **7/7 HTTP 200 byte hashes match** via public origin; no account/classifier/provider request | [public assets](webapp/scan-special-maps-public-assets.json) |
| Public account preview | **3/3 PASS** at 558×668: enabled login, no horizontal overflow, empty fields | [live preview](webapp/scan-special-maps-live-preview.json) |

Focused suites included in the Node total cover 22 PBT projection/panel cases, 19 location orchestration cases, 32 actual-host cases, 27 special-map backend cases and 12 synthetic HTTP fixture cases. Two optional-pin regressions and one default Bhumi sink test are also included; these are subsets, not additional totals.

Desktop fixture transport recorded **67 synthetic business calls**, including **11 classifier requests**. That classifier count is a request category, not a count of account mutations or successful server writes. There were zero unexpected calls, pending responses, provider requests, production requests or camera accesses. The 67 calls include traffic from the retained draft assertion attempts and two browser bootstrap profile reads during the initial opening/reload; one initial bootstrap read predates input-hash capture. All 26 acceptance checks followed the final reload and input-hash capture with stable sources. Thus 67 is the whole captured fixture traffic total, not a count of calls generated exclusively by the final assertions.

Three draft browser assertions remain visible in `excludedDraftChecks`: an assertion expected `display:none` where the implementation correctly used `visibility:hidden`; another searched a diff-only accessibility snapshot for unchanged notice text; another took an initial accessibility snapshot before asynchronous map fit. Corrected final DOM/visibility/timing checks pass without runtime changes. A failed exact-label input locator was retargeted to the observed visible `#scan-raw-q`; the failed locator made no business request. These are recorded test-observation corrections, not removed product failures.

The first combined runs failed seven Node checks and all 23 VM suites because older fixture contexts lacked the new real `scanDisposeLocation` binding. Their receipts remain [backend-before-fixture-binding](webapp/scan-special-maps-backend-tests-before-fixture-binding.json) and [regressions-before-fixture-binding](webapp/scan-special-maps-regressions-before-fixture-binding.json). Only the actual extracted function binding was added to 25 harnesses; no assertion was weakened. Final runs above pass. The dedicated [baseline](webapp/scan-special-maps-baseline.json) and final regression receipt retain historical protection evidence.

Final source hashes include:

| File | SHA-256 |
|---|---|
| `webapp/app.js` | `7cfceeaf59a20b3f787f1beb654b94d4c4319032e0f3afa965939df483ba2206` |
| `webapp/styles.css` | `68405543a22690de74ca030bc7061b9dc2e462dbc152945d6553a8b84473c422` |
| `webapp/scan-location.js` | `88a32541dcc902a5e0789bc5e737553af40ee35553eca7adb4b9da384665e9da` |
| `webapp/private/scan-map-response.mjs` | `6f1235026cd900555f547368cac9b80693984a4b5d62ed4054891ece0e878305` |
| `webapp/private/api-client.mjs` | `92eeee6cdc8bc449bd9860cb63e6652ade3e6dc745f51b2b2169a64e71c0a8b7` |

The release owner reports a healthy local deployment with all 15 frontend and 23 backend source checks matching. The catalog remains 176 total operations / 76 enabled; geotag submission remains disabled. Current coverage generation reports 29 menus, 19 pages and 33 views; those inventory counts do not certify end-to-end server parity. Public static checks establish current file delivery, not authenticated feature/provider acceptance. The public preview was restored to `https://sentuh.davay.space/#/account`. Its post-restart receipt records authenticated false at 558×668, empty login fields and an enabled login button. No credentials, document code or classifier request were entered there; the release owner requested one fresh login for subsequent authenticated testing.

The separate narrow synthetic fixture recorded seven business calls, including one classifier request, and zero pending responses, unexpected calls, provider requests, camera accesses or network transport use. Its seven checks cover the generic foreground, fitting PBT panel/map/rows, focus-preserving search and original source indices, selected zoom19/directions, null-center preservation of manual zoom18 with hidden pin, no added requests from local search/selection and closing back to the retained PDF. The visually inspected [narrow screenshot](webapp/scan-special-maps-mobile.png) shows the panel, reference pin and rows fitting the viewport; the [desktop screenshot](webapp/scan-special-maps-desktop.png) records the larger layout. This is browser viewport testing, not a physical handset test.

Earlier live Bhumi observations were 7/9; they were **not retested in this batch**. Their cause and repair remain unproved. Neither the logger change nor local synthetic raster success upgrades that historical result. No current live provider/server acceptance is claimed here.

No original-account mutation, activation, geotag/GPS submission, attestation/signature/checksum bypass, or real-device location acceptance is certified by this validation.
