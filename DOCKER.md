# Docker Desktop deployment

Run commands from `<repository-root>`. Docker Desktop must use Linux containers. The application has no npm runtime dependencies.

`START-WEBAPP.cmd` now starts the Docker deployment. Its PowerShell entry point is `scripts/start-webapp-docker.ps1` (`-NoBrowser` to keep the browser closed; `-Rebuild` after source changes). It reuses the existing image/container by default. Use `scripts/stop-webapp-docker.ps1` or `docker compose stop webapp` to stop it.

```powershell
docker compose up -d --build --force-recreate --wait
docker compose ps
Invoke-RestMethod http://localhost:4173/health
```

Open **http://localhost:4173**. Both launchers use this address. If the native launcher already occupies this port, stop it first with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-webapp.ps1`. This sets execution policy only for that process. Do not run the native launcher and Compose together on port 4173.

The `sentuh-tanahku` Compose project publishes only `127.0.0.1:4173`, which is accessible in the browser as `localhost:4173`. The published IP keeps access on this computer; it is not the browser URL. The Node process listens on `0.0.0.0` inside its private container network and runs as the image's non-root `node` user. The filesystem is read-only, Linux capabilities are removed, and privilege escalation is disabled. The base Node 24 image is pinned by digest in `Dockerfile`.

These two evidence files are mounted read-only at their original relative locations under `/app`:

- `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`
- `analysis/recovered/blutter-unique/pp.txt`

Both are verified by fixed SHA-256 hashes before the application configuration is derived in server memory. Their contents are excluded from image layers, Docker build context and public routes. No whole-workspace mount, password environment variable or persisted account token is used. `upstreamConfigured: true` in `/health` means these local hashes passed; it does not mean the original server accepted a browser client. Health checks do not contact that server.

Seven public frontend files (`app.js`, `styles.css`, `index.html`, `gnss.js`, `coordinate-comparison.js`, `parcel-map.js`, and `assets/maps/official-map.js`) are also mounted individually, read-only, under `/app/webapp`. This supports local UI iteration: refresh the browser after a frontend edit without restarting the backend or discarding its login session. Backend code remains in the image and requires a rebuild/restart to apply changes. A browser refresh still clears unsaved page state; it does not persist document data or coordinate drafts.

The APK also contains its private CA trust anchor and a client TLS identity. The adapter reconstructs a TLS context in memory, retaining Node's built-in roots before adding the APK anchor. The default main transport scopes that identity to exactly `https://sentuh.atrbpn.go.id:443`. A separate audited queue transport scopes it to exactly `https://aplikasi.atrbpn.go.id:443`; the queue client itself accepts only fixed Directus list/detail GET URLs. Main account tokens are never forwarded there. Other services retain normal system trust. Certificate, validity and hostname verification remain enabled. Node starts with `--openssl-legacy-provider` to read the APK's legacy PKCS12 packaging; it does not lower the minimum TLS version (1.2) or enable an accept-all certificate callback. The earlier verified main connection negotiated TLS 1.3; own-account queue list and Panggilan each returned HTTP 200 after the audited 308 redirect; populated queue/detail acceptance remains untested. See [Node's runtime flag documentation](https://nodejs.org/api/cli.html#--openssl-legacy-provider) and [queue validation](analysis/QUEUE-WEBAPP-VALIDATION.md).

Transport logs contain only request ID, phase, recognized network error code, duration, HTTP status, hostname and path without query. Passwords, tokens, request/response bodies and arbitrary exception text are excluded. The UI shows the network code and request ID when a connection fails. To explicitly check the connection without account credentials, run `node --openssl-legacy-provider scripts/probe-upstream.mjs` from the workspace. It sends one unauthenticated HEAD request; HTTP 405 means HEAD is unsupported but the server was reached, not that login succeeded. Add `--baseline` to compare normal system trust without APK TLS configuration.

Sessions, access tokens and downloads exist only in memory. Recreating or restarting the container logs out all local sessions. The default local mode accepts only `localhost:4173` and `127.0.0.1:4173` hosts. Cookies are host-only, so an existing session at the numeric address does not carry over to localhost. Use `http://127.0.0.1:4174` (or another fixture port) for synthetic browser fixtures to keep their cookies separate from the main localhost session.

## Cloudflare Tunnel: sentuh.davay.space

The existing Docker `cloudflared` connector routes `sentuh.davay.space` to this application. The local `.env` enables exactly this public HTTPS origin:

```dotenv
SENTUH_PUBLIC_ORIGIN=https://sentuh.davay.space
```

Apply backend changes with `docker compose up -d --build --force-recreate --wait`. This is an origin only: no path, credentials, query or fragment. The application accepts the configured public Host and the existing exact localhost/IP hosts on its bound port. It checks browser Origin against the origin selected by that validated Host; forwarded headers confer no trust. Public sessions use `Secure; HttpOnly; SameSite=Strict` host-only cookies. Local HTTP sessions use host-only `HttpOnly; SameSite=Strict` cookies. Sessions are separated by origin; login on localhost does not log in the public domain. Recreating the backend ends existing sessions. Clear the setting and recreate the container to return to local-only mode.

For the existing containerized tunnel, configure **HTTP** service **`host.docker.internal:4173`** (full URL `http://host.docker.internal:4173`). Its own `localhost` refers to the tunnel container. Keep HTTP Host Header empty to preserve the incoming host, or set it to exactly `sentuh.davay.space`; never rewrite it to `host.docker.internal` or `localhost`. The correct spelling is `docker`. A direct check from the connector's network namespace confirmed that this target reaches the webapp. There is no need to publish port 4173 on all host interfaces or attach unrelated containers to a shared network.

The Node container serves HTTP internally; the browser uses **https://sentuh.davay.space** through Cloudflare. Browser location tests should use that HTTPS URL and grant location permission manually on the test device. This deployment enables tunnel access, not geotag upload or server acceptance of location submissions. A `502 Bad Gateway` means the connector cannot reach the configured origin; `403 Host rejected` means the application was reached but rejected the HTTP Host. See [Cloudflare's tunnel troubleshooting](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/common-errors/).

If `cloudflared` is later moved out of Docker and runs directly on Windows, its service target becomes `http://127.0.0.1:4173`. Preserve the public HTTP Host in either deployment. The application deliberately does not infer trusted host/scheme from `Forwarded`, `X-Forwarded-*`, or `CF-*` headers.

Do not put a tunnel token or account password in the public app, image or this example file. `.env` is excluded from version control and the Docker build context. `.env` contains the non-secret origin. The current OSM/Bhumi map needs no Google key. See [official map configuration](analysis/OFFICIAL-MAP-SETUP.md). No Cloudflare account changes are performed by the provided Compose file.

## Maintenance

```powershell
# Rebuild after backend, dependency, or mount configuration changes
docker compose up -d --build --force-recreate --wait
# Local service logs (request credentials and bodies are not logged)
docker compose logs --tail 50 webapp
# Stop and remove this project's container/network; leave source artifacts intact
docker compose down
```

Source references: [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/), [Compose service options](https://docs.docker.com/reference/compose-file/services/), and [Cloudflare Tunnel origin parameters](https://developers.cloudflare.com/tunnel/reference/origin-parameters/).
