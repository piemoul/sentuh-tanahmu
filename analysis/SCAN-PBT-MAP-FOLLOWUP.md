# PBT special Scan map: bounded native follow-up

This offline REA v26 audit extends [SCAN-LOCATION-FOLLOWUP.md](SCAN-LOCATION-FOLLOWUP.md) using a new, separate ledger. It does not modify previous evidence, runtime, coverage, accounts, emulator, camera, map providers or geotag operations. The ELF and object pool were independently hashed before decoding: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` and `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

The canonical [ledger](recovered/scan-pbt-map-followup/flow.json) SHA256 is `d62a880cf8940e871e98be6954327ab0bbf494540362b7e8c3aa2eb33f002e93`. The independent [verifier](rea/verify_scan_pbt_map_followup.py) [passes](recovered/scan-pbt-map-followup/verification.json): 33 new bounded sources / 4,214 instructions, nine inherited sources / 1,347 instructions, 117 new and 83 inherited pool bindings, eight constants, 131 markers, nine dependency hashes, nine dispatch entries, 11 class headers and five allocator headers. The parent `f99ec732…ff5c9` and original Scan `bfa3cdc5…c823ab4` ledgers remain hash-identical.

## Typed coordinates and projection

The inherited complete nullable PBT parsers remain unchanged: `uGb` contains `nomor`, `kantor`, `daftarBidangTanah`; each `vGb` contains nullable String `nib`, `lokasi`, **`luas`**, `noBerkas` and nullable `batas`; `batas` contains nullable `id`, `tipeHak`, `geometri`; geometry contains nullable String `type` and nullable coordinates.

The remaining `xGb.coordinates` callback is now settled. `ba0cec..ba0cf4` consists of only `ldr x0,[x15]` and `ret`. It returns each element unchanged. The model parser materializes the top iterable into a list; it does not enforce inner array dimensions, numeric leaves, finite values, ring closure or a supported geometry type. Null stays null. A backend typed decoder must not reject numeric/nesting defects in geometry that the caller never traverses, or turn `luas` numbers into Strings.

Projection `7771e8..777ec0` clears the controller's center list and creates new polygon/marker collections. It processes source features in original order:

1. Only exact geometry type `MultiPolygon` with nonnull `batas`, geometry and coordinates is traversed. Unsupported types and absent geometry append a null center slot. Null `daftarBidangTanah` skips the feature loop; the controller's list stream separately publishes `daftar ?? []`.
2. Coordinates are traversed as polygons → rings → vertices. Polygon and ring must be iterable. Each vertex is dynamically indexed at 0 and 1; both values must be `num`, then use the pinned integer-to-double or double identity dispatch. Missing/null/String/non-numeric ordinates and wrong nested iterables throw. They are not skipped or coerced. Extra ordinates are ignored.
3. A point is built as latitude from ordinate 1, clamped to `[-90,90]`, and longitude from ordinate 0, wrapped into `[-180,180)`. No minimum ring length, closure or hole classification is enforced here.
4. Each nonempty ring gets an arithmetic mean from its **raw** latitude/longitude sums divided by the full vertex count, including a duplicated closing vertex. That mean is then normalized through the same coordinate constructor. Every nonempty ring overwrites the feature's candidate center, so the **last nonempty ring across all polygons** supplies its final center. Empty polygons/rings produce none. There is one center slot, possibly null, per original source feature.

This is not a polygon centroid or a fit-to-bounds algorithm. It differs from averaging normalized points, removing closing duplicates, combining all rings, or taking the first valid geometry.

Each nonempty ring constructs a native polygon with ID `bidang_<sourceIndex>`, an empty holes list and an index-capturing tap. Multiple rings reuse the same ID. Set insertion is proved, but equality/deduplication of duplicate polygon IDs and platform rendering remain unclassified; do not infer correct hole rendering. A marker is created only when the final feature center is nonnull, with ID `marker_<sourceIndex>`, that center and the same index tap. Its info title is `nib ?? '-'`; snippet is `(luas ?? '-') + ' m²  |  ' + (noBerkas ?? '-')`. Empty Strings stay empty.

The fetch controller publishes the typed model and `daftar ?? []` before calling projection. A projection error is caught later, after center/camera state may already have partly changed; it is not an atomic rollback. Retaining textual source rows while showing a projection error is a justified browser adaptation. Silently dropping malformed source features, or giving them invented coordinates, would change the proved behavior.

## Default and selected camera

State selected index starts at 0 (`9ff1dc`); the controller's index subject also starts at 0 (`778c80..778c90`). Its default camera is zoom 19, bearing/tilt 0. When cached global coordinate slot `r26+78 → 2f08` is nonnull it supplies latitude/longitude; otherwise the fixed fallback is **latitude -6.2, longitude 106.816666**, normalized as above. The global's origin and age are unproved.

During projection, only source index 0 can replace this initial camera. Each of its nonempty rings sets target to that ring mean at zoom 19; the last wins. A later valid feature does not replace the default when index 0 has no center. The received native map controller is stored in state `+17` by `8fb340`.

Polygon/marker tap `777ec0` and panel callback `91685c` only publish the source index into the controller's subject. The subscribed listener `778f90..779100` then checks index bounds, a nonnull center and a nonnull map controller. If available it builds `CameraPosition(center, zoom:19)` and calls `768e10 → 751cc8` without awaiting. It subsequently updates the mounted state's selected index and selected marker/polygon display. An invalid/null center skips camera movement but can still change selected index. Stream scheduling and platform animation completion are not observed.

The selected marker helper returns the matching `marker_<index>` singleton or an empty set; it does not display all stored markers simultaneously. Polygon selection maps the original polygon set with index-dependent styling. The browser may expose the selected reference point while retaining approved OSM/Bhumi raster layers, with the vector/provider difference stated explicitly.

## Panel, search and source index

The main map creates `DGb` / `_EGb` through `916708`, passing document number, office, the original source list, selected index, callback and controller. Its panel listens to the controller's filtered list stream. It shows `PBT Elektronik No.` plus `nomor ?? '-'`, office `kantor ?? '-'`, and **original source-list length** plus ` Bidang`. That count does not change to filtered count.

`Cari NIB` calls `918e50`. The helper always reads the original cached model list. Null or trim-empty query restores that list. Otherwise it trims, applies the same native String normalization helper to query and `nib ?? ''`, and performs substring containment. The conventional lowercase interpretation gives case-insensitive NIB substring search; full native Unicode table/runtime equivalence is not certified. There is no request, sorting, deduplication or selected-index reset. The explicit clear callback passes null to this helper; internal text-widget clearing is outside scope.

Each visible row locates its action index with first `indexWhere` on the **original list**, comparing:

```text
candidate.batas?.id == row.batas?.id
```

This compares boundary IDs, not NIB, object identity or filtered index. Duplicate IDs and null-ID collisions select the first matching original row. Empty String is distinct from null. No match yields -1. Badge is this matched index plus 1; selected highlight compares the same index. A row tap invokes the supplied index callback, without a new request or panel-close call.

Rows display `nib ?? '-'`, optional nonnull `lokasi`, and `Luas <luas ?? '-'> m²  | No. Berkas <noBerkas ?? '-'>`. Empty values are preserved. An empty filtered list shows `NIB tidak ditemukan.` when raw input text is nonempty, otherwise `Tidak ada data bidang.`; this raw text-length test is separate from trimmed filtering.

## Actual bounded controls

The directions button reads the selected feature center, then `dac580..dac740` constructs:

```text
https://www.google.com/maps/search/?api=1&query=<latitude>,<longitude>
```

It launches Android `action_view` through the `android_intent` channel and awaits launch, propagating caught launch errors. This action does not read current GPS or construct account/geotag requests. A browser link opened explicitly by the user with `noreferrer` is an appropriate declared platform adaptation.

The separate native ID `fab_go_to_bidang` is misleading as a selected-feature recenter description: callback `8fae70..8fafdc` reads the cached global coordinate and map controller, then requests zoom 19 there without awaiting. No fresh location request occurs in this bounded callback, but cached-coordinate provenance/freshness is unproved. A web implementation should omit it or mark it unavailable rather than substitute another coordinate source.

Provider-specific controls, Google map SDK events, native layer widgets, service/permission configuration through `75628c`, visual stacking and plugin effects remain outside scope. This audit does not certify that every possible map action is read-only.

## Main source spans

| Claim | Complete bounded span |
|---|---|
| Coordinate identity | `ba0cec..ba0cf4` |
| Projection / centers / source collections | `7771e8..777ec0` |
| Controller camera defaults | `778bd0..778f90` |
| Tap → subject | `777ec0..777f20` |
| Selection camera and state | `778f90..779208` |
| Selected marker/polygon shaping | `779208..779598` |
| Model/geometry publications into state | `779598..7798ec` |
| Panel binding and callback | `916708..9168d0` |
| Panel build/body/row | `9177f4..918cb4` |
| Row action and boundary-ID equality | `918cb4..918de4` |
| Search, predicate and input callback | `918de4..9190d4` |
| First matching index | `5004e4..5005f4` |
| Directions selection / external launch | `916640..916708`, `dac580..dac740` |
| Cached-coordinate control | `8fae70..8fafdc` |

The resulting implementation scope is the typed response, source-index selector and panel, native center/zoom behavior, and explicit external map link. Approved OSM + Bhumi raster with no custom parcel vector is a browser adaptation. Native Google/vector/holes fidelity, finite/size guards, Unicode details, cached device coordinate access and current production acceptance remain separate limitations. No geotag, activation or position-substitution authorization follows from this read-only audit.
