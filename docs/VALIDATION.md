# Validation of the Tanya Berkas checkpoint, 23 October 2026

A fresh complete workspace run passed **2,553/2,553 Node tests** in 152 files, with zero failures, cancellations, skips or todo cases. It pins 147 runtime files and the current test/helper inputs. Receipt SHA-256: `263a39a3c7e13d7c61ccffc54021dc9daa9307bc4f603a2e71a8d222e0843607`. The suite includes 33 new Tanya cases; 22 existing files were explicitly migrated for the two-record catalog change without removing callbacks or assertions.

Tanya browser testing is partial: a synthetic desktop Collection/detail/chat flow loaded history, escaped literal markup and hid NIK, cleared the editor immediately, retained the next draft while a send was held, and performed one exact two-field send followed by same-ID history refresh. A mobile 390px Collection/detail was opened; full mobile chat and remaining error/navigation cases are pending. No genuine question or geotag was submitted. Earlier feature browser receipts are historical, not current aggregate parity coverage.

## Source-only tests

Run `cd webapp` then `npm run test:portable` with Node 24. All 152 current test files are published unchanged from this workspace. The public runner omits 32 explicitly named artifact/preimage-dependent callbacks, documented in [portable scope](PORTABLE-TEST-SCOPE.json). Actual portable totals and Docker rebuild results are recorded in [VALIDATION.json](VALIDATION.json). The complete suite requires the separate private analysis environment.

## Deployment and remaining work

Docker Desktop is rebuilt from the current original workspace, then checked at http://localhost:4173. Existing Cloudflare origin configuration is preserved. A backend replacement ends the in-memory login session. Health and asset hashes establish delivery, not BPN acceptance. No production write is performed by this checkpoint.

The operation catalog has 176 records: 95 active, comprising 74 reads and 21 writes. Tanya is a progress checkpoint; all-menu parity remains incomplete. Geotag upload remains disabled/official-app-required. New static audits establish capture/media and multipart details and correct response semantics; browser-only device integrity parity and legitimate physical-visit E2E remain open. Native UI navigation is not a server acceptance receipt.

APK/ELF/pool, credentials, PKI, local environment, live account responses and runtime logs are excluded. Source publication and Graphify inventories have separate hashes. Graphify is an architecture map, not a test-coverage or positioning certificate.
