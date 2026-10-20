# Native Aktaku list and local interactions

The supplied Sentuh Tanahku 6.1.5 APK supports an Aktaku list whose certificates are already nested in the list response. Expanding a card does not require a second record-detail request. This audit proves the list request, three response models, search, card/certificate rendering, expansion, retry, information legend, and navigation into the separate Rating PPAT screen. It does **not** establish the complete rating workflow or its submission contract.

Evidence is static ARM64 code from `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No production requests, account reads, credentials, or dynamic native observations were used. The bounded ledger is `analysis/recovered/akta-flow.json`; its 16 instruction windows and two four-row case tables are verified against the original ELF and existing dispatch table by `analysis/rea/verify_akta_flow.py`.

## Request and lifecycle

`Iyb` (CID 6295) creates `_Jyb` (CID 5471) through dispatch selector 49635, index 60026 → `0x9f7d3c`. State initialization dispatch selector 52643, index 62210 → `0x725654`. Its bootstrap `0xd1b728` invokes an authorization helper at `0xd1b778`, list controller `0xd1c9cc` at `0xd1b798`, and registers local search/list listeners. This audit does not exhaustively trace authorization helper `0xd1cf2c` or all scheduled bootstrap side effects. Existing session and authorization controls must remain in force.

The list controller reads its authenticated profile, takes field `+0xf` as NIK (`0xd1ca94`), and substitutes the empty string if absent. Builder `0xd1cc2c` constructs **GET `Akta/GetAktaList?nik={value}`** and calls the existing GET transport at `0xd1ccc4`. No new endpoint or arbitrary NIK input is necessary for the web list.

Only HTTP 200 enters the successful-body branch (`0xd1ccdc`). If the body is a string, it is JSON-decoded at `0xd1cd18`. The code reads the exact key **`message`** at `0xd1cd28` and requires it to be a List before calling parser `0x727858` at `0xd1ce14`. A missing/null/non-list `message` yields an error flag with an empty list (`0xd1ce44`); HTTP failure does likewise (`0xd1ce70`). The controller emits an empty list on that flag (`0xd1cb58..0xd1cb9c`). A top-level array is not the native response contract. This explains an empty UI on a bad envelope; it does not make that envelope a successful response.

The list is in source order. Pull-to-refresh and “Coba Lagi” share callback `0x87af44`, which calls the same controller with the force-reload argument at `0x87af94`. The callback does not select an individual Akta ID.

## Exact model contract

Keys are camelCase only. No PascalCase fallback appears in these parsers. Nullable string fields are cast as `String?`; numeric, boolean, array, or object values are not coerced into strings. Null and empty strings are different.

| Model/parser | Field | Native offset | Type/default |
| --- | --- | --- | --- |
| Fyb, CID 788, `0x72794c` | `aktaId` | `+0x7` | String? |
| Fyb | `nomor` | `+0xb` | String? |
| Fyb | `tipe` | `+0xf` | String? |
| Fyb | `jenisPihak` | `+0x13` | String? |
| Fyb | `tglAkta` | `+0x17` | String? |
| Fyb | `tglLapor` | `+0x1b` | String? |
| Fyb | `namaPPAT` | `+0x1f` | String? |
| Fyb | `readyToRatingPPAT` | `+0x23` | bool? input; null/missing defaults to **true** |
| Fyb | `sertipikatAkta` | `+0x27` | List of Eyb; null/missing → [] |
| Eyb, CID 789, `0x727ea4` | `nomorHak` | `+0x7` | String? |
| Eyb | `statusEl` | `+0xb` | String? |
| Eyb | `wilayah` | `+0xf` | List of Byb; null/missing → [] |
| Byb, CID 790, `0x72815c` | `nama` | `+0x7` | String? |
| Byb | `tipeWilayah` | `+0xb` | String? |

`readyToRatingPPAT`'s null fallback is explicitly Dart true at `0x727d20`. It must not be inferred false from a missing field. `sertipikatAkta` maps through `0x727db0`; `wilayah` maps through `0x728068`. Full key-load, type-check, and store addresses for all fourteen fields are in the ledger.

## Visible content and order

The screen title is **“Aktaku”** (`0x87a0c8`); the search placeholder is **“Cari akta”** (`0x87a2c0`). The description is **“Akta yang ditampilkan terhubung dengan nomor identitas pengguna.”** (`0x87a4e0`). When data is missing or loading, body `0x87a93c` creates the native spinner at `0x87a9fc`. An empty filtered list shows **“Kamu belum memiliki Akta”** (`0x87abf0`) and **“Coba Lagi”** (`0x87ad40`). There is no separate no-search-results label in this body.

Card builder `0x87b204` assembles these two lines, followed by nested certificates and applicable local controls:

```text
(tipe ?? '') + ' No. ' + (nomor ?? '-')
'Tanggal ' + (tglAkta ?? '-') + ' sebagai ' + (jenisPihak ?? '-')
  + ' dan sudah dilaporkan pada ' + (tglLapor ?? '-')
```

The dates are the raw supplied strings; no date formatter occurs in this card. Empty strings stay empty; only null/missing values use the listed fallbacks. `aktaId` and `namaPPAT` are not extra card-summary lines.

The initial nested-certificate list is collapsed: the local bool is false at `0x87b08c`, and the false branch calls `take(1)` at `0x87b558`. Only when the nested count is greater than one (`0x87b724`) is the local toggle displayed. Its labels are **“Lihat semua”** and **“Tampilkan lebih sedikit”** (`0x87b76c`/`0x87b760`). Callback `0x87baa8` uses `0x87bb10` to flip this local bool; there is no request. An empty nested list instead displays **“Gagal mengambil Sertipikat”** (`0x87b998`).

Each certificate in renderer `0x87bb38` displays:

1. `'Sertipikat Nomor ' + (nomorHak ?? '-')`.
2. Each `wilayah` element formatted as `titleCaseWhole(tipeWilayah) + ' ' + titleCaseWhole(nama)`, joined with `', '`. An empty region list displays **“Wilayah tidak tersedia”** (`0x87bd54`).
3. Badge **A** if and only if `statusEl` is the string **`'0'`**; otherwise **E** (`0x87bf50..0x87bf8c`). Numeric zero must not be accepted or coerced by the strict model guard.

`titleCaseWhole` is first-character uppercase plus the lowercase remainder of the *whole string*, not title case for each word (`0x87c140..0x87c2f0`). It does not trim; an empty input remains empty. Native code asserts both region strings non-null when rendering a region. Safe browser treatment of a nullable region field should be described as a robustness difference rather than exact native crash behavior.

The information action `0x87c320` opens a local dialog built at `0x87c398`: **“Informasi”**, **“A : Sertipikat Analog”**, **“E : Sertipikat Elektronik”**. It does not fetch data.

## Local search and casing proof

Search lowercases the input at `0x728c00` and does **not** trim it. Predicate `0x728cb8` checks a case-insensitive substring OR in this exact order:

```text
nomor → tipe → jenisPihak → tglAkta → tglLapor
```

There is no search over `aktaId`, `namaPPAT`, nested certificate numbers, regions, or the rating flag. The filtered subset retains source order. Each evaluated native search field has a non-null assertion. A browser implementation can avoid a native null crash by treating null as empty, but should record that deviation. Leading/trailing query spaces must not be removed merely for convenience.

Lowercase selector `-4092` and contains selector `-4096` reuse the previously verified HT dispatch evidence. Uppercase selector `-4086` resolves to `0xca5d0c` for CID 94 and `0xe25cec` for CID 95. The byte-string table reader accesses pool `0x1b090`.

The safe `--akta-case-metadata` Blutter option exports only four codepoint mappings from that one table: A→A, a→A, Z→Z, z→Z. Together with the existing four lowercase mappings A→a, a→a, Z→z, z→z, this proves the ASCII direction without exporting the complete pool/table. Reproduction command: `analysis/rea/export_akta_case_metadata.cmd`. Full Unicode equivalence between Dart and browser casing is not established.

## Actions and explicit remaining gap

The ordinary Akta card has no proven detail-navigation request. The nested certificate renderer contains no tap, map, download, share, or navigation callback; its only closure is the region formatter. Do not create a guessed `GetAktaDetail`, document URL, or certificate route from this response.

There **is** a distinct native Rating PPAT entry. Inside the nonempty-certificate branch, `readyToRatingPPAT` is tested at `0x87b62c..0x87b634`. True creates `Jz` (CID 6293) at `0x87b698`, with `aktaId ?? ''`, `namaPPAT ?? ''`, and the controller. `_Oyb` callback `0x8127a4` invokes local navigation at `0x812804`; target builder `0x81281c` constructs `Kyb` (CID 6294), preserving all three fields. That is a separate screen, not evidence of an Akta-record detail request.

This audit stops at that entry. The Rating PPAT screen's initialization, questionnaire reads, automatic prompt, answers, and writes are not yet established. A non-actionable rating notice can acknowledge this missing native function. Do not label the Aktaku experience fully 1:1, enable the existing inspect-only rating operations, or invent rating parameters based on this audit.

## Offline verification and regression cases

Run:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_akta_flow.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_akta_flow.py
```

Verified on 2026-10-18: original ELF SHA-256, 18 evidence-source hashes, **4,269 exact instructions**, fourteen model field keys/types/stores, eight dispatch entries, and eight safe ASCII mappings. This is static evidence verification, not a production feature test.

Useful frontend regressions are: JSON-string and object envelopes; missing/non-list `message`; rejection of direct-array envelopes; exact camelCase versus PascalCase; string-only fields; null/empty distinction; null rating defaults true versus explicit false; empty/one/multiple certificates; expansion preserving all source rows; `'0'` versus other strings/null badge behavior; first-character-only region casing; search over each of the five allowed fields and no excluded fields; query spaces preserved; local toggles/legend producing no request; retry using only the existing list operation; HTML escaping of every supplied string. Native null assertions and full Unicode differences should remain documented.
