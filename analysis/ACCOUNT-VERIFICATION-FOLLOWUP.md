# Account verification status: callback and action boundaries

This is a separate offline supplement to [the frozen status flow](ACCOUNT-VERIFICATION-STATUS-FLOW.md). The original ledger `f485ffcc9a5521177ba98c3cb2051018699c6855976b987adb229408b628c72a` and its sources remain unchanged. No application, account, session, verification identity, OTP, or server was accessed or changed.

The new [ledger](recovered/account-verification-followup/flow.json), SHA-256 `6bba9015f1527fefb855fd58e66be781f6bf7e36806e08cee9cbe6132b706e3a`, is pinned to the supplied ARM64 ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` and pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

## Status read and business message

The inherited service remains `GET account/CheckVerifStatusPerorangan`, main/session client, with no caller body, query, or extra headers. It parses the already decoded `response.data` Map directly to nullable `BCb.error:bool?`, `message:String?`, and `data:String?`. Wrong nonnull types fail. A JSON String is not decoded a second time. There is no HTTP 200 comparison inside this helper; this supplement does not redefine the shared transport's accepted HTTP status range.

Both service and retained profile consumer ignore `BCb.error` for business dispatch. A generic backend rejection of `error:true`, or a frontend rule preventing these business messages when `error:true`, conflicts with this narrowly scoped endpoint. This is not authorization to loosen error handling on other endpoints, authentication, or account permissions.

The outer consumer tests exact message `-1` and `3` before reading the cached sign-in user. Both use route callback `8dbbe4`. They are routing codes, not proof that an account is verified or unverified.

Other messages enter `da0fcc`, reading cached storage `user` via `d2c74c` and `gyb.userLevel:int?` at `+17`. It does not use `account_summary.statusVerifikasi`. Cached `userLevel == 2` suppresses normal dialogs; nullable level on an existing cached user compares unequal to 2. A missing cached user hits the native null assertion; a browser must not invent a role from another profile field.

| Exact message | Condition | Official message | Explicit dialog controls |
|---|---|---|---|
| `0` | Stored sign-in userLevel != 2 | Permohonan verifikasi akun sedang dalam proses. | `Ok` |
| `1` | Stored sign-in userLevel != 2 | Permohonan verifikasi kamu telah disetujui. Mohon untuk login kembali untuk memperbarui akun kamu. | `Batal ` and `Logout` |
| `2` | Stored sign-in userLevel != 2 | Permohonan verifikasi kamu ditolak. followed by newline and `data ?? ''` | `Batal ` and `Verifikasi` |

Empty data Strings are preserved. Unknown/empty message codes produce no mapped normal dialog in this switch; displaying their raw value neutrally would be a browser adaptation, not a guessed business status.

## Dialog and credential-action boundary

Complete builder `8db594..8dbb6c` receives the message at captured context `+13`, the offer-Logout flag at `+17`, and offer-Verifikasi at `+1b`. The first label is `Batal ` when either flag is true, otherwise `Ok` (`8db740..8db76c`). The first button always binds `728800`, whose complete callback only invokes shared navigation helper `7257e8` and returns.

The offer-Logout flag controls insertion of the `Logout` button (`8db88c..8db9e0`), bound to `da1270`. That explicit callback awaits helper `da1324`, then calls `6bab2c` and shared navigation `456de0` using an LRb-owned callback `6bfa34`. This is the credential/session action boundary. The deeper helper, storage/HTTP effects, and exact destination are deliberately unexpanded. **A status read must not invoke this action automatically.**

The offer-Verifikasi flag controls insertion of `Verifikasi` (`8db9e4..8dbb38`). Its callback `8dbb6c` invokes `7257e8` and then shared route helper `6ba6fc` with the same `8dbbe4` destination builder. No direct HTTP call appears in the complete callback. Exact generic navigator internals, barrier/back behavior, and all widget visual defaults are outside this bounded proof.

## What the verification destination actually is

`8dbbe4..8dbbfc` contains one call: allocator `da1240`. Its header binds `WEb`, class 6229. Dispatch 59960 selects factory `9fd780`, which creates `_XEb`, class 5409. Dispatch 61619 selects build `905e78`.

The bounded build and its local selection callbacks prove:

- Title **Metode verifikasi** at `905ea4`.
- Choices **Daring** 0, **Luring** 1, and **IKD** 2 at `9061a4..9061d8`.
- Selection reads cached static slot `r26+78 -> 31b8`. Callback `90660c` invokes setState with `90666c`; the latter only stores the selected integer to that slot.
- `9060a4` returns cached or newly allocated child widgets through `da9fcc`, `da9fc0`, or `da9fb4`. Their init, identity, OTP, liveness, camera and submit effects are not audited here. Opening the chooser is not proof that every selected child has no automatic behavior.

Consequently, a read-only browser correction can faithfully display exact status and explanatory text, retain the sign-in role gate, and identify `-1`/`3` as method-choice navigation. Implementing verification child flows or credential actions requires their separate scope; no automatic Logout, OTP, identity submission or verification-state mutation follows from this result.

## Verification and limits

Run `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_account_verification_followup.py`. It independently compares the new and inherited sources to pinned ELF bytes, checks pool offsets/contents, class bindings, dispatch rows, allocator headers, decisive branch/call markers, and dependency hashes. [The retained PASS receipt](recovered/account-verification-followup/verification.json) covers 9 new source files / 1023 instructions and 10 inherited files / 1569 instructions, with 3 identical allocator instructions overlapping: **2589 unique instructions**. It also checks 33 new and 134 inherited pool references, 85 markers, 4 class records, 2 dispatch rows, 2 allocator headers, and 6 dependencies.

This is static evidence only. It proves neither current server acceptance nor a client checksum requirement, original-device behavior, completed verification, exact UI pixels, deeper credential/identity effects, or permission to change official records. No protection, account, identity, or location bypass was performed.
