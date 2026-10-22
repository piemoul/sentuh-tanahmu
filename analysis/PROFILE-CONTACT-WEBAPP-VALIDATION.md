# Profile destinations: browser implementation and validation

Recorded 2026-10-20. This release adds the Contact, Rating and Privacy pages. It does not establish complete application or native runtime parity. The machine-readable binding is `webapp/profile-destinations-verification-summary.json` in this analysis directory.

## Implemented behavior

Contact follows the recovered native subtree: original email animation, introduction and paragraph text, then ministry WhatsApp, technical Email and technical WhatsApp in that order. The two numbers, email recipient and fixed message templates match the APK constants. The email body retains the literal `<Nama Anda>` placeholder; account data is not inserted. All destinations require an explicit click and isolate opener and referrer. No contact link was activated in testing and no message was sent.

The three copied animation/icon files match their APK bytes. The local SVG player is the pinned lottie-web 5.13.0 light ESM build, acquired without package scripts and checked against npm integrity. No CDN is required. Animation loading bounds the fixed same-origin JSON, omits credentials, rejects redirects and external animation assets, and tears down on route removal or pagehide. Reduced motion and hidden-document behavior are covered by module tests. A desktop illustration cap, responsive layout, accessible touch targets and separate browser links are explicit adaptations of the Android layout and OS launchers.

Rating presents the production Google Play URL independently present in the APK and corroborated by its package manifest. An actual click opened the public Sentuh Tanahku store page with an empty referrer. No installation, review or rating was submitted. The exact native runtime rating package-field initializer is still unbound.

Privacy presents `https://www.atrbpn.go.id/privacy-policy`, corroborated by the current official Google Play App support link. The browser observed the store's update label as 2026-10-17. That label does not identify the user's installed APK version. The policy target itself was not opened in the browser. Native Privacy/FAQ/benefits concatenate suffixes with a shared runtime base that remains unbound; the published policy URL is a separate first-party source, not proof of that base. FAQ and benefits have no new destination implementation in this release.

## Verification and deployment

| Evidence | Result and boundary |
| --- | --- |
| Node suite | 966/966 pass, including 29 tests of the actual contact animation manager; mocked upstream, no production requests. |
| Existing actual-function VM regressions | 1,190 checks in 23 suites pass; no changed inputs or protected historical receipts. |
| Independent bounded host review | 11 checks, including five actual-renderer VM groups; 18 stable inputs, no material findings. Reviewer authored the Contact native ledger but not the runtime implementation. |
| Actual public browser | 25/25 checks pass; no console warnings/errors. Contact, Rating and Privacy render at observed 1280×720 and 558×668 sizes. Mixed viewports and the popup-registration draft observation are retained in the report. |
| Deployed source comparison | 22 public frontend files and 23 backend files match local hashes. |
| Standalone Docker image | 13/13 selected hashes match with no bind mounts and network disabled. |
| Public HTTPS assets | 14/14 selected hashes match through normal DNS/TLS. No account or classifier requests in this static asset check. |

The actual browser loaded the original PNGs at 20×20, rendered and advanced the local SVG animation, preserved three exact contact destinations, and mounted a single fresh illustration after leaving and revisiting Contact. It checked layout, 48px touch targets, isolated links, the public store identity and the published policy destination. It did not test WhatsApp/email handlers, policy content, physical hardware, device GPS, camera, Bhumi or server mutation acceptance.

One container recreation was required to replace the single map-asset bind with a read-only public `webapp/assets` directory bind. The root filesystem remains read-only, the port remains bound to 127.0.0.1:4173, and the existing Cloudflare service remains `http://host.docker.internal:4173`. Private backend code remains image-only. The recreation ended the old in-memory login session; the current public browser checks were anonymous. Login is needed again for subsequent account features. No backend private source, API scopes or geotag operation was changed.

## Native audits and separate account observation

The new Contact, Profile destination and account-verification ledgers each pass their ELF/pool/source verifier. They are static proof, not emulator acceptance. The earlier 16 native ledgers, 290 historical JSON receipts and original 170-record request corpus retain their baseline hashes.

Before the container recreation, one explicit own-account status read rendered a recognized card and retained the logged-in session. Its separately sanitized connection report records one HTTP200 response from `account/CheckVerifStatusPerorangan`. That observation belongs to the predecessor frontend and does not prove a currently authenticated session. The native follow-up also identified remaining differences in nullable error handling, sign-in user-level gates and verification dialogs. Those account actions were not implemented or executed by this release.

The emulator readiness audit found installed Android images and acceleration, but retained the previously observed API30 native crash and API36 S5 refusal before login. No emulator was relaunched and no device/attestation check was bypassed. The source binding for a map directly inside the selected Berkas detail remains unresolved; no invented Berkas-to-parcel ID mapping was added. Existing OSM/Bhumi provider limitations remain separate.

## Remaining scope

This release is local/deployed progress after the previous published checkpoint `f2ea136a368f8614960b3b58169acf7e2c3cfd7d`; it has not been pushed again. Complete native menu, pixel, OS, server and hardware parity remains unverified. Geotag upload is disabled; document coordinates are not submitted as evidence of a required physical visit. The overall goal remains open.
