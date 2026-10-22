# OSM raster and Bhumi release

The user selected OpenStreetMap instead of Google because of setup cost. The deployed app now combines OSM standard raster tiles with the fixed official Bhumi cadastral PNG overlay. Google key and billing setup are unnecessary for this implementation. The two raster layers use packaged Leaflet1.9.4; there is no custom parcel-vector drawing.

[Consolidated verification](webapp/osm-bhumi-verification-summary.json), [setup](OFFICIAL-MAP-SETUP.md), [current deployment](webapp/deployment-latest.json).

| Check | Result and scope |
|---|---|
| Node suite | 358 passed, zero failed/skipped; [full TAP](webapp/osm-bhumi-backend-tests.txt), [source binding](webapp/osm-bhumi-backend-tests.json) |
| Actual frontend functions | 906 checks across19 synthetic suites; [receipt](webapp/osm-bhumi-regressions.json) |
| Browser | 15 checks using actual packaged Leaflet and local PNGs; [checks](webapp/osm-bhumi-browser-checks.json) |
| Responsive | Actual DOM390×844 and1280×900 verified; no horizontal overflow. The fresh visible fixture tab plus a separate observation after applying the override closed the previous viewport gap. |
| Tile Referer | Every recorded local tile request carried an origin-only Referer without a query; [transport](webapp/osm-bhumi-browser-transport.json) |
| Docker/access | Healthy;7 frontend and19 backend hashes match;30 public/local access assertions over23 requests pass. No official API or GPS requests from that access script. |

The browser checks exercise zoom, pan, reset, independent Bhumi visibility, attribution, metadata escaping, dialog cleanup, removal/restoration, logout, OSM-only failures, Bhumi-only failures, configuration failure and local-library failure. The real Leaflet library runs in the fixture: its OSM template is rewritten to local PNGs and the local server also answers Bhumi paths. There are no provider or account requests. No external tile panning, scraping, prefetching or offline tests are performed.

The complete fixture lifetime records832 local HTTP requests, including766 tile requests and16 forced503 tiles. These totals include interactions before the recorded assertions; they are not attributed one-to-one to the15 checks. Browser image-load events differ from HTTP requests because of decoded-image reuse. Screenshots contain explicitly synthetic metadata and raster images:

![Desktop raster-layer fixture](webapp/osm-bhumi-browser-desktop.jpg)

[Mobile screenshot390px](webapp/osm-bhumi-browser-mobile.jpg).

The fixed Bhumi proxy retains the previously audited separate token,240-second per-session cache, lazy private authkey, exact WMS URL/parameters and one matching401/403 retry. It exposes no credential query to the browser. Before this renderer change, the user signed in and one authenticated world tile decoded PNG256×256 through that proxy; [receipt](webapp/bhumi-live-browser.json). This earlier result is not combined-map acceptance for the current renderer. The backend rebuild ended that session. The user subsequently signed in and opened a Koleksi map. A passive DOM observation found6 OSM images and6 same-origin Bhumi images decoded256x256, with no failed/pending images,2 raster layers and both attributions visible. [Live receipt](webapp/osm-bhumi-live-browser.json) omits account IDs, coordinates and tile paths. Counts describe decoded DOMimages, not upstream request totals or a direct HTTP trace. The agent did not force provider panning/zooming. The [live preview screenshot](webapp/osm-bhumi-live-preview.jpg) was captured after further user interaction and has a different zoom than the first DOMreceipt; it is not the identical observation frame.

The exact inline Koleksi/Aktivitas→Berkas map binding remains unresolved. The additional [nested native audit](BERKAS-NESTED-MAP-FOLLOWUP.md) verifies24 sources and3,808 ELF instructions, closes the rating widget and separate Unduh Peta navigation, and maps all four immediate MAb allocator callers. It does not invent a berkasId-to-persilId/q association or prove the user's observed map absent.

OSM is a deliberate provider adaptation requested by the user, not Google's native basemap. Whole-APK visual/function parity and geotag submission are not established. No physical-presence substitution or geotag upload is enabled.
