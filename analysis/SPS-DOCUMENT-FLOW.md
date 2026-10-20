# SPS document action: static read contract

The SPS item action opens a document viewer using a URL assembled from **selected SPS `spsId` and `alias`**. The query parameter named `tipe` uses `alias`, not the displayed `tipe` field. The viewer performs an authenticated GET and consumes PDF bytes directly. No document-returning JSON envelope or signed download URL is used in this examined path.

This is bounded static evidence from the supplied Sentuh Tanahku 6.1.5 ARM64 ELF, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No production request, credential access, UI action, or implementation change was made.

## Actionable contract

| Property | Proven behavior |
|---|---|
| Initial origin | `https://sentuh.atrbpn.go.id/`, from `TRb.AYi`; configuration remains mutable. |
| Method | GET; helper `0x77b0c8` supplies method literal `get` at `0x77b0e4` to `0xd07810`. |
| Path | `dokumen/GetDokumen`, exact lower-case `dokumen` in this URL builder. |
| Query `id` | Selected `FBb.spsId`, offset `+7`, load `0x8a8904`. |
| Query `tipe` | Selected `FBb.alias`, offset `+0xf`, load `0x8a898c`. |
| Request body | No body write between opening the request and sending it in this downloader. |
| Authentication | Explicit `Authorization = stored token.tokenType + ' ' + stored token.accessToken`. |
| Response | HTTP 200 body stream, consolidated into `Uint8List`; consumed as PDF bytes. |
| MIME/header | This downloader does not inspect `Content-Type` or `Content-Disposition`; server MIME and filename are unobserved. |
| Content check | Nonempty bytes must have first four characters `%PDF`; empty bytes skip this check in the native branch. |
| Native output | A local file with a generated timestamp name and `.pdf` extension, returned as `Future<File>` to the viewer. |

The selected object comes from the previously proven `Dokumen/GetSpsDokumen?dokumenid=<berkasId>` metadata list. That read parses `spsId`, `tipe`, `alias`, and `tanggal`; the document action does not replace them with the parent berkasId. `FBb.tipe` supplies the viewer title only.

## Source-to-viewer chain

1. SPS renderer `0x8a82e0` retains parent context and selected row index (`0x8a831c`, `0x8a8324`). It installs action closure `0x8a8780` at `0x8a8660`.
2. Action `0x8a8780` creates navigation builder closure `0x8a87f8` and navigates through `0x6ba6fc` (`0x8a87e0`).
3. Builder loads the same index from the captured context, then ABb `fileSps +0x43`. Selected FBb `tipe +0xb` is loaded at `0x8a8868` and assigned to yGb `+0xb` at `0x8a89d8` (viewer title).
4. URL is the string concatenation `TRb.AYi + 'dokumen/GetDokumen?id=' + FBb.spsId + '&tipe=' + FBb.alias`. Literal/load addresses: `0x8a88b8`, `0x8a8904`, `0x8a8940`, `0x8a898c`. Concatenation call `0x8a89c8`; URL assigned to yGb `+0x13` at `0x8a89e0`. No percent-encoding helper is called in this builder.
5. yGb CID 6212 createState dispatch resolves to `0x9ff33c`; zGb CID 5394 init dispatch resolves to `0x7798ec`. Init calls downloader `0xd3e0e8` at `0x7799a4` and stores its `Future<File>` in state `+0x1b` at `0x7799ac`.

Initial base provenance: safe initializer metadata maps `TRb.AYi` offset `0x17d8` to `0x6b8fa0`, and `TRb.Thj` offset `0x17cc` to `0xca53e0`. The latter returns true; `0x6b8fd0` selects the production string at `0x6b8ff8`. Later configuration overrides are not excluded by this static evidence.

## Authentication and request route

Downloader `0xd3e0e8` first returns an existing widget file if yGb `+0xf` is non-null. The SPS builder supplies a URL and does not assign a file, so its ordinary path continues to the download branch.

The download branch reads the token through `0xd025d8` at `0xd3e148`. That helper reads storage key `token` (`0xd02610`), decodes the JSON, and uses model parser `0x6b1eb0`. The parser proves `tokenType` → `+7` (`0x6b1ee4`, `0x6b1f34`) and `accessToken` → `+0x13` (`0x6b1fdc`, `0x6b202c`). No token values are included in these artifacts.

The viewer uses static `yGb.xTc` offset `0x1878` (`0xd3e1e4` / `0xd3e1f8`). It parses yGb URL `+0x13` as a URI at `0xd3e234`, opens GET through `0x77b0c8` at `0xd3e240`, obtains request headers (`0xd3e254`), and explicitly sets `Authorization` at `0xd3e2b8`. Token field loads are `0xd3e27c` / `0xd3e290`, with the separating space at `0xd3e288`. The request is sent/closed through `0x4f14b4` at `0xd3e2c0`, then awaited.

This is a separate viewer client path, not the main FRb/Dio wrapper path previously audited. The bounded downloader has no LRb interceptor or refresh call. It requires a non-null token model before header construction. Client initializer identity, TLS customizations, proxy behavior, global overrides, redirect handling, and cross-origin authorization behavior were not resolved; none should be inferred from the shared base URL.

## Byte response and failure behavior

At `0xd3e344`, tagged status is compared with `0x190` (Dart Smi 200). Other statuses branch to a `Server Error: <status>` exception. Successful responses are consolidated by `0x77ad6c` (`0xd3e354`), whose completer type is `Uint8List` at `0x77ade0`.

At `0xd3e374`, an empty byte list jumps to the file-writing branch. A nonempty body is checked against `%PDF` at `0xd3e3c0`–`0xd3e3d4`; mismatch enters an invalid-PDF error branch. There is no JSON decoding, base64 decoding, returned-URL extraction, or MIME validation between response arrival and file writing. Native debugging strings include the URL and a prefix of invalid response content; reproducing those logs is unnecessary and could disclose document metadata.

The success path obtains a local directory through `0xcee480`, constructs a timestamp filename ending `.pdf` (`0xd3e4c4`), writes the byte list via `0x750108` (`0xd3e530`), and returns the File. Catch handling produces `Failed to download file` (`0xd3e620`). The exact directory type and timestamp collision behavior were not audited further.

## Implementation implications and unknowns

An authenticated backend read adapter can use the fixed origin/path and the two fields from a selected SPS metadata record, then return validated PDF bytes to the browser. This contract does not require arbitrary caller-supplied URLs or new credential material. Construct query parameters with a normal URL encoder; the native builder's raw concatenation is an observed detail, not a reason to permit query injection. Rejecting empty responses and restricting redirects to the intended origin would be explicit defensive implementation decisions, not claims about native behavior.

Unresolved: runtime server acceptance and actual MIME; client/TLS/redirect configuration; behavior for encoded special characters in identifiers; expired-session recovery for this viewer; server authorization rules; full PDF viewer controls and optional digital-signature actions. The `%PDF` prefix check is a file-format check, not an APK checksum, client-attestation requirement, or proof of a document's authenticity.

Evidence ledger: `analysis/recovered/sps-document-flow.json`. Bounded source excerpts: `analysis/recovered/sps-document-flow/`. Verify offline with:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_sps_document_flow.py
```

## Separate follow-up

The later [SPS transport audit](SPS-TRANSPORT-FLOW.md) resolves the viewer client initializer, shared TLS-context provenance, default headers and redirect policy left open by this initial audit. It does not establish production retrieval. Current implementation and local validation are recorded separately in [WEBAPP-PARITY-STATUS.md](WEBAPP-PARITY-STATUS.md); the original evidence and bounded conclusions above remain unchanged.
