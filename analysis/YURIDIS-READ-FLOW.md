# Pengumuman Yuridis — native 6.1.5 read flow

This is bounded static evidence from the supplied `id.go.bpn.sentuh` 6.1.5 arm64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No APK execution, provider call, account request, browser operation, runtime application change, upload, or production mutation was used. Sources and instruction verification are recorded in [source-index.json](recovered/yuridis-read-flow/source-index.json). The previous lost-certificate and review receipts are retained unchanged.

## Entry, offices, and loading

Blutter identifies controller `FGb` CID575 in `1050741_vco.dart`, row `GGb` CID824 in `1050742_wco.dart`, and state `IGb` CID5392 / wrapper `HGb` CID6210 in `1050743_xco.dart`. This is a distinct flow from the lost-certificate controller/model/screen.

- Build `9190d4..9196ac` uses **Pengumuman Yuridis** (`919160`, PP30a90), shared `fTb` office picker (`91925c..91926c`), and search hint **Cari nama/wilayah/no berkas** (`919358`).
- Controller factory `701efc` creates `FGb`, then constructor `701f3c..702164` initializes false flags, an empty `List<GGb>` subject, empty selected `jyb`, empty office-list subject, and the profile publisher `wCb`. It calls office loader `d0ffa0` at `702140`, then feed loader `d0f84c` at `702148`, without awaiting one before starting the other.
- Office loader calls shared `d10268` at `d10098`, passing `nama=""` with no `Uqj` argument. Default `Uqj=null` becomes an empty string in the builder. The request is **GET `legacy/Kantah?nama=&tipeKantor=`** on the main client. No `3` or `3,2,1` default is present here.
- The shared office response is a direct List of typed `jyb`, not a `data` envelope. The retained [office-model evidence](recovered/searchfile-office/office-model.asm.txt) defines case-sensitive nullable `KantorId`, `Nama`, and `TipeKantorId`, alongside its other existing typed fields. The first two are String?, the last int?. Preserve native ordering, nulls, and empty values.
- When the returned office tuple is successful and its list nonempty, loader `d10110..d1016c` publishes that list and subscribes to profile `ayb?` through callback `d10578`. Callback `d105cc` reads `ayb+0x3f`, positively bound by the previous profile proof to **`account/account_summary.data.kantorId`**. Nonnull profile kantorId selects the **first** office matching `jyb+0x13`; predicate `701e94` compares those values. Fallback `701e24` returns the first office. Without profile kantorId, a nonempty list also selects its first office. It does not sort or trim IDs.
- Feed loader `d0f84c` snapshots profile, then selected `jyb+0x13` wins when nonnull; otherwise it uses profile `ayb+0x3f` (`d0f8e4..d0f958`). Empty-but-nonnull IDs are not rejected by these branches. If both IDs are absent, it sets its no-office flag and makes no feed request (`d0fa1c..d0fa2c`). On tuple success it publishes rows, on tuple failure an empty list (`d0f980..d0fa14`).
- Local list listener `77b168..77b310` installs the text-controller callback and subscribes to feed rows. The received source list is kept at state `+0x27`, then its search filter updates rendered rows `+0x23`.
- Native pull-to-refresh callback `919b90` calls the same feed loader at `919bc0`. It is a reread, not a pagination request.

The shared picker selection callback `9d9cac` obtains its controller, invokes a dynamic getter, publishes the selected `jyb` through `43eef4`, then invokes a second dynamic operation and closes the popup. Those two switchable callsites use PP412f8/41300 pairs and are **not resolved to named FGb methods by this audit**. Picker opening `9d9160..9d922c` resets its local query to `""`; `9d9fbc..9da010` writes its search query. Complete shared picker rendering, selector resolution, search predicate, favorite-office writes, and pixel equivalence remain separate work. A browser office dropdown/change reread is an explicit adaptation supported by the proved controller request/default values, not claimed as a complete native picker reconstruction.

## Feed request and exact typed record

Service `d0facc` constructs **GET `announcement/yuridis_byKantor?kantorId=<value>`** and calls main wrapper `7017a4` at **`d0fb64`**. Its whole builder and response branch are retained in [00d0fb64.asm.txt](recovered/http-callsite-audit/00d0fb64.asm.txt).

Only **HTTP200** reaches the success decoder (`d0fb7c..d0fb80`). A String body is JSON-decoded once (`d0fbb0..d0fbb8`), a non-String body is used directly. Exact `data` is read (`d0fbc8`), must be a List, and all rows map through `701084→701128→701188`. The builder does not accept a direct response-body list, `message` list, alternate nested envelope, or inspect body `error`/`message`. Failure returns `(true,[])`. Source order and duplicates are preserved; no pagination/sorting/deduplication is established here.

`701128` requires every element to be a `Map<String,dynamic>`. Constructor `701188..70176c` has **11** case-sensitive fields:

| JSON key | `GGb` slot | Type | Key load / field store |
|---|---:|---|---|
| `persilId` | +0x07 | String? | `7011c0 / 701214` |
| `nomorBerkas` | +0x0b | String? | `701244 / 701298` |
| `nomorPengumuman` | +0x0f | String? | `7012c8 / 70131c` |
| `tanggalMulai` | +0x13 | String? | `70134c / 7013a0` |
| `tanggalSelesai` | +0x17 | String? | `7013d0 / 701424` |
| `nib` | +0x1b | String? | `701454 / 7014a8` |
| `wilayah` | +0x1f | String? | `7014d8 / 70152c` |
| `luasPersil` | +0x23 | **int?** | `70155c / 7015ac` |
| `pemohon` | +0x27 | String? | `7015e0 / 701634` |
| `permohonan` | +0x2b | String? | `701664 / 7016b8` |
| `kegiatan` | +0x2f | String? | `7016e4 / 701738` |

Missing keys/null remain null; empty strings remain empty. Nonnull wrong types fail casts. `luasPersil` uses native int? test `e2facc` at `7015a0`; numeric String, double/exponent lexemes, or fraction aliases are not native inputs. Reuse of the separate Dart JSON number reference must remain labeled SDK-reference evidence, not execution of this APK. Browser decimal-string transport for large exact integers is an adaptation.

**Differences from lost-certificate rows:** there is no `dI304Id`, `berkasId`, `nomor`, `luas`, `tanggalBerkas`, or `tipe` field in this GGb parser. Its integer key is `luasPersil`; its document identifier for downstream map/reviews is `persilId`. Do not reuse the lost model with renamed headings.

## Search, cards, detail, and map

Filtering `77b374` lowercases the current query (selector -0xffc at `77b3e0..77b3e8`) without trimming. Predicate `77b4a0..77b65c` checks **nomorBerkas, then wilayah, then pemohon**, with short-circuit OR, native `toString`, lowercase, then substring containment. It does not search every row field, normalize accents, sort, paginate, or call a server. Unicode equivalence of browser lowercase/substring is not certified by these selectors.

Card builder `919c6c..91a790` renders these values in order:

1. `pemohon`, null→literal `-` at `919dbc..919dcc`.
2. Formatted `tanggalMulai` via shared `d910bc` (`919f1c..919f30`); input is null-asserted.
3. `wilayah` (`91a100..91a110`), also null-asserted.
4. Literal **Selesai ** plus formatted `tanggalSelesai` (`91a214..91a234`), date null-asserted.
5. `kegiatan` badge (`91a450..91a548`), null-asserted for its text. Exact equality to **Rutin** selects PP30b00 orange; any other value selects PP30b08 blue. There is no fallback text `Rutin` and no case-insensitive comparison.

The date helper is the existing native `d910bc` `dd MMMM yyyy` / `id_ID` chain from [CERTIFICATE-DATE-FLOW.md](CERTIFICATE-DATE-FLOW.md). A browser null placeholder is a resilience adaptation; invalid nonnull dates reach that helper's own fallback. Existing separate date-oracle results are not direct APK render evidence.

Tap `91a790` wraps existing telemetry with enum `PengumumanYuridis`, original `persilId.toString()`, and navigation callback `91a83c→91a910→91a95c`. Its captured selected row is reused; it does not request a second Yuridis detail endpoint or open a PDF.

Detail `91a95c..91b318` has heading **pemohon**, subtitle **formatted tanggalMulai + ` - ` + formatted tanggalSelesai**, then exactly these six rows in order, each bound to row helper `91bb18`:

| Label | Value | Binding |
|---|---|---|
| Nama Desa | `wilayah` | `91adf8..91ae14` |
| NIB | `nib` | `91ae2c..91ae48`; PP1ec60 is the UnlinkedCall literal `NIB`, value slot +8 |
| No Berkas | `nomorBerkas` | `91ae60..91ae7c` |
| Luas | `luasPersil.toString()` with no unit | `91ae94..91aed4` |
| Kegiatan | `kegiatan` | `91aeec..91af08` |
| Selesai | formatted `tanggalSelesai` | `91af20..91af48` |

Most String/date bindings assert nonnull. Luas takes native `toString` directly and does not clamp, coerce a numeric String, or append a unit. `nomorPengumuman` and `permohonan` are parsed but no direct display binding appears in this complete detail builder. The exported row-helper range is incomplete and is **not** used to claim its full visual layout; calls and their label/value arguments above are complete in the caller.

After rows, the detail constructs JTb reviews (next section), then **Lokasi Peta Bidang** (`91afdc`). Its callback `dad4ac` reads **the original selected `GGb.persilId`** at `dad550`, null-asserts, and calls `dad660` at `dad564`: **GET `LokasiBidang/GetByPersilId` with query `persilId`**, on the existing main client. It does not use nomorBerkas, nomorPengumuman, a fabricated ID, NIB, or entered GPS coordinates.

The response is the already recovered seven-String? `myb` metadata, not geometry. On valid success with nonnull data, callback `91c62c..91c694` creates `mFb` using **response.data.persilId**, `+0x13=true`, `+0x17=false`. The native error branch `91c474..91c62c` displays **Lokasi Peta Bidang tidak ditemukan.** with **Tutup**. A metadata read alone does not prove downstream boundary/WMS rendering or live map acceptance.

## Last-user review read: this is NOT lost review/all

Yuridis detail explicitly constructs the same shared JTb with:

- **contentId = original GGb.persilId**, loaded at `91af78`, passed `91af98`, stored by JTb constructor at `91b400` into +0xf;
- **reviewType = ITb.sertipikatSaya**, PP30b58 (enum suffix `sertipikatSaya`, index1), passed `91afa0`, stored at `91b420` into +0xb;
- **named yJj=true**, stack true at `91af8c..91af90`, named descriptor PP30b60 at `91afa8`, stored at JTb+0x13 (`91b440`).

This positively differs from lost detail's `berkasId`, `pengumumanSertipikatHilang`, default false. The common constructor starts `dacbec` at `91b444`. The **true flag** takes `dacc24..dacc5c`, enum suffix helper `6bece4`, and service `dad12c`.

`dad12c..dad4a0` calls main POST helper `6b9270` at **`dad1dc`** with path **`review/last_user_review`** and a `Map<String,String>` in exact order:

| Field | Fixed/native value |
|---|---|
| reviewType | `sertipikatSaya` |
| contentId | original nonnull `persilId`, unchanged |

There are no pageNumber/pageSize, query, multipart, or caller header overrides. The ordinary shared main interceptor supplies form URL encoding and stored-session handling. The shared default status predicate accepts **200–299**; this helper has no extra HTTP200 comparison. Existing transport MIME transformation precedes it; the service has **no extra String JSON decode**. Browser session gating is an explicit application policy; no authenticated/profile guard is present in JTb constructor/build itself, and static client code does not prove anonymous server acceptance.

Response handling is materially different from `review/all`:

1. At `dad1f0..dad214`, native indexes exact `response.data['data']` in the transformed body.
2. If that value is absent or null, it immediately returns **`(false, [])`** (`dad218..dad278`) without parsing yyb metadata. A browser implementation that first type-validates unused envelope fields in this branch is stricter than this native behavior.
3. If nonnull, native reads that same data again, creates a **singleton list `[original data]`**, assigns it back into the body under exact `data` (`dad278..dad30c`), then casts the resulting body to `Map<String,dynamic>` and runs **yyb `91b460`** (`dad310..dad350`). No list flattening or `data` array fallback occurs: an incoming array becomes one array element and fails the required review item Map cast.
4. yyb is the same positively bound seven-field envelope parser from [LOST-REVIEW-PROTOCOL.md](LOST-REVIEW-PROTOCOL.md): nullable int totalRecords/resultsCount/pageSize/pageNumber, bool? error, String? message, List<zyb>? data. It validates those types only in this nonnull branch. It maps the singleton through shared zyb `77fe9c` and nested Ayb `7802c0` parsers. Those exact shared models have reviewId String?, rating int?, comment String?, createdAt String?, reviewPhotos List<Ayb>?, and photo mediaId/mediaUrl/createdAt String?.
5. Typed yyb.data is null-asserted, then returned `(false, rows)` (`dad368..dad388`). Envelope error true is not consulted for that tuple. Transport exception family sa returns `(true,[])` at `dad444..dad480`; other exceptions rethrow at `dad484..dad490`. Loader `dacbec` publishes only when tuple error is not true, so a transport error can retain existing rows. No fake empty-success fallback should replace malformed input failures.

Calling current `decodeLostReviewJson` directly on this raw last-user response would be incorrect because it requires an array already at body.data. A scoped decoder can reuse the **same typed models only after reproducing this conditional singleton wrapping**, while retaining exact numeric lexemes and the null early return. Copying through ordinary JSON.parse/stringify first would lose the existing int64/double-lexeme distinction.

## Review UI, compose context, and limits

The existing complete [JTb stream-and-actions range](recovered/lost-review-ui/review-stream-and-actions.asm.txt) positively contains its true branch, despite the old report only claiming the default lost flow:

- `a4ce3c..a4cea8` checks true flag. For a nonempty list it gets **first**, asserts its `reviewPhotos` nonnull, and picks height **60** for no photos or **122** for a nonempty photo list (PP6e60 / PP3c810). It does not compute length*60 in the true branch.
- `a4cf5c..a4cf64` sets **itemCount=1**; `a4d800..a4d83c` takes first rather than the index. `a4d878..a4d880` constructs the same zTb with that first review. No multi-review rendering or pagination is native to this true-flag entry.
- zTb therefore uses the already proved **five stars, comment, source-order thumbnails, literal id_ID footer**. It does not use createdAt as the displayed footer or add an author name. The old row/photo evidence is shared by a positive call binding, not borrowed because the endpoint names look similar.
- Empty data selects `a4d63c`, with the existing belum_ada_ulasan image and **Beri Ulasan**. Nonempty data also calls **Beri Ulasan** at `a4d070→a4d144`. There is no reviewId/prepopulation passed by that entry: it opens the common new-review composer.
- The compose callback **deabc4** in `1051027_Oho.dart` reads its captured JTb **contentId+0xf** at `deac3c`, enum+0xb at `deac50`, derives its suffix with `6bece4` at `deac58`, and passes them to the shared **dead38** writer at `deac84`. Thus its native scope is positively **original persilId + sertipikatSaya**, not lost-certificate scope. After successful posting, common callback `a4d5f8→dacbec` rereads **the same true-flag last-user endpoint**. Existing false-success/uncertain-write behavior and upload MIME/byte contracts require their own implementation gates; no production write was attempted here.

Current webapp's lost-review composer/backend preparer only authorizes the lost reviewType. Its existing behavior is not a substitute for this Yuridis path. Do not broaden to arbitrary reviewType/contentId; any new support must bind this exact Yuridis selection and retain request ownership, stale-result guards, authenticated session, explicit user submit, media/size policies, and uncertain-outcome handling as named browser adaptations.

This audit supports a concrete dedicated chooser/list/search/detail/map/last-user-review read implementation. It does not establish completed runtime delivery, original APK E2E, successful production read/write acceptance, all menu parity, complete shared picker selectors, exact rendered pixels, legal authority, physical presence, geotag upload, or bypass of a required visit.
