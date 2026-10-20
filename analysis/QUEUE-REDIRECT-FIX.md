# Queue canonical redirect fix

The old deployed queue client rejected an HTTP **308** before following the service's canonical URL. The source fix permits a tightly bounded GET redirect to the same endpoint on the same origin, including the endpoint spelling with a trailing slash. This document records the observed failure, the policy implemented in source, and its mocked validation. It does **not** establish that this source has been deployed or that a real queue GET has subsequently completed with HTTP 200.

## Observed failure and anonymous corroboration

The bounded own-account log window retained in [redirect verification](recovered/queue-redirect-followup/verification.json) records the old container `10260a9b7a24041e006c26967dbf7ac772f8a34ca4d624b94b0e669818877c92` returning main account-summary HTTP 200, followed by a queue list GET failure on attempt 1: upstream HTTP 308 with local code `QUEUE_REDIRECT_REJECTED`. The old adapter followed no redirect. This identifies a redirect-policy failure; it does not establish a failed main-account login or a final queue response. The log window may include concurrent user actions and omits query, body, header and identity values.

A separate [anonymous HEAD check](webapp/queue-redirect-head-check.json), performed on 2026-10-19 at 08:49:13–08:49:14 UTC, requested the queue list path without an identity query or either application/user Authorization. TLS verification remained enabled. It returned 308 to:

`https://aplikasi.atrbpn.go.id/konsol/antrian/directus/api/antrian/saya/`

The destination has the same origin and adds only the trailing slash. This corroborates endpoint canonicalization without sending account data. A HEAD request with no identity query does not prove the final authenticated GET response, the presence of queue records, or universal behavior for every queue endpoint.

## Native evidence and the narrower web policy

The existing [native interceptor ledger](recovered/queue-interceptor-followup/flow.json) supplies the APK transport context. The pinned official [Dart 3.12.2 HTTP implementation](https://github.com/dart-lang/sdk/blob/3.12.2/sdk/lib/_http/http_impl.dart) is retained locally as [http_impl.dart](recovered/queue-redirect-followup/http_impl.dart), SHA-256 `c08274810379df0a1e0157bccec346c469d141ef334f656d1773220cf272bc4f`. Its role is **source corroboration**, not a claim that every SDK branch has independently been matched to the compiled APK.

Relevant official-source locations are lines 647–698 for GET/HEAD redirect handling including permanent redirect, 1491–1493 for enabled-follow/default-five settings, 1573–1584 for the redirect limit, and 3062–3117 for relative URI resolution and sensitive-header copying. The SDK preserves the GET method, resolves a relative destination against the previous request, and retains Authorization for the same scheme/host/port. Its header policy also permits matching subdomains. The web adapter does not adopt that wider audience policy.

The implemented policy in [queue-client.mjs](../webapp/private/queue-client.mjs), particularly `#response`, is:

| Property | Source behavior |
|---|---|
| Transport | Manual redirects; reject a response already followed by a transport or reporting an unexpected response URL |
| Methods and statuses | GET only; redirect statuses 301, 302, 303, 307 and 308 |
| Audience | Exact original HTTPS origin; reject another scheme, host or nonmatching port, and reject URL username/password |
| Endpoint | Destination path must be the original path or that original path plus one trailing slash |
| Identity/query | Ordered decoded query entries must equal the original entries; equivalent percent encoding is allowed, changed/added/removed values are rejected |
| Destination restrictions | Reject missing/invalid Location, control characters and fragments |
| Limits | At most five followed redirects per attempt; detect revisiting a URL |
| Authorization | Reuse the same fixed application Bearer generation and Dart/Flutter User-Agent within the logical GET; no main-account credentials, arbitrary headers, or body |
| Cancellation and resources | Check cancellation before each hop, cancel an unconsumed redirect response body, and stop before another hop after cancellation |
| Retry | A transport/status retry starts again at the original URL; rejected redirects, loops and redirect-limit errors do not trigger retries |
| Diagnostics | Record normalized endpoint, attempt, status, outcome and hop number; omit Location, NIK, selected detail IDs and Bearer values |

For detail, the full selected ID remains in the path, including a colon; the redirect policy permits only its corresponding canonical path. Query re-encoding compares decoded entries once and does not apply the request encoder a second time. This is a **bounded web policy**, not full parity with Dart's general redirect behavior.

## Validation and status limits

[Queue client tests](../webapp/tests/queue-client.test.mjs) cover successful same-endpoint redirects for all five accepted statuses; unchanged application authorization; full colon-containing detail IDs; identity, endpoint, scheme, origin, port, credentials and fragment rejection; equivalent query encoding; loops; the five-hop bound; retry from the original URL; cancellation between hops; and rejection of responses already followed outside the adapter. All requests in these tests use mocked transports.

The integration owner reported **32 client tests plus 14 session tests, 46 passing**, at the redirect checkpoint before the Panggilan extension. [Session tests](../webapp/tests/queue-session.test.mjs) cover separate main-account/queue authentication, server-owned identity and detail ownership, revocation, and cancellation. A later reported **275 passing Node tests** applies to the broader source including the new Panggilan model; it is a different checkpoint, not an additional 275 redirect-specific cases or evidence of deployment.

An independent read-only review found no actionable issue in the redirect implementation and the added cases. This documentation task made no runtime change and ran no additional network request, deployment, or tests. The retained verification artifact explicitly leaves completion false. Deployment identity and a final real GET result must be established separately before any release statement claims that the live queue path succeeds.
