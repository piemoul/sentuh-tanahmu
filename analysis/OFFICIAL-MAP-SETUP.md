# OpenStreetMap raster and Bhumi WMS

The current webapp uses the OpenStreetMap standard raster basemap plus the fixed official Bhumi cadastral PNG overlay. Leaflet1.9.4 is packaged locally with its BSD license. No Google browser key, Google project, or billing setup is needed for this stack. The previous Google renderer/configuration is archived outside the public app in [analysis/prototypes/google](prototypes/google/README.md).

## Run

Retain the existing root `.env` public origin setting; no map key is needed:

```dotenv
SENTUH_PUBLIC_ORIGIN=https://sentuh.davay.space
```

After this source update, run `docker compose up -d --build --force-recreate --wait webapp`. Open `http://localhost:4173` or `https://sentuh.davay.space`. Recreating the backend ends existing account sessions; sign in yourself through the page to read Bhumi tiles. Frontend assets remain individually mounted for later UI updates without restarting the backend.

## Layering and credentials

The browser requests OSM images directly from `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. It shows visible OpenStreetMap attribution, sends an origin referrer, and uses ordinary browser HTTP caching. No tile proxy, offline downloader, background prefetch, external JavaScript CDN, or substitute parcel vector renderer is added. Google keys are neither read nor exported. See the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

The separate Bhumi layer requests same-origin `/api/maps/bhumi/{z}/{x}/{y}.png`. The backend requires the current authenticated account, obtains a dedicated token through main-client GET `Bhumi/haiiizzzzzzz`, caches it per session for240seconds, and constructs only the exact recovered WMS1.1.1 destination `https://bhumi.atrbpn.go.id/expapi/live-bhumi-wms` and layer `petabpn:PersilBerdasarkanJenisHakStroke`. This uses public TLS and the recovered Referer, with no main bearer, cookie or client certificate sent to Bhumi. Token/authkey/query values remain private. One matching401/403 can renew the dedicated token.

Both layers use Web Mercator raster tiles. Geometry already returned by audited parcel/document reads sets display bounds, a reference pin and labels; no client-drawn polygon replaces the official boundary layer. Initial/reset/resize framing fits that extent with36px padding and maximum initialzoom20; large extents use a lower zoom. The pin is a display reference, independent of device GPS or submission values. See [pin validation](MAP-PIN-WEBAPP-VALIDATION.md). Controls zoom, pan, reset and toggle only the Bhumi overlay. Layer-specific failures remain visible rather than silently changing providers.

## Evidence and limits

Native contract: [Berkas map follow-up](BERKAS-MAP-FOLLOWUP.md), [basemap audit](PARCEL-MAP-BASEMAP-FOLLOWUP.md), [Bhumi client validation](BHUMI-MAP-CLIENT-VALIDATION.md), [authkey dataflow](recovered/bhumi-authkey-provenance/initializer-dataflow/README.md).

Before the OSM switch, one authenticated world tile (z0/x0/y0) decoded PNG256x256 through the same fixed Bhumi proxy. [Browser receipt](webapp/bhumi-live-browser.json) records a proxy response, not a directly captured upstream HTTP trace or a selected parcel. Google-era test reports are historical and do not validate this new OSM renderer.

The user reports a direct map in Koleksi/Aktivitas→Berkas detail. Its exact source/ID binding remains unresolved in the supplied APK; no berkasId-to-persilId/q is invented. WMS images represent the requested viewport, not a selected Berkas identity. Full application parity and geotag submission remain separate incomplete work.
