# KKPR Scan map follow-up — offline native proof

The `GetKKPRDetail` response has its own `gEb`/`hEb` model family. It must not be decoded as the KKPR list (`gyb`) response. This follow-up establishes the remaining nested model fields, raw coordinate behavior, and the complete bounded map build/control/feature-panel chains. It changes no application code and makes no network or device requests.

## Frozen evidence

- Ledger: `recovered/scan-kkpr-map-followup/flow.json`, SHA-256 `8aec89dbd6c36b0aba47caf0c880aec5f1fbf83b58963e1eed3579f316301d24`.
- ELF: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool: `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Inherited initial route/service/root parser: `SCAN-LOCATION-FOLLOWUP.md` and ledger `f99ec732ea7c09684a34522c9b79667f08695c236f0fb8c5cf04e97eb07ff5c9`.
- Independent check: `rea/verify_scan_kkpr_map_followup.py` → `recovered/scan-kkpr-map-followup/verification.json`, PASS: 24 sources, 7,939 ELF instructions, 449 annotated pool loads, 451 decisive markers, 94 leaf fields, all 51 shuffled constructor field bindings independently propagated, 15 class records, 7 dispatch entries, 9 allocator headers.
- Exact dependency hashes, source hashes, instruction ranges, pool offsets, field key/type/store addresses and class/dispatch bindings are in the ledger. Exploratory files are not canonical evidence. In particular `feature-panel.explore.asm.txt` is an early incorrect dispatch hypothesis; only `feature-panel.proof.asm.txt` is the actual `CGb` panel.

Reproduce locally with the existing analysis environment:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_scan_kkpr_map_followup.py
```

## Entry and acceptance inherited without broadening

The exact Scan viewer type `KKPR` chooses `cEb`/`_dEb`/`XDb`. The fresh Scan widget provides original `q` at `+b` and null preloaded model at `+f`; the alternate preloaded shaping path is not selected. `apis/GetKKPRDetail` is POST, form-urlencoded, sole string field `q`. The native service uses exact HTTP 200 and an already-decoded map, with no second JSON decode. Root `error` null/missing defaults to true; root `data` null/missing becomes an empty map before the `gEb` parser. A bad known type reaches the service catch and yields error true/null model. The controller publishes only error false with a nonnull model. HTTP 201 and a body merely containing success-like text are not equivalent.

Root `gEb` (cid 623), parser `0x764764`, remains bound by the inherited ledger: nullable bool `status`; nullable strings `pesan`, `kkprId`, `berkasId`, `kantorId`, `encryptedId`; `textualData` at `+0x1f`; `geometryData` at `+0x23`. No list-model adapter, coordinate submission, activation, or account mutation follows from this proof.

## Containers and null behavior

| Container | Parser / class | Exact fields |
|---|---|---|
| `geometryData` | `0x764b44` / `lEb` 617 | `type` `+7` String?; `features` `+0xb` nullable mapped list of `mEb` |
| feature | `0x764cfc` / `mEb` 616 | `type` `+7` String?; `properties` `+0xb` `nEb`?; `geometry` `+0xf` `oEb`? |
| geometry | `0x764ec0` / `oEb` 614 | `type` `+7` String?; `coordinates` `+0xb` nullable top-level iterable materialized through identity callback |
| `textualData` | `0x7656c0` / `hEb` 622 | `pemohon` `+7` `ezb`?; `kkpr` `+0xb` `iEb`?; `berkas` `+0xf` `kEb`? |

Feature children and nonnull nested model objects must pass `Map<String,dynamic>` guards. `features` callback `0x764cac` calls feature parser `0x764cfc`. Null/missing containers remain null. Coordinates callback **`0xba0cec..0xba0cf4` is exactly two instructions: load argument; return**. It performs no coordinate numeric conversion, nesting validation, or child mapping. The parser preserves nested values; rendering has separate numeric requirements.

Every listed leaf is nullable and preserves missing/null. Strings stay strings; integer fields do not accept fractional numbers; numeric fields accept `num?` then call `num.toDouble()` while preserving null. Unknown map keys are not read. There are no string coercions, parsed dates, empty-string defaults, or zero defaults. A browser finite-number restriction, JSON-only iterable restriction or malformed-geometry guard must be described as an adaptation where the native model does not provide that check.

## Exact leaf fields

Each table records native input type and compressed field slot. `num? → double?` is conversion after the runtime guard. The ledger records key-load, type-load, temporary-store and object-store addresses for every row.

### Feature properties

Parser `0x765024..0x765688` (end exclusive), cid 615.

| Key | Input → stored type | Slot |
|---|---|---|
| `id` | `int?` | `0x7` |
| `total_polygons` | `int?` | `0xb` |
| `total_area_m2` | `num? → double?` | `0xf` |
| `total_area_formatted` | `String?` | `0x13` |
| `individual_areas` | `String?` | `0x17` |
| `area_m2` | `num? → double?` | `0x1b` |
| `area_formatted` | `String?` | `0x1f` |
| `created_at` | `String?` | `0x23` |
| `polygon_label` | `String?` | `0x27` |
| `itbx_status` | `String?` | `0x2b` |
| `geom_type` | `String?` | `0x2f` |
| `alashak_index` | `int?` | `0x33` |
| `alashak_nomor` | `String?` | `0x37` |
| `syarat` | `String?` | `0x3b` |

### Pemohon

Parser `0x767f24..0x768228` (end exclusive), cid 621.

| Key | Input → stored type | Slot |
|---|---|---|
| `namaPemohon` | `String?` | `0x7` |
| `npwp` | `String?` | `0xb` |
| `alamatPemohon` | `String?` | `0xf` |
| `telepon` | `String?` | `0x13` |
| `email` | `String?` | `0x17` |
| `namaKuasa` | `String?` | `0x1b` |
| `alamatKuasa` | `String?` | `0x1f` |

### Berkas

Parser `0x7658ec..0x76623c` (end exclusive), cid 618.

| Key | Input → stored type | Slot |
|---|---|---|
| `rNumber` | `num? → double?` | `0x7` |
| `berkasId` | `String?` | `0xb` |
| `taskNodeId` | `String?` | `0xf` |
| `pemilikId` | `String?` | `0x13` |
| `nomor` | `int?` | `0x17` |
| `tahun` | `int?` | `0x1b` |
| `seq` | `int?` | `0x1f` |
| `statusBerkas` | `int?` | `0x23` |
| `nomorTahun` | `String?` | `0x27` |
| `namaProsedur` | `String?` | `0x2b` |
| `namaKantor` | `String?` | `0x2f` |
| `namaProfile` | `String?` | `0x33` |
| `namaPegawai` | `String?` | `0x37` |
| `namaPemohon` | `String?` | `0x3b` |
| `namaKuasa` | `String?` | `0x3f` |
| `alamatPemohon` | `String?` | `0x43` |
| `keteranganStatusBerkas` | `String?` | `0x47` |
| `namaKabupaten` | `String?` | `0x4b` |
| `namaProvinsi` | `String?` | `0x4f` |
| `tanggalFlow` | `String?` | `0x53` |
| `statusJatuhTempo` | `String?` | `0x57` |
| `kategoriKKPR` | `String?` | `0x5b` |

### KKPR detail

Parser `0x766274..0x76785c` (end exclusive), cid 620.

| Key | Input → stored type | Slot |
|---|---|---|
| `kkprId` | `String?` | `0x7` |
| `nomor` | `String?` | `0xb` |
| `jenisKKPR` | `String?` | `0xf` |
| `berkasId` | `String?` | `0x13` |
| `pemilikId` | `String?` | `0x17` |
| `namaPemohon` | `String?` | `0x1b` |
| `npwpPemohon` | `String?` | `0x1f` |
| `alamatPemohon` | `String?` | `0x23` |
| `teleponPemohon` | `String?` | `0x27` |
| `emailPemohon` | `String?` | `0x2b` |
| `tanggalTerbit` | `String?` | `0x2f` |
| `tanggalCetak` | `String?` | `0x33` |
| `pembuatDokumen` | `String?` | `0x37` |
| `jabatanTTD` | `String?` | `0x3b` |
| `nipttd` | `String?` | `0x3f` |
| `statusPM` | `String?` | `0x43` |
| `kodeKBLI` | `String?` | `0x47` |
| `judulKBLI` | `String?` | `0x4b` |
| `skalaUsaha` | `String?` | `0x4f` |
| `alamatUsaha` | `String?` | `0x53` |
| `provinsiId` | `String?` | `0x57` |
| `kabupatenId` | `String?` | `0x5b` |
| `kecamatanId` | `String?` | `0x5f` |
| `wilayahId` | `String?` | `0x63` |
| `namaDesa` | `String?` | `0x67` |
| `namaKecamatan` | `String?` | `0x6b` |
| `namaKabupaten` | `String?` | `0x6f` |
| `namaProvinsi` | `String?` | `0x73` |
| `hasilKKPR` | `String?` | `0x77` |
| `luasDimohon` | `String?` | `0x7b` |
| `luasDisetujui` | `String?` | `0x7f` |
| `jenisManfaatRuang` | `String?` | `0x83` |
| `koefDasar` | `String?` | `0x87` |
| `koefLantai` | `String?` | `0x8b` |
| `koefDasarHijau` | `String?` | `0x8f` |
| `indikasiUtama` | `String?` | `0x93` |
| `garisSempadan` | `String?` | `0x97` |
| `jarakBangunan` | `String?` | `0x9b` |
| `koefTapak` | `String?` | `0x9f` |
| `ketinggianBangunan` | `String?` | `0xa3` |
| `jaringanUtilitas` | `String?` | `0xa7` |
| `judulDelineasiKKPR` | `String?` | `0xab` |
| `indikasiZonasi` | `String?` | `0xaf` |
| `layerBackground` | `String?` | `0xb3` |
| `kategoriKKPR` | `String?` | `0xb7` |
| `edisi` | `num? → double?` | `0xbb` |
| `jenisEdisi` | `String?` | `0xbf` |
| `kodeUnik` | `String?` | `0xc3` |
| `rNumber` | `num? → double?` | `0xc7` |
| `total` | `num? → double?` | `0xcb` |
| `pertimbangan` | `List<jEb>?` | `0xcf` |

`individual_areas` is a nullable **String**, not a nested area list. `iEb` uses a shuffled argument constructor (`0x76785c..0x767eec`); field order was not guessed from call argument positions. The independent verifier propagates the 51 actual parser locals through outgoing stack/register arguments and constructor stores.

### `pertimbangan` compatibility boundary

At `0x7676a8` the parser loads `Type: List<jEb>?`, then calls `0xd315b8` at `0x7676b4`. There is **no** JSON child `.map`, `fromJson`, or model allocation for this field. The complete specialized guard `0xd315b8..0xd31664` inspects list runtime class and runtime type arguments. It checks class metadata values `0xae`/`0x26b` (`jEb` cid 619), returns for null, and delegates nonmatching values to the generic runtime type-test stub at `0xd3165c..0xd31660`. It does not inspect length or iterate elements; empty arrays get no special exception.

Ordinary decoded JSON arrays have dynamic element type. Their rejection by a `List<jEb>?` cast, including empty `[]`, follows Dart generic cast semantics; **the original JSON decoder/runtime has not been executed here**. No accepted JSON representation for a nonnull `pertimbangan` is certified. A conservative browser codec should reject all nonnull JSON `pertimbangan`, expressly recording this as an adaptation. Mapping object children or accepting `[]` through a vacuous `every()` test would invent native acceptance.

## Map shaping and numeric nesting

The complete bounded shaping batch is `0x762e38..0x764764`. Entry clears three local collections at `XDb+0x23`, `+0x27` and `+0x2b`. The center list is `+0x23`: successful rings append their center (`0x763640..0x763738`, `0x7642bc..0x764398`) and selection reads that list (`0x768d14`). The other two collections support local ID/index and grouped polygon records; they should not be relabeled as a center list. Null/empty features publish empty record sets. Filter callbacks `0x7646f0` and `0x76467c` compare `properties.geom_type` with exact strings `batas` and `batasizin`.

At `0x763008..0x763094`, the first `batas` feature's geometry type selects the whole branch: exact `MultiPolygon` calls `0x7640a8` with the `batas` list only; otherwise `0x76312c` receives both lists. In the latter branch, each exact `Polygon` gets its coordinates wrapped as one component, while other types use an empty component list. `batas` builds outline polygons; `batasizin` uses its first component's exterior ring for fill/marker output. The MultiPolygon branch does not receive/process the separately filtered `batasizin` list.

**Precision clarification to the frozen ledger's wording “flattens polygon components”: do not call `Array.flat()` on coordinates.** In `0x764198..0x7642b0`, the native wrapper materializes components with callback `0x76462c` (cast each value to `List`, then return it unchanged). The subsequent loop selects `component[0]` and passes that exterior ring to `0x763ba4`. For normal GeoJSON nesting this means `coordinates.map(component => component[0])`, retaining each ring's point list. Polygon holes are not passed to the ring helper. The callback and selector are in the frozen map-shaping source; this paragraph states the operational nesting precisely rather than adding a flattening operation.

Ring helper `0x763ba4..0x76404c` returns null for an empty ring. Each point accesses `[0]` and `[1]`, requires nonnull `num`, and calls `toDouble()` via dispatch selector `-4090`. Extra ordinates are unused. It creates latitude from `[1]`, clamps to [-90, 90], and wraps longitude from `[0]` to [-180, 180). Numeric pool constants -90/-180/90/180/360 are pinned separately, since SIMD loads are not annotated as ordinary object pool loads. The center uses arithmetic mean of the supplied vertices, including a duplicated closing vertex, then normalizes the resulting point; it is not an area centroid. Full behavior for arbitrary malformed shapes, nonfinite numbers, short points, mixed types and every provider exception is not certified.

Local geometry/marker IDs use index-derived prefixes `batas_outline_`, `batasizin_`, `marker_batasizin_`, `batas_`, and `marker_batas_`; returned property IDs do not become a universal map action ID. Exact native Google map rendering and browser rendering remain distinct implementations.

## Map screen, controls and panel

Class binding is `cEb` 6237 → state `_dEb` 5417 → controller `XDb` 624. Dispatch selector 52114 for state 5417 resolves to build `0x8fa0f8`, titled **Lokasi Kegiatan**. Source `map-build-controls.proof.asm.txt` contains `0x8fa0f8..0x8fb340` (build and all immediately bound control callbacks).

| Native control | Direct callback | Established behavior / boundary |
|---|---|---|
| directions (`fab_directions_kkpr`) | `0x8fb0e4` | Checks selected center and delegates `0xda6de0`; external navigation helper is not expanded |
| pin drop (`fab_pin_drop_kkpr`) | `0x8fafdc` | Delegates map/camera operation; no GPS or submission request is proved |
| go to bidang (`fab_go_to_bidang_kkpr`) | `0x8fae70` | Shared callback (its pool label names another class); not a PBT-only binding |
| RDTR | `0x8fae20` | `_eEb.rdtr`, enum index 0 |
| RTRW Kabupaten | `0x8fadd0` | `_eEb.rtrwKab`, enum index 1 |
| RTRW Provinsi | `0x8fabf4` | `_eEb.rtrwProv`, enum index 2 |

Layer callbacks call `0x8fac44` → `setState` → `0x8facb4`, toggling state slots `+0x37`, `+0x3b`, `+0x3f`. Tile creation `0x769778..0x7698f0` uses provider fields `+0x43`, `+0x47`, `+0x4b` and updates tile state `+0x27`. Provider internals, URLs, access conditions and keys are deliberately not expanded or exported; working RDTR/RTRW network parity is not claimed.

Selection handler `0x768ca0` checks the raw selected index against the controller's center list. A nonnull center and map controller animate with zoom 19 through `0x768e10` → `0x751cc8`; selected index then changes via `setState` when the widget field is nonnull. The list click does not require a new server read.

Map factory `0x8fb220` allocates `CGb` cid 5927 using allocator `0xda701c`, passing polygon-map stream, count, selected source index and callback `0x8fb2cc`. Its actual stateless build selector **48657** resolves to **`0xa40a60`**. The complete `CGb` build (`0xa40a60..0xa41138`), item builder (`0xa41138..0xa41548`) and callback (`0xa41548..0xa415b8`) display **Daftar Bidang**, a count followed by ` Bidang`, and `Bidang (index+1)` labels. Selection styling compares source indices; clicks forward the original index. This panel does not render the 51-field textual KKPR model. Broader textual detail screens are not established by this bounded panel proof.

## Explicit remaining boundaries

- No APK execution, original-device oracle, provider request or server acceptance was observed.
- The full nested model is established, with the `pertimbangan` JSON/runtime distinction above. The existence of nullable textual fields does not prove they are displayed in the audited map panel.
- Controls are bound and the local selection/layer state chains are proved. External route helper internals, every shared camera/provider helper, exact Google Maps visuals, tile URLs and RDTR/RTRW connectivity remain outside scope.
- Robust browser guards, source/session ownership, lifecycle cancellation and map fitting are adaptations. Do not label these as native behavior without separate proof.
- No geotag, coordinate-submission, activation, login, signature or checksum bypass is derived or implemented.
