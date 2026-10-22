# Sertipikat Hilang — native 6.1.5 read flow

This is bounded static evidence from `id.go.bpn.sentuh` 6.1.5, arm64 `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No APK execution, account request, mutation, credential export, or pixel-equivalence claim is included. The retained Blutter file `1050794_odo.dart` identifies screen state `nIb`; `1050791_ldo.dart` identifies controller `jIb`; `1050792_mdo.dart` identifies record `kIb` CID823. Missing Blutter function bodies were decoded in bounded ELF ranges under [lost-certificate-flow](recovered/lost-certificate-flow/export.json), with additive [follow-up](recovered/lost-certificate-flow/export-followup.json), [initialization](recovered/lost-certificate-flow/export-finish.json), [map metadata](recovered/lost-certificate-flow/export-map.json), and [review getter](recovered/lost-certificate-flow/export-review.json) records.

## Entry and office selection

- Screen `940430` uses title **Sertipikat Hilang** (`9404bc`, PP30048), shared office picker `fTb` (`9405b8–9405c8`) and search widget with hint **Cari nama atau no berkas** (`9406b4`).
- Controller constructor `702a90` initializes loading/error subjects to false, an empty `List<kIb>`, an empty selected-office object `jyb`, and an empty office-list subject. It obtains account-profile publisher `wCb` and calls office load `d10e38` at `702c94`, then lost-feed load `d1077c` at `702c9c`. These calls do not await each other inside this constructor.
- Office load calls `d10268` with `nama=""` and **no** named `Uqj` (`d10f24–d10f2c`). The latter defaults null (`d102b8`), rendered as empty string (`d10338–d10344`). The exact native default request is therefore **GET `legacy/Kantah?nama=&tipeKantor=`**, using the main client. No `3` or `3,2,1` default is present in this flow.
- The office service expects a direct response-body List and maps each item as a typed `jyb` (`d1037c–d1042c`). `KantorId` is nullable String stored at `jyb+0x13` (`701b90–701be4`); `Nama` is nullable String at `+0x17` (`701c14–701c68`); `TipeKantorId` is nullable int at `+0x23` (`701d1c–701d6c`). These keys are case-sensitive and differ from account-profile keys.
- After loading offices, when profile `ayb+0x3f` exists, native chooses the first office whose `jyb+0x13` equals that profile value (`d1100c–d11094`, predicate `7029e8`). Its fallback closure `70298c` returns the first office. Without the profile field, it also chooses the first office (`d110b8–d110ec`).
- The profile field is **`account/account_summary.data.kantorId`**, not a login-model field: retained [profile parser](recovered/collection-save-berkas/profile-parser.explore.asm.txt) `755d64` reads `kantorId`, `755da0` validates String?, and `755db8` stores `ayb+0x3f`. See the existing [profile contract](QUEUE-PROFILE-CONTRACT.md).
- Lost-feed loader first obtains the current profile snapshot (`d107dc–d10810`). A selected office `jyb+0x13` wins when nonnull; otherwise it uses `ayb+0x3f` (`d1082c–d108a4`). If neither exists it sets its no-office flag and makes no lost-feed request (`d10968–d10978`). Empty-but-nonnull office IDs are not trimmed or rejected in these native branches.

The shared picker callbacks themselves are not fully audited here; this proves its presence, data source, default values and controller selection. It does not prove every picker interaction, office ordering, or favorite-office write.

## Feed transport and typed model

Native `d10a04` builds **GET `announcement/sertipikat_hilang_byKantor?kantorId=<selected value>`** (`d10a74–d10a9c`). Existing [HTTP callsite evidence](recovered/http-callsite-audit/00d10a9c.asm.txt) contains its whole builder and response branch.

Only **HTTP200** enters the successful-response decoder (`d10aac–d10ab8`). A String body is JSON-decoded (`d10adc–d10af4`); a non-String body is used directly. Native indexes exact **`data`**, requires a List (`d10b00–d10be4`), and maps all elements through `702208→702268`. It does not read `body.error` or `body.message`, accept a direct body List, or use a fallback envelope in this builder. Non-200, non-List, or caught parsing errors return the failure pair with an empty list. The feed controller publishes the returned rows on success and an empty list on failure (`d108cc–d10964`). It does not sort, paginate, or deduplicate the feed here.

| Exact JSON key | `kIb` offset | Type | Key / store addresses |
|---|---:|---|---|
| `dI304Id` | `+0x07` | String? | `7022a0` / `7022f4` |
| `persilId` | `+0x0b` | String? | `702324` / `702378` |
| `berkasId` | `+0x0f` | String? | `7023a8` / `7023fc` |
| `nomor` | `+0x13` | String? | `70242c` / `702480` |
| `tanggalMulai` | `+0x17` | String? | `7024b0` / `702504` |
| `tanggalSelesai` | `+0x1b` | String? | `702534` / `702588` |
| `nib` | `+0x1f` | String? | `7025b8` / `70260c` |
| `wilayah` | `+0x23` | String? | `70263c` / `702690` |
| `luas` | `+0x27` | **int?** | `7026c0` / `702710` |
| `pemohon` | `+0x2b` | String? | `702744` / `702798` |
| `nomorBerkas` | `+0x2f` | String? | `7027c8` / `70281c` |
| `tanggalBerkas` | `+0x33` | String? | `70284c` / `7028a0` |
| `tipe` | `+0x37` | String? | `7028cc` / `702920` |

Missing keys and explicit null remain null. There is no `""` substitution at these stores. Wrong-type values fail the casts. `luas` specifically uses `IsType_int?` at `702704`; accepting fractional numbers would change this contract. JSON integer values beyond JavaScript safe integer precision require a separate decision and must not be described as fully equivalent to native Dart int64 by this audit.

## Search, list and detail

The text-controller listener `77ed74–77ed98` invokes `77ef14`. That method takes the controller text and applies the string lowercase operation (`77ef68–77ef98`); no trim or server request appears. Predicate `77f0a0` checks, in order, `nomorBerkas`, `pemohon`, then `wilayah`, using `toString`, lowercase and substring containment, with short-circuit OR. Filtering preserves source-list order (`77f01c–77f068`). Lowercase/substring method dispatch and unusual Unicode behavior have not been independently reconstructed here; the fields and operation sequence are positively bound. The renderer uses the filtered list at state `+0x23`, not arbitrary object values.

List card `940e00–941514` has exactly these four text blocks:

1. **Sertipikat milik ** + `pemohon`, null→`-` (`940f28–940f5c`).
2. **Kelurahan/Desa ** + `wilayah`, null→`-` (`94103c–941070`).
3. **Telah dilaporkan hilang pada ** + formatted `tanggalMulai` (`941180–941194`).
4. **Diumumkan hingga ** + formatted `tanggalSelesai` (`9412dc–9412f0`).

The date helper is the same recovered **`d910bc`** described in [certificate date flow](CERTIFICATE-DATE-FLOW.md), output `dd MMMM yyyy`, default app locale `id_ID`. Lost-date callsites null-assert their input (`94118c`, `9412e8`); therefore null dates cannot honestly be claimed to render a native dash. An invalid nonnull date reaches the helper's own catch fallback. The current browser date runtime is a reference implementation; this document does not turn its tests into APK execution proof.

Card tap `941534` records its existing telemetry metadata and opens the native detail builder `94170c` through the navigator at `9416e0`. It does **not** directly open a PDF. Detail header is `pemohon` (`941848`), subtitle is formatted `tanggalMulai` + ** - ** + formatted `tanggalSelesai` (`941984–941a18`). Detail rows, in order:

| Label | Value |
|---|---|
| Nomor | `nomor` |
| Tanggal mulai | formatted `tanggalMulai` |
| Tanggal selesai | formatted `tanggalSelesai` |
| NIB | `nib` |
| Nama Desa | `wilayah` |
| Luas | `luas.toString()`; no unit appended in this row |
| Pemohon | `pemohon` |
| Nomor Berkas | `nomorBerkas` |
| Tanggal berkas | formatted `tanggalBerkas` |
| Tipe | `tipe` |

Row bindings are `941b10–941ea0`, calls to shared row renderer `942240`. Most String/date values have native null assertions before rendering. A browser null fallback is a deliberate resilience adaptation, not evidence of the same native nullable rendering behavior. Header/rows contain plain Text widgets, not HTML interpretation.

## Map and reviews in detail

The detail includes **Lokasi Peta Bidang** (`941f50`) bound to callback `dba380`. It reads current row `persilId` at `dba424` and calls service `dad660` at `dba438`.

- Exact request: **GET `LokasiBidang/GetByPersilId`**, main client, query-map field `persilId` (`dad6bc–dad6f4`). It does not use `berkasId`, `dI304Id`, NIB, or user-entered coordinates here.
- Response body must Map, then shared envelope parser `6bbe60` calls model factory `91c040`. Model `myb` contains seven String? fields, no coordinate or geometry field: `persilId`→`+7`, `kantorId`→`+b`, `namaKantor`→`+f`, `wilayahId`→`+13`, `namaWilayah`→`+17`, `jenisHak`→`+1b`, `nomorSertipikat`→`+1f` (keys/stores `91c0d8–91c440`).
- The service returns envelope error plus typed metadata (`dad79c–dad7d4`). Native success callback `942820` reads response.data.persilId and constructs `mFb` with that ID at `+0xf`, `+0x13=true`, `+0x17=false` (`942840–94287c`). The downstream geometry request and rendering are a separate shared-map chain, not established by this metadata response alone.
- Error branch opens the exact message **Lokasi Peta Bidang tidak ditemukan.** with **Tutup** (`9426dc`, `942758`). Missing/null metadata in a nominal-success branch may reach a native null assertion; it is not a successful empty geometry result.

The widget constructed just before the map button is **`JTb`, a review/comment widget**, not a document viewer. Constructor `91b318` receives `berkasId` (`941ef4`) and enum `ITb.pengumumanSertipikatHilang` (`941f10`, PP30138). It stores those at `JTb+0xf` and `+0xb`, default flag `+0x13=false`, then calls `dacbec`.

- With that default false flag, `dacbec` takes the `review/all` branch (`dacc70–dacca4`). This is a **POST used for reading**, catalog operation `post-review-all-dace58`; it is not a GET. The body/map fields are `reviewType`, `contentId`, `pageNumber`, `pageSize` (`dacd84–dace58`). The numeric constants become strings **`"1"`** and **`"10"`** through `a94824` (Smi constants2/0x14 at `dacdb4`/`dacdf8`).
- `reviewType` is **`pengumumanSertipikatHilang`**: getter `91bae0` reads enum `+0xb` and calls `6bece4`; this helper obtains enum text, splits literal `.`, and takes index1. `contentId` is `berkasId`.
- The other branch calls read POST `review/last_user_review` (`dad12c`). Review submission code also exists, but has **not** been audited or authorized for implementation as part of this read-flow patch. No review write was executed.
- No PDF endpoint or document/PDF destination was positively bound in these completed list/detail functions. Earlier exploratory class-name guesses that treated JTb as an attachment viewer are superseded by the positive review-service calls above.

## Exact screen messages and remaining limits

Builder `9409a0–940d68` distinguishes loading, no-office, snapshot error, empty list and nonempty list. The user-visible strings are:

- No-office: **Kamu belum punya kantor favorit, nih! Yuk, pilih kantor yang pengumuman yuridisnya pengen kamu lihat.** (`940ad8`, PP30070). The unexpected word “yuridis” is present in this Sertipikat Hilang screen and must not be silently reported as a recovered different string.
- Error: **Gagal Mengambil Data** (`940bdc`, PP30078).
- Empty: **Belum ada Laporan Sertipikat Hilang** (`940cb4`, PP30080).

This audit supports replacing the generic raw office-ID form with a typed office/list/search/detail read flow. It does not prove full native parity: shared picker interactions, all indirect string semantics, geometry chain, review response models, review posting, image/pixel match, and live private-account acceptance still need their own evidence. All exported ranges are bounded; a few include nearby unrelated prologues/tails, which are not used as feature evidence.
