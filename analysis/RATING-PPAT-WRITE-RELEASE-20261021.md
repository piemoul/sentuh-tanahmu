# Rating PPAT write — 2026-10-21

The user-controlled Rating PPAT writer is implemented. This is one completed feature increment; the overall 1:1 application goal remains incomplete.

| Evidence | Current result |
| --- | --- |
| [Node suite](webapp/rating-ppat-write-node-final.json) | 2,138/2,138 tests passed across 126 files. |
| [VM suite](webapp/rating-ppat-write-vm-final.json) | 1,190 checks passed across 23 suites; original nonpassing Mitra/Akta harness evidence remains separate. |
| [Browser suite](webapp/rating-ppat-write-browser-summary.json) | 25 synthetic groups passed, including 12 synthetic Rating POST requests; zero BPN/provider requests or production writes. |
| [Deployment](webapp/rating-ppat-write-deployment-final.json) | **PASS.** Backend replaced once after the [image check](webapp/rating-ppat-write-image-retry.json): 117 container files, 80 localhost files and 80 HTTPS files match; both health checks pass. Read-only root, 13 read-only mounts, dropped capabilities and loopback binding are retained; the new container has zero restarts. |

The active authenticated endpoint is `RatingPPAT/PostRatingPPAT`. Only an explicit **Kirim Rating** action submits; there is no additional confirmation dialog or automatic retry. The request preserves the original selected `aktaId` and the ordered `PertanyaanRatingPPATId` String list, with exactly those two JSON keys in that order.

Answers come from the returned choices. `Map.values()` preserves first-selection order; replacing an answer does not reorder its group. Completion follows the native count-only check. Loaded empty groups can submit an empty list; duplicate/null group IDs retain their native effects on completeness. An incomplete explicit submit displays “Jawab seluruh pertanyaan sebelum mengirim.” without a POST.

The service accepts the shared 2xx status range and preserves the separately decoded boolean/message tuple. Strict field types and native null defaults remain intact. JSON-looking `text/plain`, malformed responses and ordinary transport failures follow the documented fallback; an empty or whitespace message is not rewritten or treated as proof of success.

The browser permits one pending write per raw Akta ID and session. Owned selection, reload and back controls lock while pending, and stale owner/session results are discarded. `SESSION_CHANGED` requires an explicit questionnaire reload; only the three actual auth codes invoke the session-error handler.

Both ordinary tuple outcomes navigate to the remembered first SPA route and show the literal escaped message. The route choice is an explicit browser adaptation: the native audit proves the first present route, not its screen identity. No Akta list refresh, cache invalidation or local `readyToRatingPPAT` mutation is added.

Actual mobile testing exposed horizontal overflow from a long PPAT name. The two-line scoped heading-wrap CSS correction passed the final browser run; the [failed initial observations](webapp/rating-ppat-write-browser-initial-observations.json) and original screenshots/transport remain preserved.

Native contract references: [final request/response audit](RATING-PPAT-WRITE-FINAL-FOLLOWUP-20261021.md) and [result-navigation audit](RATING-PPAT-RESULT-NAVIGATION-FOLLOWUP.md). The catalog contains 176 operations, 89 enabled: 74 reads and 15 writes. Only the Rating POST record and questionnaire GET description changed; the other 174 records remain unchanged.

All stated browser submissions use synthetic transport. Actual server acceptance or persistence of a rating, full APK execution/pixel parity, and any geotag physical-presence bypass are **not proved**. A result dialog alone does not establish persistence.
