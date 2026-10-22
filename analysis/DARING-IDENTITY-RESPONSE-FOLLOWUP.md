# Daring identity validation: response and transport closure

This is a new bounded static supplement for **POST `PeruriLivenessSdk/ValidateKTPDataV2`**. It closes the response model, effective error tuple, five String multipart fields and initial ordinary-session client binding needed by a scoped browser adapter. It does not execute identity validation, send an OTP, open a camera or complete account verification.

The frozen [ledger](recovered/daring-identity-response-followup/flow.json) SHA-256 is `ff50866326808280c90b2962cda3845b2e50ffe5124cdae2ad6d6c46d96a3243`. The [independent verifier](rea/verify_daring_identity_response_followup.py) passes **13 new windows / 579 instructions**, **10 inherited sources / 1,351 instructions**, 36 new pool bindings, 122 decisive markers, seven class records, two String dispatch entries, five allocator headers and 15 dependency hashes. Its [receipt](recovered/daring-identity-response-followup/verification.json) proves the retained static observations, not current server acceptance.

ELF SHA-256 remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 remains `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. The earlier Daring form ledger remains unchanged at `ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8`.

## HTTP 200 response

At `da9a9c`, the service requires exact HTTP 200 before parsing. It casts the already-decoded response data to `Map<String,dynamic>` and invokes generic parser `6bbe60` with `<byb>` and callback `903b48`. There is no second JSON String decode.

The resulting native model is `wyb<byb>`, CID 797, rather than abstract `byb` itself:

| Entry | Native field | Exact rule |
| --- | --- | --- |
| `data` | `+0x13`, `byb?` | Missing/null stays null. Every nonnull value is passed to `903b48` **before** the other fields are read. |
| `error` | `+0xb`, `bool?` | Missing/null is accepted; a wrong nonnull type fails its cast. No numeric or String coercion. |
| `message` | `+0xf`, `String?` | Missing/null is accepted; a wrong nonnull type fails its cast. Empty String is preserved. |

The complete `903b48` callback only checks that its argument is a native `byb` instance and returns that same argument. It contains no nested Map/List/String model parser. Ordinary nonnull JSON values cannot represent such a native instance. Therefore a JSON adapter must require `data` to be **absent or null**; it must not ignore or flexibly accept nonnull data, even when `error` is true.

Unrelated extra envelope keys are ignored by the native parser. A top-level JSON String, array, scalar or null is not the required response map.

The service converts the parsed envelope to `vVb<bool,String>`, CID 295:

```text
effectiveError   = envelope.error   ?? true
effectiveMessage = envelope.message ?? genericApology
```

The exact generic apology is:

> Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi

Consequently, an empty response map produces `true` plus that apology; explicit `error:false` remains false; an empty String message remains empty. The tuple does not retain parsed `data`.

The outer callback `da9708` interprets **true as error**: it displays Info with the tuple message and remains on the form. Otherwise it routes to OTP builder `90434c`. This is an inverted error flag, not a success flag. Neither branch proves that the account is finally verified.

## Other statuses and exceptions

For a normally returned status other than 200, the service does not parse the envelope. It returns error true and:

```text
Terjadi kesalahan saat memproses data (status ${status})
```

The shared default transport predicate accepts 200–299, so ordinary returned 201/204 responses reach this service fallback. Non-2xx responses ordinarily throw in transport instead.

The catch path explicitly handles `WO`, CID 3758, by returning true plus the generic apology. It also tests interface `sa` and uses that apology for matching exceptions; other thrown values are rethrown. The full core exception hierarchy and response/error/retry interceptors are outside this closure. Invalid typed envelopes must never be coerced into success.

A browser adapter may retain its existing 401, non-2xx, network and protocol errors. That preserves its existing session/error handling, but is an explicit browser adaptation from native catch-message behavior. Returned 2xx non-200 responses can use the native status tuple above.

## Multipart fields and String preservation

The request has exactly five case-sensitive fields, in the native builder order, with no file entry:

| Field | Existing form-model source |
| --- | --- |
| `Nik` | `OEb+0xb ?? ''` |
| `Nama` | `OEb+0x7 ?? ''` |
| `Tempatlahir` | `OEb+0xf ?? ''` |
| `TglLahir` | `OEb+0x13 ?? ''` |
| `NoHp` | `OEb+0x1b ?? ''` |

The preceding form audit binds these to String inputs/date formatting. `707bd4` constructs `iP`, CID 3744, with `Da<String,String>` fields. The non-file mapper at `707ee8` handles null as an empty String and otherwise invokes `toString`. String CIDs 94 and 95 both dispatch selector `0xab4d` to `ba0cec`, whose entire body returns the original input.

Thus the supplied Strings survive this path unchanged, including Unicode, whitespace and empty Strings. Do not trim, convert NIK/phone to numbers, JSON-stringify field values or replace multipart with URL form encoding. Exact generated multipart boundary bytes and complete native/browser wire-byte equality remain unobserved.

## Client and session binding

The `70b800` registration binds type `FRb` to factory closure `70be2c`. That factory allocates `FRb`, CID 408, and calls constructor `6bb2a4`.

The Daring controller factory resolves `FRb`, allocates `QEb`, CID 765, stores FRb at `QEb+0x7` and the service at `JEb+0x23`. This identity service reads `QEb+0x7 → FRb+0x7`, the main client. It does not use Directus `FRb+0xb` or the queue backend slot.

The main client uses `TRb.AYi`. Frozen initializer metadata binds `TRb.AYi → 6b8fa0` and `TRb.Thj → ca53e0`; the initial true flag selects `https://sentuh.atrbpn.go.id/`. Later mutable runtime overrides are unobserved.

The constructor installs `LRb` on this client's interceptor list. LRb recognizes the multipart `iP` body and sets `multipart/form-data`. Its exact common-route matcher, `.*\/common\/([a-zA-Z]+)$`, does not match the fixed identity endpoint URI, so this request follows the ordinary stored-token branch.

That branch reads the stored token model, may refresh it on expiry, and sets Authorization from token type, a space and the access token when a model exists. Missing models forward without that assignment. This audit did not read any stored token or credential value. The adapter should retain the established server-held account session; no new bundled credential, privilege or role is inferred.

The bounded caller and LRb request path add no checksum, GPS/device field or identity-attestation header to this business request. This does not prove that the server, another interceptor or a native SDK imposes no further requirement.

## Remaining boundary

The contract is sufficient for a narrowly scoped, explicit identity-validation adapter with five String fields and the typed effective response described above. It does not authorize automatically testing identity submissions against production, sending OTP messages, reconstructing camera/liveness submission, bypassing verification checks or claiming full server parity.

There was no production request, live identity inspection, stored credential read/export, OTP message, biometric action, account mutation or application/backend/catalog edit in this investigation. Historical ledgers were preserved.

```powershell
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 analysis/rea/verify_daring_identity_response_followup.py
```
