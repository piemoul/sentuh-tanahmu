# Pengumuman Yuridis: implementation and acceptance checklist

This is an incremental part of the existing whole-app goal, not a replacement
for it. The previous goal turn made progress by accepting one real Berkas
journey; this turn addresses the still-generic Yuridis menu. Physical-visit
geotag submission remains a distinct requirement and is not completed by this
feature, coordinate drafts, a map, or a successful ordinary read.

The source baseline is `webapp/yuridis-runtime-baseline.json`: 114 runtime
files, 113 test files, 176 operations with 87 enabled (73 read, 14 write).
All runtime preimages are retained in `environment/yuridis-runtime-before`.
The native source index is `recovered/yuridis-read-flow/source-index.json`,
SHA256 `3993a0e2b3988890bb6bad345797329c07d126d965579324dc75af6f3d5a3ebe`.

| Requirement | Authoritative acceptance evidence required |
| --- | --- |
| Replace the technical office-ID form | Actual application tab, returned office chooser, automatic initial read, explicit refresh |
| Correct office fallback | Returned IDs/favorite profile ID kept exact; empty/failed chooser still allows known favorite; no invented office row |
| Distinct GGb model | Ten nullable Strings and `luasPersil` nullable int; bad rows fail the service, wide integers remain exact |
| Native search/cards | Only nomorBerkas/wilayah/pemohon, lowercase without trim, source indices/duplicates preserved, exact Rutin category split |
| Detail | Six ordered native facts, shipped date formatter, nullable area String semantics; no invented PDF or extra legal facts |
| Map binding | Original selected persilId -> location metadata -> returned persilId -> boundary; local raster fixture then separately scoped live evidence |
| Last-user review | Exact `sertipikatSaya` and original persilId, no pages; transformed body only, early null list and otherwise singleton yyb/zyb/Ayb validation |
| Review compose | Same native shared composer with explicit selected type, real user input, original photos, confirmation and typed inverse error flag; no optimistic result |
| Ownership and errors | Back/refresh/route/tab/session retirement, response races and pre-I/O checks; no duplicate or automatic retry caused by UI |
| Preserve previous features | Full Node/VM regressions, native pins, exactly three catalog-record changes, unchanged 14 write IDs/confirmations and unrelated 173 records |
| Browser and delivery | Whole-app synthetic fixture desktop/mobile, no external providers, then independent image/container/static localhost/HTTPS checks |
| Real acceptance | Public Yuridis read and, if an authenticated session and real eligible data exist, one read-only detail/review/map test; no manufactured IDs or production review |

The new source catalog has one additional read enabled: existing
`post-review-last-user-review-dad1dc`. Existing Yuridis feed metadata and the
existing confirmed shared review writer are the other two changed records.
The resulting 176/88/74/14 counts describe source readiness, not deployment or
production acceptance.

The first broad regression run is retained unchanged in
`webapp/yuridis-node-initial.json` and its TAP log: 2011 tests, 1993 pass,
18 fail, no input drift. It is not a passing receipt. Old catalog expectations
and mocks must be migrated with exact preimages and a stronger current-delta
guard; behavior failures must be fixed in the implementation.

Known browser adaptations include serial office/feed initialization, guards
for native nullable assertions, explicit errors/retry, responsive layout,
session/owner retirement, and read-only response projections. Default strict
lost-certificate review helpers remain scoped to their original type.

Remaining whole-goal limits include all menus/roles/populated/error branches,
native device execution, booking wire/provisioning/reconciliation, direct
Berkas geometry binding, production writes, and mandatory-presence geotagging.
Do not mark the overall goal complete from Yuridis tests or deployment.
