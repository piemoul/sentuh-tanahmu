# Mitra Kerja: bounded native read flow

Static evidence from supplied Sentuh Tanahku 6.1.5 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No application edits, production requests, credentials, or location changes were made for this audit. Recovered addresses describe compiled behavior, not original source.

The existing five read adapters are sufficient for the native list and parent-selection flow: **PPAT → office → PPAT/PPATS**, **Surveyor → province → Surveyor/Asisten Surveyor**, and **Penilai**. Main categories are ordered PPAT, Surveyor, Penilai. Search and child category switches filter the fetched lists locally; they do not add requests. Child rows display their fields inline rather than opening a generic details modal.

| Route | Native selection/request | Retained response fields |
|---|---|---|
| Kantor PPAT | Init `0x77483c` → controller `0xd3ad14` → GET `Mitra/GetKantorPPAT` at `0xd3af08` | DFb: `kantorId` (+7), `nama` (+0xb), both nullable strings |
| PPAT | Row tap `0x90fad4` → destination `0x90fb50` → selected `kantorId ?? ""` to KFb+0xb → child init `0x774e94` → GET `Mitra/GetPPATList?kantorId=...` at `0xd3b428` | CFb: `nama`, `alamatKantor`, `tmtPensiun`, `totalAkta`, `isPPAT`, `nomorSK`, all nullable strings |
| Wilayah Surveyor | Init `0x775980` → GET `Mitra/GetWilayahSurveyor` at `0xd3b910` | FFb: `wilayahId` (+7), `nama` (+0xb), both nullable strings |
| Surveyor | Row tap `0x912188` → destination `0x912204` → selected `wilayahId ?? ""` to SFb+0xb → init `0x775eec` → GET `Mitra/GetSurveyorList?wilayahId=...` at `0xd3be30` | EFb: `nama`, `jenisSurveyor`, `nomorLisensi`, all nullable strings |
| Penilai | GET `Mitra/GetPenilaiList` at `0xd3aa20` → parser `0x77435c` / BFb constructor `0x774450` | BFb: `nama` (+7), nullable string |

All five services require HTTP 200, optionally decode a string body once, then read **body.data as a List**. A bare list or `message` fallback is not the native envelope. The body `error` field is not checked by these services. List items are maps with nullable string fields; an invalid type is caught by the service and produces its error/empty-list result. Kantor PPAT also reads and validates `kode` but discards it. PPAT also validates and discards `tempatKedudukan` and `status`.

PPAT office labels use `(nama ?? "-").replaceAll("Kantor Pertanahan ", "")`; the destination title uses `Daftar PPAT ` plus `(nama ?? "No Address").replaceAll(...)`. Search uses the original `nama`, not the stripped label. Selection preserves exact ID strings, including empty and whitespace values. Existing browser URL encoding can remain in place. No arbitrary ID form is required by the native interaction.

The default PPAT tab requires `isPPAT == "1"`; PPATS requires `isPPAT == "0"`. Search matches lowercase `nama` or `alamatKantor` with the untrimmed lowercase query. Each row shows uppercase `nama ?? ""`, No SK (`nomorSK ?? "-"`), Aktif Sampai (`tmtPensiun ?? "-"` unchanged), and Alamat (`alamatKantor ?? "-"`). The parsed `totalAkta` falls back to zero and displays these literal buckets: zero/negative/invalid → `0`, 1–10 → `<10`, 11–30 → `10-30`, 31–50 → `30-50`, 51–100 → `50-100`, above 100 → `>100`, followed by `Akta`. The inclusive 10 boundary is intentional evidence. The information icon opens an `Informasi` modal with `Total akta ditampilkan per bulan ` and the current local month/year formatted `MMMM yyyy`; it makes no request.

Surveyor parent labels show `nama ?? "-"`; the child title is `Daftar Surveyor Provinsi ` plus selected `nama ?? ""`. Its default Surveyor tab requires exact `jenisSurveyor == "Surveyor Kadaster"`; Asisten Surveyor requires `"Asisten Surveyor Kadaster"`. Both parent and child search only `nama`. Child rows show uppercase `nama ?? ""` and `No. Lisensi: ` plus `nomorLisensi ?? ""`. Penilai likewise searches only `nama` and displays uppercase `nama ?? ""`. No contact action or separate child-detail request was found in these complete row builders.

Native search asserts non-null searched names/addresses when evaluated. A null-safe browser filter is a deliberate robustness difference. Full Unicode casing equality between Dart and browser JavaScript is unproven; the reused dispatch evidence establishes the string operations and ASCII behavior. This audit establishes the supplied APK flow, not server availability, live response contents, or every visual layout detail.

Evidence is indexed in `analysis/recovered/mitra-flow.json`, with PPAT detail in `mitra-ppat/ppat-flow.json`, and Surveyor detail in `mitra-surveyor/surveyor-parent-flow.json` and `surveyor-display-contracts.json`. Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_mitra_flow.py` to compare every bounded instruction, source hash, marker, and dispatch entry against the local ELF and recovered pool/table evidence.
