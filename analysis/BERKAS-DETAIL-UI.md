# BERKAS detail: static UI and read contract audit

The supplied Sentuh Tanahku 6.1.5 ARM64 snapshot proves a shared `MAb` detail screen for selected Berkasku rows and BERKAS collection entries. This audit identifies the primary model, visible field bindings, and the additional read requests. It makes no production requests and does not establish live acceptance or full runtime parity.

Artifact: `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

## Navigation and request sequence

| Entry | Proven selected identifier | Native call chain |
|---|---|---|
| Collection, type BERKAS | `contentId.split(':')[0]` | `0xda76d0` → `0xd878dc` → primary `0xd87fe0` → SOP `0xd87e00` → print status `0xd87c14` → closure `0x87ec28` → MAb |
| Berkasku row | `EAb.berkasId` at offset `+7`; row callback also reads `tipeKantorId` at `+0x23` | row closure `0xd94220` → `0xd94798` → primary → SOP → SPS; then `0xd9460c` → print status; navigation `0x8b0008` → `0x8b0144` → closure `0x8b0280` → MAb |

The row card installs closure `0xd94220` at `0x8af7a0`; the callback loads the two row fields at `0xd94330` / `0xd94340` and calls `0xd94798` at `0xd94368`. The EAb row parser is `0x708160`. `tipeKantorId` does not alter the primary request body in this bounded helper.

| Read | Wire call | Request | Response / consumer |
|---|---|---|---|
| Main detail | `0xd88218` | POST `/berkas/CariBerkas`, form keys `nomor`, `tahun`, `kantorId`, `berkasId` | For selected-ID navigation the first three are null. HTTP 200 body `data` is parsed by `0x74ca78` at `0xd88290` into ABb. |
| SOP | `0xd87ea8` | POST `berkas/berkassop`, form `berkasid=selected berkasId` | HTTP 200 envelope `data` → EBb, callback `0x87eb60` → `0x74e050`; envelope error is checked. Injected into ABb `fileSop` (`+0x3f`). |
| Print status | `0xd87ca8` | POST `berkas/getStatusCetak`, form `berkasid=selected berkasId` | Top-level `error` boolean defaults true; `message` string defaults `-`. The helper returns a tuple; exception also returns `(true, '-')`. UI consumes message, not a `data` field. |
| SPS metadata, Berkasku path | `0xd94aac` | GET `Dokumen/GetSpsDokumen`, query `dokumenid=selected berkasId` | HTTP 200 response body list → FBb elements. Required string casts for `spsId`, `tipe`, `alias`, `tanggal`. Injected into ABb `fileSps` (`+0x43`). This request does not download a document. |

These requests use the established main FRb/session client. Their request adapters already existed at audit time: `post-berkas-berkassop-d87ea8`, `post-berkas-getstatuscetak-d87ca8`, `get-dokumen-getspsdokumen-d94aac`.

Collection navigation sets MAb `+0x17=false`; Berkasku navigation sets it true (`0x8b0320`–`0x8b0324`). This flag controls the SPS section in the main body. Therefore a collection result must not be assumed to make the same SPS read as Berkasku.

## Primary response model

Parser `0x74ca78`, final ABb assignments `0x74d4d4`–`0x74d5c4`:

| JSON key | Offset | Type |
|---|---|---|
| berkasId | +7 | String? |
| statusBerkas | +0xb | int? |
| nomor | +0xf | int? |
| tahun | +0x13 | int? |
| tanggalDibuat | +0x17 | String? |
| tanggalSelesai | +0x1b | String? |
| namaProsedur | +0x1f | String? |
| namaPemilik | +0x23 | String? |
| namaPegawai | +0x27 | String? |
| namaProfile | +0x2b | String? |
| perjalananBerkas | +0x2f | List<BBb>?; fallback key `PerjalananBerkas` if lowercase value is null |
| parapihak | +0x33 | List<DBb>? |
| biaya | +0x37 | num converted to double? |
| kantor | +0x3b | CBb? |
| fileSop | +0x3f | EBb? |
| fileSps | +0x43 | List<FBb>? |
| statusCetak | +0x47 | String? |
| allowGeotag | +0x4b | int? |
| kodeSPOPP | +0x4f | String? |

`kodeSPOPP` is parsed earlier but assigned last. Neither `berkasId` nor `kodeSPOPP` has been proven to bind an ID label in the examined summary. Do not derive such a binding from the name.

## Native section bindings

MAb CID 6280 dispatches createState to `0x9f8d00`; its `_NAb` state CID 5457 dispatches init to `0x749dfc`. The state builder is `0x899b84`, calling the detail body `0x89a3b0` at `0x89a328`. The page title is `nomor + '/' + tahun` (loads `0x899be0`, `0x899c58`).

The read sections are constructed in this order: summary, **Para Pihak**, **Perjalanan Berkas**, conditional **SPS**, **Kontak Kantor**. Separate review, bookmark, and geotag controls are not established as implemented by this audit.

### Summary

| Display | Binding and evidence |
|---|---|
| Status | ABb `statusBerkas` (`+0xb`), comparisons `0x89a5bc`–`0x89a764`; mapping below. Unknown values fall back to their string representation. |
| Procedure | `namaProsedur` at `0x89ac80`; null fallback `Pengukuran - ASN` at `0x89ac94`. |
| Status Cetak | Separate widget argument MAb `+0x1b`, passed to body; hidden for `-` or empty string at `0x89adfc`–`0x89ae30`. Collection controller also stores the same message in ABb `statusCetak` at `0xd87b10`, but the native UI input is the separate argument. |
| Biaya | `biaya` at `0x89b070`; formatter `0x89df68` receives literal `ID` at `0x89b054`, then format call `0x5251b8` at `0x89b07c`. Exact symbol and decimal defaults have not been established. |
| Petugas | `namaPegawai` at `0x89b1dc`; null → `-`. |
| Dibuat | `tanggalDibuat` at `0x89b388`; null/empty → `-`, otherwise shared date formatter `0xd910bc`. |
| Selesai | `tanggalSelesai` at `0x89b540`; same fallback and formatter. |
| SOP badge | Only if `fileSop != null` and `fileSop.tipeProduk == 'Rutin'` (`0x89a800`–`0x89a83c`). `lewatTenggat=true` selects `assets/images/badge_lewat_sop.svg` at `0x89a874`, otherwise `badge_sesuai_sop.svg` at `0x89a880`. Other EBb dates are not displayed by this bounded body. |

Status mapping:

| Value | Native text |
|---|---|
| 0 | Sudah diambil |
| 1 | Sedang berjalan |
| 4 | Ditunda, hubungi Kantor Pertanahan |
| 8 | Sudah selesai, silahkan diambil |
| 21 | Diverifikasi RDTR |
| 23 | Penilaian KKPR |
| 24 | Penerbitan KKPR |
| 25 | Pemeriksaan KKPR |
| 26 | Penandatanganan KKPR |

### Para Pihak

Label at `0x89b95c`, list load at `0x89b9a0`, per-row closure `0x8a8c54` → renderer `0x8a8cf4`. The DBb parser `0x74e9b4` assigns `pemilikId +7`, `tipePemilik +0xb`, `nama +0xf`, `tempatTanggalLahir +0x13`, all nullable strings. Renderer displays `nama` at `0x8a8d3c`; `tipePemilik == 'P'` → `Pemohon`, otherwise `Pemberi Kuasa` (`0x8a8df0`–`0x8a8e2c`). All list rows are mapped; no status filter was observed. ID and date/place of birth are not displayed in this renderer.

### Perjalanan Berkas

Label at `0x89bc90`, list load at `0x89bccc`, summary helper `0x89d1dc`. BBb parser `0x74ebd4` maps `taskNodeGroupId +7`, `tanggalFlow +0xb`, `namaGrup +0xf`, `isCurrent +0x13`.

The collapsed summary is not the complete list. It displays `Belum ada aktivitas` for an empty list. Otherwise it scans backward for the last row with `isCurrent == true`. If none is found and main `statusBerkas == 0`, it creates a display record whose `namaGrup` is main `namaProfile`; otherwise it uses the **first** row. The latter calls `0x60f89c`, whose first-index implementation is explicit at `0x60f8c8` / `0x60f8dc`.

Renderer `0x89d3f8` shows formatted `tanggalFlow` if present; the missing-date fallback is `namaGrup`. Its time line formats `tanggalFlow` using `0xd90d5c`, otherwise `-`; the main text is `namaGrup` (`0x89d8fc`). The expanded history navigation (`0x8a8a24` → `0x8a8a9c` → RAb) exists, but expanded ordering and full UI are not established here.

### SPS

Only present when the MAb `+0x17` flag is true. The block begins at `0x89be10`; an empty list produces `SPS Tidak Ditemukan` at `0x89c0f0`. FBb parser `0x74e794` maps nullable `spsId +7`, `tipe +0xb`, `alias +0xf`, `tanggal +0x13`; the dedicated SPS read helper requires strings when constructing these records.

Item renderer `0x8a82e0` displays FBb **tipe** (`0x8a8380`). The second line reads **main ABb.tanggalSelesai**, not FBb.tanggal (`0x8a8454` → formatter at `0x8a8468`). This is a direct native binding, even though the record also contains a date. The document action callback was not followed sufficiently to establish a safe download contract; metadata is the implemented read opportunity.

### Kontak Kantor

CBb parser `0x74e3c0` maps nullable `nama +7`, `alamat +0xb`, `telp +0xf`, `fax +0x13`, `email +0x17`, `tipeKantorId +0x1b`. The section label is at `0x89c48c`. Display fields are `nama` (`0x89c504`), `alamat` (`0x89c640`), **Email** → `email` (`0x89c878`), **Telp** → `telp` (`0x89ca88`). Missing office/field falls back to `-`. Fax is parsed but not shown in this section.

## Implementable next improvement and bounds

Use a shared renderer for ABb, preserve all party rows, implement the proven collapsed journey summary, and load the existing read-only SOP/status/SPS adapters with the selected berkasId. Keep collection and Berkasku SPS behavior distinct. Preserve raw date strings if a browser formatter cannot faithfully reproduce the native formatter. Keep the server error flag when presenting print status; do not turn an arbitrary error message into a success status.

The supplied APK proves these fields and branches, not server acceptance, current production schema, document download behavior, complete expanded history, or all native actions. GPS/geotag submission, physical-presence checks, integrity checks, uploads, collection mutations, and account changes are outside this audit. No private account data was retained.

Machine-readable evidence and exact source hashes: `analysis/recovered/berkas-detail-ui.json`. Recheck the ELF, source hashes, dispatch entries, selected parser markers, and 21 concrete instructions with:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_berkas_detail_ui.py
```
