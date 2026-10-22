# Office map UI binding follow-up — 21 October 2026

The browser Office map now has **one office-information panel**, rendered by the existing parent `officeSelectedView`. The Leaflet marker module creates no popup. It retains keyboard-selectable markers, original row indices and office IDs, camera movement, map-tap/explicit-close callbacks, and lifecycle guards. This corrects the intermediate implementation that displayed the same office name and three facilities in both a Leaflet popup and the parent overlay.

## Positive native evidence

This is an offline, bounded check of the supplied Sentuh Tanahku 6.1.5 ARM64 ELF (`bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`) and retained pool (`871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`). The original [Office UI audit](OFFICE-UI-FLOW.md) and its frozen ledgers remain unchanged.

| Binding | Exact positive evidence | Browser consequence |
|---|---|---|
| Empty native marker InfoWindow | `745fd0..745fd4` installs `Ecb@785dd1` into marker `RUa+2b`. Pool `pp+1e878` contains its anchor only; title/snippet fields are null. `c681fc..c68218` serializes that field as `infoWindow`; `7461bc..7461f8` emits title (`+7`) and snippet (`+b`) only when nonnull. | Do not invent a second office text popup. |
| Single custom information panel | Existing canonical builder `8f467c..8f523c` builds office name and three facilities. Selection `da5a0c..da5a20` passes this widget to `760d60`, which stores the overlay and its position. `da5bd0` separately publishes the selected original NDb to `JDb+27`. | The parent overlay owns the name, facilities and close button. Shared selected state is not another panel. |
| Marker source independent of list filters | `8f2ac4` reads `JDb+1f` marker set; `8f2afc` stores the locally filtered rows in a different context field `+13`; `8f2c28` installs the marker set in the map. `745cb8` builds those markers from the original nearby response. | Pass all original rows to the map. Name/facility filters affect the list without removing other office markers or clearing its selection. |
| Exact selected-camera zoom | `da5ba4` loads double `15`; `da5bbc` invokes camera movement after building the selected coordinate. | A new selection centers its original point at zoom 15. A retained camera survives ordinary rerenders. |
| Close/map-tap semantics | Captured close `8f52c4` and map tap `8f5354` both call overlay hide helper `760b7c`. | Root close button, map tap and controller close hide the same parent panel. |

The [source pins](recovered/office-map-popup-correction/source-pins.json) retain **9 windows / 181 exact ELF instructions / 20 decisive markers / 15 dependency hashes / one pool object**. Seven windows reuse canonical retained ranges; the only two new bounded windows bind the marker's `infoWindow` serialization and its title/snippet null checks. These pins do not establish native Google empty-InfoWindow rendering or pixel positioning.

## Frozen correction and validation

The exclusive [preimage manifest](recovered/office-map-popup-correction/preimages.json) preserves the original module and its 26-test file byte for byte before this correction. Intermediate [before](recovered/office-map-popup-correction/before-focused-result.json) and [after](recovered/office-map-popup-correction/after-focused-result.json) focused receipts remain unchanged. After the correction, root disabled Leaflet's built-in zoom buttons to avoid overlapping the single overlay; the existing external zoom/reset buttons and map keyboard navigation remain the browser adaptation. The [controls delta](recovered/office-map-popup-correction/root-controls-delta.json) proves that the sole intervening module change was `zoomControl:true` to `zoomControl:false`.

The final [focused result](recovered/office-map-popup-correction/final-controls-focused-result.json) is **26/26 PASS**, including guards that fail if any Leaflet popup bind/unbind/open/close API is used. Previously popup-related cases now verify the actual single-overlay boundary: literal keyboard labels, no duplicated facility renderer or source mutation, one marker-selection callback, no fabricated close event, stale-marker retirement, map/explicit close exactly once, and cleanup. Existing tests still cover original indices with duplicate IDs, all-source markers, selection/retained cameras, shared bundled loading, partial failures, asynchronous retirement, resize, tile failure and controls. No assertions claim that this module renders the parent facilities.

| Final input | SHA-256 |
|---|---|
| `webapp/assets/maps/office-map.js` — 9,506 bytes | `4995feee92245e7f2884109f934d5016b3452fbaca8ddd47509378fd7cb99021` |
| `webapp/tests/office-map.test.mjs` — 22,500 bytes | `66210eb5bfdf323052b6088eec0e6261b8ecb9a0a3bd61d0b03464e971d6fac5` |

The read-only [verifier](rea/verify_office_map_ui_binding_followup.py) passes and retains [verification.json](recovered/office-map-popup-correction/verification.json). Reproduce without overwriting its receipt:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_office_map_ui_binding_followup.py
```

This follow-up made no provider, GPS, account or production request and did not build or restart containers. OSM raster tiles and external controls are accepted browser adaptations; there is no parcel geometry or Bhumi layer on this office-point map. Browser visual testing and delivery verification remain separate work owned by the parent task.
