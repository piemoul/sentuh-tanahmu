# BERKAS detail: Simpan ke Koleksi

The supplied Sentuh Tanahku 6.1.5 ARM64 application has a direct bookmark toggle on specific BERKAS detail contexts. It does not open a caption form. The button automatically submits four fields derived from the detail model and the stored sign-in user. This audit makes no account or network request and changes no application, registry, backend or deployment file.

Canonical evidence: `analysis/recovered/collection-save-berkas/flow.json`, SHA-256 **`c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573`**. The ledger is frozen; its independent verifier re-decodes each instruction directly from the pinned ELF and rechecks pool references, dependencies, dispatch slots and class metadata.

| Artifact | SHA-256 |
|---|---|
| `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so` | `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` |
| `analysis/recovered/blutter-unique/pp.txt` | `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04` |

## Entry contexts

`MAb` CID6280 creates `_NAb` CID5457 at `9f8d00`; its state initializes at `749dfc`, builds at `899b84`, and calls the detail body `89a3b0`. MAb slot `+0xf=true` selects the bookmark branch (`89a9d4 → 89aa4c → 8a8fa0`). False selects a different rating branch. This flag is not a global permission attached to every BERKAS detail page.

| Native context | Route and bookmark setup |
|---|---|
| Collection, exact `BERKAS` row | `da76d0` splits `contentId` on `:` and uses element zero; `da78b0 → d878dc → 87ec28`. Builder sets `+f=true`, `+3b=false`, `+17=false`. It receives original collection row ID as `Jdj → MAb+1f` and callback `da78e0` as `Hpe → MAb+23`. |
| Activity, contains-`berkas` branch | `87e984` passes activityType `+b`, contentId `+17` and index to `d871d0`. The ordered berkas branch splits the first `:` component and calls `d878dc` at `d873ac`, then the same `87ec28` builder. Optional Hpe/Jdj are absent/null. |
| Activity, contains-`geotag` branch | Same router calls `d878dc` at `d87724` with the whole contentId. This is detail navigation and makes no geotag submission. Optional Hpe/Jdj are absent/null. |
| Search | Builder `8bd010` sets `+f=true`, `+3b=false`, `+17=false`; MAb+1f and +23 remain null. The primary ABb returned for the selected search detail supplies all save metadata. |
| Berkasku | Builder `8b0280` sets `+f=false`; this branch does not render the bookmark control. Do not infer universal bookmark availability from the shared screen class. |
| Downloaded detail | Builder `8adb20` gets `+f` from a cached object, rather than constant true. Its bookmark availability is conditional; this audit does not certify every cached context as an online save entry. |

The filtered immediate-BL scan of `.text` finds exactly four direct MAb allocator callers: `87ec84`, `8adc08`, `8b0304`, `8bd070`. It finds only `8a9a08` directly entering toggle `d91748`, and only `d91ef4` directly entering the save service. This does not enumerate indirect calls, inlining or constant widgets.

## Eligibility and button behavior

The exact native gate in `8a8fa0` is:

```text
stored-token-object-present == true
AND profile.statusVerifikasi != null
AND profile.statusVerifikasi != -1
```

The profile snapshot holds `ayb?`. `755a4c` binds JSON `statusVerifikasi`, `755a84` validates `int?`, and `755a9c` stores it to ayb `+0x27`; `8a8fe4` reads that slot. The native comparison is not `> 0`: zero and other negative integers except -1 pass this bounded gate. It does not use `userLevel` or `nomorIdentitas`.

The first condition is `_NAb+37`, initialized false and filled through `d258cc → d25988 → d025d8`. The helper reads storage key **`token`**, treats missing/empty storage as null, decodes and parses `fyb` at `6b1eb0`, and returns null on parser/other exceptions. `d25988` tests only the returned object's nonnullness; `74b410` publishes the boolean. There is no expiry or token-value comparison in these complete presence routines. This is distinct from the stored **`user` → gyb** reader used for NIK during submission.

Parent/body argument and capture bindings are separately pinned: state saved flag `+23`, busy flag `+27`, and token presence `+37` become body context `+2b`, `+2f`, `+33`. The callback is body context `+47 → 8a99e8 → d91748`.

| State | Button copy |
|---|---|
| Unsaved, idle | `Simpan ke Koleksi` |
| Saved, idle | `Hapus dari Koleksi` |
| Unsaved, busy | `Menyimpan...` |
| Saved, busy | `Menghapus...` |

While busy the builder passes a null click callback and shows a progress indicator. The controller independently checks `_NAb+27` and immediately returns if already busy. There is no form, editable caption, cancel button, confirmation dialog, trimming, blank-input validation, file upload or coordinate field in this bookmark workflow.

## Initial collection status

State initializes saved ID `+2b` from MAb+1f. Any nonnull initial ID, including the empty string, sets saved flag +23 true. If that ID is null and MAb+3b is false, init calls `d24fc0`. A true +3b skips the status read.

The service is `d251ac`, callsite **`d25250`**:

```text
GET collection/GetCollectionId
query, in order:
  id   = "${ABb.berkasId}:${ABb.kantor?.tipeKantorId ?? ''}"
  type = "BERKAS"
```

The endpoint starts with lowercase `collection`. It has no body, files, caller headers or caller options, and uses the ordinary main session client.

ABb.berkasId `+7` is a nullable string interpolated directly; null becomes the text `null`. The suffix is **CBb.tipeKantorId `+1b`, an `int?`**, not kantorId or an arbitrary string. CBb parser key load is `74e5cc`; nonnull input is validated as `num` at `74e62c` and converted with `toInt` before store `74e6b8`. Dispatch for integer CIDs60/61 points to identity `e26178`; double CID62 points to `e2610c` with `fcvtzs` at `e26124`. Null kantor/type falls back only to an empty suffix. Neither component is trimmed or blank-checked by the controller.

The status consumer has a distinctive binding: after successful typed HTTP200 it takes **yEb.message `+b`**, requires nonnull/nonempty, and stores it as saved collection ID +2b and saved flag true through `74b034`. **It does not use yEb.data for initial status.** Failed, null-envelope or null/empty-message results leave state unchanged. Catch logs `[FILE_DETAIL] Error checking collection status: ` plus the exception; this routine has no native status-error toast.

## Automatic save request

Toggle controller **`d91748`** chooses its operation from saved ID +2b, independent of the displayed saved flag. A null ID enters save; a nonnull ID enters direct removal.

Save reads the stored sign-in user again using `cfed14`: key `user`, JSON map, parser `6b1b08 → gyb`. The NIK is **gyb.nomorIndukKependudukan `+f`**, bound by key load `6b1c34`, String? validation and store `6b1c84`. It must not be substituted with profile ayb.nomorIdentitas or an editable form field. Missing user/NIK shows `NIK tidak ditemukan. Silakan login ulang.`, resets busy and makes no POST. An empty but nonnull NIK passes the native guard.

| Field, exact order/case | Value and source |
|---|---|
| `BerkasId` | `"${ABb.berkasId}:${ABb.kantor?.tipeKantorId ?? ''}"`; same composite as status, derived from the primary ABb, not clicked collection ID/contentId. |
| `Title` | `"Berkas No ${ABb.nomor}/${ABb.tahun}"`; ABb `+f/+13` are nullable ints. Raw nulls stringify as `null`; no fallback or trim. |
| `Subtitle` | `ABb.kantor?.nama ?? 'Kantor Pertanahan'`; CBb nama `+7` String?. Empty/whitespace is preserved. |
| `Nik` | Stored gyb.nomorIndukKependudukan `+f`, as above. |

Service **`d92568`**, wire-wrapper call **`d92664`**:

```text
POST Collection/AddCollectionBerkas
multipart FormData
```

`d925d0/d925e4/d925f8/d9260c` bind the four ordered keys; FormData construction is `d15344 → 707bd4`. There are no files/query/caller options/headers or additional GPS, GNSS, checksum, device or integrity fields in this bounded request. Shared inherited transport proof identifies ordinary main FRb+7 LRb and its session interceptor; final wire serialization and server enforcement are not observed.

## Response, local state and callbacks

Save, status and removal use parser **`74ae18`, yEb CID606**, on an already decoded map. Its fields are `error+7:bool?`, `message+b:String?`, `data+f:String?`. Missing/null fields are accepted; empty strings are preserved; wrong nonnull types reject. No second JSON decode or object/list data payload is accepted.

Only HTTP200 with a valid typed map returns `(false,envelope)`; **valid `error:true` is still accepted** because the controller checks the tuple error, not the envelope error. HTTP201 and other normally returned statuses fail. WO3758 exceptions may return `(true,envelope)` if their present body parses; malformed/absent body, parser failures and other exceptions return `(true,null)`.

On save success the native controller shows `message ?? 'Bookmark berhasil disimpan'` and sets the saved flag true. Save differs from the status reader: it captures **data**, and only nonnull/nonempty String data updates saved ID +2b. Null/empty data still selects the `Hapus dari Koleksi` label while ID can remain null; another tap then saves again. This native label/ID divergence must not be silently normalized. On save failure it shows `message ?? 'Gagal menyimpan bookmark'` and preserves saved state; an empty message is preserved.

After ordinary save or removal success, optional MAb+23 is invoked dynamically **without await**. Search and the proved Activity routes have no callback. The Collection callback `da78e0` internally awaits the legacy rows reader `d3175c`, omitting `DZi`, whose default is false. If shared loaded +23 is already true, it returns immediately; otherwise it may read/publish rows. It never calls full forced rows+groups orchestration or the groups reader. The complete bookmark toggle itself performs no optimistic row insertion/publication, group change, loaded-flag change, GET or cache invalidation.

Nonnull saved ID, including empty string, directly calls `d92804`: **DELETE `Collection/DeleteCollectionBerkas/${savedId}`**, without root first-cached-row lookup, type routing or confirmation. Typed200 success shows `message ?? 'Berhasil dihapus dari koleksi'`, sets saved flag false and ID null, then invokes the same optional callback. Failure shows `message ?? 'Gagal menghapus dari koleksi'` and leaves state unchanged. The final treatment of special path characters is outside this audit.

The screen remains on detail; no modal/pop/navigation follows the toggle. Busy resets through `77acb8` on ordinary completion/finally. Mounted checks guard state/toast/callback handling. Outer exceptions use `Terjadi kesalahan: ` plus exception. The native routine has no form cancellation workflow; browser route/session ownership guards would be explicit lifecycle adaptations.

## Provenance and verification

This audit used the local REA skill and bounded ARM64 decoding. It did not repull tools, run Android, dump the whole application, read account data or send any production request.

The older `berkas-detail-ui.json` remains untouched at SHA `2433ee5612359d338703a279622ad7aae93ddfa8d4245faf0329c9c62f51d730`. Its original verifier has a known mismatch for `request-callsites/range-006bbe60.asm.txt`: frozen hash `057615f021387f68e60aa7466446b739d47bf17dc7acedab49b49896e1469ab9`, current hash `75d47b42385904ffc999c70968332dbd7b1ae12ff78b3f45e06ae4afb834d192`. This audit does not rebaseline or claim to repair that historical verifier. Its fresh ABb/CBb/controller/widget proofs are decoded directly from the pinned ELF; the separately pinned `berkas-current-source-verification/verification.json` records the earlier current-source instruction equivalence and original verifier failure.

Run the independent check:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_save_berkas.py
```

PASS: **41 own proof hashes / 5,046 ELF instructions**, **11 inherited proof hashes / 1,109 instructions**, **141 decisive markers**, **321 own + 65 inherited pool bindings**, **12 dependency hashes**, **6 dispatch slots**, **7 class metadata records**, **10 filtered immediate-BL references**. No runtime/server acceptance, pixel/gesture parity, server authorization/storage semantics or final wire equivalence is certified. No application, backend, registry, deployment or prior frozen ledger changed.
