# Queue read models and booking scalar conversion

Implemented the bounded `azb` list, `bzb` detail and nested `czb`/`dzb`/`ezb` parsers in [queue-models.mjs](../webapp/private/queue-models.mjs). The implementation is a standalone component: it enables no endpoint, changes no registry or UI, and performs no network operation. The original model and envelope contract remains in [QUEUE-FLOW.md](QUEUE-FLOW.md); this follow-up closes supported scalar booking conversion and records deliberate web normalization.

Evidence: [frozen ledger](recovered/queue-model-followup/flow.json), [offline verification](recovered/queue-model-followup/verification.json), [test result](recovered/queue-model-followup/tests.json), [tests](../webapp/tests/queue-models.test.mjs). Ledger SHA-256: `178f6869be1875bed2b9b3995f015123c7408b63d918fef78b167fec04660463`.

## Public component contract

| Helper | Input | Result |
|---|---|---|
| `parseQueueListJson(text)` | Raw response JSON text | `{error, data: list}` |
| `parseQueueDetailJson(text)` | Raw response JSON text | `{error, data: detail or null}` |
| `parseQueueListEnvelope(body)` / `parseQueueDetailEnvelope(body)` | Already typed body | Same normalized envelope |
| `parseQueueListItem` / `parseQueueDetailItem` | Exact model record | Detached normalized model |
| `parseQueueLocation` / `parseQueueOffice` / `parseQueueApplicant` | Exact nested record | Detached nested model |

Raw entrypoints use Node 24 `JSON.parse` reviver `context.source` to retain numeric lexemes. Queue transport must pass response text directly to these entrypoints whenever numeric booking values may be present. Calling ordinary `JSON.parse` first cannot distinguish `7` from `7.0` or recover a rounded integer. The component does not change the JSON transport of any other service.

Missing/null `error` defaults to failure; `true` returns failure before reading `data`. A present non-bool error is invalid. `false` plus missing/null data is failure; successful `[]` remains a successful empty list. A successful detail `{}` produces model defaults and empty nested models. There is no `message`, case alias, nested envelope, or HTTP-status fallback. Public failure data is `[]` for the list and `null` for detail, avoiding the native services' opposite internal tuple-flag conventions.

Exact String fields and null defaults follow the original ledger. Ordinary String values never receive numeric or object coercion. List `kode_booking` requires String members; it does not use detail booking conversion. All list and booking items retain order and duplicates, without truncation or filtering. Unknown fields are omitted and results do not share nested mutable arrays with input.

Applicant `token` remains a validated nullable String schema field but is omitted from every normalized result. No credential value was read. Tests use only a named synthetic placeholder and verify that it does not survive serialization or appear in errors.

## Booking scalar evidence and numeric normalization

The original mapper at `0x72b0e0` reads `kode` at `0x72b100`, invokes zero-argument selector `0xab4d` at `0x72b14c`, and defaults null to empty String at `0x72b168`. The saved dispatch index is `4096 + 0xab4d + cid`:

| Type / CID | Target | Supported interpretation |
|---|---|---|
| Smi / 60 | `0xa94824` | Decimal cache for -99…99; positive/negative decimal digit-generation paths |
| Mint / 61 | `0xdedbd0` | Bootstrap native String conversion; matching SDK `Mint::ToCString` uses signed decimal |
| Double / 62 | `0xa944a0` | String cache/positive-zero fast path; bootstrap conversion at `0xdeda98` |
| bool / 63 | `0xa94488` | Exact pool strings `true` and `false` |
| OneByteString / 94; TwoByteString / 95 | `0xba0cec` | Returns the receiver unchanged |

Eight instruction windows match **484 ELF instructions**, with **25 markers**, **six dispatch entries**, **eight public pool bindings**, the 199 String cache entries and 200 decimal digit bytes. The exact APK ELF SHA is `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. The original queue ledger and mapper hashes remain unchanged.

Mint and Double stubs reference the same native-function pointer. Blutter does not export that native function's semantic name. Identification as the number String conversion is supported by the dispatch behavior and matching local Dart 3.12.2 primary runtime sources, rather than a recovered symbol name. The ledger pins those source hashes, including `runtime/lib/double.cc`, `runtime/vm/object.cc`, `runtime/vm/double_conversion.cc` and the bundled `double-conversion` implementation.

The Dart and `EcmaScriptConverter` configurations use the same shortest-decimal algorithm and exponent thresholds (-6 inclusive, 21 exclusive). Dart additionally retains negative zero and appends `.0` to decimal integers. Its actual shortest halfway branch rounds to even in `bignum-dtoa.cc`; the header's contrary comment is stale. An offline C++ oracle compiled directly against the pinned bundled converter produced **1,079 frozen reference vectors**, including signed zero, subnormals, largest finite values, threshold neighbors and halfway decimals. All match the queue implementation. This is reference-library execution on this PC, not APK execution or an exhaustive enumeration of IEEE754 values.

| Raw `booking[].kode` | Normalized String |
|---|---|
| `7` | `"7"` |
| `7.0` or `7e0` | `"7.0"` |
| `-0` | `"0"` |
| `-0.0` | `"-0.0"` |
| `9007199254740993` | `"9007199254740993"` |
| `9223372036854775807` | `"9223372036854775807"` |
| `1e20` | `"100000000000000000000.0"` |
| `1e21` | `"1e+21"` |

Signed64 integer tokens are parsed with BigInt internally and emitted as decimal strings; no BigInt reaches public JSON. `jumlah_berkas` retains Number output within the safe integer range and uses decimal String outside that range, through the complete signed64 range. Missing/null count remains Number `0`; negatives are retained. This mixed representation is an explicit lossless web normalization. Raw `7.0`, `7e0` and `-0.0` are rejected for the int-only count. Already typed body helpers accept safe integer Numbers for count, while any untagged Number used as a booking code requires raw JSON.

## Explicit web boundaries and validation

- `INVALID_QUEUE_RESPONSE`: malformed envelope/model, non-scalar booking code, wrong ordinary field type, non-JSON record, sparse array, or schema accessor. Errors are sanitized and contain no payload values. Unlike native internal caught-failure tuples, these helpers throw and leave HTTP/error presentation to their caller.
- `QUEUE_RAW_JSON_REQUIRED`: numeric booking value was already decoded, or the runtime does not expose the required numeric source lexeme. The component does not guess whether a Number originated as int or double.
- `UNSUPPORTED_QUEUE_NUMBER`: integer token outside signed64, nonfinite double, or unsafe/non-integer Number passed as an already typed count. Native JSON integer-overflow and nonfinite fallback semantics were not audited, so those cases are explicitly bounded.
- Native arbitrary-object `toString` and general non-JSON Iterable semantics are not emulated. Custom object conversions and getters are not executed. No arbitrary scalar String coercion is used.
- Numeric token classification is the queue web decoder boundary; this follow-up does not audit the original native JSON decoder implementation. Server acceptance, identity/session integration and remote queue behavior remain separate evidence scopes.

Validation completed: **21 Node tests, zero failures**, including the 1,079 reference vectors, malformed/default/empty/error cases, all exact String fields, order/duplicates, lossless integers/counts, privacy omission and accessor/prototype boundaries. Network requests, credential access and APK runtime tests: **zero**.

Reproduce offline:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_models.py
.\tools\runtime\node.exe --test webapp/tests/queue-models.test.mjs
```

The optional oracle builder uses the existing local MSVC compiler and pinned local Dart sources only. `analysis/recovered/queue-model-followup/build-oracle.cmd` compiles it; `analysis/rea/build_queue_double_vectors.mjs` verifies or creates the immutable vector fixture. Neither downloads dependencies nor contacts a service.
