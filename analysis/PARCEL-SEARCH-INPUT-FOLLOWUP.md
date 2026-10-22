# Cari Bidang: three input/type closures

This supplement closes exactly three gaps left in the frozen Cari Bidang ledger `c110b2f22ecb811f063156ccc47e5708f31286d1ad0e4bab8492a6309077d2d7`: temporary PersilId trim, the NIBEL on-change transform, and the specialized `Type: Null?` parser checks. The old ledger, old verifier and application/backend/model/test files are unchanged by this audit. No network, account, credential, geotag, original-app execution or production action was used.

The new ledger is `analysis/recovered/parcel-search-input-followup/flow.json`, SHA-256 **7ae1307678dbce9ea051cd1c4c7acc20f9615007cf0c307f179074c999b06b61**. Its independent verifier is `analysis/rea/verify_parcel_search_input_followup.py`.

## PersilId: native blank gate, original String on the wire

Helper `447974` is already positively frozen in `collection-group-create`: it scans left `43b3c8` and right `43b5f4`, returns empty for an entirely trimmed String, returns the original String when unchanged, and otherwise takes a substring. This supplement reuses and independently re-decodes those three sources instead of dumping them again.

The exact trimmed code units are:

```text
U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A,
U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF
```

Only the leading and trailing runs are removed. Interior code units remain. JavaScript `String.trim()` alone is not identical, notably for U+0085.

The Cari Bidang controller loads `tyb.PersilId(+1f)` at `d7444c` and calls `447974` at `d74468` **only for an emptiness comparison**. In the accepted branch, it reads the original model field again at `d745b8` and returns the original parcel. Search action `d741a0` reads that original `+1f` and passes it to `d39470` at `d741d4`. Therefore:

- Native blank check: trim using the explicit set, then compare with empty.
- Boundary request ID: preserve the original nonblank String, including any leading/trailing whitespace.

Replacing the outgoing ID with the temporary trimmed String would change native behavior.

## NIBEL: remove all literal ASCII dots

The on-change call uses the changed String emitted by the input widget, a literal String **`.` (U+002E)** from pool `9f0`, and an empty replacement from pool `e0`. The surrounding `pp.txt` records alone did not identify its switchable target reliably.

An isolated metadata-only helper reads five fixed object-pool entries. Actual pool entry `3a548` is `UnlinkedCall` with target **`dyn:Qbc`**. `_OneByteString94` and `_TwoByteString95` inherit `_StringBase7414`; metadata `GetInvocationDispatcher(..., create=false)` resolves that target on the superclass to **`cb10fc`**, whose complete dispatcher delegates to **`42989c`**. No initializer or application method is invoked.

The empty-replacement branch of `42989c` enumerates matches of the literal String pattern:

1. Dispatch `-0xfe5` for String classes 94/95 reaches `ca59ec`, which constructs match-list object 7548.
2. Its iterator dispatch reaches `578320`, creating iterator 7412 with input, literal pattern and initial cursor zero.
3. `moveNext` dispatch reaches `4528d0`; it uses the literal code-unit index scans `ca6470`/`ca6188`. For a one-character pattern these compare the actual pattern code unit against successive input code units. Dot is not a regular-expression wildcard.
4. Match 7413 holds start and pattern; its bound start/end accessors return start and `start + pattern.length`. The cursor advances past each nonoverlapping match.
5. The replacement caller collects only the nonmatch spans, adds the remaining tail, then copies those spans. The short one-byte path has a retained copy body; general output uses the core native copy wrapper. Core allocation/copy runtime primitives are not independently reimplemented here.

The resulting String is interpolated at `811ad4` and passed through named `wej` to the existing setter at `811b1c`, storing it in `gFb+2f`. The original changed String is not stored instead of that result.

The closed on-change behavior is **remove every literal ASCII dot U+002E; preserve all other code units and their order**. This callback does not trim, change case, filter digits, normalize Unicode dots or enforce length.

| Changed String | Stored String |
| --- | --- |
| `12.34..56` | `123456` |
| ` . ` | two spaces |
| `A．B.C` | `A．BC` (full-width dot remains) |
| `...` | empty |
| U+0085 + `.12` | U+0085 + `12` |

This is the transform of the value **after** input-widget formatting has emitted on-change. Full `rFb`/`Dra`/`Cra` formatter bodies, caret/IME behavior and their edit restrictions remain outside this supplement. A browser must not infer digit-only input or native maximum-length/truncation behavior from this result.

## `Type: Null?` means only null at this compiled entry

Metadata binds stub `e31134..e3115c` as `IsType_Null?_Stub`. Its complete ten instructions establish:

- Small integers jump to the same null comparison.
- Heap values load a class ID, then unconditionally jump to that null comparison.
- Only `value == null` returns successfully at `e31150`.
- Every nonnull value jumps through the type-check failure trampoline loaded from `x26+280`.

The adjacent `ret` at `e31144` is unreachable from this entry because `e31140` jumps over it. It does not make the check permissive.

Parser `810d68` unconditionally calls that stub for exactly these PascalCase fields:

| Field | Model slot |
| --- | --- |
| Alamat | +7 |
| NamaWilayah | +17 |
| NomorIndukBidang | +1b |
| TipeWilayah | +23 |

With ordinary Dart `Map[]` behavior, a missing key yields null; missing or explicit null is accepted. A nonnull String, number, Boolean, list or map fails this compiled specialized parser. There is no evidence for widening these checks to `String?`/dynamic, adding aliases or unwrapping another envelope. Existing `BatasPersil`/`BatasPersilLegal`/`Luas` `int?` checks and `PersilId` `String?` remain as previously frozen.

This describes acceptance of the pinned compiled APK parser. It does not assert that live payloads always omit/null these fields, or establish current server compatibility.

## Verification

Run:

```text
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_parcel_search_input_followup.py
```

PASS independently checks **16 new windows / 1,372 instructions**, **7 inherited windows / 1,226 instructions**, **2,598 unique instructions**, **15 new + 55 inherited pool bindings**, **99 decisive markers**, **9 dispatch bindings**, **108 literal semantic checks**, and **13 dependency hashes**. It reruns the isolated metadata helper and compares its output byte-for-byte, then verifies all **23 existing shared Blutter build inputs** remain unchanged. The helper is built entirely in the new audit directory from the existing objects/libraries.

Verifier SHA-256: `c05909eb5bb3700aab774e86f5d0c294790f981254a39e53aab7e9510a6dbaac`.

Builder SHA-256: `1e31bc99a468335c89966c3af1646b4f61bbb6daf85277b1db6dfa78ee0e04c9`.

Receipt: `analysis/recovered/parcel-search-input-followup/verification.json`.
