# Main Scan: native entry and result routing

This is a bounded **static** audit of the supplied Sentuh Tanahku 6.1.5 ARM64 library, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No application execution, production request, credential value, server mutation, integrity bypass or application edit was performed. The machine-readable evidence is [scan-flow.json](recovered/scan-flow.json).

The native main Scan flow is not four independent query forms. It captures the barcode text and a profile-derived name, calls a classification service first, then routes according to the **returned message**. The existing generic web Scan forms therefore do not establish native parity.

## Entry and input provenance

The shared bottom-navigation callback `0x8bfb0c → 0xd9aa0c` treats the Scan label as a menu event with a no-op callback at `0xca30e8`. The separate center action supplies the scanner. Its builder `0x8be7f0` binds `0xd9a824` when its captured account model and asynchronous stream value are non-null; otherwise it constructs the waiting dialog. The enabled callback awaits the camera gate `0xd9a8dc` and requires true before `0x8bef6c → 0x8befe8` constructs scanner widget `Lz` (class 6139, Wkn), with its mode flag false.

`LBb+0x27 → +0x13` is bound as an `ayb?` stream at `0x8be478..0x8be4bc`. The builder reads its current value via `0x8be704 → 0x8be7b8 → 0x62d618`. In `0x8befe8`, the selected name is exactly:

```text
profile.nama ?? profile.email ?? "-"
```

`ayb+0x1b` maps to JSON `nama`, and `ayb+0xf` to JSON `email`; both have nullable String guards. The fallback tests only null: empty strings and whitespace survive. The code does not fall back to username, and does not expose a typed name input. It dereferences the profile, so a null profile is not proved to produce `"-"`. This differs from the previously audited Activity/KKPR name contract (`nama`, null default empty). See [profile proof](recovered/scan-document-callers/profile-name-proof.json).

The QR plugin callback `0xd8621c` handles `onRecognizeQR`, reads `Map.code` as `String?`, and stores it unchanged in `dxb+7` at `0xd863e0`. The scanner stream callback `0xd7581c`, with the main mode flag false, invokes `0x8137b4`; that constructs `hIb` (class 6191, kdo) with the original barcode object and selected name. Result-state `_iIb` initialization `0x77db14` passes this barcode to `0xd4107c`. The request receives `barcode.code ?? ""`. No trim, URI decode, split, or local type-prefix extraction occurs in this bounded chain.

The literal `/ScanPage` has one direct pool-load reference in `.text`, `0xde2ec0`, inside a list also containing Form, OTP, VerificationMethod, Liveness and KtpPreview routes. That route-check list is not scanner construction or result dispatch. The audit does not equate this string with the main center-action route.

## Classification and document routing

At `0xd41174`, the result handler calls `0xd4232c` before a document read. The helper uses the main `FRb+7` client and performs `POST apis/scanDocument` at `0xd42440`, with `application/x-www-form-urlencoded` body keys **q** and **name**. They are the unchanged raw barcode string and the selected profile name.

For HTTP 200, the helper accepts a direct map or parses a string as JSON once. `error` is a bool, default false; `message` is a String, default `Unknown Error`; `data` is a required String. Both branches of the error bool construct the same `(message, data)` tuple. Non-200 and caught failures return `("error", "1009")`. A false error flag is therefore not a complete description of native routing.

| Classification message | Native action | Scope of proof |
| --- | --- | --- |
| `GetParcelBoundaryById` | `0xd42880 → 0x77ece8` passes tuple.data to `mFb+0xf` (persil ID), with true at +0x13 and false at +0x17. | Map construction only; full downstream controller behavior on this entry remains unverified. |
| `AktivasiBerkasGeotag` | `0xd427f4` passes literal `1010` and tuple.data to `0xd41a40`. | Activation effects and presence-validation workflow are not established by this bounded audit; not implemented. |
| Any other message | `0xd41428` calls `GetDocument` using the original q and profile name. | The document sequence below is proved; this does not prove classification POST has no server-side effects. |

After `GetDocument`, null or an exact result code `1001`, `1002`, `1003`, `1004`, or `1009` takes the error path and returns without the metadata call. Otherwise, `0xd41574` calls `GetDocumentType` with the original q, awaits it at `0xd41580`, and schedules viewer builder `0xd4273c → 0x77ebc0`.

The shared metadata helper and its default tuple are already documented in [ACTIVITY-DOCUMENT-FLOW.md](ACTIVITY-DOCUMENT-FLOW.md) and [activity-document-flow.json](recovered/activity-document-flow.json). Main Scan does not inspect the metadata error flag before building the viewer. Non-200/null/parse failure produces its existing `(true, false, "")` fallback. The main Scan viewer forwards **metadata.type** into `yGb+0x2b`, whereas the Activity non-PBT viewer supplies an empty type. It also forwards metadata.showRoute into +0x1b and the original barcode.code into +0x17. That original viewer q can remain null even though the request used an empty-string default. Flags are +0x1f=true, +0x23=true, +0x27=false. These distinctions matter when reusing document controls.

## Consequences for the webapp

The webapp's independently executable Scan forms do not reproduce classification-before-routing, the profile fallback, or the main viewer's metadata.type behavior. Reusing the Activity document function unchanged would preserve these differences. Manual q entry can later substitute for camera decoding, but that alone would not establish the downstream native sequence.

The catalog currently keeps `apis/scanDocument` **disabled**, classified as a write. This audit does not reclassify or enable it: the client control flow does not establish absence of server writes or activity logging. No application patch or Docker rebuild follows from this audit. The map/activation branches and type-dependent document controls need further evidence before their implementation can be claimed equivalent. There is no physical-presence or geotag-submission bypass here.

## Reproducible evidence

The builder only exports the selected instruction windows and allowlisted public strings; it does not modify the shared Blutter source:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_scan_flow.py
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_scan_flow.py
```

The verifier independently compares **26 source hashes, 3,029 ARM64 instructions, five dependency hashes, four dispatch entries, 105 decisive instruction markers, and 51 string-pool references**. It additionally scans `.text` for the direct result-handler caller (`0x77db40`) and the direct `/ScanPage` pool reference (`0xde2ec0`). The instruction count includes the duplicated 28-instruction name-constructor fragment retained by the independent profile audit. These checks prove the retained static evidence matches the supplied artifact, not server behavior or browser feature completion.

The independent service audit also distinguishes the additional `GetDocument` caller at `0xdbcbc4` as the certificate-open flow (`klik buka sertipikat`, q suffix `:SERTIPIKATKU`), not main Scan. Its separate viewer defaults must not be used as evidence for the main Scan contract.
