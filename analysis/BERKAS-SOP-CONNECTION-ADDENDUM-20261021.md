# SOP connection addendum: retained account reads before Mitra deployment

**SOP succeeded in the current retained-container window.** One `POST /berkas/berkassop` completed HTTP200 in897ms at `2026-10-21T06:56:48.417848302Z`; no SOP failure was recorded in that window. The separate saved browser account check rendered the SOP supplement with `hasSop=true`, `error=false`, `pending=false`. This adds a positive current observation to [the earlier connection audit](BERKAS-SOP-CONNECTION-AUDIT-20261021.md); it does not erase the older TCP refusal or prove a permanent repair.

The [safe aggregate successor](webapp/account-read-before-mitra-connection-summary.json) was created by a read-only Docker audit. It contains only allowlisted fixed endpoints, symbolic stages/codes, status/timing/outcome/counts, and safe process metadata. Raw logs were neither printed nor persisted. The audit made no production request, runtime change, restart, file upload or account action.

## Window and attribution

The saved [14-check browser receipt](webapp/account-read-before-mitra-release.json) has a completion time but no start timestamp. Accordingly the log range is the authoritative retained container start, **06:40:52.342167645Z**, through that browser receipt's **07:19:05.650Z** on2026-10-21. The process ID, image, start time and running state matched the Mitra baseline before and after reading logs; no container replacement occurred during this audit. It was the retained review/post release, before the separate Mitra backend deployment.

This broad window can include concurrent user activity. No query, record ID, geometry, coordinate, tile URL, token, authkey, response body or screenshot is retained, so counts are not exclusive per-click attribution. Fourteen browser checks are preserved with **12 passing and2 not passing**; the incomplete tile observations are not relabeled as success.

## Positive SOP and other connection outcomes

| Fixed endpoint / category | Observed result |
|---|---|
| `/berkas/CariBerkas` | One HTTP200,1817ms |
| `/berkas/berkassop` | One HTTP200,897ms; zero recorded failures |
| `/berkas/getStatusCetak` | One HTTP200,3547ms |
| `/legacy/GetParcelBoundaryById` | Two HTTP200 successes,364ms and8466ms; one separate failure described below |
| Main Bhumi token GET | Two HTTP200 responses,1088ms and6921ms; token values not retained |
| Bhumi WMS images | Fourteen attempt1/HTTP200 successes; one attempt1 network failure; zero retry events |

The earlier SOP observation was `status=null`, `stage=tcp`, `networkCode=ECONNREFUSED`, elapsed21048ms. The current successful SOP request corroborates the fixed native-compatible host/service/path contract already established in the original audit. No host, port, TLS, body, checksum or identifier workaround was applied by this audit.

## Boundary timeout is a separate failure

At **07:08:47.033772322Z**, one `/legacy/GetParcelBoundaryById` request logged `upstream_fail`, `status=null`, `stage=request`, `networkCode=REQUEST_TIMEOUT`, elapsed**30007ms**. This is distinct from the historical SOP TCP refusal. `stage=request` plus the generic request timer does not identify whether DNS, TCP, TLS, server processing or another pre-response wait consumed the deadline. No upstream HTTP response or typed boundary body is established for that event.

Two other boundary reads succeeded in the same broad window. Without retaining request/record/image correlation, this audit does not assign the later timeout to a particular earlier screenshot or conclude that a field ID, map center or boundary geometry is wrong.

## Bhumi partial-tile evidence

At **07:01:20.773487955Z**, one fixed-path `bhumi_tile_request` logged `attempt=1`, `status=null`, `outcome=failure`, `code=BHUMI_NETWORK_ERROR`. The same window has14 HTTP200/attempt1 successes and no retries. The existing Bhumi client intentionally sanitizes unknown transport/body exceptions into that code, so the record does not identify an underlying DNS/TCP/TLS/edge error. In particular, it does not establish a Cloudflare response or HTTP401/403.

The browser receipt separately records collection map13/13 loaded and certificate map9/10 loaded with1 failed. Its later provider-classification observation had `maps=0`, `groups={}` and no tile/status data, so that later observation cannot classify or replace the earlier failed image. A Bhumi network failure is positively present in the window, but exact DOM-image-to-log correlation is not retained.

A valid transparent PNG still decodes with nonzero image dimensions. The current map module has separate sticky OSM/Bhumi `tileerror` warnings; the Bhumi backend accepts only HTTP200 with PNG MIME/signature/size guards, without substituting a no-coverage image. It does not fully decode PNG pixels/CRC/dimensions. Therefore neither a backend success log alone nor an unclassified image count proves complete browser rendering, and this partial result must not be described as expected transparent coverage. Marker/no-src/pending images must also be separated from actual `img.leaflet-tile` failures in any later browser diagnostic.

The current observations support **SOP read success with unresolved intermittent map/network failures**, not all-function acceptance or a location/ID correction. No new production retry was performed here. Any later current-server test belongs to a separate explicitly scoped receipt.

## Immutable references

| Evidence | SHA256 |
|---|---|
| `webapp/account-read-before-mitra-connection-summary.json` | `3c932098b14437c20bf0f027e2d0923bd1420df9b3cd9620da63f0fae8fe52d2` |
| `webapp/account-read-before-mitra-release.json` | `90b264ca74c299ad5699f802979ef64bdeb1d6e022ccb92a658a29bf52611051` |
| `BERKAS-SOP-CONNECTION-AUDIT-20261021.md` | `47e629d00bd2d9ee98a3caac8341aa7c2d19135f88c7a3de7d3cbb64854630b6` |
| `webapp/live-account-berkas-log-observation.json` | `9eb4c4663013d878af4b2f40bea36edfb6f95c913130ea45e6b8a6fac3e49260` |
| `rea/audit_account_read_before_mitra_connection.mjs` | `295850b547d7a335af4052d8ea6e83de674c67497a64b2f20257cb7e89d043db` |

The audit writer's first invocation stopped at a mistyped source-hash assertion before any Docker command or receipt write. The corrected invocation exited0 and exclusively created the successor JSON. Existing account, SOP and release receipts remain unchanged.
