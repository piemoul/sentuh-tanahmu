# Hak Tanggungan detail: native model and visible behavior

The examined HT detail page is a **list of certificates**, titled **“Daftar Sertipikat”**. It does not reuse the analog or electronic land-certificate detail model. Each row shows a name, a certificate number, a right type, and an `A`/`E` badge. The page has a local search control; the examined rows have no tap action.

This is static evidence from Sentuh Tanahku 6.1.5 ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. This audit made no production requests, read no credentials, and did not modify frontend or backend behavior. It does not establish runtime server acceptance or pixel-level native UI parity.

See [HT-DETAIL-FLOW.md](HT-DETAIL-FLOW.md) for the selected parent HT record, navigation, lifecycle dispatch, and request authorization. The detail-specific findings below are sufficient to build a structured browser list without inventing another API call.

## Response and model

The existing GET `legacy/GetSertipikatHTDetail` sends `haktanggunganId`. The request call is `0xd446dc`. The returned HTTP body is asserted to be a **direct list of maps** at `0xd446f4`–`0xd44734`; it is not read from a JSON `data` property. Mapping closure `0x785410` allocates `wIb` and invokes parser `0x785470`.

`wIb` is CID 817, size `0x1c`, with five nullable string fields. For every field, the parser reads the PascalCase key first and reads its camelCase counterpart **only if the first value is null**. An empty PascalCase string remains an empty string. A non-null value of the wrong type fails the native string type check; it is not replaced by the alias.

| Preferred JSON key | Null fallback key | Model offset | Preferred key load | Store |
|---|---|---|---|---|
| `HaktanggunganId` | `haktanggunganId` | `+7` | `0x7854a8` | `0x78553c` |
| `Nama` | `nama` | `+0xb` | `0x785570` | `0x785604` |
| `NomorHak` | `nomorHak` | `+0xf` | `0x785638` | `0x7856cc` |
| `Nibel` | `nibel` | `+0x13` | `0x785700` | `0x785794` |
| `JenisHak` | `jenisHak` | `+0x17` | `0x7857c8` | `0x785854` |

The examined parser contains no status field, nested owner list, value of mortgage, date field, map geometry, or document payload. The parent's HT list model (`vIb`) is different and must not be treated as this detail model.

## Layout and row predicates

`cJb` (CID 6183) uses state `dJb` (CID 5365). Outer builder `0x956eb0` loads **“Daftar Sertipikat”** at `0x956ef0`. It combines controller error, loading, and detail-list state through `0x956fec`, then invokes body builder `0x9570b0`.

The body places the search control above a scrolling list. Row callback `0x957530` indexes the currently displayed list and passes that record to `0x9575a8`. The examined row builder places these three text lines in this order:

| Line | Value expression | Evidence |
|---|---|---|
| First | `Nama ?? '-'` | Field `0x9576a0`, fallback `0x9576b0` |
| Second | `NomorHak ?? Nibel ?? '-'` | Fields `0x957770` and `0x957780`, fallback `0x957790` |
| Third | `JenisHak ?? '-'` | Field `0x957850`, fallback `0x957860` |

The column assembly stores those three text widgets in order at `0x957940`, `0x957954`, and `0x957968`, with spacing between them. There are no separate “Nama”, “Nomor Hak”, or “Jenis Hak” field headers in this row builder. `HaktanggunganId` is not displayed.

A right-side badge is **`A` if `NomorHak` is non-null**, otherwise **`E`**. The field read and null branch are `0x957a08` and `0x957a14`; literals are loaded at `0x957a68` and `0x957aec`. This is a null test, not a nonempty-string test. Consequently:

- `NomorHak: ''` gives an empty second text line and an `A` badge, even if `Nibel` is populated.
- `NomorHak: null, Nibel: 'fixture-number'` displays that Nibel and an `E` badge.
- Both number fields null give `'-'` and an `E` badge.

The examined detail page does not render the selected parent HT's `NomorHT`, `TahunHT`, or `Nilai` as an additional heading or summary. Those belong to the preceding HT list screen. No document, map, share, edit, or submission button is present in the bounded detail row/page builders. Row builder `0x9575a8`–`0x957c1c` constructs presentation widgets only; it has no callback closure or navigation call.

## Local search

The input placeholder is **“Cari nomor hak”**, loaded at `0x957280`. Listener `0x78588c` invokes the state update flow `0x7858c4` → `0x785928`; predicate `0x785a54` filters the source list. The query is read from the text controller and passed through the string normalizer at `0x78599c`. There is **no trim call** in this query path.

The predicate is equivalent to:

```text
lower(Nama).contains(lower(query))
OR lower(JenisHak).contains(lower(query))
OR lower(NomorHak).contains(lower(query))
```

Field reads are `0x785a80`, `0x785ae8`, and `0x785b58`. `Nibel` and `HaktanggunganId` are not searched, even though Nibel can appear as the displayed number. Filtering preserves source order and has no network call.

The string normalizer selector is `-0xffc`: CID 94 resolves to `0xe25e24`, CID 95 to `0xe25d88`. The one-byte implementation uses a 256-entry table at pool offset `0xdd80`. A dedicated bounded metadata export recorded only four mappings: `A → a`, `a → a`, `Z → z`, and `z → z`. The contains selector `-0x1000` resolves to `0xca6c90` / `0xca6b7c`, using the default start index zero and substring search. Full Unicode equivalence between Dart's normalization and JavaScript's `toLowerCase()` is not established by this audit.

The native predicate asserts non-null values for each searched field as that OR branch is evaluated (`0x785bbc`, `0x785bc0`, `0x785bc4`). A browser implementation that treats a missing field as an empty string avoids that native failure mode; this should be described as a robustness difference, not an exact reproduction of the native null behavior.

## Loading, failure, and empty state

The combined tuple supplies error at `+0xb`, loading at `+0xf`, and list at `+0x13`. These originate from controller fields `+0x3b`, `+0x43`, and `+0x1b`, respectively.

- Error true is checked first (`0x9570fc`) and displays the literal **`error!`** (`0x95710c`).
- Loading true is checked next (`0x95715c`) and places the `mTb` loading widget in a centered parent (`0x957178`).
- Normal data renders the search and rows. The current filtered list controls whether the list is populated.
- The empty branch (`0x957408`) allocates a bare `Xta` widget through `0xd1d3a8` and inserts it without a child or text assignment. **No empty-result label is present in this branch**; the search control remains visible. “Tidak Ditemukan” would therefore be added browser copy, not a recovered native label.

## Evidence and verification

The machine-readable ledger is [recovered/ht-detail-ui.json](recovered/ht-detail-ui.json). Nine bounded assembly windows and the four-row metadata file are hash recorded. The verifier compares all **1,744** extracted instructions directly with the original ELF, checks five model key pairs against the recovered pool, verifies four dispatch entries, and checks the safe ASCII mappings.

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_ht_detail_ui.py
```

The optional safe metadata reproduction command is `analysis/rea/export_ht_case_metadata.cmd`. Its dedicated Blutter flag `--ht-case-metadata` emits only four numeric input/output pairs from the allowlisted pool table. It does not dump the object pool, arbitrary strings, account data, or credential material. `analysis/rea/build_ht_detail_ui.py` deterministically assembles the reviewed source windows and ledger; it does not make production requests.
