# Analog certificate location map (APK 6.1.5)

**The native location map fetches geometry using each `Persil.PersilId`. It does not derive this map from `BatasPersil` or `BatasPersilLegal` embedded in the certificate response.** The initial request is the already reviewed `GET legacy/GetParcelBoundaryById?persilid=...` at callsite `0xdbaeb8`. The preview and expanded map then use the existing `mFb` parcel-map widget, whose own geometry request is the same wire contract at callsite `0xd39898`.

This bounded static audit reads the original ARM64 instructions and existing AOT metadata only. No APK execution, production request, account values, coordinate values, device-location changes, or client-integrity changes were used. It applies to analog certificate `PIb`, not the electronic certificate screen.

## Selected ID and initial acquisition

| Step | Evidence | Meaning |
| --- | --- | --- |
| Iterate certificate locations | `0x9471dc` loads `AIb+0x1f`; `0x94734c` obtains an iterator; `0x9473d4` obtains the current item | Visit each supplied `Persil` in source order. |
| Capture current location | `0x9473e4` stores the `tyb` item in the per-item closure context at `+0xf` | Map callbacks retain the selected item rather than the first certificate location. |
| Read map ID | `0x947904` loads that item; `0x94790c` loads `tyb+0x1f` | This is the selected `PersilId`. |
| Prove JSON binding | Serializer `0x70a8c0` reads `tyb+0x1f`, paired with literal `PersilId` at `0x70a8d0` / `0x70a8ec` | Do not substitute `Nomor`, `NomorIndukBidang`, certificate ID, or a collection ID. |
| Construct controller | `0x947918` allocates `jFb`; `0x947928` calls `0x947e54` with the exact field value | The constructor runs while the section is built, before a tap. |
| Store and fetch | `0x947f58` stores the input in `jFb+0xb`; null check `0x947f80`; `0x947f88` calls `0xdbac1c` | A nonnull ID triggers automatic acquisition; this branch does not test nonempty text. |
| Main client | `0x947ed0` / `0x947edc` resolve `FRb`; `0x947ef0` stores it at service `+7`; `0x947efc` stores the service at `jFb+0x17` | Reuse the normal main-session client. |
| Request | `0xdbacbc` loads `jFb+0xb`; `0xdbaccc` calls `0xdbae34`; `0xdbae90` loads `legacy/GetParcelBoundaryById?persilid=`; `0xdbaeb8` calls GET wrapper `0x7017a4` | GET, exact selected ID as `persilid`, no body or extra caller headers. |

The service builder loads `service+7 → FRb+7` at `0xdbae6c` / `0xdbae74`. The constructor also resolves other app dependencies, but this request does not create a different authorization audience, change TLS trust, or select a special client. Existing session and transport evidence remains in `CERTIFICATE-DETAIL-FLOW.md` and `TRANSPORT-BOUNDARIES.md`.

`BatasPersil` and `BatasPersilLegal` are different fields of `tyb` (`+0xb` and `+0xf`, serializer `0x70a7a8` / `0x70a7e0`). Neither is loaded as the request argument or used by this audited acquisition path. This claim is limited to the location-map chain, not every use of those model properties in the APK.

## Initial parser and loading state

HTTP 200 (`0xdbaed4`, tagged integer `0x190`) reads root `features` (`0xdbaef8`) into the `qyb` model through helper `0x947fa4`. That helper iterates all feature records and invokes parser `0x948168`.

The parser reads `id`, `properties.TIPEHAK`, `geometry.coordinates`, and `properties.PENGGUNAAN`. The geometry helper `0x94887c` selects **`coordinates.first`**, then iterates two nested lists, flattening their points into a single `List<iUa>`. The dispatch selector `0xeef3` is resolved to the actual first-element getters for built-in list CIDs 90, 91, and 92 by the retained snapshot table; direct getter bodies read array index zero. For a conventional MultiPolygon this selects its first polygon and flattens its rings. It is not a complete, structure-preserving GeoJSON renderer, and it does not inspect `geometry.type` or `crs` in this helper.

At `0x948ab4` the tagged index 2 means point index 1. That value is stored in `iUa+7` (`0x948b7c`), while point index 0 is stored in `iUa+0xf` (`0x948b88`). Closure `0x948e18` converts these back to two-element lists in the opposite field order (`+0xf`, then `+7`), preserving the original `[x, y]` order. The map-widget parser independently proves these axes are interpreted as **`[longitude, latitude]`**, via `0x7712d0` documented in `COLLECTION-DETAIL-FLOW.md`.

The initial loader uses `qyb.features.first` at `0xdbad68` (direct getter `0x60f89c`), maps its flattened points using `0x948e18`, and materializes the result at `0xdbadb0`. The materialized list is not forwarded to the preview widget in the examined continuation. The `iFb` state observed by the preview has a single field at `+7`, which is set true at `0xdbac84` and false at `0xdbad4c` or `0xdbae00`; builder `0x948f10` reads that loading flag. **Do not implement the rendered parcel geometry by copying this lossy intermediate flattening.** The actual preview and expanded map obtain their geometry through `mFb` below.

This audit does not claim the initial loader is necessary for server authorization; it is a native UI/controller sequence, not a server challenge or checksum.

## Preview and expanded-map callbacks

`0x948f10` is registered as the location section's reactive builder at `0x947960`. While state is absent or loading, it returns the loading child (`0x948f54`–`0x948f84`). When loading is false:

1. It reads the captured item's `PersilId` again at `0x948f90`.
2. It allocates **`mFb`** at `0x948f9c` (allocator `0xd4292c`) and stores the ID in widget `+0xf` at `0x948fac`.
3. Preview booleans `mFb+0x13` and `mFb+0x17` are both false at `0x948fb4`–`0x948fb8`.
4. It wraps the preview in an interaction callback `0x949040`, registered at `0x948ff4`–`0x949004`.

Tap callback `0x949040` constructs the activity label `klik lokasi bidang tanah sertipikat ` plus a suffix of the certificate number and the selected `PersilId` (`0x9490b0` onward). It passes the next callback `0x9491cc` to helper `0x6bd5d0` at `0x9491ac`. The bounded evidence establishes that activity/navigation wrapper; this audit does not enable or execute an activity POST, nor fully audit its wire contract.

`0x9491cc` installs navigation builder `0x949248` and calls navigator `0x6ba6fc` at `0x94922c`. The builder again reads the exact captured `PersilId` (`0x949268`), allocates `mFb` (`0x949274`), and stores it in `+0xf` (`0x94927c`). The expanded widget uses `+0x13=true`, `+0x17=false`. The native names and full UI effects of these booleans remain obfuscated; the evidence proves the changed configuration without guessing field names.

`mFb` is CID 6225, exactly the same parcel widget used by a `PERSIL` collection row. The existing AOT dispatch evidence selects createState `0x9fda0c`, then `_nFb` CID 5406 initializer `0x770190`. The initializer reads widget `+0xf` at `0x7701e0`, then passes it as `eDf` to controller constructor `0x770384`. With widget `+0xb` null here, this follows `0xd39470 → 0xd39814 → GET 0xd39898`, with the same selected ID and main session. Both preview and expanded widgets therefore have the parcel-map initialization path; a complete native runtime request count is not claimed from static control flow alone.

## Implementable web contract and parity limits

For each analog `Persil` record with a usable `PersilId`, the existing enabled operation `get-legacy-getparcelboundarybyid-dbaeb8` can legitimately request the exact native endpoint and query. Do not derive an ID from the embedded boundary fields or fall back to unrelated record identifiers. Treat the response as a root FeatureCollection and preserve Polygon/MultiPolygon ring structure. Existing `parcel-map.js` can render the actual response without extra client-trust settings or device GPS.

The native section starts its first request automatically. A web button that reads the boundary lazily is an explicit request-timing/UI difference, even if the endpoint and selected ID match. A local SVG boundary sketch also does not establish native basemap, tile, overlay, style, map-tool, or full-screen action parity. The native tapped activity write is a separate action; do not add it as an unreviewed side effect of a boundary read.

Neither this response nor the map display proves physical presence, acceptable GPS accuracy, datum validity, legal survey acceptance, or permission to bypass a location requirement. No checksum, attestation, or geotag-submit behavior was changed by this audit. `crs`/datum is not established by this static map parser.

## Reproduction

`analysis/rea/build_certificate_map_flow.py` verifies the original ELF SHA-256, bounded source markers, and relevant dispatch entries, then writes `analysis/recovered/certificate-map-flow.json`. It also retains source hashes so the claims can be checked against the exact audited windows. New windows were extracted with the existing project-local `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/dump_arm64_range.py`; no whole-pool dump or secret extraction is required.

Confidence is high for selected `PersilId`, new authenticated GET acquisition, automatic initial fetch, nested parser/axis operations, and preview-to-expanded widget routing. Exact rendering appearance, all map tools, activity request semantics, and runtime multiplicity are not established here.
