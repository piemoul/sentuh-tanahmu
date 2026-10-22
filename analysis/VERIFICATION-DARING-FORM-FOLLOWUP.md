# Daring verification form: native follow-up

This new static supplement follows the established Daring **Mulai Verifikasi** builder `905a9c` into `KEb`, CID 6232. It resolves the initial form, local state and validation, the first identity request, and the next OTP/liveness action boundaries. It does not execute those actions or implement a replacement identity workflow.

The frozen [ledger](recovered/verification-daring-form-followup/flow.json) SHA-256 is `ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8`. The [verifier](rea/verify_verification_daring_form_followup.py) passes 17 new source windows / 3,959 instructions, four inherited sources / 408 instructions, 171 new pool bindings, 156 decisive markers, 11 class records, three dispatch entries and eight allocator headers. It independently reads the pinned ELF and pool, recalculates bindings and verifies each retained source hash. The [verification receipt](recovered/verification-daring-form-followup/verification.json) is static evidence, not a runtime or server test.

The ARM64 ELF remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; the pool remains `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. The previous method-chooser ledger remains unchanged at `86a32299f9b50a0b6393009ee2599ba00dfd829f44db9a18ee7a389b94743977`.

## Initial form and state

The incoming `KEb+0xb` is the existing `JEb` controller, CID 604, created by the Daring introductory screen. `KEb.createState`, selector 49635, resolves to `9fcef4`, allocates `LEb`, CID 5412, and initializes local controls at `9fcf3c`. `LEb.build`, selector 52114, resolves to `902a14`.

The page title is **Verifikasi Akun**. The form heading is **Lengkapi data**, followed by “*Masukkan data diri kamu sesuai dengan KTP.” The single primary button is **Lanjut**.

| Ordered input | `LEb` local text controller | `OEb` model value | Error location | Change / edit-validator callback |
| --- | --- | --- | --- | --- |
| Nama Lengkap | `+0x17` | `+0x7` | `PEb+0x7` | `9050fc` / `905264` |
| NIK Sesuai KTP | `+0x1b` | `+0xb` | `PEb+0xb` | `904df4` / `904f5c` |
| Tempat Lahir | `+0x23` | `+0xf` | `PEb+0xf` | `904b04` / `904c6c` |
| Tanggal Lahir | Date picker, no text controller bound here | `+0x13` | `LEb+0x13` | Picker `da9e68`, selection `904960` |
| No. HP (terhubung dengan WhatsApp) | `+0x1f` | `+0x1b` | `PEb+0x13` | `9046f0` / `904858` |

`JEb+0x7` is the form-value subject holding `OEb`, CID 603. `JEb+0xb` is the error subject holding `PEb`, CID 602. `JEb+0xf` is the busy subject used by the Lanjut control. The form does not introduce a new login/session source.

`LEb.initState`, selector 52643, resolves to `76a744` and calls `d32374`. This initializer awaits the existing `cfed14` local cached-login reader and discards its return. It then awaits `d32400`, which copies existing form-model values into the four text controllers, in name/NIK/phone/place order, with empty strings for null values. This does **not** establish automatic prefill from the cached user or a fresh profile request.

The incoming controller is reused, so returning to this form can retain its form model. Do not substitute account-summary identity fields merely because the initializer reads cached login.

## Validation and date behavior

Individual edit callbacks validate local input and store the original string in the corresponding form-model field. They make no direct business HTTP request in the retained complete bodies.

- The name callback checks a leading literal ASCII space and raw emptiness, with the public errors “Nama tidak boleh diawali spasi” and “Nama tidak boleh kosong”.
- The NIK callback rejects raw emptiness and length below 16. A `\D` replacement call is present, but its returned string is discarded before the subsequent length checks and model assignment. Do not assume that callback normalizes the stored value.
- The birthplace callback checks raw emptiness and constructs `^[A-Za-z][A-Za-z\s]*$`. Full regex/Unicode edge equivalence is not established.
- The phone callback checks raw emptiness. No country-prefix, WhatsApp ownership or phone-number validity check is established by this callback.
- Confirmed date selection formats the supplied date with `dd/MM/yyyy`, writes the string to `OEb+0x13` and clears the local date error.

The final **Lanjut** check is a separate routine, `903ee4`. It tests trimmed name/NIK/place/phone strings without overwriting their original model values. It requires nonempty name/place/phone, NIK length at least 16, and an existing nonempty date string. It updates field errors and its aggregate result. Do not assume it invokes every individual edit validator or independently proves an exact 16-digit wire invariant.

The form binds native input formatters: name and birthplace use `tSb`, CID 2695; NIK uses static `Cra.Tvg` plus `Dra`, CID 2697, with encoded integer field value 16; phone uses the same static formatter plus `Dra` with value 15. Their exact implementations, keyboard enum meanings, generic input-widget defaults and IME/grapheme behavior remain unaudited here. These raw constructor bindings alone must not be reported as fully proven browser formatting rules.

The date callback passes `allowHoliday=true`, no holiday subject, and two named bounds to the previously audited shared picker `d8a500`: lower `tpj` comes from the DateTime construction with year 1900; upper `spj` is local now. Its initial date comes from the construction with year 2008 and additional positional integer 8. **2008 is the initial date construction, not the upper bound or proof of an age-18 rule.** Complete DateTime constructor defaults, locale, timezone and calendar edge parity remain outside this new audit.

While busy, the Lanjut callback does nothing. Otherwise `da9708` unfocuses the input and runs the aggregate local check. Failure displays an **Info** dialog with “Harap lengkapi semua data” before the identity service is invoked.

## Identity, OTP and camera boundaries

| Stage | Observed native effect | What remains unproven |
| --- | --- | --- |
| Form construction, initialization and typing | Local form state, cached login read, local validation and date picker | Full generic widget/formatter parity and all transitive helper behavior |
| Explicit Lanjut after local checks pass | `da986c → da9928` makes a POST to `PeruriLivenessSdk/ValidateKTPDataV2` | Current server/provider acceptance, roles, requiredness, complete transport/interceptor and final multipart stringification |
| Identity response branch | Exact HTTP 200 comparison; result boolean true displays Info, otherwise navigation constructs the OTP page | Complete generic response-model typing; no final account-verified result follows from this branch alone |
| OTP page configuration | `oGb`, CID 6214, wraps `mGb`, CID 583, with **OTP Verifikasi**, the WhatsApp OTP instruction, existing controller and a result callback | Generic OTP lifecycle, automatic send timing, resend, countdown, storage and current acceptance |
| Existing controller OTP operation | `JEb.yaj → de4970 / de4ba0` contains POST `common/send_otp_wa`, JSON `phone_number` and `otp`, with `application/json` | Its invocation timing through the generic OTP widget and provider behavior; this is message sending, not a read |
| Accepted OTP callback branch | Routes to `NEb`, CID 5933, carrying the same controller and four camera/lighting/face/accessory instructions | Camera permission, biometric/liveness SDK, actual capture, media upload and final verification submission |

The first identity request explicitly constructs these five case-sensitive fields; each model value falls back to an empty string when null:

| Request field | Source |
| --- | --- |
| `Nik` | `OEb+0xb` |
| `Nama` | `OEb+0x7` |
| `Tempatlahir` | `OEb+0xf` |
| `TglLahir` | `OEb+0x13` |
| `NoHp` | `OEb+0x1b` |

The existing request corpus identifies POST and FormData construction through `707bd4`. This supplement binds the form inputs to that request. It does not certify the final bytes, server validation, browser compatibility or checksum requirements.

A separate local `OEb` serializer at `902be4` constructs `nama`, `email:null`, `nik`, `tempatLahir`, `tanggalLahir` and `noHp`. The actual identity request builds its own five fields above. The local serializer is not evidence for adding an email entry to `ValidateKTPDataV2`.

No identity values, OTP values, credentials, camera images or live account data were inspected. No production request, OTP message, camera/biometric action, identity mutation, application/backend/catalog edit, geotag change or attestation bypass occurred. Deeper OTP and liveness pages must not be automatically opened against production under the assumption that they are passive reads.

Run the verification from the workspace root:

```powershell
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 analysis/rea/verify_verification_daring_form_followup.py
```
