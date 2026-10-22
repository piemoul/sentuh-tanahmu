# Berkas Rating entry correction — 2026-10-21

The native **Berikan Rating untuk Berkas ini** entry requires the original Berkasku row's **`readyToRating == true`**. The earlier [main note](BERKAS-RATING-FOLLOWUP-20261021.md) and its original ledger incorrectly attributed rating suppression to `MAb+2f`. That slot is **`isPPAT`**. The rating eligibility slot is **`MAb+33`**, with missing/null treated as false. This additive note supersedes only that entry-gate interpretation; the original files remain byte-identical.

The independent [entry ledger](recovered/berkas-rating-followup/entry-refinement.json) and [verification](recovered/berkas-rating-followup/verification.entry-refinement.json) passed against the original APK ELF and pool. The verifier checks **1,496 unique instructions**, **61 explicit markers**, seven pool records and all predecessor source/dependency hashes. No product/test files or predecessor evidence were changed, and no server request was made.

| Meaning | Checked native path |
| --- | --- |
| List field | Serializer `0xc9fb28` loads `EAb+43`; pool `0x12128` binds the serialized name `readyToRating`. Adjacent `EAb+3f` binds `isPPAT` at `0xc9faf0..0xc9fb20`. |
| Original eligibility passed to detail builder | `0xd9455c` loads row `+43` into `x6`; `0xd94598` places it at caller `SP+10`; call `0x8b0008` reads callee `FP+20` at `0x8b0080` and stores capture `+2b` at `0x8b0084`. |
| Detail widget | The retained closure chain supplies `0x8b0280`. It reads capture `+2b` at `0x8b02e0`, keeps local `-18`, and stores it in `MAb+33` at `0x8b0354`. The builder sets branch selector `MAb+f=false` at `0x8b0318..0x8b031c`. |
| Null default and child parameter | Parent `0x89a234` loads widget `+33`; null selects `NULL+0x30` (false) at `0x89a244`; local `-48` goes to caller `SP0` at `0x89a308..0x89a30c`, hence body `FP+10`. |
| Visibility | `0x89a9d4` tests the branch selector. The false selector enters rating handling; then `0x89a9d8..0x89a9dc` loads `FP+10` and branches to the empty child at `0x89aa3c` when its bool-value bit 4 is set (false). True proceeds to the rating stream callback `0x8a92e8`. |
| Separate busy suppression | `0x8a9334..0x8a9360` returns the shipped busy/empty widget only when stream data equals native true exactly. Null or false proceeds. |
| Unrelated `isPPAT` | Row `EAb+3f` enters `x4` at `0xd94554` → caller `SP18` → callee `FP28` → capture `+27` → local `-20` → widget `MAb+2f` at `0x8b034c`. This is a separate chain. |

Bool interpretation is checked against the local Dart VM pointer-tagging definitions and the matching recovered Blutter true annotation: on this 64-bit target the bool-value discriminator is bit 4, true is `NULL+0x20`, and false is `NULL+0x30`. Thus `tbz #4` follows true and `tbnz #4` follows false. Reversing this bit test would invert eligibility.

The full `fromJSON` decoder was not reconstructed in this refinement. The directly checked nullable widget fallback establishes that null/missing eligibility cannot expose this entry along the inspected chain. No current account eligibility, APK execution or server acceptance is claimed. The backend should retain the strict original-row gate `row.readyToRating === true`, alongside source/session ownership; the public composer itself needs only display number/year and office name.

Reproduce without writes:

```powershell
& 'tools/runtime/blutter-python/Scripts/python.exe' -X utf8 'analysis/rea/verify_berkas_rating_entry_refinement_20261021.py' --verify-only
```

The entry ledger SHA-256 is `60891c26dbbbc4856ed66af2806926555124628ffc0642d57507273c44ff81b1`. Preserved original ledger: `16c83a12a6b4cbf62b9a3881843c27c569102bd6a0617cddccd63dc9e8c0275f`; preserved original note: `18be4093b1cddc5a268ceeaa1ab5dbe6d523bc5b477d05755fce6a030924128c`.
