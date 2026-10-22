# KKPR dense indices, panel and controls — native supplement

This separate offline REA v26 supplement resolves the KKPR shape-to-panel contract. It preserves the prior [model/map proof](SCAN-KKPR-MAP-FOLLOWUP.md) (`8aec89db…01d24`), [initial routing proof](SCAN-LOCATION-FOLLOWUP.md) (`f99ec732…ff5c9`) and their receipts. It makes no runtime, account, device, provider or production request changes.

Canonical [ledger](recovered/scan-kkpr-controls-followup/flow.json) SHA-256: **`0398c9ae8bcded7009f474cc272c95c24350c63c9636922c8f4d3003e19c425d`**. The independent [verifier](rea/verify_scan_kkpr_controls_followup.py) [passes](recovered/scan-kkpr-controls-followup/verification.json): nine new sources / 786 instructions, seven inherited sources / 4,648 instructions, 25 new pool bindings, 11 public pool values, one channel-object hash, 11 class declarations, seven inherited dispatch entries, seven allocator headers, 98 markers and ten dependency hashes. It independently decodes the pinned ELF and checks every selected instruction and annotated pool load.

ELF SHA-256 remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool remains `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_scan_kkpr_controls_followup.py
```

## Actionable identity contract

KKPR panel indices are **dense successful rendered-ring indices**. They are not original feature indices, filtered feature indices, property `id`, `alashak_index`, NIB, or PBT source-row indices. The native `CGb` panel contains `Daftar Bidang`, count and `Bidang (index+1)` rows; it does not render the 51 textual KKPR fields or reuse the KKPR-list model.

| Native field | Type and meaning | Evidence |
|---|---|---|
| `XDb+0x23` | `List<iUa?>` centers; successful nonempty rings append nonnull centers, with no skipped-source placeholder | `0x6b5f8c..0x6b5fa0`, ring append chains |
| `XDb+0x27` | `Map<String,int>` filled polygon ID → dense index | `0x6b5fbc..0x6b5fd0`, `0x7637b4`, `0x764444` |
| `XDb+0x2b` | `Map<int,ubb>` dense index → marker ID wrapper | `0x6b5fec..0x6b6004`, `0x763a50..0x763a7c` |
| `XDb+0x1b` | Tuple stream: actual marker map, tile set, polygon set | inherited `0x762e38..0x763124` |
| `XDb+0x1f` | Selected-index subject, seeded 0 | `0x6b5f60..0x6b5f70` |
| `_dEb+0x2f` | Selected integer, initialized 0 | `0x9fca8c` |

**Correction of an earlier provisional label:** `XDb+0x2b` is not a grouped-polygon-record map. Marker allocator/header and `ubb`/`RUa` metadata establish an index-to-marker-ID map. No rule groups every outline under a selected filled polygon. The old evidence stays immutable; this typed identification supersedes that narrative label.

`0x8fb258..0x8fb28c` reads the center-list length and passes it as `CGb+0xf` count. Row builder `0xa41138..0xa41548` uses its raw row index, labels index+1 and compares that index with the selected integer; callback `0xa41548..0xa415b8` forwards it. Source/component indices may be retained by a browser as provenance, but are not native action identities.

## Whole-model branch and traversal order

`0x762e38` clears the three local collections above. It filters the original feature list in order into exact `properties.geom_type == 'batas'` and `'batasizin'` lists. Null/nonmatching properties do not enter either list. The **first filtered `batas` geometry's type** selects one global branch (`0x763008..0x763094`). No `batas` selects the non-Multi branch. Root `gEb.status == false` does not block shaping; the service tuple's `error == false` and nonnull model gate it.

### Non-Multi branch — `0x76312c..0x7639ec`

First process all filtered `batas`, then all filtered `batasizin`:

| Phase | Geometry | Output for each successful nonempty exterior ring |
|---|---|---|
| `batas` outlines | Only exact `Polygon`; coordinates are wrapped as one component, then component[0] is selected | Polygon `batas_outline_<filteredBatasIndex>_0`; no center, marker or polygon-to-index entry |
| `batasizin` selectable fills | Only exact `Polygon`; take the first component's first exterior ring | One center and dense row; polygon `batasizin_<filteredIzinIndex>`; marker `marker_batasizin_<filteredIzinIndex>` |

Null geometry/coordinates skip that feature. Other geometry types skip their coordinates entirely. Both phases call the numeric ring helper, so a malformed outline can throw **before any izin processing**, even though outlines do not contribute to the panel count. Only the selected exterior ring is traversed; holes are unused.

The filled polygon ID maps to the preappend center-list length, and that dense index maps to its marker ID. Outline IDs never enter this lookup map. Selection styling looks up a polygon's ID and uses -1 for missing IDs (`0x769068..0x7690e8`); there is no property-ID fallback.

### Multi branch — `0x7640a8..0x76462c`

This branch receives **only `batas`**. The separately filtered `batasizin` list is ignored. It does not recheck each later feature's declared geometry type. Any later nonnull geometry/coordinates is traversed using this branch's nesting, even if the later type says `Polygon`.

For each filtered batas feature, materialize its components with callback `0x76462c` (cast each value to `List` and return it unchanged). For every component, select `component[0]` as the exterior ring, then invoke `0x763ba4`. Do not apply `Array.flat()`. Every successful nonempty ring appends a center and gets:

```text
polygon: batas_<filteredBatasIndex>_<componentIndex>
marker:  marker_batas_<filteredBatasIndex>_<componentIndex>
action:  centers.length before append
```

Property IDs, duplicate property IDs and unused fields do not change this indexing. Multiple valid components of one feature produce multiple dense rows. Empty or skipped earlier features/components reserve no dense index.

### Empty and malformed distinctions

| Input in the selected branch | Native effect |
|---|---|
| Null geometry or coordinates | Skip feature |
| Empty MultiPolygon top-level coordinates `[]` | No component, no row |
| Polygon coordinates `[]` | First-ring index 0 fails |
| Polygon coordinates `[[]]` | Empty exterior returns null; no row |
| Multi coordinates `[[]]` | Empty component's index 0 fails |
| Multi coordinates `[[[]]]` | Empty exterior returns null; no row |
| Null/non-List selected ring | Traversal/cast fails; not silently skipped |
| Wrong numeric x/y in traversed point | Fails; no String/bool coercion |
| Malformed unused holes, extra ordinates or geometry skipped by branch/type | Not traversed here |

A later declared Polygon with Multi nesting is processed in the global Multi branch. A conventional Polygon nesting in that branch can fail; the native code does not repair the shape by consulting its later type. Backend typed model rejection of bad known leaf types is separate and may occur before any geometry projection.

## Centers, initial camera and partial publication

The inherited ring helper converts numeric ordinates to double, normalizes each displayed point, and computes the reference center from **raw** longitude/latitude sums divided by the full vertex count, including a supplied closing duplicate. The mean is then normalized. Latitude clamps to [-90,90]; longitude wraps to [-180,180). It is not a polygon centroid. Browser JSON/finite/size/array guards remain declared adaptations. A Web Mercator raster host's latitude bound near ±85.0511 is also a display adaptation rather than the native ±90 rule.

Constructor `0x6b6020..0x6b61c4` reads cached global `r26+0x78 → 0x2f08`; null falls back to latitude -6.2, longitude 106.816666, normalized into a camera with zoom19, bearing0, tilt0. Global coordinate source and age are unproved. Both projection branches test the **preappend center count == 0** (`0x76366c`, `0x7642e8`), then replace the initial camera (`0x763694`, `0x764310`). Consequently the first successful dense entry sets the camera regardless of original source index. Empty/ignored sources before it do not prevent this. This differs from PBT's source-index-0 rule.

New shaping clears centers/ID maps but does not reset the selected subject/integer or camera. A fresh Scan map instance has selected index0 and the constructor default above. Empty features leave that instance's default camera; rerendering/reusing an instance must not invent a reset absent from the proved chain.

Fetch `0xd30f80..0xd30f8c` publishes the typed `gEb` model **before** calling shaping at `0xd30f98`. Shaping progressively mutates center list, ID maps and initial camera. Its complete marker/polygon tuple is emitted only at the end (`0x7630e8..0x763110`; empty-feature early path emits its empty tuple). A later malformed ring throws into the fetch catch. Earlier cache/model effects can remain, while the new complete marker/polygon record has not been emitted. This is neither atomic rollback nor proof of a fully published partial map.

A browser may retain the typed document and expose processed entries/centers in a diagnostic partial model with a warning. Label this as a browser adaptation; do not claim that native final record publication succeeded, discard malformed features silently, or assign invented coordinates. An exception before the first successful ring yields zero processed selectable rows; after one success it can yield one diagnostic row.

Selection checks the dense index against the current center list, requires a nonnull center and map controller, animates zoom19 through `0x768e10 → 0x751cc8`, and updates the selected integer. Pin-drop `0x8fafdc..0x8fb0e4` reads the selected center and performs the same recenter; it does not acquire fresh GPS. The separate shared `0x8fae70` control reads the cached global coordinate. Its provenance remains unavailable; a browser must not substitute a fresh device or supplied coordinate.

## Selected-point directions, not an account request

`0x8fb0e4` bounds-checks the selected dense center. `0x8fb178..0x8fb180` passes its latitude and longitude to `0xda6de0`. That complete helper and its launch bridge establish:

```text
https://www.google.com/maps/search/?api=1&query=<latitude>,<longitude>
```

The URL is built from native Double string values, parsed as URI and converted to String. Intent data is `{action: 'action_view', data: URL}`. The channel is `dev.fluttercommunity.plus/android_intent`, method `launch`; the helper awaits the result and rethrows a launch error. It reads no new GPS position and makes no main-session form request. An explicit user-opened browser link with `noreferrer` is a declared platform adaptation; JavaScript Double formatting need not certify every Dart edge value's text representation.

Evidence: `0xda6de0..0xda7010`, inherited `0x8fb1ac..0x8fb220`, public pool prefix `0x23bb0`, comma `0xafe0`, action `0x23bb8`, method `0x23bd0`, and the channel object's hash. No channel object or opaque credential value is copied wholesale into this supplement.

## RDTR/RTRW — constructors proved, integration unavailable

The state constructors bind these providers, which the prior toggle chain passes to native tile overlays:

| State slot | Class | Constructor | Public layer name |
|---|---|---|---|
| `+0x43` | `CTb` cid367 | `0x8f8a28..0x8f8ac0` | `rtr-online:rdtr_1_indonesia` |
| `+0x47` | `ETb` cid366 | `0x9fcd2c..0x9fcdc4` | `rtr-online:rtrw_kabkot_1_indonesia` |
| `+0x4b` | `FTb` cid365 | `0x9fcc94..0x9fcd2c` | `rtr-online:rtrw_provinsi_1_indonesia` |

Each concatenates static `TRb.MYi` with an opaque artifact route suffix and calls common `DTb` constructor `0x8f8ac0..0x8f8bdc`, storing layer name at `+7` and endpoint at `+0x17`. Opaque suffix values are withheld, not copied or reused as access capabilities. The verifier confirms that this new ledger contains no UUID route literals.

This bounded constructor audit does **not** establish the static base's current origin, how it is obtained, getTile HTTP method, full request path, query encoding, headers, authentication/token flow, access conditions or an approved browser credential scope. The public layer names alone do not establish a trusted provider origin. These controls must stay unavailable pending a separate scoped proof; do not invent an OSM substitute layer, borrow Bhumi credentials, add a general proxy, or advertise working RDTR/RTRW connectivity.

## Boundaries

No APK execution, real-device oracle, provider tile, original-account request, activation or geotag/GPS submission was observed. Original Google SDK rendering, polygon equality/deduplication, exact visual styling and arbitrary malformed geometry edge cases remain unproved. The supplement establishes the dense-index contract, model/cache publication order, selected-coordinate camera/directions and the provider-construction boundary. Current browser validation belongs to its own source-bound receipts, not this native ledger.
