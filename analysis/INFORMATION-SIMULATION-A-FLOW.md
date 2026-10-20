# Info Layanan — native simulation forms 1–3

This is a bounded static audit of the supplied Sentuh Tanahku 6.1.5 ARM64 `libapp.so`, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. It uses the REA evidence workflow and the already unpacked ELF, Blutter metadata, object pool and dispatch table. It performs no network request, app execution or application edit. It does not establish production acceptance, current server policy, visual pixel parity or a complete application reconstruction.

The machine-readable ledger is [flow.json](recovered/information-simulation-a/flow.json). [The root/detail audit](INFORMATION-FLOW.md) proves the inline six-way selector; [the service audit](INFORMATION-SERVICES-FLOW.md) proves request serialization and response envelopes. Province lookup, shared text-widget internals and result presentation belong to the separate `information-simulation-b` audit.

## Binding and defaults

| Type | Widget / state | State factory / constructor | Build / submit |
| --- | --- | --- | --- |
| 1 | mDb cid6251 / nDb cid5431 | `9fbb20` / `9fbb68` | `8e78b4` / `8e8164` |
| 2 | oDb cid6250 / pDb cid5430 | `9fbca4` / `9fbcec` | `8e8b50` / `8ea494` |
| 3 | qDb cid6249 / rDb cid5429 | `9fbe2c` / `9fbe74` | `8eb170` / `8eb544` |

All three states dispatch initialization to `75f3a4`, whose shared province loading is covered by the companion audit. Each widget receives the existing `VCb` controller at `+0xb`; type 3 additionally receives the **returned detail** `layananId` at widget `+0xf`. The forms use controller province stream `+0x1b`, result stream `+0x23` and busy stream `+0x27`.

The constructors initialize text controllers and option arrays. They assign no selected province, usage or procedure: those nullable fields begin null. Type 2 creates an empty growable `List<eDb>`. The text controller's shared default is separately audited; the literal `0` in type 2 is a **placeholder**, not a form value.

Raw usage values, in order, are `pertanian`, `non-pertanian`. Type 1 procedures are `konversi`, `Pengakuan dan Penegasan Hak`. The shared option mapper `8e87bc` stores display text at `CSb+0xb` and the unchanged raw string at `CSb+0xf`; setters take the raw value. The display helper `8e7e5c` retains a trim-empty string, otherwise uppercases the original first character and lowercases the original remainder. For these ASCII constants, the labels are `Pertanian`, `Non-pertanian`, `Konversi`, and `Pengakuan dan penegasan hak`. Earlier Akta evidence supplies bounded case-table proof; full Unicode parity remains unproved.

The region builders (`da3090`, `da363c`, `da3b20`) show `Wilayah / Provinsi` / `Pilih Wilayah / Provinsi`. They map the province snapshot list to dropdown options, use an empty list if data is null, and restore a current option with `firstWhere`; a failed lookup yields null. Type 1/3 selection lives at state `+0x17`; type 2 at `+0x13`. The province model and lookup wire contract are in the companion audit.

## Form contract

| Type | Inputs after province | Submit guard in this form | Payload |
| --- | --- | --- | --- |
| 1 | `Luas Tanah (m2)`; `Penggunaan`; `Prosedur` | Province, usage, procedure are nonnull | `WilayahId`, `Luas`, `Penggunaan`, `Prosedur` |
| 2 | Local list plus `Jumlah`, `Luas (m2)`, `Penggunaan` | Province is nonnull and item list has at least one entry | `WilayahId`, `data[]`; each entry has `Jumlah`, `Luas`, `Penggunaan` |
| 3 | `Luas Tanah (m2)`; `Penggunaan` | Province and usage are nonnull | `WilayahId`, `Luas`, `Penggunaan`, `LayananId` |

Types 1 and 3 use the area hint `Masukkan luas tanah dalam meter persegi`. Type 2 uses `0` for both text hints. Usage and procedure hints are `Pilih Penggunaan` and `Pilih Prosedur`. All calculate buttons say `Hitung Simulasi`.

Every numeric-looking text field is copied into a model as its existing **String**. These submit paths do not trim, parse a number, enforce positivity, compute a fee or replace an empty area with zero. Types 1 and 3 contain no area-length guard. Missing required selections silently return. This describes the form callback; it does **not** prove all strings can be entered through the shared input formatter.

The local input widget is `ISb` cid6133 / shared state `JSb` cid5316. Captured arguments select numeric keyboard object `Gra@7887d1` (type 2, signed false, decimal false), one line, enabled true and maximum-length argument 99999. The form does not assign a local validator callback. Actual keyboard/filter/length enforcement comes from the common widget, not these submit guards; the companion evidence reuses the existing shared formatter audit.

## Type 2 list editing

The native form displays `Daftar Bidang`, initially `Belum ada bidang yang ditambahkan.`, then `Tambah Bidang Baru`. `Jumlah` and `Luas (m2)` are two Expanded controls in one row, followed by the usage dropdown and `Tambah ke Daftar`.

The add callback `8ea7ac → 8ea7e4` requires both raw text lengths to be greater than zero and usage to be nonnull. It does not require province selection. On success, `8ea8e4` constructs an `eDb` with the original three strings and appends it. There is no deduplication, numeric merge or sort. Then it invokes shared text-controller clear `810d30` for both inputs and sets usage to null. Province and existing rows remain.

Each row renders `{Jumlah} Bidang | Luas: {Luas} m2`, then `Penggunaan: {display label}`. Its trailing icon binds callback `8eaf0c`; the nested state update `8eaf74` removes the captured current list index using `removeAt` helper `506aac`. Add and remove are local operations with no remote request in the captured callbacks.

Calculate `8ea494` sends the current list only when the province is nonnull and the list is nonempty. If the list is empty, it shows `Harap tambah minimal 1 bidang tanah.` even if province is also missing. A nonempty list with a null province returns silently. No extra count cap or per-row recalculation appears in the captured form.

## Service handoff and results

| Type | Form call → controller | Controller call → service | Route |
| --- | --- | --- | --- |
| 1 | `8e8258 → da2ce4` | `da2d4c → da2e60` | `InfoLayanan/SimulasiTipe1` |
| 2 | `8ea544 → da322c` | `da3294 → da33a8` | `InfoLayanan/SimulasiTipe2` |
| 3 | `8eb62c → da37cc` | `da3834 → da3948` | `InfoLayanan/SimulasiTipe3` |

The three controllers set busy true, await the service with the model unchanged, publish the result when the returned tuple's error is not true, or publish null when it is true, then set busy false. Exception cleanup resets busy and rethrows. They do not clear the old result before starting. The shared result UI is separately audited; this ledger does not claim successful live cost calculation.

Service evidence establishes the serializer keys and typed `kDb` envelope. It does not establish production access policy, server side effects or acceptance of malformed inputs. Browser validation and request ownership are implementation concerns requiring separate tests.

## Verification

Run from the workspace:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_information_simulation_a.py
```

The verifier independently compares exact non-overlapping source instructions with the ELF; derives annotated pool offsets from instructions; checks literal/pool contents, constants, dispatch, dependency hashes, payload bindings, selection guards and controller service targets. The current bounded pass covers 20 source hashes, 3,702 instructions, 188 decisive markers, 272 pool references, 13 dispatch entries and three constant objects. It is an evidence-integrity check, not an emulator or production test.

There is no geotag, physical-presence, authentication or integrity bypass in this work.
