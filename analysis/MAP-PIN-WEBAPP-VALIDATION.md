# Centered parcel pin and preview

The user requested a location pin plus a centered, closer field preview. The shared OSM/Bhumi map now derives display bounds from the existing validated server geometry and adds one accessible PNG marker labeled **Titik acuan bidang**. Initial display, reset and container resize fit the whole extent with36px padding and initial zoom capped at20. Large fields zoom out to remain visible. Legacy camera templates without bounds retain the prior center/zoom behavior.

The marker is the midpoint of the display extent, not a measured corner, device location, or new geotag value. Multiple or disconnected geometries share one extent/reference point. Native arithmetic-mean camera metadata remains intact. Raw longitude bounds are not antimeridian-unwrapped. Visible cadastral boundaries remain official Bhumi raster tiles; no browser parcel polygon renderer or new API/submission is introduced.

[Verification summary](webapp/map-pin-verification-summary.json).

| Evidence | Result |
|---|---|
| Full Node suite | 364 passed, zero failed/skipped; [TAP](webapp/map-pin-backend-tests.txt), [source bindings](webapp/map-pin-backend-tests.json) |
| Actual frontend functions | 906 checks in19 suites; [receipt](webapp/map-pin-regressions.json) |
| Actual Leaflet browser fixture | 9 checks with local PNGs; [checks](webapp/map-pin-browser-checks.json), [transport](webapp/map-pin-browser-transport.json) |
| Size/camera behavior | Small field zoom20; large field zoom11 desktop and10 after resizing to390px. Full extent remains visible and marker tip stays within2CSSpx of the map center. |
| Controls/lifecycle | Pan→reset recenters; hiding Bhumi retains the marker and OSM; dialog close/logout remove marker DOM. Unit coverage additionally validates bad/polar/reversed bounds, cloned inputs, local icon URLs and closed resize callbacks. |
| Runtime | Same backend container,7 frontend and19 backend hashes match. No backend rebuild or account logout. |
| Own account | A Koleksi parcel reopened after frontend refresh shows one decoded pin, zoom20,4 OSM PNGs and9 Bhumi PNGs, with no failed/pending images. [Live receipt](webapp/map-pin-live-browser.json). |

The production marker tip measured approximately(-0.40,-0.52)CSSpx from the map center. The receipt stores pixel offsets/counts only, omitting identifiers, geographic coordinates and tile paths. Image counts are decoded DOMimages, not upstream request totals or captured HTTP status. Provider panning/zooming was not forced by the test; control tests ran against local tiles only.

![Centered reference pin on the authenticated map](webapp/map-pin-live-preview.jpg)

Leaflet1.9.4 behavior is documented in [fitBounds](https://leafletjs.com/reference.html#map-fitbounds) and [marker](https://leafletjs.com/reference.html#marker). This browser camera adaptation was requested explicitly; it is not a claim that the APK uses the same framing algorithm.

Acceptance covers one Koleksi parcel. The exact direct inline BERKAS entry and whole-APK parity remain unresolved; geotag upload stays disabled. See [provider validation](OSM-BHUMI-WEBAPP-VALIDATION.md) and [nested native audit](BERKAS-NESTED-MAP-FOLLOWUP.md).
