# BERKAS detail and Bhumi map follow-up

This is a bounded static audit of Sentuh Tanahku **6.1.5**. It establishes a cadastral **PNG tile overlay** used by the native YAb map and a separate geotag document read path. It does **not** establish the exact inline map that the user reports seeing directly in Koleksi/Aktivitas → BERKAS detail. That observation remains valid and unresolved; the static evidence must not be used to tell the user the map does not exist.

No production requests, account values, credential derivation, app changes or deployment were performed. Capture, submission and presence/visit checks are outside this read-only audit.

## Frozen evidence

- ARM64 ELF: `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Ledger: [flow.json](recovered/berkas-map-followup/flow.json), SHA-256 `03eb047c8b07a61bb8223011b1d658a1e7c628c51c13eb463afb7a54400dacf7`.
- [Verification report](recovered/berkas-map-followup/verification.json): **26 source hashes, 7,464 ELF instructions, 155 decisive markers, 267 pool bindings, 8 dispatch entries, 14 dependency hashes and 2 public constant records pass**.
- Builder: [build_berkas_map_followup.py](rea/build_berkas_map_followup.py); independent verifier: [verify_berkas_map_followup.py](rea/verify_berkas_map_followup.py).

The new proof windows are immutable and checked against ELF bytes. Historical BERKAS text-source drift remains documented separately; dependency pinning here does not claim the old whole-ledger verifier passes. Exploratory windows are not the canonical proof set.

## Entry and the unresolved inline map

The frozen collection/activity audits route the first colon-separated component of BERKAS `contentId` through cBb `d878dc`, then CariBerkas/SOP/print and MAb builder `87ec28`. This builder supplies MAb+13 as the selected berkas ID, sets MAb+3b false, and does not supply MAb+2b.

The full parent build `899b84–89a3b0` and body `89a3b0–89d1dc` are now independently frozen. Parent `89a20c` reads nullable MAb+2b, defaults it to zero, and passes it into body context+3f. The **Penandaan Lokasi** branch at `89ccd4–89cce0` requires that integer to equal one. This is a specific section gate, distinct from ABb.`allowGeotag`+4b. The bounded init window separately uses MAb+3b to decide whether to call the geotag-list loader with MAb+13.

The full bodies show status, cost, parties, progress, SPS, office contact and marking-section bindings. A recorded direct-call scan finds no calls to the known Google map allocator, BTb allocator/provider or the known parcel read helper in those two bodies. **This is not an exhaustive recursive widget/caller analysis.** Nested variants, other caller arguments, runtime behavior or an app-version difference can still explain the user's direct inline map. No exact source ID for that observed map is established by this audit.

Do not convert `berkasId` into `persilId` or document `q`. The primary ABb model has no audited geometry field. A new read-only map panel using the recovered WMS is a browser adaptation until its exact native entry is closed.

## Geotag list and document action

`d254ac → d2556c` posts `geotag/GetGeotagList` at `d25618`, through the main FRb client. It builds FormData using the exact key **`BerkasId`**, with the selected berkas ID passed unchanged. The body is accessed directly: `error` null/missing defaults true; a nonnull value must be bool. Only false plus nonnull `data` parses a required List. Empty lists succeed; every item must be Map<String,dynamic>. Error true, missing data or a caught parse/service exception returns an error tuple with null data. This service has no separate explicit HTTP-200-only comparison.

FAb factory `74b084 → 74b0e4` contains exactly:

| JSON key | Field | Native type |
|---|---|---|
| `geotagId` | +7 | String? |
| `geotaggerName` | +b | String? |
| `uploadAt` | +f | String? |

The parser applies no aliases, scalar coercion or empty-string defaults. It has no latitude, longitude, persil ID or geometry field.

**Lihat Penandaan Lokasi** (`8a8034`, callback `8a81e8`) creates WAb at `8a8264`, using selected FAb.`geotagId` (null defaults empty). Existing [read-adapter evidence](READ-ADAPTER-AUDIT.md) connects that viewer to POST `geotag/GetSuratPernyataanGeotag`, key `geotagId`, and PDF bytes. This action is a document viewer, not proof of a parcel-vector map.

The separate **Ambil/Ambil ulang Penandaan Lokasi** callbacks branch to NGb or YAb. YAb receives context+23 at `8a7a3c/8a7a58`; it must not be populated by inventing a berkas-to-parcel mapping.

## Native cadastral tile contract

YAb/_ZAb leaf `8b6be8` creates Google Maps iab CID6309 with **hybrid** type (`8b6ec0/8b6ec4`), plus a rab tile overlay using BTb CID368. The tile-provider dispatch reaches `e24ba8`; that function computes a bbox via `ca1bf0`, then fetches through `e24d08` and `db17f8`.

Fixed destination: **GET `https://bhumi.atrbpn.go.id/expapi/live-bhumi-wms`**.

| Query key | Native value |
|---|---|
| `token` | Dedicated cached WMS token |
| `service` | `WMS` |
| `version` | `1.1.1` |
| `request` | `GetMap` |
| `layers` | `petabpn:PersilBerdasarkanJenisHakStroke` |
| `bbox` | MINX,MINY,MAXX,MAXY, interpolated doubles |
| `width`, `height` | `256`, `256` |
| `srs` | `EPSG:900913` |
| `format` | `image/png` |
| `transparent` | `true` |
| `authkey` | Private Wxb.xYi configuration; value not inspected/exported |

`ca1b70` supplies one explicit header: **`Referer: https://bhumi.atrbpn.go.id/`**. `76daec → 76dbf4` proves GET; `d0e028` uses the HTTP Client factory `6fcf58`, whose normal branch constructs an IO client and whose alternate branch supports a zone override. It closes the client on success/error. This callsite does not use FRb or pass the main user Authorization header. Implicit Dart HTTP headers, zone overrides and actual network behavior remain runtime boundaries.

With `H = 20037508.34789244`, `W = 40075016.69578488` and `S = W / 2^z`, the exact native XYZ conversion is:

```text
MINX = -H + x*S
MINY =  H - (y+1)*S
MAXX = -H + (x+1)*S
MAXY =  H - y*S
```

The units are Web Mercator meters; X increases east and Y increases south. `ca76c0` proves division; public pool constants and arithmetic at `ca1e64–ca1ebc` fix the axes/order. Null native zoom defaults zero; this method does not itself establish a valid zoom range.

The overlay is rendered regional PNG, **not vector GeoJSON** and not proof of the selected BERKAS parcel. No `berkasId`, `persilId` or device-GPS parameter appears in this tile query. The viewport XYZ determines the area.

BTb accepts HTTP200 bytes. HTTP401/403 invalidates the matching WMS cache token and retries once; other status/null fails. It reads a non-200 content-type but does not enforce PNG MIME in this window. A native quirk remains explicit: the request and overlay size are 256, but returned oVa dimensions at `e24cb8/e24cc0` are **100×100**. This audit does not claim full visual parity for that mismatch.

## Dedicated token lifecycle

RRb constructor `77c9fc` obtains FRb and stores it at +7. The loader `d3fffc` uses main FRb+7 to GET **`Bhumi/haiiizzzzzzz`**, no explicit query/body. It accepts only HTTP200, body Map, `error != true`, and a nonempty String `message`. It does not parse a second JSON String and does not cast `error` to bool; missing error can therefore satisfy the comparison.

That message is a **separate WMS token**. RRb+b caches it, +f holds a DateTime expiry, and +13 shares one in-flight future. Expiry is set with the public duration object at pool3cf08 (`off_8: int(0xe4e1c00)`); completion callback `6a071c` clears +13. The matching-token invalidator `926e60` clears token and expiry only if the failed request's query token equals the current cache value. It does not clear the main account session.

HTTP/body/message failure returns null. The caught recognized-Exception path returns null; other exceptions are rethrown. Current-server acceptance and cache behavior were not tested.

## Browser implementation boundary

A temporary OSM basemap, approved by the user, is separate from native Google hybrid. If the recovered cadastral overlay is implemented, keep the dedicated token and authkey in the backend. Accept bounded numeric XYZ and construct this fixed URL; do not accept arbitrary upstream URLs or forward the main bearer to Bhumi. Bind cache/requests to the intended main session, redact query-bearing logs/errors, and apply cancellation, image-size and MIME guards as explicit web adaptations.

Browser CORS, Referer control, actual response headers/PNG validity, redirects, current access permissions and token-endpoint acceptance remain untested. No credential was copied into frontend code. No capture, geotag submission, visit simulation or presence-check bypass is enabled by this proof.

The existing [certificate map](CERTIFICATE-MAP-FLOW.md), [document GeoJSON](DOCUMENT-GEO-FLOW.md) and [shared Google hybrid proof](PARCEL-MAP-BASEMAP-FOLLOWUP.md) remain separate sources. `common/GetWilayahByLocation` in the YAb controller supplies region information, not a substitute parcel geometry response.
