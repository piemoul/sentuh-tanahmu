# BERKAS nested widgets and caller variants

The new static evidence narrows the missing link, but **does not establish the map reported directly in Koleksi/Aktivitas → BERKAS detail**. The inspected nested renderers resolve to ratings, collection controls, parties, journey history, document viewing and marking navigation. An additional **Unduh Peta** action opens a separate destination. None provides a proven selected-parcel geometry/request/center binding for the reported inline map.

This is a bounded REA follow-up on the supplied Sentuh Tanahku **6.1.5 ARM64** artifact. No production request, APK execution, credential derivation, runtime configuration or application modification was performed. The user's screen observation is not contradicted by a static negative search.

## Frozen proof

- ELF SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool SHA-256: `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- [New ledger](recovered/berkas-nested-map-followup/flow.json), SHA-256 `0353b0fb1f25d00a714081851a6119e813a5d7c79f9170e50a6cd6fa2f0f213f`.
- [Independent verification](recovered/berkas-nested-map-followup/verification.json): **24 source hashes, 3,808 ELF instructions, 104 decisive markers, 118 pool bindings, 17 dependency hashes, 2 dispatch entries, 13 root callback bindings and 4 class metadata records pass**.
- [Immediate-reference index](recovered/berkas-nested-map-followup/direct-reference-index.json): a separately reproduced `.text` AArch64 immediate-`BL` scan for exactly three allocators. It contains 17 references overall and 4 references to the MAb allocator.
- Builder: [build_berkas_nested_map.py](rea/build_berkas_nested_map.py); independent checker: [verify_berkas_nested_map.py](rea/verify_berkas_nested_map.py).

The `.proof.asm.txt` files and ledger are canonical for this follow-up. Files containing `.explore.` and `direct-reference-exploration.json` are exploratory only. Existing ledgers and historical BERKAS source-drift reports were not rewritten. Hash-pinned reuse does not assert that the historical whole-ledger verifier passed.

## What was followed below the parent

The [previous audit](BERKAS-MAP-FOLLOWUP.md) already pinned parent `899b84`, body `89a3b0` and the marking subtree. This pass enumerates their 13 closure bindings and adds their selected child builders and navigation destinations rather than repeating a parent-only direct-call scan.

| Body binding | New bounded trace | Concrete result |
|---|---|---|
| `89aa1c → 8a92e8` | `8a9400` allocates zC; CID6273 createState dispatch → `9f9628`; state CID5635 build dispatch → `81befc` | Displays **Berikan Rating untuk Berkas ini**. The click `81c134 → 81c1b0` opens modal builder `81c278 → gBb`. This custom child is a rating control. |
| `89aa94 → 8a8fa0` | Full stream renderer through `8a92e8` | Displays **Simpan ke Koleksi / Hapus dari Koleksi**, including busy states; uses an existing callback. Mutation transport is outside this audit. |
| `89ba10 → 8a8c54` | Selected `ABb.parapihak` row → `8a8cf4` | Party name and Pemohon/Pemberi Kuasa display. |
| `89bdd4 → 8a8a24` | Builder `8a8a9c` → RAb allocation `8a8bb0` | A separate journey-history destination carrying the ABb journey list. This pass stops at that destination boundary. |
| `89c200 → 8a82e0` | Row action `8a8780` → builder `8a87f8` → yGb | Document viewer route; the constructed URL has `dokumen/GetDokumen?id=` and `&tipe=`. The already-proven document transport is not re-audited or called. |
| `89ce90 → 8a6cf8` | Reuses frozen marking subtree | YAb/NGb capture/navigation and WAb statement document viewing remain distinct from the reported inline map. |

The rating child receives a number/year display, office name and a callback at `8a9410/8a9418/8a9434`. Its inspected build creates a button and text; its nested callback opens the rating dialog. This closes the ambiguity created by stopping at an unknown custom widget allocator in the first pass.

Parent action bindings were also followed to their immediate UI boundaries:

- `8a9b80 → 8a9bfc → aBb` is the **Tanya Berkas** destination carrying the selected file identifier and number/year display.
- `8a9d68 → 8a9da0 → 8a9f04/8a9f44` renders **Bagikan Berkas** and its recipient dialog. Submission callbacks were not executed or traced into write services.
- `8aa9b4 → 8aa9ec → 8aab08/8aab48` renders **Unduh Berkas**, with explicit text about offline marking and downloading the map. **Unduh Peta** binds `8abb44`; its builder `8abbac` allocates NGb and sets `+b=false`. The map is reached through this action, not inserted by this dialog into the parent detail body.
- `8abbcc` performs the back action. `8a9948`, `8a9990` and `8a99e8` delegate to state/controller actions; their complete downstream behavior is intentionally outside the read-only nested-renderer proof.

## Four immediate MAb allocation callers

The scan is complete only for **immediate `BL` instructions targeting allocator `d8833c` in this ELF's `.text`**. It is not an inventory of indirect calls, inlined allocations, constant objects or every possible runtime route.

| Allocation site / builder | Proven source | Relevant argument distinction |
|---|---|---|
| `87ec84` / `87ec28` | Existing collection/activity vBb path from the selected BERKAS content ID | Supplies selected berkas ID at MAb+13 and primary ABb at +b. Does not supply +2b or +37. |
| `8adc08` / `8adb20` | PAb row rendered with **Unduhan** | Supplies decoded ABb, row+b as berkas ID, row+2f into MAb+2b, and optional parsed GAb into +37. |
| `8b0304` / `8b0280` | Berkasku builder | The complete window explicitly supplies MAb+2b (`8b0344`) and +37 (`8b035c`), along with other flags/context. Do not generalize the plain collection defaults to this variant. |
| `8bd070` / `8bd010` | Search-result `_zBb` builder | Requires ABb+7 as the selected berkas ID; statusCetak defaults empty. Does not supply +2b or +37. |

The downloaded row's dataflow is concrete: `8ad398` selects the list row; `8ad430` loads row+f; JSON decoding plus Map cast precede ABb factory `74ca78` at `8ad46c`; the result is captured for the detail builder. The visible **Unduhan** label is at `8ad844`. This is a distinct variant, not evidence that the ordinary Koleksi/Aktivitas entry silently receives the same optional context.

## The optional downloaded context contains no geometry fields

`8adca4` reads optional row+3f, decodes it as a Map, and invokes GAb factory `8add1c`. Its complete bounded factory reads these exact keys and stores them at offsets +7 through +1f:

| Key | Factory behavior |
|---|---|
| `berkasId` | Missing/null → empty String, otherwise requires String |
| `nomorHak` | Same |
| `noBerkas` | Same |
| `namaKantor` | Same |
| `namaPemilikBerkas` | Same |
| `wilayahHak` | Same |
| `sharedUntil` | Nullable String |

No coordinates, `persilId` or GeoJSON are read by this factory. It is **GAb**, not the FAb geotag-list item whose three fields were proven previously. Parent `89a1f4/89a2cc` forwards MAb+37 through body context+23 (`89a424`); the existing YAb builder reads that context at `8a7a3c`. This proves descriptive context propagation, not a conversion from `berkasId` to a parcel ID or document `q`.

## Remaining boundary and implementation consequence

The exact source/request/center for the user-observed direct map is still unknown. Shared framework builders, dynamic dispatch outside these selected child paths, additional runtime routes, or a difference between the supplied APK and the observed installed version remain possible. This report does not claim that all MAb variants lack a map or that the user's observation is incorrect.

The previously recovered Bhumi WMS remains a **regional cadastral PNG layer controlled by viewport XYZ**, not selected-file geometry. A browser detail panel using that layer remains a browser adaptation until the exact native inline binding is established. Basemap decisions are separate from this static evidence. Do not invent `berkasId → persilId`, document `q`, a parcel polygon, GPS coordinates, or a native camera center from these findings.

Recheck offline with:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_berkas_nested_map.py
```
