# Read-only Bhumi map client: implementation and bounded validation

The new backend component is ready for integration. It implements the recovered **Bhumi cadastral WMS PNG overlay** only. It contains no OSM, substitute vector map, Google SDK/key, geotag capture or submission. The latest user direction requires the native Google hybrid plus Bhumi presentation; acquiring/configuring an authorized Google browser key and implementing that frontend are separate work.

This handoff changed only the new client, its new tests, and this validation document. Configuration derivation, HTTP API routing, application UI, registry enablement and deployment were not performed by this worker. There were **zero network requests** and no credential values were derived or exported.

## Source and test result

| Artifact | SHA-256 |
|---|---|
| `webapp/private/bhumi-map-client.mjs` | `13b0260abeaf83c3e3d9d6c445104efed7f1e3b6f2d3b014c1267f1045c44ad7` |
| `webapp/tests/bhumi-map-client.test.mjs` | `6c920d3f251724cbd8c3334dd294de8b87b85f8f1e399912edb9c7e2723b87c6` |

Command: `tools/runtime/node.exe --test webapp/tests/bhumi-map-client.test.mjs`.

Result: **38 tests passed, 0 failed, 0 cancelled, 0 skipped**. Every main-service and tile response is synthetic. The default-fetch test replaces `globalThis.fetch` with a mock and restores it. This is source-level behavior validation, not production acceptance, browser rendering or full app parity.

## Interface

```js
import { BhumiMapClient, BhumiMapError } from './private/bhumi-map-client.mjs';

const maps = new BhumiMapClient(configuration, {
  mainClient,                 // existing trusted ApiClient interface
  transport,                  // optional (url, init) -> Response; defaults to fetch
  log,                       // optional safe structured event sink; default no-op
  now: Date.now,             // optional clock for token expiry
  timeoutMs: 30_000,         // optional test/deployment bound, integer 1..30,000
});

// Return shape: { status: 200, contentType: 'image/png', bytes: Buffer }
const image = await maps.tile({ x, y, z, session, signal });
maps.invalidateSession(session); // optional explicit logout/ownership invalidation
maps.close();                    // terminate this client's ongoing/future reads
```

`configuration.bhumiAuthKey()` is a synchronous private function. Construction does not invoke it or require that it exist. The function is invoked only after a valid XYZ/session and a usable dedicated WMS token, just before preparing the actual tile GET. Its value is never included in public result metadata or logs.

The session must be an active object with main tokens and an un-aborted `authenticationSignal`. The current SessionStore provides that signal and aborts it through `clearAuthentication`/delete. An integration must preserve that lifecycle; it must not synthesize an anonymous main session to obtain tiles.

`BhumiMapError` contains only `status`, a local `BHUMI_*` code and fixed Indonesian message. No upstream message/code/details/cause/header/URL is retained. Tile 401/403 ultimately maps to local HTTP502 and does not clear main login. A rejected/closed main authentication generation can return local401; explicit ownership changes return409; user abort499; timeout504. The HTTP integration must map these errors without appending underlying diagnostics.

## Recovered behavior retained

The [frozen native audit](BERKAS-MAP-FOLLOWUP.md), ledger SHA `03eb047c8b07a61bb8223011b1d658a1e7c628c51c13eb463afb7a54400dacf7`, establishes the source contract.

- The dedicated token uses `mainClient.ensureFresh(session)`, then `request({path:'Bhumi/haiiizzzzzzz', method:'GET', encoding:'none', query:{}, body:{}, auth:'session', session, signal})`. A successful refresh may replace the main token object within the same authentication generation.
- The token response must be HTTP200, a Map-like JSON object, `error !== true`, and a nonempty String `message`. The client performs no second JSON String decode. Missing/null/non-bool error values can satisfy the native comparison.
- The WMS destination is fixed to GET `https://bhumi.atrbpn.go.id/expapi/live-bhumi-wms`. The only explicit header is `Referer: https://bhumi.atrbpn.go.id/`; no main Authorization, cookie, TLS identity, PFX, arbitrary URL or body is accepted by the tile interface.
- Native query values and order are retained: token, WMS/1.1.1/GetMap, `petabpn:PersilBerdasarkanJenisHakStroke`, bbox, width256, height256, `EPSG:900913`, `image/png`, transparenttrue, private authkey.
- Bounding boxes use the native `40075016.69578488 / 2**z` span, half-world `20037508.34789244`, X east/Y south and MINX,MINY,MAXX,MAXY order. Query escaping is one pass with space `+`, `*` escaped and `~` preserved. Double formatting retains `.0` for integer doubles, using the already pinned [queue scalar conversion proof](QUEUE-MODEL-FOLLOWUP.md).
- The dedicated token cache lasts 240 seconds: native public Duration payload `0xe4e1c00` microseconds. Concurrent tiles share its in-flight load. Failed loads release that slot so a later request can recover.
- Only a first tile401/403 invalidates its matching token and causes one retry. A second401/403 or other non200 status fails; no network retry/backoff is invented. Tile success requires HTTP200.

## Explicit browser/backend guards

The following are intentional web restrictions and lifecycle adaptations, not claims about native checks:

- XYZ must be safe integer Numbers, zoom0..21, with `0 <= x,y < 2**z`. Strings and fractional/out-of-range values are not coerced.
- Cache ownership uses a per-session WeakMap and the authentication-signal identity. Logout clears cached token state and aborts its owner. No global strong session set is maintained. A late old-token401 cannot evict a newer token, including a new token object containing the same String.
- Individual tile cancellation stops only that tile's wait/fetch/body. It does not cancel the session-owned shared token future for other waiters. A sole aborted tile can therefore leave a token load running until its own session/timeout boundary; this is deliberate deduplication behavior.
- Session invalidation, client close and shared-load timeout prevent late token publication. Per-tile timeout bounds the entire logical read, including a retry. Token acquisition has its own bounded timeout.
- **Current main ApiClient limitation:** its existing `request` implementation ignores the additional signal parameter, and `ensureFresh` has no cancellable argument. This component races those operations against its signal, observes late rejections and prevents late cache publication. It does not claim to physically stop an already issued main HTTP operation; the main transport retains its own timeout. Tile fetch and response-body reading are cancellable. Future main-client signal support composes with the supplied parameter.
- The default tile transport uses fetch's standard public trust store, manual redirects and omitted credentials; no custom dispatcher or client identity is installed. Native HTTP zone overrides are not reconstructed here. Implicit fetch HTTP headers may differ from Dart.
- All redirects, pre-followed responses and mismatched response URLs are rejected. This intentionally narrower policy is not native full redirect parity.
- Tile bytes must remain at most5MiB after stream decoding, have MIME essence `image/png`, and begin with the eight-byte PNG signature. Declared oversized/invalid Content-Length also fails. The result always uses fixed safe MIME `image/png`. This does not validate full PNG structure, dimensions, cadastral accuracy or authenticity.
- Token/authkey Strings are bounded to32,768 characters, well-formed Unicode and no control bytes. Schema getters are not evaluated. An echoed main access/refresh credential cannot become a WMS token. A PNG-prefixed plaintext echo of the current WMS token/authkey is rejected rather than exposed as image bytes; this is not a claim to inspect encoded/compressed image metadata.
- Logs contain only fixed service/method/path, attempt, numeric status, outcome and local code. XYZ, query, headers, body, keys, user identity and arbitrary error properties are omitted. A throwing logger cannot alter results.

The native BTb's returned100×100 size versus256 request/overlay discrepancy remains in the native audit. This backend supplies bounded PNG bytes only; it neither rewrites image dimensions nor claims native layout parity.

## Covered regressions

The38 tests exercise exact main/token and fixed-origin tile request construction; query escaping and axis/zero formatting; lazy configuration; native envelope acceptance/rejection; session/zoom/type guards; per-session cache expiry; refresh; concurrent deduplication; recovery after failed token load; once-only401/403 retry; simultaneous and late old-token failures; individual cancellation; logout, explicit invalidation and authentication-generation replacement; close; pending refresh/token/transport/body cancellation; late response disposal; timeout; redirect rejection; strict200; MIME/signature/declared and streamed size limits; credential echoes; sanitized network/body/main errors; and logger isolation.

The tests do not establish valid current credentials, upstream CORS/availability, server acceptance, API-route authorization, Google browser-key configuration, native inline BERKAS entry mapping or browser image appearance.

## Authkey provenance handoff

The separate metadata-only audit closes the exact initializer chain without deriving a value:

1. WMS builder `db1adc` loads field descriptor `pp+0x3cea8` for `Wxb.xYi` (static late final String, offset0x1778).
2. Direct `Field.InitializerFunction` metadata maps `Wxb.xYi` to **0x929378**.
3. That wrapper reads `_Xxb.xYi`, descriptor `pp+0x3cf38`, offset0x1708.
4. Direct metadata maps `_Xxb.xYi` to **0x9293c0**.

The [supplemental README](recovered/bhumi-authkey-provenance/initializer-followup/README.md), [ledger](recovered/bhumi-authkey-provenance/initializer-followup/flow.json) and [verification](recovered/bhumi-authkey-provenance/initializer-followup/verification.json) record SHA `f0809aae331d6b7248e6733aa237fe2ced1d4276b8c53bb7bf988a4c295a23b6`. Metadata re-export matched,23 shared source/build inputs and the earlier ledger stayed unchanged. No initializer was executed and no field value read/exported. Private lazy configuration recovery and its own validation remain the integration owner's work.

The subsequent [initializer dataflow proof](recovered/bhumi-authkey-provenance/initializer-dataflow/README.md), ledger SHA `44fe3ddffa13a1682e66379c761d55e44c7001d289d42624323dcd6f1d3adc11`, closes the safe private locator: indexwise XOR of pool **0x3cf48** and **0x3cf50**, both **List<int>(36)**, then the same native String helper used by the existing queue configuration. Verification passes79 ELF instructions. Table values and reconstructed characters were not exported and the XOR was not evaluated; actual decoded character class/validity remains a private runtime guard. The client/tests above are unchanged.
