# Daring local input: exact copy and remaining formatter boundary

This static supplement uses the supplied APK 6.1.5 and preserves the previous
Daring form ledger `ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8`.
The new [ledger](recovered/daring-input-followup/flow.json) is
`453a59d94bf5fcee88e5590b2a3702b20506b918e08c71397959da4c7caf60e1`.
The ELF remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`
and the pool remains `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
No application, backend, account, network, identity, OTP or camera action was performed.

## Edit and final-check errors differ

| Field / failure | Individual edit validator | Final Lanjut aggregation |
| --- | --- | --- |
| Name begins with literal ASCII space | `Nama tidak boleh diawali spasi` | This check is not replayed |
| Name empty | `Nama tidak boleh kosong` | `Nama tidak boleh kosong` |
| NIK empty | `NIK tidak boleh kosong` | `NIK tidak boleh kosong` |
| NIK shorter than 16 | `NIK harus 16 digit` | `NIK harus 16 digit` |
| Birthplace empty | `Tempat Lahir tidak boleh kosong` | `Tempat lahir tidak boleh kosong` |
| Birthplace fails pattern | `Tempat Lahir hanya boleh mengandung huruf dan spasi.` | This check is not replayed |
| Phone empty | `Nomor Telepon tidak boleh kosong` | `Nomor HP tidak boleh kosong` |
| Date absent or empty | Date selection clears its local error | `Tanggal lahir tidak boleh kosong` |

The retained complete callbacks are name `905264`, NIK `904f5c`, birthplace
`904c6c`, phone `904858`, and aggregate `903ee4`. The name checks the space prefix
before raw emptiness. The String helper `43106c` defaults the optional start
index to zero, then uses a fixed-position substring comparison for ordinary
OneByte/TwoByte Strings; it is not an anywhere-in-string space search.

The NIK edit callback constructs `\D` and calls replacement, but discards that
return value. It reloads the original String for raw emptiness/length checks.
All four on-change callbacks retain the original changed String in the model.
The NIK check is **below 16**, rather than an exact-length test. The birthplace
literal is `^[A-Za-z][A-Za-z\s]*$`; full RegExp/Unicode edge parity remains outside
this supplement. The phone edit callback establishes no prefix, minimum length,
WhatsApp ownership or provider acceptance rule.

The separate aggregate trims temporary **current text-controller Strings** for
name, NIK, birthplace and phone. It requires trimmed nonempty name/place/phone,
trimmed NIK length at least 16, and an existing nonempty model date String.
It does not overwrite the original Strings or rerun the edit-only name-prefix
and birthplace-pattern checks. A nonempty value can therefore clear an earlier
edit-only error during aggregate validation. Local success does not imply
identity validation or a verified account. The shared valid-date callback
`6a071c` clears the local date error slot.

## Formatter configuration is proved; formatter behavior is not

An isolated metadata helper reads the public `Cra.Tvg` field descriptor at
pool `30c50`, checks static field offset `ae8`, and exports its
`Field.InitializerFunction` entry **`8c6300`**. It does not read the field value
or invoke the initializer. A repeated export gives identical output, and all
23 shared Blutter build inputs remain unchanged.

The complete initializer `8c6300..8c6378` constructs the public pattern `[0-9]`,
allocates **Cra, CID 2698**, and stores pattern at `+b`, true at `+7`, and empty
replacement at `+f`. The earlier form proof binds this configuration before
**Dra, CID 2697**, with integer 16 for NIK and 15 for phone. Name and birthplace
instead receive **tSb, CID 2695**.

The three classes' function metadata arrays are stripped in the bounded export.
Heuristic dispatch candidates did not establish the formatter method bindings;
none is promoted into proof. This supplement therefore **does not establish**
tSb capitalization/filtering, digits-only execution, truncation, UTF-16 versus
grapheme limits, IME/composition policy, or old/new text-selection behavior.
A browser should not enforce those guessed transformations from configuration
and constructor arguments alone. A later audit needs the actual formatter call
site/selector and complete dispatched method bodies.

## Date constructor defaults

The complete positional constructor `6b3b80..6b3e28` defaults omitted month/day
to 1 and hour/minute/second/millisecond/microsecond to 0, then passes false for
UTC to its internal constructor. The caller descriptors distinguish required
receiver/year from the additional optional month argument. Together with the
inherited date callback this closes these source constructions:

- lower bound: **1900-01-01**, local midnight;
- native initial date: **2008-08-01**, local midnight;
- upper bound: **local now**.

The initial date is not the upper bound, and no age-18 restriction is proved.
This does not close shared calendar rendering, timezone/DST conversions or
Intl formatting edge cases. A browser using no initial date must disclose that
choice as its interface adaptation.

## Reproduce and use public proof

Run `analysis/rea/verify_daring_input_followup.py` with the project-local Python.
The independent verifier passes six new source hashes / **371** instructions,
three inherited sources / **2,775** instructions, **3,146 unique** ELF instructions,
two new and 105 inherited pool bindings, five selected pool metadata records,
91 decisive markers, three class records, one initializer binding, and ten
dependency hashes. The metadata helper rerun is identical; no initializer or
APK user code executes.

`analysis/rea/export_daring_input_public_proof.mjs` creates the small immutable
[public fixture](../webapp/tests/fixtures/daring-input-native-proof.json) from
the two pinned ledgers. It contains only fixed public copy, local rules and
explicit boundaries, so source-only tests need neither ELF nor unpacked APK.
The exporter does not inspect application implementation to derive expected values.
