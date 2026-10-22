# Rating PPAT: native 6.1.5 read contract

This additive static audit closes the question-list read and its typed models. It extends the Rating entry identified by `AKTA-FLOW.md`; it does not modify that frozen audit, enable a submission, execute the APK, or contact a provider. The separate UI follow-up owns question controls, selection state, and submit-dialog behavior.

The artifact is `id.go.bpn.sentuh` 6.1.5, ARM64 `libapp.so`, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Instruction addresses below refer to that artifact. New bounded evidence and the executable verifier are in `analysis/recovered/ratingppat-read-followup/`.

## Entry and bootstrap

The existing Aktaku proof positively binds the Rating action in the nonempty certificate branch, gated by `readyToRatingPPAT ?? true` (`87b62c..87b634`). `Jz` stores `aktaId ?? ''`, `namaPPAT ?? ''`, and the existing controller. Navigation `8127a4 → 812804 → 81281c` allocates `Kyb` at `812870`, copying those three values into `Kyb+b`, `+f`, and `+13` at `812878/812880/812888`. This is a separate form, not an Akta detail request.

Dispatch binds `Kyb` CID6294 createState to `9f7ea0`; `_Lyb` CID5470 init to `728f3c` and build to `87c830`. The UI follow-up owns the init instructions and widget presentation; the read controller called by init is `d1d4c8`.

`d1d4c8` emits busy=true through controller `+1b`, calls its service `+7 → d1d654` at `d1d528`, and awaits it. On a false error flag, it publishes the returned list through controller `+13` (`d1d554..d1d584`). A true flag publishes a fresh empty `List<Gyb>` (`d1d58c..d1d5d0`). Both paths clear busy; the outer catch clears busy and rethrows (`d1d614..d1d644`). No sorting, filtering, pagination, or Akta-specific parameter is added by this controller.

## Request and response

| Property | Positive binding |
| --- | --- |
| Method/path | GET `RatingPPAT/GetRatingQuestions`, literal `pp+50c88`, call `d1d6bc → 7017a4` |
| Client | service `+7 → FRb+7`, ordinary main client (`d1d698..d1d6a4`) |
| Call arguments | path only; descriptor `pp+40`; no explicit query, body, headers, or options |
| Local accepted status | exactly HTTP200, comparison `d1d6d4`, failure target `d1d868` |
| Body handling | String CID94/95 is JSON-decoded exactly once at `d1d710`; otherwise the already transformed body is used directly |
| Envelope | `body['data']` at `d1d720`; must be a nonnull List; no `error` or `message` branch |
| Parser | `728f88`, called at `d1d80c` |
| Success | tuple `(false, parsedList)` at `d1d824..d1d830` |
| Failure | non200, missing/null/nonlist data, invalid model, decoding/transport exception → `(true, initialEmptyList)` |

An empty `data: []` is a successful read. `error: true` in an otherwise valid envelope does not itself fail this native service. A direct list, `message` fallback, recursive String unwrapping, per-record recovery, or a default question set has no binding here. Source order and duplicate records are preserved by map followed by eager typed `toList`.

The preceding shared main transform remains relevant: JSON MIME consumes bytes through the previously bound fatal UTF8/JSON path; nonJSON uses replacement UTF8. A JSON-MIME outer String may therefore undergo the shared decode and then this one service String decode. The service-level String BOM edge and the full native Unicode/number parser internals are not newly established by this audit. Shared status rejection happens before this method's exact200 gate. See the frozen `lost-review-post-protocol` proof for that shared pipeline, and the retained main-client/session/base-selector sources for the ordinary client setup.

The initial production main base is the already bound `https://sentuh.atrbpn.go.id/`; the ordinary session interceptor applies. No separate Rating checksum, GPS field, or credential is introduced at this caller. The current browser catalog's existing session restriction can be retained. This caller does not prove that the server independently requires a session, nor that today's server accepts this read; neither was tested.

## Typed model projections

Every list element must be a `Map<String,dynamic>` (`72904c/729058` for the outer model; `729310/72931c` for nested answers). A malformed element fails the entire service; it is not skipped.

| Model | JSON key | Native type | Key load / type load | Stored field |
| --- | --- | --- | --- | --- |
| Gyb CID787 | `pertanyaanRatingPPATId` | String? | `7290ac / 7290e8` | `+7`, store `7292c8` |
| Gyb | `kategori` | String? | `72910c / 729140` | validated, discarded |
| Gyb | `indikator` | String? | `729164 / 7291a0` | `+b`, store `7292d0` |
| Gyb | `jawabanRatingPPAT` | List<Hyb>? | `7291c4 / 729228` | `+f`, store `7292d8` |
| Hyb CID786 | `pertanyaanRatingPPATId` | String? | `729370 / 7293ac` | `+7`, store `729530` |
| Hyb | `pertanyaan` | String? | `7293d0 / 72940c` | `+b`, store `729538` |
| Hyb | `jawaban` | String? | `729430 / 72946c` | `+f`, store `729540` |
| Hyb | `bobot` | String? | `729490 / 7294c4` | validated, discarded |
| Hyb | `nilai` | String? | `7294e4 / 729518` | validated, discarded |

Missing/null strings remain null. Empty and whitespace strings remain exact strings. Nonnull numbers, booleans, arrays, or objects are rejected even in the three discarded String fields. In particular, `bobot` and `nilai` are not numeric coercion sites, and there are no integer/date/large-integer model fields in this parser.

Missing/null `jawabanRatingPPAT` remains null: `7291d8 → 7292b0` supplies native null. An empty list remains empty. A nonnull value must be a List, whose items are mapped through `7292f0 → 729340` and eagerly materialized at `7292a4`. Model allocation is positively bound by `7292c0 → d1d8c0` (Gyb) and `729528 → d1d8cc` (Hyb). The exported window after `729558` is adjacent unrelated Pyb initialization and is not evidence for this Rating contract.

The parser supplies no explicit question-type discriminator, numeric score, answer-ID field separate from the named `pertanyaanRatingPPATId`, or ordering field. Controls must follow the separate positively bound UI rather than infer types from these key names.

## Submission boundary, audit only

The bounded service `d86cd0..d86f54` identifies POST `RatingPPAT/PostRatingPPAT` at `d86e10 → 6b9270`, using the same main client. It constructs the ordered map keys `aktaId` then **`PertanyaanRatingPPATId`** (uppercase P), with the third function argument used as an Object value unchanged, JSON-encodes it at `d86d78 → 6b27e0`, and explicitly supplies `Content-Type: application/json` and `accept: text/plain`. This is not proof that the Object is a string, a map, or a list; the caller must bind that shape.

After the shared response path, this writer reads the body directly, without the read service's optional String JSON decode. It reads nullable `error`, substitutes true, requires bool, and returns the inverse as the tuple's first field (`d86f28`). It requires a String message after fallback. The retained constant `pp+50c48` is the catch tuple `(false, 'Terjadi kesalahan saat Mengirimkan Rating PPAT')`. There is no separate local numeric HTTP200 comparison in this writer. This identification does not establish the caller's validation, argument shape/order, navigation, concurrency, or final success UI. Those remain the submit-boundary/UI follow-up's responsibility. No write is enabled or attempted by this audit.

## Eligible implementation and limits

The question GET and strict typed decoder can now be implemented, preserving nullable nested lists and validation of discarded fields. The existing eligible Aktaku entry can open a read-only question form after the separate UI proof closes the controls and state. UI null guards or visible error panels would be explicit browser adaptations where native assertions or empty-on-error behavior differ.

There were no provider requests, submissions, account changes, uploaded files, APK/emulator runs, or runtime edits by this audit. This proof establishes native static behavior, not complete server acceptance or a finished end-to-end Rating workflow. The source index and verification receipt pin the relevant old proof and new instruction windows; they do not claim the unrelated neighboring code is part of Rating.
