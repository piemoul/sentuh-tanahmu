# Analog certificate detail: native UI bindings

Bounded static audit of the supplied official arm64 APK (`libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`). This covers `OIb` / `PIb`, selected when `StatusEl` is null or zero. Request, selected-ID, and authenticated-client proof is in `CERTIFICATE-DETAIL-FLOW.md`. It does not describe the electronic `QIb` / `_RIb` UI.

All evidence below comes from the snapshot and bounded disassembly. No production calls, account values, credentials, document writes, GPS changes, or integrity changes were used. The observed live response was consulted only for key/type/count compatibility.

Follow-up audits now resolve the geometry source and the configured date formats/default locale: [certificate map](CERTIFICATE-MAP-FLOW.md) and [date handling](CERTIFICATE-DATE-FLOW.md). The bounded section audit below is retained; its original map/date uncertainties should be read with those later findings. Full native map rendering and complete date-parser grammar remain unverified.

## Main display order

The main native builder at `0x9442f0` creates the following children in this exact order, then writes them into the child array at `0x9444f4` through `0x944514`:

| Order | Native section | Builder | Call site | Input |
|---|---|---|---|---|
| 1 | Certificate summary | `0x94929c` | `0x9443f4` | Whole `AIb` |
| 2 | Lokasi Bidang Tanah | `0x9471a4` | `0x944410` | Whole `AIb`, then `Persil` |
| 3 | Pemilik | `0x946904` | `0x944434` | `AIb.PemilikPertama`, `+0x1b` |
| 4 | Surat Ukur | `0x945938` | `0x944458` | `AIb.SuratUkur`, `+0x27` |
| 5 | Catatan Pendaftaran | `0x94494c` | `0x944488` | `AIb.CatatanPendaftaran`, `+0xb` |

Each nested-list section iterates its supplied list in order. Empty sections retain their title and use `Tidak ada data!` with the native page-not-found asset. The detail scaffold title is `Informasi Sertipikat`, visible at `0x94c624`.

## Summary

| Native display | Binding | Evidence |
|---|---|---|
| Main certificate number | `Nomor` | `AIb+0x17` at `0x949410` |
| Right/secondary certificate type | `JenisHak` | `AIb+0xf` at `0x9494f8` |
| NIB | **`Persil[0].Nomor`** | `AIb.Persil+0x1f` at `0x9492c0`; index zero at `0x949308`; `tyb+0x27` at `0x94931c`; displayed beneath label at `0x949680` / value at `0x9496c4` |
| Kode Blanko | `KodeBlanko` | label `0x9498f8`; `AIb+0x33` at `0x949940` |
| Tanggal Penerbitan | `ValidSejak` | label `0x949b78`; `AIb+0x2f` at `0x949bc0` / `0x949bf8`; formatter call `0x949c08` |
| Berlaku Sampai | `ValidSampai` | label `0x949e34`; `AIb+0x2b` at `0x949e7c` / `0x949eb4`; formatter call `0x949ec4` |

The NIB binding is not a semantic guess: `tyb+0x27` is serialized as `Nomor` at `0x70a930` / `0x70a940` and parsed from `Nomor` at `0x781ce4`, stored at `0x781d50`. `NomorIndukBidang` is a different field at `tyb+0x1b` and is not selected for this native summary. Only the first Persil contributes to the summary; all Persil still appear in the location section.

Summary labels remain visible when the corresponding scalar is null. Null displays as `-`. Native date formatting also maps empty/unparseable dates to `-`. The native `Persil.Nomor` parser normalizes null input to an empty string, so do not confuse a null-model fallback with an empty-string fallback.

## Lokasi Bidang Tanah

For every `Persil` / `tyb` item, preserving input order:

1. Display `Alamat` when it is not the empty string (`0x947440`–`0x947484`). When it equals the empty string, display `TipeWilayah + " " + NamaWilayah` (`+0x23` at `0x947498`, `+0x17` at `0x9474c8`). This branch compares against an empty string; it is not a generic null-or-empty test.
2. Display `"Luas " + Luas + " m2"`: prefix `0x947614`, `tyb+0x13` at `0x947628`, suffix `0x947638`.

The section also contains a native map helper at `0x947e54`, called at `0x947928`, with a callback chain through `0x948f10` / `0x949040` / `0x949248`. The follow-up [map audit](CERTIFICATE-MAP-FLOW.md) proves automatic acquisition from `legacy/GetParcelBoundaryById` using each exact `PersilId`, then the same parcel widget used by collection maps. The embedded `BatasPersil` fields are not the geometry source for that chain. Full basemap, style and map-tool parity remain unverified. Do not substitute device GPS or invented polygons.

## Pemilik

For every `PemilikPertama` / `CIb` item, preserving input order:

1. `Nama`, unlabeled primary line.
2. `TempatTanggalLahir`, unlabeled secondary line, displayed as the supplied string.

`TipePemilik` and `PemilikId` are parsed model properties but are not rendered in this helper. No extra `Jenis Pemilik` row is justified by the audited UI.

Exact proof: native calls at `0x946b9c` and `0x946c8c` use the following snapshot invocation-dispatcher cache entries:

| PP entry | Receiver | Getter name | Getter stub | Field | API property |
|---|---|---|---|---|---|
| `0x56688` | `CIb`, CID 545 | `dyn:get:GDf` | `0xcb6cd4` | `+0x7` | `Nama` |
| `0x566a8` | `CIb`, CID 545 | `dyn:get:htj` | `0xcb5504` | `+0xf` | `TempatTanggalLahir` |

Each stub only reads the receiver from the argument stack, loads that field, decompresses the pointer, and returns. The field-to-JSON mapping is in serializer `0x70a9e4`.

## Surat Ukur

For every `SuratUkur` / `DIb` item, preserving input order:

1. `Nomor`, unlabeled primary line.
2. `TipeWilayah + " " + NamaWilayah`, unlabeled secondary line.
3. Label `Luas`, value `Luas + " m2"`.
4. Label `Berlaku Sejak`, value from `BerlakuSejak` passed through the shared date formatter.

`DokumenPengukuranId` is parsed but not displayed in this helper. The native label is `Berlaku Sejak`, not a newly inferred document-date label.

| Call site | PP entry | Getter name | Getter stub | DIb field | API property |
|---|---|---|---|---|---|
| `0x945b94` | `0x565f0` | `dyn:get:Ljj` | `0xcd07b0` | `+0x17` | `Nomor` |
| `0x945c84` | `0x56610` | `dyn:get:mjj` | `0xcb9390` | `+0x1b` | `TipeWilayah` |
| `0x945ccc` | `0x56620` | `dyn:get:Yij` | `0xcaf4f8` | `+0x13` | `NamaWilayah` |
| `0x946168` | `0x56638` | `dyn:get:fjj` | `0xcb5504` | `+0xf` | `Luas` |
| `0x9462fc` | `0x56648` | `dyn:get:WNj` | `0xcb6cd4` | `+0x7` | `BerlakuSejak` |

The field-to-JSON map is proven by serializer `0x70a534`. The labels are at `0x945f4c` and `0x946068`; unit suffix at `0x94618c`; date formatter call at `0x946344`.

## Catatan Pendaftaran

**No `Status` filtering occurs in the native section.** Builder `0x94494c` iterates the supplied list directly, with iterator-next at `0x944a1c` and current-item at `0x944a44`. Every record is rendered in source order. It reads these four fields, in order:

| Order | API property | FIb field | Read |
|---|---|---|---|
| 1 | `Kolom1` | `+0xb` | `0x944a4c` |
| 2 | `Kolom2` | `+0xf` | `0x944ac0` |
| 3 | `Kolom3` | `+0x13` | `0x944b34` |
| 4 | `Kolom4` | `+0x17` | `0x944ba8` |

For each field, null becomes an empty string. The helper replaces `<br\s*/?>` with newlines, splits on newline, and maps each line through the shared TextSpan closure at `0x945820`, which appends a newline. The resulting four RichText blocks are stacked in the original column order (`0x9451fc`–`0x94521c`). This is text rendering; it does not establish arbitrary HTML execution.

There are no semantic column headers in the helper. Do not invent legal headings for Kolom1–4. Preserve the server ordering and line breaks. Browser rendering should escape the text and perform only the proved line-break conversion; payloads must remain unchanged.

`Status` is parsed into `FIb+0x1b` (`0x7827dc` → `0x782830`) but is never consulted by this renderer. `CatatanId+0x7` is also not displayed. The parser at `0x78251c` proves all six JSON bindings; the entire bounded rendering helper `0x94494c`–`0x945820` was reviewed for additional item reads or filters.

## Date handling and explicit limits

Shared helper `0xd910bc` constructs a DateFormat with literal **`dd MMMM yyyy`** at `0xd910e8`, parses the supplied string via `0xd90ddc`, then formats it at `0xd91110`. Its catch branch at `0xd91120` returns `-`. Parser `0xd90ddc` tries the format list `WRb._Jhj`; empty input throws `Empty date string`, and exhausted parsers throw an unable-to-parse error.

The follow-up [date audit](CERTIFICATE-DATE-FLOW.md) establishes six configured input patterns, the application default `id_ID`, local-date construction, and the relevant literal/no-op `Z` handling. Complete accepted-input grammar and all timezone edge behavior remain unproved. A web implementation that preserves supplied date text should describe that formatting difference rather than claim exact native date parity. Do not silently apply browser-local timezone shifts.

## Actions and native omissions

- Main detail includes `Bagikan Akses ke Sertipikat Ini` at `0x944830`, associated with callback `0x94a1a4`. Another branch displays `Dibagikan sampai ` at `0x944708`. The exact role/share-state predicate is not fully named by this audit.
- The share UI continuation contains `Bagikan sertipikat` (`0x94a798`), `Username / email` (`0x94a874`), `Lanjutkan` (`0x94ab50`), `Bagikan kepada` (`0x94af78`), `Bagikan` (`0x94b790`), `Tutup` (`0x94b8e8`), and `Durasi hari` (`0x94c184`). These are label evidence, not proof of the complete share request contract or authorization to execute a share.
- `Kantah`, `Wilayah`, and `BerakhirHak` are parsed on `AIb` but are not additional sections in the audited main-detail child list. `ValidSampai`, rather than `BerakhirHak`, supplies the visible `Berlaku Sampai` row.
- `Persil.NomorIndukBidang`, `BatasPersil`, `BatasPersilLegal`, and identifiers are model properties; they are not extra text rows in the audited location helper. This does not rule out their use by the separate map/geometry flow.
- `PemilikPertama.TipePemilik`, `PemilikId`, `SuratUkur.DokumenPengukuranId`, `CatatanPendaftaran.CatatanId`, and `Status` are not displayed by the corresponding audited helpers.

## Secondary initial request: existing review lookup

The secondary controller call `0xd42d40`, issued by the analog state initializer with the same selected certificate ID, calls request builder `0xd42e84`:

```text
POST review/last_user_review
body: { reviewType: "sertipikatSaya", contentId: selected SertifikatId }
```

The request path is loaded at `0xd42f20`, then invokes the established POST wrapper `0x6b9270` at `0xd42f30`. Body keys/constants appear at `0xd42ee0`, `0xd42eec`, `0xd42ef8`; contentId is assigned at `0xd42f04`. It uses the main `XIb+7 → FRb+7` client, parses `LIb`, and stores that result in controller observable `+0x33`. The response wrapper contains pagination/error/message/data fields.

This is the native existing-user-review lookup, not another certificate-detail payload. It was neither enabled nor called during this audit. Its downstream review rendering, full model schema, and any review-writing actions remain outside this proof.

## Reproduction and evidence files

- `analysis/recovered/request-callsites/range-009442f0.asm.txt`: main builder and contiguous section helpers.
- `range-0094929c.asm.txt`, `range-009471a4.asm.txt`, `range-00946904.asm.txt`, `range-00945938.asm.txt`, `range-00945820.asm.txt`: focused UI windows.
- `range-00709f44.asm.txt`: AIb and nested serializers; `range-007805e0.asm.txt` and `range-0078245c.asm.txt`: parser evidence.
- `range-00d910bc.asm.txt`, `range-00d90ddc.asm.txt`, `range-00d90f38.asm.txt`: bounded date helper evidence.
- `range-00d42d40.asm.txt`: existing review lookup; `range-0094a1a4.asm.txt`: sharing-label continuation.
- `analysis/recovered/certificate-detail-dispatch/certificate-ui-getters.tsv`: seven allowlisted PP getter target names, receiver CIDs, and relative function entry points.
- `range-00cd07b0.asm.txt`, `range-00cb9390.asm.txt`, `range-00caf4f8.asm.txt`, `range-00cb5504.asm.txt`, `range-00cb6cd4.asm.txt`: field-load getter stubs.
- `analysis/rea/export_certificate_ui_getters.cmd`: rebuilds the existing Blutter and runs the added `--certificate-ui-metadata` mode. That mode reads only the seven fixed UnlinkedCall entries and their already-materialized invocation-dispatcher cache targets; it does not create dispatchers, run APK behavior, dump the pool, or print secret-bearing values. Default Blutter behavior remains unchanged.
- `analysis/recovered/certificate-detail-ui.json`: compact structured bindings, evidence, and limitations.

Confidence: high for section order, scalar and nested field bindings, first-item NIB behavior, lack of Catatan Status filtering, and date output pattern. Map parity, exact date locale/input formats, complete sharing behavior, and review UI remain explicit gaps.
