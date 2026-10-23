# Architecture checkpoint

This repository is an independent browser reconstruction informed by bounded static audits of Sentuh Tanahku 6.1.5. It is a source checkpoint, not a claim of complete application parity or production transaction acceptance. Source verification, synthetic fixtures, Android observations and earlier live observations are separate evidence categories. No deployment or account mutation is performed by the architecture mapping workflow.

## Runtime and trust boundaries

The application has no npm runtime dependencies or frontend build step. `webapp/index.html` loads the browser modules, while `webapp/server.mjs` uses Node's HTTP server to serve a fixed public allowlist and dispatch private API routes. `webapp/package.json` declares the supported Node version and local test commands.

```mermaid
flowchart LR
  User[User browser] --> SPA[app.js responsive UI]
  SPA --> Local[server.mjs same-origin HTTP]
  Local --> API[private/http-api.mjs]
  API --> Session[session.mjs memory and CSRF]
  API --> Registry[operations.mjs validated catalog]
  Registry --> Main[api-client.mjs main service]
  Main --> TLS[https-transport.mjs verified TLS]
  TLS --> Original[Fixed official upstream hosts]
  API --> Queue[queue-session and queue-client]
  API --> Bhumi[bhumi-map-client WMS proxy]
  SPA --> Map[parcel-map and official-map]
  Map --> OSM[OpenStreetMap raster tiles]
  Map --> Bhumi
  Artifacts[Local hash-pinned APK artifacts] --> Configuration[configuration.mjs]
  Configuration --> Main
  Configuration --> Queue
  Configuration --> Bhumi
```

`private/browser-origin.mjs` validates the exact Host and browser Origin. `private/session.mjs` keeps account/session state in server memory and provides host-only cookies and CSRF checks. The HTTP API binds sessions to an origin. Frontend route, session and source-response ownership guards suppress stale completions; they are browser lifecycle adaptations, not proof of native framework equivalence.

`private/configuration.mjs` derives required runtime configuration in memory from locally supplied ELF/pool artifacts with fixed hashes. Those artifacts, extracted credentials, TLS identities, account tokens and local environment values are not published in this source checkpoint. A clone without the separately provisioned original artifacts cannot establish the live upstream configuration. The server public allowlist does not serve `private/`, scripts, analysis or environment files.

`private/https-transport.mjs` implements bounded HTTPS requests, timeouts and transport diagnostics. Configuration scopes APK-derived TLS identity/trust to the audited hosts; certificate and hostname verification stay enabled. Logs contain bounded metadata rather than credentials or request/response bodies. Configured transport and a healthy localhost server do not establish upstream acceptance.

## Frontend, request adapters and feature state

`webapp/app.js` owns routes, authenticated profile gates, forms, record lists, details, dialogs and local request ownership. It imports `gnss.js`, `coordinate-comparison.js` and `parcel-map.js`. The API client executes enabled, explicitly registered operations rather than a general arbitrary URL proxy. `operations-runtime.mjs` supplies the validation/runtime functions appended to the generated `operations.mjs`; `build-operations.py` is the generator source.

Public feed, account, search, document, office, service-information, queue and collection flows use dedicated response validation where audited. Specialized modules include `news-response.mjs`, `scan-response.mjs`, `collection-response.mjs`, `queue-models.mjs` and `queue-calls-models.mjs`. Runtime-disabled or partially mapped operations remain limitations; a catalog schema count is not a completed-feature count.

The BERKAS bookmark control is wired in shared Search, Activity and Collection detail paths. It has no editable NIK form: `app.js` sends the three derived metadata fields, while `private/api-client.mjs` obtains `Nik` only from the stored sign-in user field. Initial collection status uses response `message`; save uses response `data`. Valid typed HTTP200 envelopes are handled according to the audited caller, including native label/ID divergence for empty save data. The Collection success callback uses a non-forced rows read, not a rows-plus-groups refresh. Berkasku retains its distinct rating branch.

Group creation, assignment, group deletion, membership removal, item deletion and caption editing have different cache effects. Assignment/removal refresh rows and groups; group deletion filters groups locally; item deletion filters a pre-request rows snapshot; caption editing maps the current rows list and preserves the audited local `groupId:null` clone behavior. The server's membership/cascade behavior is not inferred from those local effects.

Activity deletion uses the native post-await local removal behavior even when ordinary server acceptance is not confirmed. Its scoped backend response parser is distinct from collection scalar envelopes. Synthetic tests keep that distinction visible rather than equating a local UI disappearance with server deletion.

**Wired PERSIL collection:** `app.js` imports `collection-save-persil.js` and binds map ownership, eligibility, save/group selection, cancellation and deletion. Original server context supplies the parcel ID; the browser does not invent an ID from a Berkas number. This supersedes the historical staged-only checkpoint.

## Dedicated audited workflows at the 22 October checkpoint

The generated catalog has 176 records, 94 enabled (74 reads and 20 writes). Dedicated login/refresh and bounded map routes are distinct from this count. Enabled schemas do not prove all-role/full-menu parity or transaction acceptance.

- `assets/berkas-journey/` renders the full Journey destination with server timeline semantics and return ownership; `assets/berkas-rating/` uses backend `berkas-rating-session.mjs` and `berkas-rating-post.mjs` for a separately guarded rating workflow. Tanya Berkas, sharing/download and the selected Berkas inline geometry binding remain incomplete.
- `assets/rating-ppat/` and `private/rating-ppat-post.mjs` implement the PPAT question/rating workflow. `assets/certificate-date/` keeps audited date presentation separate from browser Date guesses.
- `assets/lost-certificate/`, `assets/lost-review/`, and `assets/yuridis/` supply lost-certificate detail/map/reviews, scoped review posting and Yuridis reads. Their decoders live in corresponding private response modules.
- `assets/swaplotting/`, `private/swaplotting-post.mjs` and `private/swaplotting-submit-session.mjs` bind personal plotting forms, retained photo bytes, review and explicit submit to a server-owned context. Personal plotting does not waive geotag visit checks or establish managed/instansi delegation.
- `assets/guestbook/` parses an office QR, reads standalone metadata, edits nine raw fields and submits through `private/guestbook-submit-session.mjs` and `private/guestbook-post.mjs`. Twelve ordered multipart parts use the original lookup's office/unit/user IDs and application authentication, separately from the main account bearer. Status interpretation follows the bounded native shared transformer. A valid office QR/arrival has not been submitted in the latest synthetic QA.
- `assets/queue/` and the queue booking models/client/session preserve native office/date/quota and review steps. Final create stays gated without genuine browser notification provisioning. No invented FCM token or Android-key reuse is introduced.
- `assets/profile/` and `private/daring-identity-response.mjs` cover verification status/method display and the initial Daring form. OTP, liveness, IKD and other device-bound completion remain explicit boundaries.
- `assets/parcel/` and `private/parcel-search-response.mjs` support scoped analog/NIBEL search. `scan-controller.js`, `scan-camera.js`, `scan-location.js` and `private/scan-map-response.mjs` keep document/PBT/KKPR scan and map branches bounded.
- `assets/session-sync.js` coalesces authoritative local session reads after focus/visibility/login rotation. Opaque cross-tab notices contain no credentials. Old responses cannot clear a newer session; requests are not replayed automatically.

All write controllers separate pre-dispatch failure from uncertain delivery after handoff, retain current-owner guards and require an explicit user action. These browser lifecycle/duplicate/context guards are documented adaptations. A local success state does not certify legal registration, officer verification or physical presence.

## Tanya Berkas checkpoint

`assets/berkas-question/` separates seven-String history parsing, adjacent raw-date grouping, controller state, escaped bubbles and a host that restores the original detail DOM. The entry is enabled only for server-proven Collection BERKAS or Cari Berkas results; Berkasku and unproven Activity entry points do not expose it. The original server berkasId remains distinct from the displayed number/year.

`private/berkas-question-session.mjs` mints opaque session-owned contexts from the successful source/detail reads. `private/berkas-question-post.mjs` enforces the two native ordered wire fields, berkasid and untrimmed content, with the recovered UTF-8 form codec. HTTP 200 with typed error=false accepts the send, followed by the same-ID history GET. The editor clears immediately and preserves a subsequent draft during the pending send.

Current browser adaptations include ordinary-ID validation, explicit read/uncertain-delivery errors, no automatic POST replay, and context/duplicate guards. A later Collection read currently revokes earlier Collection chat contexts, including another tab; reopening the detail mints a new context. This conservative behavior and further browser cases remain follow-up work. Synthetic local tests do not establish production message acceptance or full APK parity.

## Map and coordinate paths

`parcel-map.js` derives an initial camera, bounds and reference pin from server feature data. `webapp/assets/maps/official-map.js` mounts the raster OpenStreetMap base and the Bhumi WMS boundary overlay, fitting the extent and limiting the initial zoom. The displayed pin is an acuan/reference point from returned geometry, not a survey boundary or independent accuracy certificate.

OpenStreetMap tiles are loaded from their raster tile endpoint with attribution. Bhumi tiles use the same-origin `/api/maps/bhumi/{z}/{x}/{y}.png` route and `private/bhumi-map-client.mjs`; Bhumi credentials stay in the backend. `browser-map-configuration.mjs` controls the browser map configuration and CSP. Bundled map-library vendor code and artwork are excluded from this Graphify map, while authored `official-map.js` is included.

`gnss.js` parses and normalizes supplied coordinates; `coordinate-comparison.js` computes local comparisons. These local tools do not replace evidence of physical attendance. Geotag upload remains disabled/official-app-required, and this checkpoint does not implement a visit bypass, fabricated positioning or remote attestation.

## Tests, publication and evidence

`webapp/tests/*.test.mjs` contains Node transport, backend, model, ownership and actual-function VM UI tests. Separate `*-browser-fixture.mjs` files provide synthetic local browser surfaces. Those fixtures are development tools rather than product entry points; their successful responses do not prove original server behavior. Test fixtures do not need production credentials.

`scripts/` contains launch/stop/package utilities, extraction/audit verification and emulator inventory/install helpers. Docker configuration binds localhost and supports read-only frontend mounts; Cloudflare configuration is documented in `DOCKER.md`. The publication task also rebuilds the existing localhost Docker service; deployment evidence is kept separate from the graph and synthetic tests.

Selected human-readable audits remain under `analysis/`. Raw XAPK/APK/ELF/pool dumps, local runtime evidence, credentials and tool environments are omitted from publication. `docs/SOURCE-MANIFEST.json` records the copied source snapshot; it is a publication inventory, not live-server validation. Historical release documents remain historical and may describe earlier source/deployment counts.

## Graphify map provenance

The architecture graph is generated with the installed TypeScript Graphify 0.17.1 runtime and actual AST extraction, plus assistant semantic extraction for these architecture documents. `.graphifyignore` bounds the graph to production sources, tests, scripts and selected documentation. The entire analysis archive, test/fixture sources, generated validation JSON, vendored libraries, icons, binary artifacts and font/image assets are excluded from this production-architecture graph; excluded analysis documents may still be committed as reference material.

JavaScript/MJS production modules and Python utilities receive structural extraction. The installed runtime previously lacked a PowerShell parser; any current extraction gap is recorded in the graph report rather than treated as a parsed call graph. All test sources remain published and their execution scope is documented separately. No parser/package installation is used to conceal a gap.

Outputs are `.graphify/graph.json`, `.graphify/GRAPH_REPORT.md`, `.graphify/manifest.json` and `.graphify/studio/studio.html`. The Studio export is self-contained for offline review. `.graphify/.graphify_runtime.json` records the TypeScript runtime proof; `.graphify/portable-check.json` records the portability check. Semantic relationships are marked EXTRACTED, INFERRED or AMBIGUOUS; the map does not certify runtime coverage, security completeness, pixel parity or production acceptance.
