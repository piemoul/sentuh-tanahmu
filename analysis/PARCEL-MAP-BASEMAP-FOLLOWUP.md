# Shared parcel map: basemap follow-up

Scope: saved Sentuh Tanahku 6.1.5 ARM64 ELF, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Static proof only. No network, account data, emulator run, application edit, or API-key reuse.

The shared `mFb` parcel-map widget configures **Google Maps hybrid** with vector overlays. This bounded follow-up closes the provider/type gap in DOCUMENT-GEO-FLOW; it does not prove every toolbar action or a live tile response.

## Evidence chain

- Shared parcel build `9075f4` / reactive `9077f4` allocates `iab` CID6309 at `9079d0 -> d991d8` and stores initial camera at `iab+0xf` (`9079e0`).
- `907a30` loads pool `0x20ea0`, `Ocb@7a4fd1`; the existing frozen office constant object gives enum index4 and name `hybrid`. `907a34` stores it at `iab+0x23`.
- `_jab` CID5480 initialization `72509c` calls `655d78` at `7250cc`. `655d9c` reads the map type from `iab+0x23`; `655e48` writes config+0x1f; `7250d4` stores configuration at state+0x3b.
- `_jab` build `86c2b4` passes camera, overlay collections and configuration to the platform path. Android view builder `86c4c4` loads `plugins.flutter.dev/google_maps_android` at `86c7ac` and stores it at `86c7b0`. Runtime branch selection and tile traffic were not observed.
- Polygon collection is stored at `iab+0x4f` (`907a80`). Other sets are stored at +0x53/+0x63; this follow-up does not infer their semantic names from offsets alone.

## Keep the entry routes distinct

| Entry | Selected source ID and destination | Existing evidence |
| --- | --- | --- |
| Koleksi BERKAS | `contentId.split(':')[0] -> cBb -> CariBerkas` detail | COLLECTION-DETAIL-FLOW |
| Aktivitas contains `berkas` | Same split first component -> cBb detail; predicate precedes `geotag` | ACTIVITY-FLOW |
| Koleksi PERSIL | Entire contentId -> mFb+0xf -> `legacy/GetParcelBoundaryById?persilid=...` | COLLECTION-DETAIL-FLOW |
| Aktivitas bidang / PBT scan | Entire contentId -> mFb+0xf -> same boundary read | ACTIVITY-FLOW |
| Analog certificate | Selected per-item `PersilId` -> preview/expanded mFb -> boundary read | CERTIFICATE-MAP-FLOW |
| Electronic certificate | Top-level response `persilId` -> preview/expanded mFb -> boundary read | ELECTRONIC-CERTIFICATE-UI |
| Non-PBT scan viewer, location action | Entire contentId -> mFb+0xb -> `apis/getGeoJsonInfo?q=...`; shown when showRoute is1 | ACTIVITY-DOCUMENT-FLOW / DOCUMENT-GEO-FLOW |

Koleksi/Aktivitas **BERKAS is not a direct PERSIL map launch**. The separate BERKAS detail map/geotag action requires its own source trace and is outside this follow-up.

Existing DOCUMENT-GEO-FLOW proves polygon ring0 as outer boundary and remaining rings as holes (`770a08`, `770b44`, `770c0c`); `[lng,lat]` conversion (`7712d0`); arithmetic mean of all vertices, including closure, for center (`771418`); document marker `geojson_marker`; expanded/document zoom18 and preview zoom17. These facts do not prove every parcel marker uses the document marker ID. Recenter uses the stored center; legend is a static route. Other controls and route/location side effects remain incompletely audited.

## Reproduction and limits

Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_parcel_map_basemap_followup.py`, then the matching `verify_parcel_map_basemap_followup.py`. The builder freezes five bounded instruction windows and pins existing source ledgers; the independent verifier checks ELF bytes, pool bindings, dispatch entries, dependency hashes and decisive instructions.

Artifacts: `analysis/recovered/parcel-map-basemap-followup/flow.json` and `verification.json`. Existing canonical ledgers are unchanged. A browser Google Maps integration still needs suitable web authorization. A temporary OSM basemap is not identical to the APK's hybrid provider.
