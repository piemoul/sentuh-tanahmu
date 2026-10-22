# Office map release — 21 October 2026

**Status: this Office map increment is verified and delivered.** The current frontend passed automated, synthetic browser and mounted-file delivery checks. This is not a whole-application completion claim.

The increment replaces the Office map placeholder with original office-point markers. It changes three existing runtime files (`webapp/app.js`, `webapp/styles.css`, `webapp/assets/maps/official-map.js`) and adds `webapp/assets/maps/office-map.js`: **121 runtime files**. Backend code and the catalog remain unchanged: **176 operations, 88 enabled** (74 reads, 14 writes).

Native behavior retained: all original office rows feed the markers independently of list filters; selections preserve original indices even for duplicate office IDs; selecting a valid point centers it at zoom 15; one office-information overlay closes through its button or map tap. The initial camera is `-0.792918, 116.482347`, zoom `4.4746`, with no invented office location. [Native binding evidence](OFFICE-MAP-UI-BINDING-FOLLOWUP-20261021.md).

OSM raster replaces the Android hybrid basemap as an accepted browser adaptation. External map controls, responsive layout and Enter/Space activation are browser adaptations. Keyboard handlers follow Leaflet's delayed marker `add` lifecycle and release replaced/retired DOM listeners. Invalid/out-of-Mercator points are omitted with explicit status; office coordinates are not changed. No parcel geometry or Bhumi layer is added to this office-point map.

| Verification | Retained result |
|---|---|
| [Node](webapp/office-map-node-keyboard-add.json) | **2082/2082 PASS**, 122 test files; `changedInputs: []`. |
| [VM](webapp/office-map-vm-keyboard-add.json) | **1190 PASS**, 23 suites; no failing current suites or input drift. Historical failed harness observations remain preserved. |
| [Browser](webapp/office-map-browser-summary.json) | **23/23 groups PASS**, plus the focused [resize DOM probe](webapp/office-map-resize-dom-observations.json): screen-anchor error about `0.400 px, 0.000007 px` after resize, including map-pane translation. Fixtures stopped and listeners closed; zero application-provider requests, production writes, console errors or CSP violations in the synthetic runs. |
| [Delivery](webapp/office-map-delivery-final.json) | **116 container files, 80 localhost files and 80 HTTPS files matched.** Existing read-only frontend mounts verified; backend process unchanged; zero builds, restarts or recreates. Both health reads returned `ok`. |
| [Public initial preview](webapp/office-map-public-preview.json) | Anonymous Office page displayed **8 loaded OSM tiles**, zero office markers, no location-button click or nearby search initiated. |

Synthetic browser checks cover office markers, filters, selection/close, keyboard, mobile layout, resize, empty/error/retry and retired replies. Their application responses and tile data are fixtures. Earlier keyboard failures and premature tile/resize measurements are retained separately, without relabeling them as passes. Final validation waits for loaded tiles and measures screen-space marker anchors, including Leaflet's ancestor pane translation after resize.

The public preview establishes initial raster rendering only. Actual nearby-service acceptance with device coordinates, account features, physical-device GPS, native hybrid-map pixel parity, geotag submission and full-application end-to-end parity remain unproved by this increment. It introduces no location spoofing or presence-attestation bypass.
