# Verification method chooser: bounded native follow-up

This is a new static supplement to `account-verification-followup/flow.json`. It resolves the three initial screens displayed under **Metode verifikasi** and their explicit next-page builders. It does not implement or execute identity verification.

The pinned ARM64 ELF SHA-256 is `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; the frozen pool SHA-256 is `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. The prior account supplement remains unchanged at `6bba9015f1527fefb855fd58e66be781f6bf7e36806e08cee9cbe6132b706e3a`.

The new finding ledger is [flow.json](recovered/verification-methods-followup/flow.json), SHA-256 `86a32299f9b50a0b6393009ee2599ba00dfd829f44db9a18ee7a389b94743977`. The [independent verifier](rea/verify_verification_methods_followup.py) re-decodes original ELF bytes, recalculates all retained pool bindings and checks class, dispatch and asset records. Its [receipt](recovered/verification-methods-followup/verification.json) passes 17 new source hashes / 1,550 instructions, one inherited cached-login source / 47 instructions, 70 new pool bindings, 80 decisive markers, 10 class records, seven dispatch entries, 10 allocator headers and three packaged image hashes. This is proof of the retained static observations, not proof of runtime acceptance.

## Established initial screens

| Choice | Initial native widget | Initial state / build | Visible contents | Explicit next destination |
| --- | --- | --- | --- | --- |
| Daring, selected integer 0 | `SEb`, CID 6231, allocator `da9fcc` | `TEb`, CID 5411; factory `9fd1cc`; build `9053d0` | Original `KTP.png`, two fixed notices about an e-KTP already linked to another Sentuh account and unlinking through IKD, then **Mulai Verifikasi** | Callback `905a20` → shared navigation `6ba6fc` → builder `905a9c` → `KEb`, CID 6232 |
| Luring, selected integer 1 | `uRb`, CID 6141, allocator `da9fc0` | `vRb`, CID 5323; factory `a05f88`; build `9c8a54` | Original APS illustration, seven ordered instructions covering physical APS attendance, e-KTP identity validation, QR scan and account verification, then **Mulai Verifikasi** | Callback `9c8cc8` → shared navigation `6ba6fc` → builder `9c8d34` → shared `Lz`, CID 6139 |
| IKD, other selected value (UI option 2) | Stateless `MEb`, CID 5934, allocator `da9fb4` | Stateless build `a3bdf0`, selector 48657 | Original IKD illustration, requirement to already have a Dukcapil IKD account and direction to register at Dukcapil if absent, then **Mulai Verifikasi** | Callback `a3c3d4` → shared navigation `6ba6fc` → builder `a3c440` → `QCb`, CID 6254 |

The prior chooser helper `9060a4` can return a cached child. These bindings do not resolve the chooser's static field initializer or every later write to its selected integer.

The Daring factory creates the `JEb` controller, CID 604, initializes it at `9fd21c`, and stores it in `TEb+0x13`. The next-page builder obtains that same controller through closure context → `TEb+0x13` and writes it to `KEb+0xb`. It does not introduce an editable identity argument at this navigation boundary.

The Luring factory constructs a `tRb` controller and defaults but does not install it on the returned `vRb` state in its complete body. The next-page builder writes an empty string to `Lz+0xb` and false to `Lz+0xf`. No meaning beyond these raw field assignments is inferred here.

The IKD next-page builder writes false to `QCb+0xb` and true to `QCb+0xf`. It does not write `QCb+0x13` in this builder. These flags must not be interpreted as successful verification.

## Cached reads and action boundaries

`TEb.initState` dispatch selector 52643 resolves to `76a918`, whose complete body calls `d324ec`. That initializer resolves `JRb`, awaits the previously frozen `cfed14` cached stored-login reader, discards its result and returns. It contains no direct business HTTP service call.

`vRb.initState` resolves to `7cd968`, whose complete body calls `d70928`. That initializer resolves `JRb`, awaits the same cached-login reader, then invokes `setState` with the function at pool offset `4d910`. That function body is not semantically audited here; it is not declared to be an empty callback. The complete initializer contains no direct business HTTP service call.

The inherited `cfed14..cfedd0` proof reads the stored `user` value, decodes it as a map and applies the cached-login model parser. It is a local storage boundary; no stored value or credential was read or exported by this investigation.

All three visible initial builds bind **Mulai Verifikasi** to separate explicit callbacks. Their complete callback bodies route through shared navigation; their complete builders allocate the named next widgets. The audit does not make a transitive no-network claim about dependency-injection constructors, shared Flutter helpers, the Luring `setState` function, generic navigation internals or the next widget lifecycles.

Opening the method chooser, selecting Daring/Luring/IKD, displaying instructions or navigating to a child is not evidence that an account has become verified.

## Packaged illustrations

All paths below are under `analysis/unpacked/apk/id.go.bpn.sentuh/assets/flutter_assets/assets/images/` and are directly bound by the retained build instructions.

| Packaged name | Actual header format | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| `KTP.png` | PNG | 2387 × 1790 | 522,604 | `10a1bf99a31d2bbbd9b6f6ddc45409032f006b1d8b4b70a0d74e148cd542c98e` |
| `aps.png` | PNG | 1065 × 2922 | 145,072 | `c1edb70bb8440d2a4a6bf44937b77c613ad6fc686e3d1f3e0cd2167101ec7202` |
| `ikd.png` | WebP, VP8L | 240 × 240 | 11,682 | `96b4fafe842e6cf0c718c0da370de365276442e917482dd86d48c6f0b47dbf23` |

The `.png` suffix of `ikd.png` does not describe its actual WebP bytes. A future browser asset copy must preserve the original bytes and serve an appropriate content type.

## Explicitly unresolved

The lifecycle, build, fields and requests of `KEb`, `Lz` and `QCb` beyond these next-page allocations remain unaudited here. In particular this work does not reconstruct or execute identity input, e-KTP validation, camera/scanner permissions, QR payload acceptance, liveness, OTP, IKD app/deep-link interaction or verification submission. These are substantive native workflows and cannot be replaced by an assumed success response.

There was no production request, browser/Android action, APK execution, application/backend/catalog change, credential read/export, verification mutation or geotag/physical-visit/attestation change. Full native parity, server acceptance and end-to-end completion remain unproven.

Verification command from the workspace root:

```powershell
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 analysis/rea/verify_verification_methods_followup.py
```
