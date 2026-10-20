# Native save PERSIL to collection — frozen static contract

The ordinary map-detail action opens a fresh caption and optional single-group sheet. It sends **POST `Collection/AddCollectionPersil`**, multipart fields **`PersilId`, `Title`, `Subtitle`, `Nik` in that order**. `Subtitle` is always `Lokasi Bidang`. Both native add callers require the typed response's **`error` to be exactly false**, in addition to the service tuple indicating success. This is stricter than the existing root collection group mutations.

Canonical ledger: `analysis/recovered/collection-save-persil/flow.json`, SHA-256 **`dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199`**. `verification.json` records an independent PASS: 56 own source hashes / 9,329 ELF instructions; 19 inherited source hashes / 3,704 instructions; 125 decisive markers; 342 own and 171 inherited pool bindings; one public empty-text object; 19 dependencies; 16 dispatch entries; 11 application class records; seven allocator headers; 18 direct BL references, including all 12 direct map-widget allocations.

The pinned `id.go.bpn.sentuh` 6.1.5 ELF SHA-256 is `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; its pool SHA-256 is `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. No APK execution, provider access, production requests, account mutation, runtime changes, registry changes or credentials are part of this audit. REA was applied through `tools/Reverse-Engineer-Anything/skills/reverse-engineer-anything/SKILL.md` and the existing bounded offline recipes.

## Entry chain and eligibility

The proved class chain is `mFb` CID 6225 / `_nFb` 5406 (map) → `sFb` 6223 / `_tFb` 5405 (detail panel) → `uFb` 6222 / `_vFb` 5404 (save sheet). Map controller `lFb` is CID 595. Class headers, allocator headers and the relevant state factory/init/build dispatch entries are frozen in the ledger; class names alone are not evidence for business labels.

The complete parent map builder `9075f4..9089c0` contains the only two direct `sFb` allocations (`908724`, `908830`). Both require `_nFb+17 == true`, the detail-panel state. The map shell has additional predicates involving widget `+17`, requested ID `+f`, saved ID `+1b`, controller `+b`, and state `+1b/+17`; the save button is not an unconditional action on any arbitrary map. The saved-ID branch forwards the map controller, original collection ID and original callback. The unsaved branch additionally installs callback `9089c0` into `sFb+17`, which only sets the map parent's detail state false. It does not refresh a collection.

`_tFb` starts with busy false, other local flags false, an empty text controller, and token-presence false. Init `774074` copies `sFb+f` to `_tFb+1b` without trimming or empty normalization. **Empty saved ID is still nonnull and selects “Hapus Koleksi”.** Init also starts the asynchronous local token-presence reader `d3a57c → JRb.d25988 → d025d8`: it reads storage key `token`, parses the token object and checks nonnull. This is not an HTTP status query.

The save/delete control is included only when that local token-presence flag is true **and** the `ayb?` profile snapshot has a nonnull `statusVerifikasi` at `+27` other than integer `-1` (`90a6ec..90a720`). The parser independently binds pool key `statusVerifikasi` to nullable **int** and slot `+27` (`755a38..755abc`), with the serializer name binding at `c9efe0..c9f018`. The local predicate does not check role, IKD, user level, physical location or GPS accuracy. This proves a client visibility rule, not server permission.

The control shows `Simpan ke Koleksi` or `Hapus Koleksi`; while busy it shows `Menyimpan...` or `Menghapus...`, a spinner, and a null action callback. `Kembali` remains available and uses `sFb+17` when present, otherwise generic back `7257e8`.

## All known direct map origins

The verifier scans raw `.text` ARM64 BL-immediate opcodes for five known targets, without producing a full disassembly. All 12 references to map allocator `d4292c` have complete bounded caller listings. `flow.json → contract.contexts.map_origins` records each exact closure-context field chain, mode flags, preloaded feature, collection ID and callback. The compact table below uses the original class names rather than guessing every original screen's product label.

| Map call | Native owner | Map input | `+13`, `+17` | Saved ID / callback |
|---|---|---|---|---|
| `77ed14` | `kdo _iIb` | requested ID from context → `+17 → +f` | true, false | null / null |
| `87ef1c` | `QXn Pyb` | requested ID from context → `+f` | true, false | null / null |
| `87efd8` | `QXn Pyb` | same ID source | true, true | null / null |
| `8903a0` | `GYn _cAb` | neither initial ID nor preloaded feature | true, true | null / null |
| `8fcc84` | `nbo tEb` collection row | requested ID = bound `+13` content ID | true, false | bound `+17` row ID / `da78e0` |
| `917668` | `qco _zGb` | preloaded feature from context → `+f → +b → +17`, required nonnull | true, false | null / null |
| `91c668` | `xco _IGb` | requested ID from context → `+f → +b → +7`, parent required | true, false | null / null |
| `942864` | `odo _nIb` | analogous optional-parent ID | true, false | null / null |
| `948f9c` | `Bdo PIb` inline | requested ID from outer context → `+f → +1f` | false, false | null / null |
| `949274` | `Bdo PIb` route | same ID source | true, false | null / null |
| `94f8d8` | `Cdo _RIb` inline | requested ID from outer context → `+f → +3b` | false, false | null / null |
| `94fb14` | `Cdo _RIb` route | same ID source, required nonnull | true, false | null / null |

Unwritten fields remain null through the frozen null-fill allocator. This scan exhausts direct BL references to the named allocators in this ELF; it does not establish completeness for arbitrary dynamic or indirect construction. Full original-screen business labels and later map-selection state changes are outside this bounded claim.

## Ordinary save sheet

Tap handler `90ad4c` uses saved ID `_tFb+1b`: nonnull calls toggle/delete routine `daa62c`; null opens the `uFb` bottom sheet through `90aea0` and `74719c`. The normal unsaved action therefore opens this sheet. `uFb+b` receives the same map controller and `uFb+f` receives callback `90af28`, which only invokes the original parent's callback when present. **It does not write `_tFb+1b` after a normal form save.**

Every fresh sheet has an empty caption controller, save busy false, group loading false, own empty group list at `+27`, and selected group ID null at `+2b`. Init starts its own group GET without awaiting it. The form displays first-feature `Tipe Hak`, `Luas`, `NIB`, then `Caption` with hint `Tulis sesuatu biar mudah dicari di koleksi`, `Pilih Grup`, `Buat Grup`, and `Simpan ke Koleksi`. No separate main-sheet title, explicit main `Batal` button, validator, on-change validation, or explicit maximum length appears in the complete builder `90b074..90be58`. Generic Flutter back/drag/IME behavior is not inferred.

Submit `daafdc` follows this order:

1. Return if already busy. Read the map feature stream at `lFb+3b`, then the first feature of `syb.features+7` through `5f6e28`. The first-or-null helper and list iterator factories / move-next / current dispatch are independently bound. Missing or empty features show `Data bidang tidak tersedia` and issue no save.
2. Await local storage `user` via `JRb.cfed14`; parse cached sign-in model `gyb` through `6b1b08`. Missing user or null `gyb.nomorIndukKependudukan+f` shows `NIK tidak ditemukan. Silakan login kembali.`. **This NIK is distinct from the profile model `ayb.nomorIdentitas+23`.** The caller does not trim or length-check NIK: an empty string passes its nonnull test.
3. Read the **map controller's requested target ID `lFb+b`**. Null or empty string shows `ID Persil tidak tersedia`; spaces remain valid. It does not substitute first-feature ID, collection row ID, NIB, or browser-chosen identity.
4. Set save busy true, trim the current caption using native trim `447974`, and use the result if nonempty. A blank trimmed caption becomes **`Bidang Analog nomor ` + `(firstFeature.NIB ?? '1')`**. Null NIB uses `1`; empty NIB remains empty. The first feature was captured before the cached-user await. Caption/default title is captured before the primary request; later typing does not alter that request.
5. Await the primary save. A typed, accepted result may be followed by one optional group assignment, described below. Finally reset busy if mounted.

While saving, only the save action is disabled and its label becomes `Menyimpan...`. Caption input, group choices and `Buat Grup` are not disabled by parcel-save busy. No second confirmation exists in this chain. Generic route/dismiss behavior and session ownership are not proved by this static caller.

## Exact primary request and acceptance

Service `daad38`, callsite `daae30`, constructs FormData CID 3744 using the inherited multipart allocator, constructor and field mapper. The paired array stores the following insertion order before constructing the map:

| Field | Source |
|---|---|
| `PersilId` | exact map `lFb+b`, service x3 argument |
| `Title` | trimmed caption or native NIB fallback, service x5 argument |
| `Subtitle` | constant `Lokasi Bidang` |
| `Nik` | cached sign-in `gyb+f`, service x2 argument |

It calls ordinary main-client POST wrapper `6b9270` with path `Collection/AddCollectionPersil`, FormData and no caller query, files, headers or options. The inherited ordinary main client/session interceptor evidence is dependency-pinned. The primary body contains no group ID, returned collection ID, coordinate, accuracy, visit flag or checksum. The FormData mapper converts null to an empty string and other values with `toString`; the caller's validation restricts the ordinary UI path as stated above.

Only HTTP **200** with nonnull already-decoded map reaches typed parser `74ae18`, `yEb` CID 606. Fields are `error: bool?` at `+7`, `message: String?` at `+b`, `data: String?` at `+f`. Missing or null fields parse; wrong nonnull types fail. There is no second JSON decode. The service returns tuple `(false, envelope)` for a valid 200 even if body error is true or null. A normally returned non-200 becomes `(true, null)`; a typed WO3758 response can yield `(true, envelope)`; parser failures and other exceptions yield `(true, null)`.

Both add UI callers then require tuple failure flag not true **and envelope present and `envelope.error === false`** (`daaac8..daaaec`, `dab28c..dab2c8`). Body error null is a UI failure despite being parseable. Returned `data` is a nullable collection-ID string, not a parcel object. Null or empty `data` does not undo primary success. Whitespace data is nonempty and usable without trimming.

Ordinary failure displays `envelope?.message ?? 'Gagal menyimpan ke koleksi'`, preserving an empty message; it keeps caption, selected group and sheet open. The catch path uses `Terjadi kesalahan: ` plus the exception. Browser exception sanitization would be an explicit adaptation.

## Group loading, choice and post-save assignment

`_vFb` owns its group list; it is not the shared `tEb` group stream. Loader `d3a65c` calls `d31f68`, GET **`collection/GetPersilCollectionGroup`** (lowercase initial `collection`). It sets its own loading flag, uses `envelope?.data ?? []` on tuple success, and uses `[]` on tuple failure or catch. It does not branch on body error. No loaded-cache flag is introduced.

A raw empty group list shows `Belum ada grup. Buat grup terlebih dahulu.`. Nonempty raw lists are filtered with `8ffbd4`: group ID must be nonnull and length nonzero. There is no trim, sorting or deduplication; whitespace IDs pass. If a nonempty raw list contains only invalid IDs, the result has zero choices without the raw-empty message. Labels use name `?? '-'`; empty names stay empty. Exactly one ID is stored at `+2b`. Tapping the currently equal ID clears it; another ID replaces it. Duplicate IDs compare equal.

After primary acceptance and its mounted check, the caller reads returned `data`. If data is nonnull/nonempty and **the currently selected group ID is nonnull**, it awaits service `da88b8`: POST `Collection/AddPersilCollectionToGroup`, multipart order `collectionGroupId`, `collectionId`. The collection ID is the returned primary data; the group ID is read **after** the primary await, not with the caption. Changing the still-enabled selection during that await therefore changes the assignment target. There is no additional group-ID length test at this step.

Assignment also requires tuple success and body error exactly false. Failure produces warning count one; success or no assignment produces zero. No retries, multiple selection or rollback occur. A failed assignment leaves the PERSIL saved and appends exactly:

`\n\nCatatan: 1 grup gagal ditambahkan, namun bidang sudah tersimpan di koleksi.`

Missing or empty primary data skips assignment without that warning. After primary save and optional assignment, the native order is: mounted check → invoke required `uFb+f` callback **without awaiting** → close using `7257e8` → notify with primary message `?? 'Berhasil disimpan ke koleksi'`, including any warning → finally reset busy if mounted. Unmounted after the primary await skips assignment and all following UI effects; unmounted after assignment skips following UI effects. The server may already have changed.

## Nested “Buat Grup” path

The always-bound main `Buat Grup` control opens `90d00c → 74719c`, even while parcel save is busy. This is implemented by a separate nested sheet, not an unavailable feature or the root shared-controller create form. It starts with fresh empty text and local busy false. Its copy is `Buat Grup Baru`, `Beri nama grup agar bidang-bidangmu lebih mudah dikelola.`, label `Nama Grup`, hint `Contoh: Tanah Warisan, Investasi...`, buttons `Batal` / `Buat Grup`, and busy label `Menyimpan...`.

Submit `dab664` trims. Blank names show **`Nama grup tidak boleh kosong`**, remain open and issue no request, before busy is set. This differs from the root create form's blank behavior. The input remains editable while creating, but both explicit buttons are disabled while its local busy is true. Explicit cancel `9014fc` only closes the nested context; generic drag/back behavior remains unproved.

It directly calls service `da8e78`, POST `Collection/AddPersilCollectionGroup`, multipart `GroupName`. It does not use the root `tEb` create controller. **Only the service tuple failure flag controls success**: a valid body error true or null is accepted here. Failure uses `envelope?.message ?? 'Gagal membuat grup'`, preserving empty messages, or catch copy `Terjadi kesalahan`; the nested sheet stays open and local busy resets.

On accepted creation, if the nested context remains mounted, it closes through `5f3bbc → 4e5ffc` **first**, then starts the outer save sheet's own group loader `d3a65c` **without awaiting it**. No success toast, optimistic group insertion, shared cache invalidation, new-group auto-selection, or selected-ID reset is present. The existing selection survives the list reload, including when the new list omits it. Local busy finally resets through `9014ac`.

## Separate direct-toggle branch and cache effects

`daa62c` contains both delete and direct-add code, but the only observed BL caller `90ad90` calls it after a nonnull saved-ID gate, with no intervening await. The ordinary null-ID entry opens the caption sheet instead. The audit does not claim the direct-add branch globally unreachable through arbitrary dynamic calls.

The saved branch issues DELETE `Collection/DeleteCollectionPersil/{savedID}` through `da74ac`, without root-row first-match routing or another confirmation. It accepts tuple success without consulting body error, uses failure fallback `Gagal menghapus dari koleksi`, success fallback `Berhasil dihapus dari koleksi`, clears local `_tFb+1b`, and invokes its optional callback without awaiting it. This is separate from the frozen root whole-item deletion behavior.

The direct-add branch repeats the native prerequisites/default caption/primary request and strict body-error-false acceptance. Unlike the normal sheet, nonnull/nonempty returned data is written to local `_tFb+1b`; it clears parent caption and `+17`, uses success fallback `Berhasil menyimpan ke koleksi`, then calls its optional callback. Its busy state is set before prerequisites and reset in finally.

None of the save/toggle callers directly publish shared collection rows/groups, change shared loaded flags, optimistically add rows, call full refresh `d31cb8`, or call the shared row/group loaders `d32224`/`d31e18`. The save sheet's own list at `+27` is distinct from the shared controller's loaded flag at `+27`.

The collection-row map origin installs callback `da78e0`. Its complete inherited proof calls shared row loader `d3175c` with **default `DZi=false`**. If the shared rows-loaded flag at `+23` is already true, that loader returns without a GET. It does not invalidate or force refresh; its Future is not awaited by the save caller. Do not represent the normal save as automatically updating the parent's saved ID or forcing a collection refresh. Other known map origins leave the callback null.

## Reproduction and boundaries

Run locally, with the existing offline Python environment:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_collection_save_persil.py
```

The builder reproduces bounded proof listings and refuses differing frozen files. The independent verifier checks original ELF bytes, pool addressing, all source/dependency hashes, inherited source membership and prior canonical hashes, dispatch arithmetic, class metadata, seven allocator headers, direct BL scan completeness for the five specified targets, decisive branch/body/slot instructions, exact field order and the absence of direct shared-cache mutation calls in the audited callers.

This establishes static native behavior for the pinned version. It does not establish live API acceptance, authorization, server-side cascades, complete dynamic-call coverage, every original screen's business label, complete Flutter gestures/IME/lifecycle/pixel behavior, or browser adaptation correctness. No geotag, physical-visit, coordinate-integrity or location submission method was changed or tested.
