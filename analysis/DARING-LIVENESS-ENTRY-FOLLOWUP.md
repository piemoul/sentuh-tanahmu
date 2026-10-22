# Daring: OTP callback to native liveness instructions

This bounded static audit freezes the supplied APK's public **NEb** instruction
screen, its local entry gate and its explicit next-action boundary. The new
[ledger](recovered/daring-liveness-entry-followup/flow.json) is
`8b34b26dbc0e827f926014d61f32d18762f6315ef11455d2b985cd60e818721e`.
It inherits the unchanged Daring form ledger
`ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8`.
The original ELF remains
`bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`;
the pool remains `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
No application, backend, account, network, OTP, camera or biometric action was
performed. Existing runtime and earlier reports are unchanged.

## Entry gate and ownership

The form callback `da9d0c` receives the original OTP callback String, invokes
numeric parser wrapper `43a868`, substitutes integer zero for a null parse result,
and calls `9044f4`. That helper reads the current **JEb+27** subject using
`62d618`, compares its integer value to the argument, and returns a tuple:

| Comparison | Tuple first slot `+b` | Tuple message `+f` |
| --- | --- | --- |
| Equal | `true` | `OTP Benar` |
| Unequal | `false` | `OTP Salah, silahkan coba lagi` |

Only an **exact true** first slot reaches shared navigation helper `6ba6fc` with
builder `9045b0`. The other branch displays `OTP yang kamu masukkan salah`.
This is a **local controller recheck**, not a fresh server or provider OTP
acceptance proof. The generic OTP widget's input conditions, send/resend,
countdown and callback invocation belong to the separate OTP audit. Complete
numeric parser edge semantics are outside this proof.

Builder `9045b0` allocates **NEb, CID 5933**, through `da9e5c`, invokes `904628`,
stores the same controller at **NEb+b**, and stores the four fixed instruction
Strings, in order, at **NEb+f**. No identity, OTP value or session state is
invented by this audit.

## Exact initial instruction screen

NEb extends stateless `sK`. Its build selector **48657** resolves positively to
`a3c468`; the complete retained build ends at **`a3d2c8`**. Adjacent configuration
initializer wrappers after that boundary are excluded from the evidence.

The title is **`Verifikasi Akun`**, the heading is
**`Ketentuan Pengenalan Wajah`**, and the explicit action is **`Lanjut`**.
The previews occur in this source order:

| Packaged asset under `assets/images/liveness/` | Label | Bytes | Dimensions |
| --- | --- | ---: | --- |
| `liveness_salah_1_anim.png` | `Salah` | 546,644 | 1024 × 1536 |
| `liveness_salah_2_anim.png` | `Salah` | 476,706 | 1024 × 1536 |
| `liveness_benar_anim.png` | `Benar` | 410,407 | 1024 × 1536 |

All three are ordinary indexed PNGs. Their exact bytes, header, dimensions and
every chunk CRC are verified; each contains only `IHDR/PLTE/IDAT/IEND` and no
APNG chunks. The `_anim` filename does not prove animation. Each native image
uses **viewport height / 6**. Shared layout/font defaults and exact browser
pixel parity are outside this bounded audit.

The exact four instructions are:

1. `Pastikan Kamu berada di tempat yang cukup terang`
2. `Pastikan wajah Kamu terlihat jelas seperti pada foto di KTP`
3. `Gunakan kamera yang dapat merekam dengan kualitas jelas`
4. `Pastikan tidak ada aksesoris wajah, seperti kacamata atau topi`

NEb+f supplies the row count. Builder `a3d774` selects the current source index,
allocates **YEb, CID 5932**, via `de878c`, and writes that String at **YEb+b**.
YEb's build selector 48657 resolves to `a3d7f8`, whose retained complete body
renders this String. The screen does not select, enter or store OTP values.

## Explicit next-action boundary

The button binds closure **`de81b4`** at `a3d000`; construction of the retained
NEb screen does not directly invoke that callback or its two deeper helpers.
This is a bounded direct-call observation, not a transitive claim about every
generic Flutter helper.

The complete 129-instruction callback reads current model name (`+7`) and date
(`+13`), substitutes empty Strings for nulls, calls **`de86ec`** and **`de83c4`**,
and awaits. Both helper bodies remain **unreviewed**. They must not be assumed
passive or invoked just to display the instructions.

After the await, its returned String is compared as follows:

| Returned String | Visible callback branch |
| --- | --- |
| Empty | Invokes shared navigation helper `7257e8` |
| Exact `0` | Stops |
| Other String | Writes JEb+1f subject using `43eef4`, allocates **ZEb, CID 6228**, carries the same controller at `+b`, and navigates through `6ba6fc` |

The String's meaning, SDK/provider workflow, permissions, capture, upload,
liveness verdict, ZEb lifecycle, final submission and server acceptance remain
unresolved. The third branch is **not** evidence of successful account
verification. No browser SDK equivalence is established. A browser instruction
preview must identify its continuation boundary and must not synthesize a
successful OTP, biometric result or verified-account state.

Toolbar back closure `7500a0` calls shared navigation helper `7257e8` twice.
System-pop closure `9c9364` returns early when passed true, otherwise calls the
same helper twice. These call counts do not establish full navigator-stack
semantics.

## Independent verification and portable proof

Run `analysis/rea/verify_daring_liveness_entry_followup.py` with the local Python.
The verifier independently re-decodes the frozen ranges from the ELF, compares
every instruction and source hash, recalculates pool offsets, checks dispatch
arithmetic, class records, allocator headers, exact copy, callback branches and
all original PNG bytes/chunks. It imports neither the explorer nor the ledger
builder.

The successful immutable [receipt](recovered/daring-liveness-entry-followup/verification.json)
is `8847ba59aebb4405bef0ad4dcb5eae7cb7cb9f5fda5b7751bb146e7fde70f3d0`:

- nine new source hashes / **1,388** instructions;
- three inherited sources / **2,758** instructions;
- **4,146 unique** ELF instructions;
- **48 new + 106 inherited** pool bindings, **99** decisive markers;
- three class records, three allocator class IDs and two dispatch entries;
- six dependency hashes and three original assets totaling **1,433,757 bytes**.

`analysis/rea/export_daring_liveness_entry_public_proof.mjs` exports only fixed
public copy, preview metadata and explicit limitations into the immutable
[portable fixture](../webapp/tests/fixtures/daring-liveness-entry-native-proof.json).
It derives no expected values from application code and includes no ELF bytes,
account data, current OTP, session material, provider configuration or media
capture. No application assets are installed by this audit.
