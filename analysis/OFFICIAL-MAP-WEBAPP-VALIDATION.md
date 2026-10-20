# Official-provider map release

**Historical Google-era release:** the user subsequently selected OSM raster plus Bhumi WMS because of Google setup cost. Counts and snapshots below remain bound to the earlier Google renderer. See [current provider setup](OFFICIAL-MAP-SETUP.md).

The Docker application at `http://localhost:4173` and `https://sentuh.davay.space` now uses the Google Hybrid RASTER renderer and fixed same-origin Bhumi WMS proxy. OpenStreetMap, Leaflet, and the custom SVG parcel renderer are absent from the active public app. One website key is configured centrally by the webapp operator, not supplied by every account user. Google configuration is still empty.

[Consolidated receipt](webapp/official-map-verification-summary.json) and [setup instructions](OFFICIAL-MAP-SETUP.md).

| Verification | Observed result |
|---|---|
| Complete Node suite | 360 passed, zero failed/skipped; [full TAP](webapp/official-map-backend-tests.txt), [hash binding](webapp/official-map-backend-tests.json) |
| Actual frontend functions | 906 checks in19 synthetic suites; [receipt](webapp/official-map-regressions.json) |
| Browser fixture | 14 checks with Google API double,16 local PNG requests including4 forced503 responses; [checks](webapp/official-map-browser-checks.json), [transport](webapp/official-map-browser-transport.json) |
| Docker | Healthy;4 frontend and19 backend hashes match; loopback host binding; [deployment](webapp/deployment-latest.json) |
| Public/local access | 30 assertions over23 requests, zero official API/GPS requests from this script; [receipt](webapp/cloudflare-access-latest.json) |
| Own authenticated account | User signed in after rebuild; one protected world tile decoded PNG256×256; [receipt](webapp/bhumi-live-browser.json) |

The live browser image is evidence that the fixed authenticated proxy returned a decodable PNG. Upstream WMS200 is inferred from this path's implementation; its raw HTTP response, query, token and authkey were not captured or exposed. The tile is z0/x0/y0, not a selected property or device position. No geotag or document mutation occurred.

The fixture verifies zoom, pan, reset, layer visibility, mounting/releasing dialog maps, removing/restoring DOM, auth failure, missing key, failed configuration/SDK, forced failed tiles, and logout cleanup. It does not load Google's SDK or contact BPN. A requested390px viewport did not apply to that target tab: observed DOMwidth was1280. Therefore the former mobile-named screenshot was renamed [layout observation](webapp/official-map-browser-layout.jpg), and no mobile-layout acceptance is claimed. Browser memory reused some decoded tile URLs; the transport count records actual HTTP requests rather than image-load events.

No key triggers this status in the actual renderer, shown here with explicitly synthetic metadata:

![Synthetic fixture showing missing Google website key](webapp/official-map-browser-no-key.jpg)

Remaining work: configure an authorized website key, verify the live Google SDK/CSP and combined map at desktop/mobile resolutions, and close the exact inline Koleksi/Aktivitas→Berkas source binding. Current geometry callers supply the camera only; no Berkas-to-parcel identifier is invented. The release does not establish full APK parity or enable geotag submission. Historical queue release evidence remains archived and source-bound.
