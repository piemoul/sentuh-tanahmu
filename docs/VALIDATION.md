# Validation of the 22 October 2026 checkpoint

The complete original analysis workspace passed **2,520/2,520 Node tests** across 149 files, with zero failures, skips, cancellations or todo cases. Its frozen current runtime contains 141 authored files. The full local receipt SHA-256 is `0b18ea1475705665f5346aa775446c48d3521de16eb80229102d33af18e6c6df`. Its private/historical dependencies are intentionally absent from this source-only clone.

The latest Buku Tamu browser fixture exercised the actual app, HTTP handler, SessionStore, registry and standalone clients with synthetic account/QR/identity/transports: **14 checks, including 11 functional DOM groups, and 156 observations**. Desktop 1280 and mobile 390 remained horizontally contained; console, unhandled-rejection and CSP observations were empty. Fourteen injected lookups and eleven injected submissions are synthetic, not BPN submissions. The fixture stopped and its listener closed. The local summary hash is `bf61dd2ee3db47a2383959ed1949ccfd6848c8acac56c13a25fc6fefcd8b8209`.

Earlier native, VM, browser and genuine-account observations belong to their recorded source hashes. They are not added together into a new current coverage total. Original APK runtime parity, all-menu behavior, officer verification and production mutation acceptance remain unverified.

## Source-only tests

With Node 24:

```sh
cd webapp
npm run test:portable
```

The publication runner lists unavailable artifact/preimage-dependent cases explicitly. Tests with module-level reads of absent private evidence are excluded as whole files; other exclusions use exact anchored test names. All original test source remains in the repository. No missing artifact is fabricated and no excluded case is counted as passing. This subset is narrower than the complete 2,520-case workspace suite.

See [portable scope](PORTABLE-TEST-SCOPE.md) and its JSON manifest for actual executed/pass/skip counts, names and reasons. `docs/VALIDATION.json` records the final publication run and localhost rebuild separately. `npm test` remains the complete test command and requires the separately provisioned analysis environment.

## Deployment and publication boundaries

Docker Desktop is rebuilt from the existing original workspace using the unchanged production source, then checked at `http://localhost:4173`. The port stays bound to host loopback; Cloudflare's existing origin configuration is preserved. A cached rebuild may retain the same container and login session. A healthy server/static hash match proves delivery only, not provider acceptance.

The latest earlier feature deployment matched 136 container files, 89 localhost assets and 89 HTTPS assets. The current checkpoint rebuild has its own sanitized validation record. No account mutation is performed as part of Git/Graphify/Docker publication.

APK/ELF/pool, credentials, PKI, local `.env`, live account responses and runtime logs are excluded. `docs/SOURCE-MANIFEST.json` records copied source hashes and the disclosed README/ignore/portable-runner/documentation overlays. The Graphify map has separate extraction and portability evidence and is not a test-coverage certificate.
