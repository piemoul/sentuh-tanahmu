# Native Antrian list and detail — bounded static audit

The APK proves a queue list and a shared read-only detail destination, including the Activity `antrian` branch. It does **not** yet prove the queue service's origin/path joining, authentication, session bootstrap or TLS/client identity. This evidence does not activate an upstream route. In particular, do not substitute a profile NIK for the native list's locally managed identity list, or send these calls through the main API adapter by analogy.

Audit target: `id.go.bpn.sentuh` 6.1.5, ARM64 compressed-pointer Dart 3.12.2 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Reused the local REA/Blutter artifacts; no network, production records, credentials, booking, creation or deletion was accessed. No frontend/backend changes were made.

Evidence: [ledger](recovered/queue-flow.json), [bounded instruction windows](recovered/queue-flow/), [builder](rea/build_queue_flow.py), [offline validator](rea/verify_queue_flow.py). The validator passes **41 source hashes, 5,743 exact ELF instructions, 37 model fields and 9 lifecycle dispatch entries**. It verifies selected pool keys without exporting the full object pool or secret values. Native behavior descriptions below are bounded static findings, not server acceptance or runtime pixel parity.

## 1. Exact request contracts and identity source

| Operation | Native request | Input | Response consumption |
|---|---|---|---|
| Account queue list | `GET api/antrian/saya`, builder `0xd1ea74`, call `0xd1eb1c` | Query `nik`; no body or page/search parameter | Already-decoded `body.error` and `body.data`; false error plus nonnull List data maps to `List<azb>` |
| Selected queue detail | `GET 'api/antrian/' + id`, builder `0xd1e0ac`, call `0xd1e130` | Full selected ID in path; no query/body | Already-decoded `body.error` and `body.data`; false error plus nonnull Map data maps to `bzb` |

Both call GET helper `0x7017a4` via the service wrapper. Their bounded request functions do **not** JSON-decode string bodies or compare a status value to HTTP 200. The shared helper may impose status behavior; that has not been established here. Missing/null `error` defaults to `true`; a nonnull error must be a bool. There is no `message` fallback or case alias for `data`. A wrong data shape fails the native type check. The list's success tuple uses a true flag; the detail's tuple uses a false error flag. These opposite internal conventions must not be conflated.

The `nik` query is not guessed from a label:

1. List controller `0xd1e6c8` calls identity loader `0xd1ed00` at `0xd1e6f8`.
2. Loader reads preference key `user_antrian` (`0xd1ed5c`) and maps saved records through `0x72dba4 → 0x72d844`, producing `qzb` objects.
3. Getter `0x436cf8` reads model offset `+0x17` at `0x436cfc`. The `qzb` parser proves this is `nik`.
4. The mapped strings are joined with `,` (`0xd1e798`) and passed to list request `0xd1ea74` through controller `0xd1e824`.
5. An empty managed identity list stops the outer controller; an empty joined string also returns from the request builder before GET.

The loader also installs an account/profile-linked listener at `0xd1f04c`, targeting callback `0xd1f080`. Its full merge/bootstrap behavior was not audited. A browser cannot accurately reproduce this query by assuming a single current-profile NIK or by accepting an arbitrary substitute.

Yyb construction resolves dependency `FRb` at `0x6fefc8 → 0x6a7584`, wraps it, and stores the wrapper at controller `+7`. This establishes the service dependency, not its transport/session contract. The existing service-family inventory is insufficient to prove final URL joining or cross-origin authentication. Origin, headers, credentials, redirects, proxy behavior, trust material and bootstrap side effects remain unproved in this audit.

## 2. Lifecycle and selected ID

| Screen | Widget → state | Factory / init / build |
|---|---|---|
| Antrian Daring parent | `rzb` CID 6291 → `_szb` CID 5468 | `0x9f7f54` / `0x72a29c` / `0x87f0f4` |
| Antrian list | `Gzb` CID 6288 → `_Hzb` CID 5465 | `0x9f81d0` / `0x72b748` / `0x881d58` |
| Queue detail | `tzb` CID 6290 → `_uzb` CID 5467 | `0x9f7f88` / `0x72a44c` / `0x87f9f8` |

The parent displays `Antrian Daring`, with `Antrian` and `Panggilan` tabs. The Panggilan/notification workflow is outside this audit. List init calls `0xd1e6c8` at `0x72b774`; refresh callback `0xd88704` calls the same controller at `0xd88770`.

List row tap `0x882b78 → 0x882bf0` reads **selected `azb.id` (`+7`) at `0x882c34`**, creates `tzb`, and stores that ID at widget `+0xf` (`0x882c50`). Neither `nomor` nor `kode_booking` is used as the selected ID.

The previously audited [Activity flow](ACTIVITY-FLOW.md) matches lowercased `activityType` containing `antrian`, after the bidang and berkas branches, and requires nonnull `contentId`. Its builder `0x87ef44` creates the same `tzb` destination and stores **the full `contentId`**, without colon splitting, at widget `+0xf` (`0x87ef9c`). The new ledger re-verifies this builder from the ELF.

Detail init `0x72a44c` passes widget `+0xf` to controller `0xd1df1c` at `0x72a48c`; null ID becomes an empty string. The controller calls the detail request and updates its detail subject at `+0x27`. The detail build binds that subject. An observed Activity ID alone is not enough to enable a browser route until the queue-service transport is verified.

## 3. Wire models

Keys below are exact. There is no PascalCase/camelCase fallback for the snake_case response models. Invalid nonnull scalar types fail native type checks; do not silently stringify ordinary String fields.

### List `azb`, CID 739, parser `0x72b868`

| Key | Offset | Wire type and null/missing default |
|---|---|---|
| `id` | `+7` | String, `''` |
| `nomor` | `+0xb` | String, `''` |
| `kode_booking` | `+0xf` | Iterable converted to `List<String>`; null → `[]` |
| `tanggal_antrian` | `+0x13` | String, `''` |
| `waktu_booking` | `+0x17` | String, `''` |
| `status` | `+0x1b` | String, `''` |
| `lokasi` | `+0x1f` | String, `''` |
| `loket` | `+0x23` | String, `''` |
| `pemohon` | `+0x27` | String, `''` |
| `estimasi_message` | `+0x2b` | String, `''` |

`kode_booking` uses the typed list constructor (`0x72b9e4 → 0x4b80e0`); this is not evidence for converting numeric members into strings.

### Detail `bzb`, CID 738, parser `0x72a4ac`

| Key | Offset | Wire type and null/missing default |
|---|---|---|
| `id` | `+7` | String, `''` |
| `nomor` | `+0xb` | String, `''` |
| `jumlah_berkas` | `+0xf` | int, `0`; stored as a 64-bit field |
| `booking` | `+0x17` | List mapped into `List<String>`; null → `[]` |
| `nama` | `+0x1b` | String, `''` |
| `kode` | `+0x1f` | String, `''` |
| `tanggal_antrian` | `+0x23` | String, `''` |
| `lokasi` | `+0x27` | Map → `czb`; null → empty Map before parsing |
| `kantor` | `+0x2b` | Map → `dzb`; null → empty Map before parsing |
| `pemohon` | `+0x2f` | Map → `ezb`; null → empty Map before parsing |

Booking mapper `0x72b0e0` reads each item's `kode` (`0x72b100`). A nonnull value receives dynamic zero-argument selector `0xab4d` (`0x72b14c`); a null result becomes `''`. The semantic name/full scalar conversion contract for that selector was not proved. The output is a typed string list. Do not confuse this nested `booking[].kode` path with the list model's `kode_booking` string iterable.

All nested model fields are String with null/missing → `''`:

| Model | Parser | Exact fields and offsets |
|---|---|---|
| `czb`, CID 737 | `0x72aef8` | `id` +7, `nama` +0xb, `alamat` +0xf |
| `dzb`, CID 736 | `0x72ad94` | `id` +7, `nama` +0xb |
| `ezb`, CID 735 | `0x72aaa4` | `nik` +7, `nama` +0xb, `tempat_lahir` +0xf, `tanggal_lahir` +0x13, `token` +0x17 |

`token` is recorded only as a schema key. No token value was read or exported. These applicant fields are not visibly bound by the bounded detail screen and should not be automatically rendered as raw facts.

The stored identity model `qzb`, CID 722, parser `0x72d844`, has required fields with **no null defaults**: int `id` (+7), String `nama` (+0xf), String `noHp` (+0x13), String `nik` (+0x17), String `tempatLahir` (+0x1b), String `tglLahir` (+0x1f), and bool `fromUserData` (+0x23). This storage schema is different from `ezb`.

## 4. List and detail rendering

List row closure `0x882458` displays these values in order:

| Order | Field | Read |
|---|---|---|
| 1 | `nomor` | `0x882750` |
| 2 | formatted `tanggal_antrian` | `0x8827a8`, formatter call `0x8827b4` |
| 3 | `loket` | `0x8828b0` |
| 4 | `lokasi` | `0x882914` |
| 5 | `pemohon` | `0x882978` |
| 6 | `estimasi_message` | `0x8829dc` |

`status`, `waktu_booking` and `kode_booking` are not visibly bound in this card. There is no free-text search/filter in the bounded list page, and no page/search query parameter in the list request. The list builder uses the returned list length and row index; no fixed row cutoff is found. This does not establish all remote pagination, refresh-cache or subscription behavior outside the bounded paths.

Empty text at `0x882300` is: `Kamu belum punya antrian, nih! Yuk, ambil Antrian Daring sekarang buat mengurus berkas ke Kantor Pertanahan.` Error text starts `Terjadi kesalahan: `. The page also has `Mulai Mengantri` (`0x881e70`) leading to a separate booking flow; this audit inventories that entry but does not trace or enable booking.

Detail body `0x87ff24` shows:

| Order | Label / section | Source |
|---|---|---|
| 1 | `Nomor Antrian Kamu` | `nomor` +0xb (`0x880100`) |
| 2 | `Informasi Lengkap` | Section heading |
| 3 | `Kantor Pertanahan` | `kantor.nama` (`0x880248 → 0x880250`) |
| 4 | `Lokasi Kerja` | `lokasi.nama` (`0x8802bc → 0x8802c4`) |
| 5 | `Loket Group` | **`nama` +0x1b**, not `kode` (`0x880330`) |
| 6 | `Tanggal Kunjungan` | formatted `tanggal_antrian` +0x23 (`0x880398`) |
| 7 | `Kode Booking` | Each mapped string from `booking` +0x17 (`0x88049c`; chip helper `0x88097c`) |
| 8 | Attendance warning | Static text |
| 9 | Thanks message | Static text |

Null detail/nested objects use `-` where guarded; model-level empty strings remain empty strings. The warning reads: `Saya menyetujui apabila panggilan saya terlewatkan karena saya belum hadir di lokasi pelayanan, maka petugas berhak untuk menyesuaikan urutan antrian saya.` This is displayed text, not evidence of a checkbox, submission or consent mutation. The final text is `Terimakasih telah menggunakan Layanan Antrian Daring Kementerian ATR/BPN`.

The bounded detail build has a back callback (`0x728800`) and loading/subject presentation. No download, QR, delete or other mutation action is proved by those build windows. No additional detail GET is proved beyond `api/antrian/{id}`. These are bounded findings, not a claim about every action elsewhere in the application.

## 5. Dates, remaining limits and implementation boundary

Detail date helper `0xd8853c` uses shared parse `0x6beed4`, pattern `d MMMM yyyy` and locale `id_ID`; empty input or its exception branch displays `-`. List helper `0xd88794` uses localized Indonesian weekday/month tables with a zero-padded day; its exception branch returns `''`. Full shared parsing, timezone and malformed-date semantics are not established.

A local renderer can now use the exact verified list/detail fields and ID routing, with explicit handling of the unproved booking-code conversion and date semantics. Enabling remote list/detail calls still requires a separate bounded transport/authentication audit of the actual FRb dependency and the managed identity bootstrap. This task provides no authority or evidence to guess a NIK, forward the main API session to a different service, create bookings, delete queues, or bypass any service validation.

Reproduce locally:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/build_queue_flow.py
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_flow.py
```

The builder and validator read only existing local audit artifacts and the exact APK ELF. The registry, frontend, backend and shared Blutter exporter are unchanged.
