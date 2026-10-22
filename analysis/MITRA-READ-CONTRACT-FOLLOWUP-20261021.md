# Mitra read contract follow-up, 2026-10-21

The five existing Mitra reads have a positive typed native contract. A custom decoder should require **HTTP200 and body.data List**, permit **one service JSON decode when the already transformed body is a String**, and ignore unrelated envelope `error`/`message` values. Parent navigation uses the exact native nullable ID fallback, **ID ?? empty String**, with no trim. This supersedes the older browser-only blank-ID restriction; it does not change the frozen earlier tests or evidence.

This is a read-only follow-up to [MITRA-FLOW.md](MITRA-FLOW.md), [root ledger](recovered/mitra-flow.json), [PPAT ledger](recovered/mitra-ppat/ppat-flow.json), [Surveyor parent ledger](recovered/mitra-surveyor/surveyor-parent-flow.json), and [Surveyor display ledger](recovered/mitra-surveyor/surveyor-display-contracts.json). No APK/runtime execution, new native export, production request or application edit is performed by this contract audit. The original libapp.so SHA256 remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

## Fixed request set

| Native GET call | Main-client path | Parameters | Model |
|---|---|---|---|
| `d3af08` | `Mitra/GetKantorPPAT` | none | DFb |
| `d3b428` | `Mitra/GetPPATList` | query `kantorId`, exact selected String | CFb |
| `d3b910` | `Mitra/GetWilayahSurveyor` | none | FFb |
| `d3be30` | `Mitra/GetSurveyorList` | query `wilayahId`, exact selected String | EFb |
| `d3aa20` | `Mitra/GetPenilaiList` | none | BFb |

All call shared GET`7017a4`, read service`+7`→FRb`+7`, and provide no per-call request body, options or alternate service. The established main initial base is `https://sentuh.atrbpn.go.id/`. Ordinary LRb behavior adds stored account Authorization when a session exists and otherwise forwards without it; this matches the existing `optionalSession` adapter role. It does not create a new auth/application-credential requirement. Session refresh, default main GET/form Content-Type and scoped verified TLS remain existing shared behavior, not new Mitra-specific metadata.

The two child services interpolate a raw ID after the literal `?kantorId=` or `?wilayahId=` in the native path. Browser URL encoding that keeps an ID in one query value is an explicit existing transport adaptation; do not introduce manual ID entry, trim or ID aliases to compensate. Do not infer a second office/region lookup from the child request.

The bounded ranges do not independently close final native URI escaping for `*`, `~`, literal plus, space, percent or ampersand inside arbitrary IDs. No caller encodeComponent appears in these service ranges. Preserve the existing browser query-value encoding as a named containment adaptation rather than claiming those exact wire bytes equal raw native interpolation. Native selected String identity and browser query-value equality are distinct from final byte parity.

## Response and decode order

Each complete retained service applies its own HTTP200 comparison: Kantor`d3af20`, PPAT`d3b440`, Wilayah`d3b928`, Surveyor`d3be48`, Penilai`d3aa38`. A different normally returned2xx does not produce a successful typed list. Shared status/transport processing occurs before these service checks.

The service examines the already transformed response body. If its CID is String94/95, it invokes JSON decode exactly once (`d3af5c`, `d3b47c`, `d3b964`, `d3be84`, `d3aa74`); otherwise it uses that value directly. It then looks up the literal `data` key and requires a nonnull List. It does not recursively unwrap Strings, accept a bare List, substitute `message`, or search arbitrary aliases.

The existing main response transformer is relevant before that one service decode. Under JSON MIME, an outer JSON String can become a String and receive the service decode; ordinary JSON Map receives none. Under non-JSON MIME, text can receive that one decode. Consequently JSON-MIME encoded-String→Map and text/plain ordinary-JSON→Map may work, whereas text/plain quoted-JSON→String still fails the subsequent envelope/list contract. Do not implement unconditional recursive decode or MIME-agnostic repeated parsing. The already frozen [shared codec proof](recovered/lost-review-post-protocol/source-index.json) binds main JSON-MIME fatal UTF8/JSON transformation, non-JSON replacement UTF8, and the explicit same-version SDK/parser boundaries. No new codec or full MIME-parser claim is made here.

The optional service String parser is a separate step from that fused byte codec. Initial BOM handling in a non-JSON raw String, or a BOM inside an outer JSON-String value, is not independently closed here. A browser String-parser choice at that edge is an explicit parser boundary; do not silently infer identical handling from the earlier byte-decoder BOM proof.

No service reads `body.error`, `body.message`, pagination metadata or unknown row fields. A valid typed `data` List can succeed even if `error:true`, or if those unused fields have unrelated types. Preserving an outer envelope is a browser adapter representation; it must not impose an invented error/message schema or generic business-error rejection.

An empty List is successful `(false, [])`. Null/missing/non-List data, malformed JSON, invalid item/model types, non200 or thrown service failures produce the native error/empty-list result `(true, [])`. A malformed row invalidates the conversion; there is no native bad-row skipping or partial-list fallback. The controllers forward the tuple's list and clear busy state. Existing browser-visible network/protocol errors, session-expiry cleanup and stale ownership protection may remain clearly identified robustness adaptations rather than presenting invalid data as a successful empty response.

## Exact model fields

Every accessed field below is **String?**: missing or null becomes null; empty/whitespace Strings survive; numbers, booleans, Lists and Maps fail the field cast. There is no model-level numeric/date parsing or String coercion. Extra fields not listed are not inspected.

| Model | Fields retained in native model | Additional fields type-checked, then discarded |
|---|---|---|
| DFb, kantor | `kantorId`, `nama` | `kode` |
| CFb, PPAT | `nama`, `alamatKantor`, `tmtPensiun`, `totalAkta`, `isPPAT`, `nomorSK` | `tempatKedudukan`, `status` |
| FFb, wilayah | `wilayahId`, `nama` | none |
| EFb, surveyor | `nama`, `jenisSurveyor`, `nomorLisensi` | none |
| BFb, penilai | `nama` | none |

Positive examples are DFb parser`7749e8` (`kode` read`774a78`, String? cast`774aac`, retained stores`774b20/28`), CFb parser`77506c`, FFb parser in`775900` range, EFb parser`7760c4` and BFb parser`774450`. The retained ledgers bind each accessed key/cast/store. A discarded String field must still be validated; silently dropping a wrong-type `kode`, `tempatKedudukan` or `status` would broaden native acceptance.

## Navigation, defaults and autoload

The category order is PPAT, Surveyor, Penilai. Existing parent states call their controllers from init: kantor`774880→d3ad14`; wilayah`7759c4→d3b71c`. A browser initial PPAT-root autoload is a deliberate entry arrangement consistent with the first native category; no claim about Flutter eagerly constructing every offscreen category is needed.

PPAT selected-row builder`90fb50` reads DFb.kantorId, substitutes empty String **only when null** at`90fb84..98`, and stores the exact result in child KFb`+0xb` at`90fbd0`. Its title context separately uses `nama ?? "No Address"`, then removes every literal `Kantor Pertanahan `. Child init`774e94` reads widget`+0xb` and calls controller at`774ef4` without a blank-ID guard. Default child mode is0 at`774f28`: PPAT exact `isPPAT=="1"`; PPATS mode1 exact `"0"`.

Surveyor selected-row builder`912204` substitutes empty String for null wilayahId at`91222c..38`, stores child SFb`+0xb` at`912264`, and separately passes `nama ?? ""` as title context. Child init`775eec` reads that ID and calls controller`d3bc04`; the service forwards it unchanged. Default Surveyor mode0 matches exact `Surveyor Kadaster`; mode1 matches exact `Asisten Surveyor Kadaster`.

Thus missing/null IDs are **not alias lookups** and **not disabled rows**: a valid parent model yields empty child ID. Empty and whitespace String IDs also remain actionable. Wrong nonnull ID types still invalidate the parent model. `id`, `kantorID`, display name, or other unproven aliases must never replace the native key.

Search and category switching remain local, with untrimmed lowercase query. Native search has nullable field assertions; null-safe browser search is an explicit robustness adaptation. PPAT's `totalAkta` is a nullable String in the model and receives int.tryParse only in display logic. Raw `tmtPensiun` is displayed without date reformat. Existing field labels, exact tab predicates, act-count buckets and source-order behavior remain the frozen earlier contracts; no contact/detail endpoint is invented.

## Verification and legacy test correction

Actual read-only command:

```text
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_mitra_flow.py
```

It exited0 during this follow-up: **4 frozen ledgers, 41 unique source hashes, 10,161 instruction occurrences / 8,792 unique instructions, 7 dependencies, 194 decisive markers, 94 pool literal references, 24 dispatch entries**, artifact SHA verified, zero production requests/application changes. These are reused evidence rechecks, not newly extracted instructions; overlapping counts are not added to prior totals.

The old immutable `review_partner_flows.mjs` includes two tests for the deliberately stricter historical browser guard. The alias-only assertion expects null even though native missing kantorId becomes empty String; the next test rejects missing/empty/whitespace IDs. Those expectations contradict the positive navigation above. A separately named successor may correct only these expectations, preserving every other assertion and the original failure receipt. It must not skip tests or retain a false1190-green claim by bending the runtime back to the obsolete guard. An additive provenance map must identify the exact two test changes and distinguish the original expected failures from successor success.

Contract pins and the actual verifier result are collected in [source-index.json](recovered/mitra-read-contract-followup/source-index.json). This follow-up does not establish live service availability, account permissions, server content, complete Unicode casing/parser equivalence, or every native runtime layout. No current native/external server test is claimed.
