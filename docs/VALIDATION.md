# Validation of the 20 October 2026 checkpoint

The complete local analysis workspace passes **549 / 549 Node tests** and **1,190 checks across 23 actual-function VM suites**. The latter count is separate from the Node total. The source-bound summaries are under `analysis/webapp/collection-save-activity-*.json`; they describe the original local workspace, not production mutation acceptance.

## Source-only repository

Run with Node 24:

```sh
cd webapp
npm run test:portable
```

The portable command keeps every implementation test and explicitly excludes five named evidence checks. Those checks require private/local APK TLS and calendar material, the frozen native ledgers, historical receipts, or C++ reference-vector artifacts that are intentionally excluded from publication. `npm test` remains the complete suite and needs the original local analysis environment.

The source-only run is expected to report **544 executed and passing, zero failing**; the five evidence checks are filtered out before execution (Node reports zero skipped). The five exclusions are listed verbatim in `webapp/tests/run-portable.mjs`; they are not silently converted to successful tests. Live server writes, APK runtime parity, every map origin and full app parity remain unverified. The PERSIL save module is staged but not imported into the main UI. No backend container rebuild was performed for this Git checkpoint.
