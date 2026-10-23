# Tanya Berkas: native form codec closure

This bounded offline follow-up closes the POST key-codec and safe-character-table gap left by [the business workflow audit](BERKAS-QUESTION-FOLLOWUP-20261022.md). It uses the same Sentuh Tanahku **6.1.5** ARM64 artifact and does not rewrite the earlier proof. No app, provider, emulator, Docker, account or transport action was performed.

## Implementable POST contract

Serialize the ordered String fields **`berkasid`**, then **`content`**, as `encode(key)=encode(value)`, joined by `&`. Preserve the original selected ID and untrimmed editor String. Both key and value use:

- UTF-8, with each unpaired UTF-16 surrogate replaced by U+FFFD (`EF BF BD`). Valid surrogate pairs form their normal Unicode scalar.
- Safe ASCII **letters, digits, `-._~`**.
- ASCII space encoded as **`+`**.
- Every other byte encoded as uppercase **`%HH`**.
- Original line endings: LF → **`%0A`**, CR → **`%0D`**, CRLF → **`%0D%0A`**. There is no LF-to-CRLF normalization in this complete scalar path.

Consequently `*` becomes `%2A` and `~` remains literal. Plain `URLSearchParams` has different behavior for those two characters. A JavaScript implementation using `encodeURIComponent` must repair malformed UTF-16 first, then additionally escape `!'()*`, map `%20` to `+`, and retain uppercase hex. This is implementation guidance derived from the native algorithm; no browser/app parity test is claimed by this static proof.

## Positive native evidence

**BQ-CODEC-01, field and value path.** The existing writer constructs the two fields in order at `d99448..d99514`. The non-JSON Map branch calls `6fb938`; its scalar callback resolves String `toString` to identity at `ba0cec` for both native String CIDs 94 and 95, then calls `42eb74` at `6fba20`. Shared final-body conversion calls the UTF-8 converter at `d0caec`; the percent-encoded form String is ASCII, so those octets are preserved.

**BQ-CODEC-02, key closure.** Pool **`+cbe8`** is the retained `alc` closure. Its absolute entry minus the retained matching ELF load base gives **`6bd4d4`**. That native entry defaults to codec pool `+c50` and calls **`42eb74` at `6bd53c`**. The latter supplies **mask 1** and **space-to-plus=true** to `42ded4`. This closes the key closure's native entry rather than assuming it from its name.

**BQ-CODEC-03, exact ASCII table.** The retained allowlisted snapshot extractor explicitly reads the **pool `+b28` String** and all 128 `CharAt` masks. Those 256 little-endian table bytes have one exact occurrence in the pinned ELF at file offset **`ee21b`**. Native encoder loads of pool `+b28`, 16-bit table indexing and mask testing are retained. The table's mask-1 safe set is exactly the one stated above. Table provenance and native use establish this binding; a String search alone would not.

**BQ-CODEC-04, Unicode and malformed input.** Complete encoder `42ded4..42e288` retains safe-byte, space and uppercase-percent branches. Complete UTF-8 code `b2a318..b2aa78` retains one-, two-, three- and four-byte encoding, valid high/low-pair composition, and `EF BF BD` replacement paths for low surrogates, high/nonpair combinations and a trailing high surrogate. The encoder substitutes only ASCII space; raw LF and CR remain their original bytes before percent escaping.

## GET remains ordinary URI processing

**BQ-CODEC-05.** `d28244..d28258` constructs **`TanyaJawab/GetTanyaJawabBerkas?berkasid=` plus the original selected String directly**. It adds no caller query map or encoder. Shared `6bc4a8..6bc738` combines base and path, appends a separately supplied query-map result only when nonempty, then calls URI parser **`439100`** and normalization through dispatch at `6bc6f4`.

Do not silently replace that GET construction with a form/query-map encoder. An immutable selected ID known to contain ordinary ASCII letters, digits and hyphens can be interpolated unchanged. Broader admission requires an explicit supported-domain policy or complete Dart URI parse/normalization behavior. This pass does **not** close arbitrary GET Unicode, malformed UTF-16, percent escapes, query delimiters or fragment normalization, and does not claim equivalence to the browser URL implementation.

## Retained proof and verification

- ELF SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool SHA-256: `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- [New ledger](recovered/berkas-question-codec-20261023/flow.json) SHA-256: `b3b27e8bebd12e1e0b56ce522fd9380c5bcc9e777921378f8b23817d08648afb`.
- [Detailed report](recovered/berkas-question-codec-20261023/REPORT.md), [verification](recovered/berkas-question-codec-20261023/verification.json), [builder](rea/build_berkas_question_codec_20261023.py), [independent verifier](rea/verify_berkas_question_codec_20261023.py).

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_question_codec_20261023.py
```

The independent verifier passes **15 native windows, 2,433 instructions, 61 decisive markers, 93 pool bindings, 12 dependency hashes, all 128 mask entries, one unique 256-byte ELF table occurrence, two String identity dispatch entries, 16 derived vectors, 128 independent ASCII-domain checks and an ordered sample body**. It decodes ELF bytes and recomputes pool annotations, closure arithmetic, table provenance and semantic models independently from the builder. The vectors are derived static-model checks, not APK execution or packet capture.

The resulting claim is a closed static **POST scalar encoding contract**. Current server acceptance, complete HTTP/framework/adapter equivalence, arbitrary GET URI normalization and application parity remain outside this proof. No native or browser operation is enabled merely by publishing these findings.
