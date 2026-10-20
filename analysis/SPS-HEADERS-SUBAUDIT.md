# SPS raw HTTP headers and redirects — bounded static subaudit

Scope: the supplied ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Offline only. This supplements the locked SPS flow audit; it does not change the adapter, query production, or establish server acceptance. The separate client-initializer audit owns the exact user-agent value, TLS configuration, and HttpOverrides resolution.

## Request creation

The existing downloader calls `0x77b0c8` at `0xd3e240`. That wrapper supplies method `get` and calls `0xd07810`. The async connection continuation `0x6d0060` (or retry continuation `0x6d01cc`) calls request construction `0x6c7280`; the method is uppercased before that call. The request returned to the downloader has headers at field `+0x37`.

| Item | Observation | Evidence |
| --- | --- | --- |
| Explicit SPS header | `Authorization` receives the session token scheme, a space, and the token. It is the only explicit header-setting call between the downloader's GET and close. | Existing `range-00d3e0e8.asm.txt`, `0xd3e254`–`0xd3e2c0`, header setter call `0xd3e2b8` |
| Host | The URI host and port are passed to header helpers. Host formatting includes IPv6 bracket handling and omits the default port. | `0x6c7424`–`0x6c74dc`; helpers `0x6c7ab8`, `0x6c7978`, `0x6c79fc`; literal `host` at `0x6c7a98` |
| Accept-Encoding | The request builder adds `accept-encoding: gzip`. | `0x6c74e0`–`0x6c74f8` |
| User-Agent | The request builder adds `user-agent` using HTTP client field `+0x47`. This subaudit does not resolve that field's initialized value. | Load `0x6c7514`, literal `0x6c7524`, header add `0x6c752c` |
| Accept / Content-Type | No explicit `Accept` or `Content-Type` value is set in the examined downloader, request constructor, or default-header block. In particular, there is no observed `Accept: application/pdf` request setting. | Downloader `0xd3e0e8` through close `0xd3e2c0`; constructor `0x6c7b28`–`0x6c80ec`; default-header block `0x6c7424`–`0x6c76f4` |
| Request body | GET selects the branch setting content length to zero in the request model. The downloader subsequently closes without adding body bytes. This does not alone prove the exact serialized `Content-Length` header. | `0x6c7d10`–`0x6c7d78`, `0xd3e2bc`–`0xd3e2c0` |

The headers constructor allocates an initially empty `Map<String,List<String>>` at `0x6c8054`–`0x6c808c` and sets HTTP version `1.1` from its caller at `0x6c7e80`. General proxy-authorization and URI-userinfo authorization branches exist in `0x6c7530`–`0x6c76f0`; their existence does not establish that SPS takes them. The downloader explicitly sets session Authorization after request construction.

The negative `Accept`/`Content-Type` result is bounded: wire serialization, embedding hooks, runtime overrides, and actual network headers were not observed. Response MIME cannot be inferred from these request headers or from a PDF filename.

## Redirect policy

The request constructor initializes field `+0x5b` to true and `+0x5f` to integer 5 at `0x6c7b84`/`0x6c7b88`. The compiled response path independently demonstrates automatic redirect handling:

1. `0x6c86e8` wraps the response and invokes eligibility helper `0x6c3878` at `0x6c8794`.
2. For GET/HEAD, the helper accepts status 301, 308, 302, 303, and 307 (`0x6c3910`–`0x6c3944`; the compared values are Dart tagged integers, hence twice the status code).
3. The current redirect-history length is compared with 5 at `0x6c87b8`. Below the limit, the response is drained and callback `0x6ca5f8` invokes `0x6ca640`. At the limit, callback `0x6ca574` produces `Redirect limit exceeded` (`0x6ca5c0`).
4. The redirect helper reads `Location` at `0x6ca76c`, rejects a missing Location (`0x6ca928`), checks visited destinations for a loop (`0x6ca868`), and calls reopen helper `0x6c9aa4` at `0x6ca8cc`.
5. The reopen helper resolves the destination against the original URI before calling `0xd07810` at `0x6c9b48`. Its continuation `0x6c9b90` copies old header entries only when the freshly created request does not already contain that header.

Sensitive header forwarding is guarded in the redirect branch. `0x6c9c80`–`0x6c9ce0` checks URI relation helper `0x6c9de4`. It permits sensitive forwarding only for the same scheme and port, with a destination host equal to the source host or ending in `.` plus the source host. Otherwise it skips names in `[authorization, www-authenticate, cookie, cookie2]` (`0x6c9cd4`). The scheme/port comparisons are at `0x6c9e08`–`0x6c9e98`; host equality and suffix checks are at `0x6c9e9c`–`0x6c9f84`.

This establishes the packaged automatic GET redirect path, not a reason to broaden a web adapter's destination allowlist. Actual redirects from the SPS server remain unobserved.

## Evidence files and remaining limits

All new dumps use `analysis/recovered/request-callsites/sps-headers-*.asm.txt`; existing shared range dumps and locked SPS files were not overwritten. The companion `analysis/recovered/sps-headers-audit.json` records source hashes and instruction checks.

Unresolved here: exact user-agent initializer value; all runtime HttpOverrides/connection-hook effects; TLS trust and certificate callbacks; literal wire ordering/casing; exact serialized Content-Length; response MIME; server redirects; and production acceptance. This is a bounded static transport audit, not an end-to-end execution test.
