# Rating PPAT: final submission contract

This additive static audit closes the remaining response and shared-transport details of the native 6.1.5 Rating PPAT writer. The [read/model](RATING-PPAT-READ-FOLLOWUP.md) and [UI/selection](RATING-PPAT-UI-FOLLOWUP.md) reports remain unchanged. No app file, catalog entry, account, provider request, rating or document was changed by this audit. The artifact is ARM64 `libapp.so` SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

The [new source index](recovered/ratingppat-write-final-followup/source-index.json) binds the exact source pins and an offline instruction verifier. Its conclusions describe native code, not a currently accepted production submission.

## Request values and serialization

The prior UI proof already binds `d869a0 → d86bc8 → d86cd0`: the selected Akta ID and the state map's materialized **value List<String>** are forwarded unchanged. The ordered JSON keys are **`aktaId`** and **`PertanyaanRatingPPATId`** (uppercase P). Values follow the compact map's insertion order, not a new sort into questionnaire order. Choosing a new answer for an already selected group changes that value without creating a new group entry. A browser Map preserves the required insertion behavior; converting group keys to an ordinary object risks integer-looking key reordering.

`d86d78` JSON-encodes the map before calling POST **`RatingPPAT/PostRatingPPAT`** at `d86e10`. Caller headers are **Content-Type: application/json** and **accept: text/plain**. The already proven ordinary main/session client applies. The String branch in the retained LRb interceptor skips the form and multipart setters (`d0da5c → d0da74`, `d0daac → d0dac0`); the Rating path does not match its common-route override. The default transformer skips another JSON encode for String (`6fb3ec..6fb3f4`), reaches String `toString` identity through `6fb544 → 6fb660`, and the common body path UTF8-encodes the result (`d0cad0..d0caec`). There is no second JSON quoting, URL form conversion or multipart body on this ordinary path.

This reuses the pinned shared serializer and String-identity evidence rather than claiming a new complete Dart JSON/UTF16/OS HTTP implementation audit. No caller coordinate, visit attestation, checksum, user/device identity field, idempotency key or receipt parameter is present in this writer. That is a bounded caller observation, not proof that a current server has no additional validation.

## Status and typed response

Shared default status accepts **200 ≤ status < 300**, positively bound by `6b8f78..6b8f8c`. The response transform is awaited before the returned body is consumed (`d05500..d0550c`). The complete Rating writer has **no extra HTTP200 gate**. A valid HTTP201 JSON response can therefore follow its ordinary success path. This differs from `review/post`, whose own helper checks exactly HTTP200.

After the shared MIME transform, the writer directly reads the response body's `error` and `message` (`d86e24..d86ebc`). It performs **no service-level String JSON decode**, and does not inspect `data`, an assigned rating ID or a receipt.

| Field/path | Exact native behavior |
| --- | --- |
| `error` missing/null | substitute **true** (`d86e50..d86e5c`) |
| `error` nonnull | require **bool**, without string/number coercion (`d86e74..d86e98`) |
| `message` missing/null | substitute **Gagal Mengirimkan Rating PPAT** (`d86ec0..d86ed0`) |
| `message` nonnull | require **String**; empty/whitespace String remains unchanged (`d86eec..d86f14`) |
| Normal result | tuple **`(!error, message)`** (`d86f28..d86f34`) |
| Caught failure | **`(false, 'Terjadi kesalahan saat Mengirimkan Rating PPAT')`** (`d86f3c..d86f48`) |

The fallback's exact pool offset is **50c30**, verified directly by an isolated static metadata reader. The old `pp.txt` prints it under `50c28 UnlinkedCall`; pinned `DartDumper.cpp` explains that this display reads the **next pool slot** for that unlinked entry and then skips it. The fallback is therefore not inferred from a nearby unrelated string. The metadata reader calls no application function or initializer and exports only that public message plus three bounded function identities/sizes.

An initial metadata attempt required a fourth function identity not recovered by that metadata engine and returned exit7 after writing the already verified public constant and first three identities. That attempt, source/binary/output preimages and failure receipt are retained. The corrected reader only requires the three positively recovered identities and returns exit0. It does not alter any ELF-byte check.

JSON MIME follows the retained fatal-UTF8/JSON transform; non-JSON MIME follows replacement UTF8. Consequently text/plain containing a JSON-looking object remains a String and fails the writer's dynamic String-key lookup; a JSON outer String is not unwrapped again. Malformed root/field types, transport/transform failure or lookup failure reach the retained false/fallback result. Extra ordinary JSON object keys are not consumed. A JSON object with missing fields yields false and the missing-message fallback; `error:false` with no message yields true and that same fallback message. The returned bool and text must remain separate—message wording alone is not success evidence.

## Busy, validation and result boundary

The existing UI proof owns the unusual native count check: only `selectionMap.length < displayedGroups.length` shows **Jawab seluruh pertanyaan sebelum mengirim.** It does not iterate over every group/answer pair. Empty question lists pass; duplicate or null group IDs can prevent completeness. Native choice callbacks accept only actual returned choices, ignore a null group ID, use an empty String for a null answer ID, and preserve nonnull empty/whitespace IDs.

The complete submit controller `d86bc8..d86cd0` emits busy=true on subject `+1f`, awaits the service, emits false, and returns the tuple; an escaping exception clears busy then rethrows. The footer swaps the send button for the loading placeholder while exactly true. Neither the helper nor controller contains a separate preflight inflight guard. A browser ownership lock, one pending request, no automatic retry and disabling navigation while its own write is pending are explicit browser adaptations; they must not be called native server idempotency.

After a normal return, the native local helper ignores the tuple's bool, checks that its context still exists, invokes shared navigation `75c000`, then opens the result dialog using the tuple's String. A displayed dialog therefore proves no storage success. The [separate positive navigation proof](RATING-PPAT-RESULT-NAVIGATION-FOLLOWUP.md) establishes **pop until the first present route of the default global navigator**, not a named Aktaku route and not just one form pop. The first route's screen identity is not established. Tutup uses shared back, which first closes a shared queued item if present; otherwise it performs one canPop-gated route pop. The complete controller/service publish only the submit-busy subject; their concrete call sets contain no direct Aktaku list reload, question-list publish, readyToRatingPPAT edit or local rating cache invalidation. Observer/disposal and other lifecycle effects remain unproven; do not invent an Aktaku success refresh or remove the rating entry locally.

The first verifier attempt also retained a wrong handwritten decisive marker address: `87ce70` is a style-field store, while the returned message load is `87cd94`. Its exit1 and complete source preimage are preserved. The correction uses the actual load and rechecks the same original ELF bytes; no assertion or test is removed, no runtime changes are made, and the newly retained request-transform wrapper remains unchanged.

## Eligible implementation and remaining limits

These contracts justify implementing a user-controlled, authenticated Rating PPAT write with strict values from the selected eligible Akta and current returned question choices, a dedicated JSON serializer/response decoder, and synthetic transport/browser coverage. Such an implementation may expose the actual server result; **this audit does not certify current production acceptance**. No genuine rating should be sent merely to make a test green. A public outcome dialog must not fabricate an assigned rating, receipt or successful persistence, and pending/ambiguous failures must not trigger an automatic duplicate write.

Full native UI pixel equivalence, account/role coverage, transport retry behavior outside the bounded caller, remote persistence and broader navigation lifecycle remain separate verification boundaries. Coordinate-only drafts and legitimate location input are unrelated to this Rating writer; nothing here establishes a physical-presence bypass.

Run the frozen verification without writes:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/build_rating_ppat_write_final_followup.py --verify-only
```
