# SPS viewer transport: client, trust, and headers

The SPS viewer's separate HTTP client resolves through the application's global HTTP override to the **same `_fhj` TLS context already audited for login**. A fixed-origin SPS read can therefore use the existing strict TLS adapter without introducing another client identity. This establishes a supported implementation path from static evidence; it does not establish successful SPS retrieval, current server requirements, or exact native transport parity.

The source is the supplied Sentuh Tanahku 6.1.5 ARM64 ELF, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. This pass made no production requests, read no credentials, exported no secret values, and changed no frontend/backend code. The earlier SPS document report and ledger remain separate and unchanged.

## Client initializer and global override

The new allowlisted metadata export resolves object-pool field `0x441f0`, yGb.xTc static offset `0x1878`, to initializer **`0x77b100`**. It exports only initializer/function identities, not field values. The small initializer calls **`0x6d057c`** at `0x77b118`.

Factory `0x6d057c` obtains the current override through `0x6fa9ec` (`0x6d0594`). The latter consults the current zone first, then falls back to the global static slot `0x450` (table displacement `0x8a0`, load `0x6faa74`). With no override, the factory creates an ordinary client with a null context. With an override, it calls `0x6d05e4` at `0x6d05cc`.

The application's startup closure `0xcfc8a0` allocates **eSb, CID 6870**, via allocator `0xd17094` at `0xcfc97c`, and stores it in the same global slot at **`0xcfc988`**. The allocator's object tag encodes CID 6870, consistent with class eSb in `1050969_Ngo.dart`. The startup then invokes the local integrity routine at `0xcfc98c`. This proves a startup installation path; later global or zone overrides and the active runtime state have not been observed.

The non-null override factory loads `_fhj` at `0x6d0618`, calls `0x6d06e0`, and passes the context to the raw client constructor `0x6f9dd0` at `0x6d070c`. It installs three callbacks:

| Client field | Callback | Evidence / purpose |
|---|---|---|
| +0x33 | `0x6d0adc` | Certificate callback assigned at `0x6d0644`; delegates the host to `0x6d0a18`. |
| +0x2b | `0x6d0ad0` | Proxy callback assigned at `0x6d0674`; returns `DIRECT`. |
| +0x1f | `0x6d0728` | Connection callback assigned at `0x6d06ac`; applies local integrity and scheme checks, then creates a connection using `_fhj` for HTTPS. |

## Trust and client identity provenance

Safe initializer metadata already maps `_fhj` offset `0x17b0` to `0x6d0b0c`; that initializer calls context builder `0xd0b63c` at `0x6d0b20`. The context builder imports the bundled trust material through `0xd0c748` (`0xd0b680`). Its production branch selects the established `Wxb.uYi`/`Wxb.nYi` identity inputs and passes the recovered bytes and associated password to native wrappers `0xd0b914` and `0xd0b884` (`0xd0b7e8`, `0xd0b808`). This is the same path documented in [APK-TRANSPORT-LOGIN.md](connection-diagnostics/APK-TRANSPORT-LOGIN.md) and its [provenance ledger](connection-diagnostics/apk-client-identity-provenance.json).

This pass only linked the viewer to that existing context; it did not recover, print, or export the identity material again. The existing adapter's exact-origin trust and client-identity boundary is the appropriate boundary for the SPS read. Shared native context use does not prove that the server requires client identity on every endpoint.

In the initial production configuration (`TRb.Thj=true`), certificate callback helper `0x6d0a18` returns **false** (`0x6d0a50`–`0x6d0a60`). Its separate development branch performs domain comparisons; it is not a reason to relax production certificate validation. The production context and hostname must continue to be verified normally.

Connection callback `0x6d0728` checks the previously audited integrity flag at `0x6d0774`–`0x6d0778`; its failing branch throws `HandshakeException` with `Device integrity check failed`. It also rejects cleartext HTTP when the production flag is true (`0x6d07d0` → `0x6d0900`). These are native local gates, not proof that an HTTP checksum or attestation field is sent to the server. This audit neither patches nor reproduces a bypass for either gate.

No explicit TLS minimum/maximum version, new trust import, or new identity import is set in yGb.xTc's own initializer. Complete SDK/native TLS defaults and later configuration mutations remain outside this bounded proof.

## HTTP headers and response handling

The SPS downloader explicitly installs only session `Authorization` between GET creation and close. It calls the stored-token reader directly and has no main-client LRb interceptor or refresh call in that bounded path. It does not acquire form-urlencoded headers from LRb.

Raw request construction adds:

| Header / property | Proven native behavior |
|---|---|
| Host | Derived from destination URI host/port; default port handling occurs in the HTTP helper. |
| Accept-Encoding | `gzip`, added at `0x6c74f8`. |
| User-Agent | Client `+0x47` is populated at `0x6f9edc` from `0x6f9f30`. The builder constructs `Dart/<platform major.minor> (dart:io)` (`0x6fa018`, `0x6fa02c`). For the identified Dart 3.12.2 artifact, `Dart/3.12 (dart:io)` is the expected value, not an observed network header. |
| Accept | No explicit setting in the examined downloader, constructor, or default-header block; no evidence for `Accept: application/pdf`. |
| Content-Type | No explicit setting in those same bounded blocks; no evidence for the main-client form Content-Type on this request. |
| Body | GET chooses a zero-length request model and the downloader writes no body. Exact wire `Content-Length` serialization was not observed. |

The existing document audit proves raw response bytes and a nonempty `%PDF` prefix check. Neither response MIME nor actual server headers have been observed. A web implementation may explicitly reject empty bytes, HTML/JSON errors, oversized content, and unexpected media types; those checks should be documented as implementation safeguards rather than native parity.

## Redirects and destination boundary

The packaged HTTP implementation automatically handles GET redirects with status **301, 302, 303, 307, or 308**, with a limit of **5**, missing-Location errors, and loop detection. Request fields `+0x5b=true` / `+0x5f=5` are initialized at `0x6c7b84` / `0x6c7b88`; the response path independently checks the history limit at `0x6c87b8`.

On redirect, `0x6c9b90` copies old headers only if the new request lacks that name. Sensitive headers (`authorization`, `www-authenticate`, `cookie`, `cookie2`) are eligible for forwarding only when scheme and port match and the destination host equals the source host or is a subdomain of it; relation helper `0x6c9de4`. This is a description of packaged behavior, not authorization to expand the web adapter's origin boundary.

A fixed same-origin adapter that rejects redirects, or permits only explicitly checked same-origin redirects, is supportable and keeps the existing TLS identity boundary. Rejecting redirects is a deliberate difference from native automatic following. Actual SPS redirects have not been observed.

The delegated [header/redirect subaudit](SPS-HEADERS-SUBAUDIT.md) and its [ledger](recovered/sps-headers-audit.json) contain the detailed callsites. This report completes its previously unresolved User-Agent and client-configuration linkage.

## Decision and limits

Implementable: fixed `https://sentuh.atrbpn.go.id/dokumen/GetDokumen`, encoded `id=spsId` / `tipe=alias` from selected SPS metadata, session Authorization kept server-side, the existing exact-origin strict TLS context, no LRb form headers, no invented automatic token refresh, and bounded PDF response handling. A per-request checksum or APK-attestation requirement was not found in this viewer route.

Still unproved: successful production retrieval; current endpoint policy; actual response MIME or redirect behavior; complete wire headers; exact native TLS protocol defaults; all later global/zone/client mutations; runtime values of local gates; and end-to-end parity. This report supports implementation review and local testing, not a declaration that SPS downloads already work with real account data.

Reproducible artifacts: `analysis/recovered/sps-transport-flow.json`, `analysis/recovered/sps-transport-flow/`, and safe metadata `analysis/recovered/sps-transport-metadata/sps-transport-metadata.tsv`. Export command: `analysis/rea/export_sps_transport_metadata.cmd`. Offline validator:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_sps_transport_flow.py
```
