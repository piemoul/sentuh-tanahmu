# Electronic certificate: Lihat Sertipikat

Bounded static audit of the supplied Sentuh Tanahku 6.1.5 ARM64 ELF, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No production requests, credentials, application edits or location/integrity bypass were used. This is a separate entry from Main Scan.

The official **Lihat Sertipikat** button uses the selected certificate list record's **SertifikatId/sertifikatId**, then appends **`:SERTIPIKATKU`**. It calls `apis/GetDocument` with that `q` and the cached current account summary's **nama**, defaulting null to an empty string. It does not call `apis/scanDocument` or `apis/GetDocumentType`.

## Exact bindings

| Binding | Native evidence |
|---|---|
| Selected ID aliases | `0x7860b4` reads `SertifikatId`; null fallback `0x7860e0` reads `sertifikatId`; `0x786148` stores `GIb+0x17`. |
| Electronic destination | `0x955e0c` reads selected `GIb+0x17`; `0x955f68` stores that exact value into `QIb+0xb`. Existing certificate-detail audit proves the electronic StatusEl branch. |
| State build | `_RIb` build dispatch index61579 resolves to `0x94c5a4`; `0x94c5e0` captures that receiver in C0+0xf. |
| Captured contexts | `0x94c878`: C1.parent=C0. `0x952bec`: C2.parent=C1. C2+0xf is the local setState callback. |
| ID at document tap | `0xdbcaf0`→`0xdbcaf8`→`0xdbcb00`→`0xdbcb08`→`0xdbcb18`: C2→C1→C0→_RIb→QIb→QIb+0xb. This never reads the detail response's `sertipikatId` or `nibel`. |
| PDF request | Suffix pool0x55be8 at `0xdbcb40`; concat `0xdbcb4c`; `GetDocument` call `0xdbcbc4`, with q in x2 and name in x3. |
| Profile name | Parser `0x7558c4` reads `nama`, `0x755918` stores ayb+0x1b. Home `0x8da200` reads it, null→`""`, and `0x8da218` caches it in static slot0x1780 (table displacement0x2f00). Document callback reads that slot at `0xdbcacc`, with its own null→`""` at `0xdbcad8`. |

The profile source is the existing `account/account_summary` pipeline proved by `recovered/kkpr-document-flow.json`. Empty and whitespace names are preserved. There is no username, email or certificate-owner fallback. The browser should reuse the current-session summary helper; do not accept a manually entered name or arbitrary document ID.

## Visibility and busy state

`0x94c83c` first checks its loaded-detail stream tuple: data must be nonnull, tuple+0xb must not be true, and tuple+0x13 must be false. The ordinary detail-read success condition remains required.

After that guard, `0x94cb60` creates document button builder `0x952bb0`; the bottom action layout always includes that StatefulBuilder at `0x94ceb0`. The `isPrinted`, `statusDI301A`, shared and StatusHT-related checks at `0x94c9a8..0x94ca1c` select the separate QR child. The later branch at `0x94cb9c..0x94cbcc` selects the sharing action. Neither condition hides **Lihat Sertipikat**. Do not apply the QR gate or an inferred own-only gate to this button.

The button's own gate is `_RIb+0x1f`, initialized false at `0xa013cc`. Builder `0x952c10` chooses a spinner while true; false builds the tap target with label pool0x55bd0 and callback `0xdbca40`. The tap starts busy via `0x952fb8`/store `0x952fe8`, and normally ends it via `0x952ebc`/store `0x952eec`. Use the existing browser lifecycle/session guards to prevent stale or duplicate actions.

## Transport, errors and viewer

The shared helper `0xd41dd0` posts exactly form fields `q` and `name` to `apis/GetDocument` using the existing main-client session transport. Its full request and error contract is retained in `recovered/kkpr-document-flow.json` and independently rechecked here in `certificate-document-flow/pdf-service.asm.txt`. The normal native success path accepts HTTP200 byte bodies longer than200 bytes and writes a temporary PDF path; known failures become codes1001/1002/1003/1004/1009.

The certificate callback checks result type `String?` at `0xdbcc00`, stores it at `0xdbcc18`, and installs navigation callback `0xdbccf0` through the event path labelled `klik buka sertipikat`. That navigation callback checks **nonnull only** at `0xdbcd38/0xdbcd3c`. Consequently the native flow can mistakenly treat an error-code string as a file path. The browser should retain its existing strict PDF signature/size validation and structured error handling.

Viewer builder `0x952ef4` creates `yGb` with the following fields:

| Field | Value | Store |
|---|---|---|
| +0xf | File created from returned local path | `0x952f78` |
| +0x17 | Full selectedID + `:SERTIPIKATKU` q | `0x952f80` |
| +0x1b, showRoute | true literal | `0x952f88` |
| +0x1f | true literal | `0x952f8c` |
| +0x23 | true literal | `0x952f90` |
| +0x27, optional signature flag | false literal | `0x952f98` |
| +0x2b, type | empty string literal | `0x952fa0` |

There is no metadata request in this document callback/navigation/viewer chain. The full q and empty type can feed the separately audited document-viewer components. This finding does not add any geotag write, physical-presence alteration or activation behavior. Physical-certificate equivalents and server acceptance are not established by this static audit.

## Reproducible evidence

- Ledger: `recovered/certificate-document-flow.json`.
- Builder: `rea/build_certificate_document_flow.py`, with an explicit safe string allowlist and bounded ELF windows.
- Verifier: `rea/verify_certificate_document_flow.py`.
- Verification: **14 source hashes, 1635 exact ELF instructions (1635 unique), 4 dependency hashes, 81 decisive markers, 32 pool literal references and 1 dispatch entry**. Certificate chain contains one direct GetDocument call (`0xdbcbc4`) and no direct metadata/classification call.

Run locally with `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_certificate_document_flow.py`. Verification does not execute the APK or contact any server.
