# Cloudflare access — 19 October 2026

This is the initial Cloudflare-release snapshot. The subsequent [queue release](QUEUE-WEBAPP-VALIDATION.md) retains tunnel access and adds two adapters; its newer deployment and access receipts are separate.

The deployed application is reachable at **https://sentuh.davay.space**, while **http://localhost:4173** remains available. This validates tunnel access and anonymous browser/session behavior, not GPS acquisition, account login on the public domain or submission acceptance by the official service.

## Cause and change

The existing Docker connector's latest configuration maps `sentuh.davay.space` to `http://host.docker.internal:4173`, with no HTTP Host Header override. A direct request from the connector's network namespace reached the old webapp and received `403 Host rejected`. Direct Node HTTPS also received the same 403 from Cloudflare. One preceding PowerShell request returned 502; that isolated result does not prove the current tunnel target is unreachable. The connector configuration was read, not modified by this work. The user separately confirmed saving the target.

The old application allowed only local Hosts while `PUBLIC_ORIGIN` was empty. Setting a public origin previously disabled normal localhost pages. The application now allows exactly the configured HTTPS Host plus the existing exact localhost/IP Hosts on the actual listening port. API Origin, cookie Secure flag and session audience follow that validated Host. Forwarded/CF headers confer no trust. Session cookies remain host-only, HttpOnly and SameSite=Strict. Cross-origin session replay and POSTs are rejected. The local `.env` contains only the non-secret `SENTUH_PUBLIC_ORIGIN=https://sentuh.davay.space` setting.

The container was rebuilt. Existing in-memory sessions ended; users must log in separately on the public domain. The host port remains bound to `127.0.0.1`; no LAN-wide port publication or Docker network attachment was added.

## Verification

- [Full Node result](webapp/cloudflare-backend-tests.txt): **187 tests passed**, zero failures. This includes four deployment tests and the newly completed private queue identity/model tests; the 1,079 pinned numeric vectors are assertions within those tests, not additional test-case counts. Upstream behavior in API tests uses mocks.
- [Access check](webapp/cloudflare-access-2026-10-19-before-queue.json): **18 assertions passed**, through 11 bounded local/public requests. Health, HTML, anonymous bootstrap, host-only cookie flags, cross-origin rejection, anonymous logout/rotation, catalog 171/67 and disabled geotag upload were checked. No credentials, GPS coordinates or official API requests were sent by this script. Cookies and CSRF values stayed in memory and were not saved.
- A separate post-deployment connector-network health GET reached `host.docker.internal:4173` with Host `sentuh.davay.space`, returning HTTP 200 and health `ok`. This request is outside the script's 11-request count.
- [Deployment receipt](webapp/cloudflare-deployment-2026-10-19.json): three frontend and ten backend file hashes matched that release's workspace; healthy read-only container, loopback binding. The [prior NEWS deployment](webapp/news-deployment-2026-10-19.json) is retained separately.
- [Browser receipt](webapp/cloudflare-preview.json): the public HTTPS office page loaded anonymously and its “Gunakan lokasi perangkat” button became enabled. No GPS button click or browser location permission was performed. [Screenshot](webapp/screenshots/cloudflare-office-preview.jpg).

An independent code review found no actionable issue in the bounded dual-origin change. This is not a full security audit or proof of application parity.

## Other source already present in this backend rebuild

The private TLS configuration now preserves Node's built-in roots before adding the APK anchor, following the independently verified native order in [TLS root proof](QUEUE-TLS-ROOT-FOLLOWUP.md). Node and Android trust-root sets are not claimed identical; verification and exact main-origin TLS identity scoping remain enabled. A prior queue root HEAD still ended in ECONNRESET after the change; queue API acceptance is unresolved.

The [queue identity](QUEUE-IDENTITY-FOLLOWUP.md) and [model](QUEUE-MODEL-FOLLOWUP.md) components are included but not wired to a route. No queue adapter, geotag upload or remote-visit mechanism was enabled. Full app parity and end-to-end server tests remain unfinished.

Tunnel target and troubleshooting guidance: [DOCKER.md](../DOCKER.md), [Cloudflare common errors](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/common-errors/), [HTTP Host Header parameter](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-parameters/#httphostheader).
