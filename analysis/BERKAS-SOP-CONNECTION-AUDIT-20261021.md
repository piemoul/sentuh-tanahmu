# Berkas SOP connection audit, 2026-10-21

The retained failure establishes **a connection-stage failure, not an HTTP rejection of the SOP request**. The configured endpoint, service and method agree with the supplied Sentuh Tanahku6.1.5 proof. No endpoint/port/TLS change is justified by this event. The browser also reported a local-response JSON parsing error; the preserved aggregates cannot identify which browser-facing response produced it or whether an intermediary was involved.

This audit only reads existing sanitized receipts, application source and previously retained native proof. It makes zero network/production/account requests, reads no credentials or document values, creates no native exports, executes no APK/initializer, and changes no runtime or old evidence files.

## Preserved observations

The [browser observation](webapp/live-account-reads-before-lost-release.json), checked at `2026-10-21T05:03:24.880Z`, records successful authenticated list/detail reads and an Aktivitas Berkas detail with one error. Its session log shows `Informasi tambahan berkas` → `ERROR · Respons layanan lokal tidak dapat dibaca.` This is an observed UI symptom; the report does not preserve a browser HTTP status, response MIME, body, or request ID.

The separate [sanitized container observation](webapp/live-account-berkas-log-observation.json), checked at `05:03:43.449Z`, covers logs since `04:41:47.125Z` and explicitly allows concurrent user activity:

| Request path | Count | HTTP status | Failure details |
|---|---:|---|---|
| `/berkas/CariBerkas` | 1 | 200 | None retained |
| `/berkas/berkassop` | 1 | null | `upstream_fail`, `stage=tcp`, `networkCode=ECONNREFUSED`, elapsed21,048ms |
| `/berkas/getStatusCetak` | 1 | 200 | None retained |

There was **no upstream HTTP status** for the failed SOP call. It is not a retained HTTP401/403, business-envelope error, checksum error, JSON decoder failure, or server response timeout. Elapsed21,048ms alone does not turn `ECONNREFUSED` into a timeout diagnosis. The source transport's normal request limit is30,000ms.

The aggregates support correlation by feature/path/window, not exclusive attribution of each log to a particular UI action. They omit remote IP, address family, selected DNS result, socket events, browser response headers/status, and matching request IDs. Do not infer that every network address was refused, or that a particular HTTP route was unavailable: a failed TCP connection has not sent that HTTP path. Current `networkFailure()` can select one recognized code from a nested/aggregate error; the retained code is not a full per-address trace.

## Positive native endpoint and service binding

The supplied arm64 ELF is SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. This audit reuses the existing [Berkas detail contract](BERKAS-DETAIL-UI.md), [Cari Berkas flow](SEARCHFILE-FLOW.md), [SOP service instructions](recovered/activity-flow/berkas-read-services.asm.txt), and [search ledger](recovered/searchfile-flow.json), rather than searching the APK for alternative hosts or ports.

| Binding | Positive retained evidence |
|---|---|
| Service helper | `d87e00` |
| Client | `d87e4c..d87e58` reads service`+7` → FRb`+7`, the main client |
| Body | `d87e70` literal `berkasid`; `d87e7c` stores caller String; `d87e80` types `Map<String,String>` |
| Path | `d87e98` literal `berkas/berkassop` |
| Method/call | `d87ea8` invokes shared POST`6b9270`; no per-call query, base URL, port or options override |
| Native response | `d87ec4` compares tagged200; `d87f1c` requires transformed Map; `d87f40` parses envelope; `d87f50` rejects `error==true`; data parser `87eb60 → 74e050` produces EBb |

The original selected-record flow supplies the selected Berkas ID as `berkasid`. The ordinary Cari Berkas flow instead supplies the returned ABb`berkasId`. Neither flow substitutes an office ID, persil ID, displayed document number or review ID. No additional SOP business parameter is established by this bounded helper.

The existing [main factory proof](recovered/collection-group-create/main-client.proof.asm.txt) binds FRb`+7` to its ordinary main client using static`TRb.AYi`. The [base selector](recovered/daring-identity-response-followup/main-base-selector.proof.asm.txt) binds that initializer to`6b8fa0`; its production branch returns **`https://sentuh.atrbpn.go.id/`** at`6b8ff8`, while the other branch returns the explicitly separate development origin. The [initial flag](recovered/daring-identity-response-followup/initial-production-flag.proof.asm.txt) at`ca53e0` returns true. These are shipped initial bindings; arbitrary later static/DI changes and the APK's current live runtime were not executed here.

The existing LRb [session interceptor](recovered/collection-group-create/session-interceptor.proof.asm.txt) sets ordinary Map data to `application/x-www-form-urlencoded` at`d0da68`. Its ordinary account-token branch applies to this path, using tokenType + space + accessToken, with established expiry/refresh behavior. This audit reads no token. There is no caller-specific checksum/device/GPS header or port override in this SOP call. This is bounded caller/interceptor evidence, not a claim that all server integrity policies have been discovered.

## Current adapter comparison

The following are current source observations at this audit, not a reconstruction of an unretained packet:

- [operations.mjs](../webapp/private/operations.mjs) registers `post-berkas-berkassop-d87ea8` as enabled read, POST, service`main`, path`berkas/berkassop`, encoding`form`, auth`session`, sole required String field`berkasid`.
- [configuration.mjs](../webapp/private/configuration.mjs) sets `MAIN_ORIGIN='https://sentuh.atrbpn.go.id/'`. The main service base in the generated registry is identical. `upstreamUrl()` in [api-client.mjs](../webapp/private/api-client.mjs) therefore resolves this fixed operation to **`https://sentuh.atrbpn.go.id/berkas/berkassop`**, without explicit port, query or fragment.
- The registry prepares the field as a form body. The ordinary client sets account Authorization and `application/x-www-form-urlencoded`. No SOP-specific origin, redirect workaround, alternate port or fallback origin appears in this scoped request path.
- [https-transport.mjs](../webapp/private/https-transport.mjs) uses HTTPS with the URL hostname as SNI, `rejectUnauthorized:true`, `agent:false`, and scoped main-origin TLS context. It does not set a SOP-specific `port`, `family`, `lookup`, proxy or address. The normal HTTPS default is the applicable endpoint; no alternate port is inferred.
- This transport serializes the body and sets its byte length, then returns only after an HTTP response. A connection failure throws into `networkFailure()`, where `ECONNREFUSED` is classified `tcp`. With no response, the structured log status is null. The normal API error is HTTP502 `UPSTREAM_UNREACHABLE` with safe diagnostic fields.

The ordinary SOP form path currently uses URLSearchParams. The native shared form proof establishes its different `*`/`~` safe alphabet, so this comparison does **not** certify arbitrary String wire-byte parity. No actual ID/body was retained in these failure receipts. Such encoding differences cannot explain this particular refusal before HTTP; changing an ID or body would not repair the evidenced connection stage.

## The separate browser-facing parsing symptom

Current [app.js](../webapp/app.js), `api()` near line95, calls `fetch()` and then `res.json()`. The exact text `Respons layanan lokal tidak dapat dibaca.` is thrown only when that browser-facing JSON decoding fails. It is not the message produced by the upstream TCP classifier.

Current [http-api.mjs](../webapp/private/http-api.mjs) normally catches an ApiError and emits a structured JSON response containing its code, message and sanitized diagnostics; a remote TCP refusal is therefore intended to become readable JSON502. The existing browser aggregate does not retain the relevant browser-facing status/MIME/request ID or prove that this current source was the exact response path at failure. An intermediary HTML/error response, a truncated response, an old build behavior or another response-layer failure cannot be distinguished from these receipts. Cloudflare is not proven to be the cause.

Thus retain two findings without collapsing them: **upstream connection refusal is recorded; browser-facing JSON decoding failure is recorded**. The latter can mask useful upstream diagnostics. No source modification is made by this audit.

## Historical corroboration and remaining work

[Account/document transport on2026-10-19](webapp/account-document-transport-2026-10-19.json) retained16 HTTP200 SOP responses in a bounded aggregate window, alongside primary/print reads. [Another retained activity transport](webapp/live-activity-kkpr-transport.json) records SOP HTTP200 in361ms. These are historical observations and may include concurrent activity; they establish neither current availability nor exactly one exclusive per-action successful flow. They do corroborate that this fixed path has worked through the adapter.

The defensible result is **no identified host/service/path/method mismatch explaining the refusal**. The evidence does not locate the refusing peer or distinguish remote availability from a transient Docker/network/DNS-address-path issue. It does not warrant changing production host, port, TLS validation, credentials, request identity or checksum handling. A future ordinary read, if performed separately by the root/user, should preserve only safe request-ID/status/MIME/stage/code/timing correlation across browser/local/upstream legs. This audit itself makes no such request or retry and claims no current live SOP success.

## Source hashes at audit

These hashes bind the sources actually read. No new ELF instruction-verifier run or new native evidence count is claimed.

| Source | SHA256 |
|---|---|
| `webapp/live-account-reads-before-lost-release.json` | `b9c1cd81e0649bfaf69c0bbd06eb06e5b729af920b19c1ec2f83a25c03b52285` |
| `webapp/live-account-berkas-log-observation.json` | `9eb4c4663013d878af4b2f40bea36edfb6f95c913130ea45e6b8a6fac3e49260` |
| `webapp/account-document-transport-2026-10-19.json` | `9169c35279c3f80d0ea45fd5a313b146187a00de3bb9be4f30c0f6105cb79e32` |
| `webapp/live-activity-kkpr-transport.json` | `985f832fd81d7cf81bdc64e023d744e7a6f5fe3f4cb1bb333778808e2e2f85a5` |
| `recovered/activity-flow/berkas-read-services.asm.txt` | `ac47a73eacd96636c64bd250c4b02dd3c883eb3ea50ed2ada6b44d9e1bff96e7` |
| `recovered/searchfile-flow.json` | `aaa361446a6462cab1c308e70c0f7b6b0ccb36b103ce6be9f73ba37ab31f8d1a` |
| `recovered/daring-identity-response-followup/flow.json` | `ff50866326808280c90b2962cda3845b2e50ffe5124cdae2ad6d6c46d96a3243` |
| `recovered/daring-identity-response-followup/main-base-selector.proof.asm.txt` | `ecce69ad8e1a8013e9d92cbbb88b2becb3fff9b7a41965819049a9dd2b60b2dc` |
| `recovered/daring-identity-response-followup/initial-production-flag.proof.asm.txt` | `4e036fd6a9b94595e0574a6ada03db91fd3ef2596b0f74c35228c1ab650bfc69` |
| `recovered/collection-group-create/main-client.proof.asm.txt` | `43a0b71b3cea5eb431bceba4a26297c256f800116544dd24582b777ee0944e00` |
| `recovered/collection-group-create/session-interceptor.proof.asm.txt` | `61c47cf1e9c5a862ce85b7a07f50b2059a180aca89311c5784e9e87733b6c90b` |
| `recovered/searchfile-null-form/transport-followup.json` | `ebf438b23ee8de8bf37faf14cb753f140f8a834637a60da11aaf2960dbd9d7d1` |
| `../webapp/private/configuration.mjs` | `a3183cfdaedf96fa140d7a0e67aeb0e4586cb303e2886240518408fe14ae4d0e` |
| `../webapp/private/https-transport.mjs` | `484e7a36fa8d8ce6a7183315098d38a558ac0071d058a375a09b6caf65daf9c1` |
| `../webapp/private/api-client.mjs` | `40f1a0f77fa54ab5d2604a59bfd4092f59b79c52d3891c18770b72dcc6833752` |
| `../webapp/private/http-api.mjs` | `c7a1c58afd14aeda537304fe90dceb4e3646b8122caa473f97b63575b27b8f05` |
| `../webapp/private/operations.mjs` | `51e689d507c162c64fceb6f523b7207a7fd3250d66a6831849a40437eabacc36` |
| `../webapp/app.js` | `e00126f3a268eb8ff20306086e87fc64150f05ba3426a47ed11429c69f0553a4` |
