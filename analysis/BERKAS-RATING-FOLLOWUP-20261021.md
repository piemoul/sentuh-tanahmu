# Native Berkas Rating follow-up — 2026-10-21

This closes the bounded static contract for **Berikan Rating untuk Berkas ini**, which is separate from Rating PPAT. It establishes the inspected native entry, modal, request, response and completion paths. It does not demonstrate execution or current server acceptance. No runtime, catalog or test files were changed, and no provider request was sent.

The immutable main ledger is [flow.json](recovered/berkas-rating-followup/flow.json). Its later [catch refinement](recovered/berkas-rating-followup/catch-followup.json) must be read with it: the controller's exceptional fallback has first value **false**, whereas the service's catch has first value **true**. The original ledger and receipts remain unchanged.

## Evidence identity and verification

| Artifact | SHA-256 |
| --- | --- |
| APK ARM64 `libapp.so` | `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` |
| Blutter pool `pp.txt` | `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04` |
| Main `flow.json` | `16c83a12a6b4cbf62b9a3881843c27c569102bd6a0617cddccd63dc9e8c0275f` |
| Additive `catch-followup.json` | `a20543d7460f39125257cf88a59f7073a8017aa0cdd07e74e2964bf575d0d24f` |
| Main `verification.json` | `e55d27ed2b693f378e9dd0567ad7d22f66fa4809b3a83f5083f99fc5ddeff2ae` |
| `verification.catch-followup.json` | `19db39e9e981248f1c38add557049ede8493ff49ed87be87940bb5945c391cc0` |

Both verifiers passed again with `--verify-only`. The main verification checks 18 new windows / 2,324 instructions plus 890 inherited selected instructions, totaling 3,214 unique instructions; 59 explicit instruction markers, 123 pool bindings, five dispatch entries, 15 dependency hashes and 133 shared LOST wire source pins. The additive check rechecks 12 controller-catch instructions and the complete constant-tuple pool record.

Reproduction, using the existing isolated interpreter:

```powershell
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 'analysis/rea/build_berkas_rating_followup.py' --verify-only
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 'analysis/rea/verify_berkas_rating_catch_followup.py' --verify-only
```

Builder hashes: `build_berkas_rating_followup.py` = `4e927501b0a9c712016ef13ae05bc453f457645341ef42725771cafa5a1a18cc`; `verify_berkas_rating_catch_followup.py` = `a0e6b462d36cb76589a5c5db0479d9e9b916b684b7ece79853bf0018178e2799`.

## Entry and source ID

- In the inspected shared detail widget, `MAb+f=false` selects the rating branch. Berkasku builder `0x8b0280` supplies false; the inspected Koleksi, Aktivitas and Cari Berkas callers select the bookmark branch instead. Downloaded/cached callers remain conditional. This is not a control to add to every Berkas detail.
- `MAb+2f` defaults null to false; true suppresses the rating child. A busy stream value exactly true also hides it (`0x89a9d4..0x89aa48`, `0x8a9334..0x8a9364`).
- The original selected `MAb+13` follows parent local `-0x68` → detail body argument `FP+0x78` → captured body context `+0x1f` → callback `0xd9129c` → controller `0xd913b4` → service `0xd914c8` → `Berkasid`. It is not the displayed number/year, bookmark composite ID, office ID or `ABb+1f` (`namaProsedur`).
- The label is **Berikan Rating untuk Berkas ini**. The prompt interpolates the display number/year and office name. Those display values do not replace the selected ID.

Evidence: inherited `berkas-parent-build`, `berkas-body-full`, `bookmark-rating-streams`, `rating-build-navigation` and `berkasku-detail-builder` sources listed and hashed in the main ledger; caller classification is pinned through `collection-save-berkas/flow.json`.

## Modal and validation

The modal starts with rating **0**, comment **null** and busy **false** (`0x9f95a0`). It builds five tap stars; index + 1 supplies values **1–5**, converted to double, then stored at state `+0x13` (`0xa4be98`, `0xa4c1c8..0xa4c218`, `0x8b970c`). No half-star input is established by this path.

`Batal` and `Kirim` are the actions. Kirim requires rating > 0, a non-null comment with nonempty native-trimmed text, and not busy. The same validity helper `0x8b943c` is checked again by submit `0xd99638`. Its false result is the invalid result; the branch `tbz w0,#4,0xd9968c` **proceeds** when validation succeeds. The comment is trimmed with native helper `0x447974` immediately before the callback; the outer callback alone converts a remaining null to empty string. No independent maximum comment length or extra rating clamp is established in the inspected service.

Submit sets busy, converts the double rating to integer, invokes and awaits the callback, then calls the common stack pop `0x7257e8` on ordinary completion. Busy reset is guarded by the modal state's mounted condition. Batal uses the same common pop with null and is disabled while busy. These are stack operations, not proof of a named destination route.

Evidence: `dialog-state`, `dialog-build-input`, `dialog-submit`, `dialog-busy-set/reset`, `star-build`, `star-items-and-tap`, `star-to-double` and `rating-change` proof windows in the main ledger.

## Request and response

| Property | Inspected native contract |
| --- | --- |
| Operation | `post-berkas-postratingberkas-d915c4` |
| Request | `POST berkas/postratingberkas` via `0x6b9270` at `0xd915c4` |
| Client/auth | Repository `cBb+7` → `FRb+7`, main `LRb` account-session client |
| Body | FormData constructor `0x707bd4`; ordered scalars **`Berkasid`, `rating`, `userComment`** |
| Other values | No files, query or caller-specific headers supplied by this call; no extra location/presence fields |
| Rating | Native integer; ordinary tap path produces 1–5 |
| Result | Already-transformed body; `(error ?? true, message ?? "Terjadi kesalahan")` |

The result requires strict bool and String types. An empty message remains empty; missing/null uses the fallback. There is no second JSON decode or local `statusCode == 200` branch in this service. Shared default transport validates 2xx before this service processes the body, so HTTP success alone does not establish application success. The normal `error=false` result is the application success indication; no server rating ID or receipt is parsed.

The service catch returns `(true, "Terjadi kesalahan saat mengirimkan Rating Berkas")` (`0xd916f4..0xd91718`). Native FormData scalar conversion, UTF-8/raw-LF handling, escaping, framing, length and main-client/interceptor behavior are composed from the pinned shared LOST and auth proofs, rather than inferred from these three field names.

## Completion and exceptional fallback

On ordinary completion the controller resets its busy stream. When the returned error is false, it starts `0xd113f4(force=true)` **without awaiting it**. That completed-Berkasku refresh retains its cache, offline and sign-in conditions; the network service, when reached, posts `Berkas/GetBerkas` with `selesai=true` (`0xd15020..0xd15068`). There is no demonstrated primary-detail reread or Activity writer in this completion path.

Outer callback `0xd9129c` schedules a delayed result closure with a shipped duration of **300,000 microseconds (nominal 300 ms)** and does not await that delayed Future. The composer ordinarily pops after its awaited callback returns. The delayed closure checks the originating context is mounted; when first/error is not true it invokes another common stack pop, then both ordinary success/error paths show the result message with **Tutup**. Tutup resolves its own dialog context through `0x7273d8`. Timing and exact visible destination are not runtime-observed.

**Exceptional refinement:** controller catch `0xd91490..0xd914bc` loads pool `0x336e0`, a shipped constant tuple whose first value is **false** and message is **Terjadi kesalahan saat mengirimkan Rating Berkas**. It does not start the completed-list refresh in that catch. Because the outer delayed closure tests the first value, this fallback can follow the same extra-pop branch as a normal false-error result while displaying error text. It is **not evidence of server acceptance**, and an implementation must not label this exceptional path “submitted” or automatically retry it. Any browser distinction between not-sent and unknown delivery must be documented as an adaptation.

## Remaining implementation boundary

The native contract is now bounded and reproducible; the browser writer remains disabled in `webapp/private/operations.mjs` (`enabled=false`, `supported=false`, `inspectOnly=true` at the audit time). This audit did not activate it. A future implementation still needs source ownership binding, exact scalar encoding, strict response handling, single-submit/result-state handling and meaningful synthetic tests before any separately authorized real rating. Static proof supplies neither server authorization nor idempotency, retry safety, legal receipt or current account eligibility.

No APK runtime, hardware, geotag/visit submission or production rating was exercised. These findings do not close the separate inline Berkas map gap or demonstrate full application parity.
