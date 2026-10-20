# Info Layanan: bounded native UI evidence

This static audit covers the supplied Sentuh Tanahku 6.1.5 ARM64 artifact, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. It establishes menu entry, automatic list loading, local search/grouping, selected-item navigation, detail sections and inclusion of the simulation widget. It does not establish production acceptance, runtime rendering, all six simulation forms, or full native parity. No application files or production services were changed.

The frozen ledger is [information-flow.json](C:/ai/CLAWD/sentuh_tanahmu/analysis/recovered/information-flow/information-flow.json). Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_information_native_flow.py` to verify **19 source hashes, 3,208 exact ELF instructions, 159 decisive markers, 18 String literal references / 232 pool annotations, 13 dispatch entries, 9 dependencies and 5 constant UI objects**. Instruction windows do not overlap. The verifier separately checks each constant-object excerpt against the retained `objs.txt`, whose hash is a dependency. These are bounded static checks, not executed APK behavior.

## Entry and state

The menu tap `0x8c32d4` captures route callback `0xd9b084`, which invokes factory `0x890088`. The factory returns constant `YCb`; dispatch maps its state factory to `0x9fb9f4` and `_ZCb` init/build to `0x75f050` / `0x8e60d8`. Init calls list controller `0xd2f588` at `0x75f070` automatically. A separate user action is not required to start the list read.

Both list and detail states construct a `VCb` controller. Constructor `0x9fb7c4` resolves `FRb` through the typed lookup at `0x9fb80c`, stores it in the new `lDb` service at `+7` (`0x9fb820`), then stores the service in `VCb+7` (`0x9fb82c`). The list stream/busy fields are `VCb+0xb/+0xf`; detail stream/busy are `+0x13/+0x17`. Busy defaults are false. `_ZCb+0x1f` starts as an empty query, with separate text and scroll controllers at `+0x17/+0x1b`.

The menu callback goes through a common telemetry wrapper. Its bounded instructions contain no local authentication branch; this does not establish the service's authorization policy. Service/envelope/model and simulation transport analysis belongs to the separate [service audit](C:/ai/CLAWD/sentuh_tanahmu/analysis/INFORMATION-SERVICES-FLOW.md) and [frozen service ledger](C:/ai/CLAWD/sentuh_tanahmu/analysis/recovered/information-services/flow.json).

## List behavior

| Concern | Native behavior and evidence |
|---|---|
| Heading/search | `Info Layanan`; input placeholder `Cari layanan` (`0x8e6118`, `0x8e64e8`) |
| Initial load | Synchronous init invokes the asynchronous controller without awaiting it (`0x75f050..0x75f08c`) |
| Loading/error/empty | Null or true busy snapshot shows the progress constant. Snapshot error shows `Gagal memuat data. Silakan coba lagi.`; absent/empty source shows `Tidak ada data informasi layanan.`; no filter matches shows `Layanan tidak ditemukan.` (`0x8e623c..0x8e657c` plus verified object excerpts) |
| Query | Local `setState` stores the unchanged String at `_ZCb+0x1f` (`0x8e756c..0x8e76a4`); no network call in this callback |
| Matching | Empty query accepts all. Otherwise compare lowercase query against lowercase nullable `nama`, `deskripsi`, or `grup`; null contributes false. **No trim** occurs in the captured callback/predicate (`0x8e76a4..0x8e78b4`). |
| Grouping | Filter first, then use raw `grup`; only null falls back to `Lainnya`. Empty strings remain empty group names. Append rows to existing groups, otherwise insert a group and append (`0x8e671c..0x8e68f4`). |
| Order | Input iteration and appends retain row order. The keys are materialized without sorting (`0x8e6460..0x8e647c`); first-seen group order additionally follows ordinary Dart insertion-ordered Map literal semantics. |
| Rows | Title is `aDb.nama ?? "-"`; description is `aDb.deskripsi ?? "-"` (`0x8e70c4`, `0x8e7188`). The group title precedes its rows directly. No group-collapse callback or application-level pagination controls appear in the captured group builder. |

The models are nullable, with exact lowercase keys `layananId`, `nama`, `deskripsi`, `grup`; the list parser also type-checks `tipeSimulasi` but does not retain it in `aDb`. The model offsets in this UI audit are anchored to the existing `official-menu-map.json`; the parallel service audit verifies the complete parsers/envelopes separately. Do not use a list item's simulation type to decide the detail simulation UI.

## Detail navigation and content

The row builder retains the selected original `aDb` in its closure context (`0x8e7098..0x8e70a8`). Tap `0x8e74ac` routes through factory `0x8e7524`, which assigns that same object to `WCb+0xb` at `0x8e7550`. `_XCb` init reads `widget.aDb.layananId` unchanged; null becomes an empty String before the detail controller call `0x75ea88 → 0xd2f1e8`. A browser guard that blocks a blank ID is a deliberate difference.

The detail build `0x8e52a4` consumes the returned `bDb` while retaining the original selected list row:

1. Heading: returned `bDb.nama`, falling back to an empty String.
2. Description: the **selected list row's** `aDb.deskripsi`, only when nonnull and nonempty; its text style is italic. There is no description field in the detail model.
3. `Persyaratan`: returned `persayaratan` (retain this API spelling).
4. `Waktu Penyelesaian`: returned `penyelesaian`.
5. `Keterangan Tambahan`: returned `keterangan`.
6. `Tarif`: returned raw `tarif` whenever nonnull. An empty String still retains the heading; this builder performs no currency conversion.
7. Conditional inline simulation widget, described below.

The three list sections use shared builder `0x8e5b74`. A null or empty list hides its entire section. Each retained entry becomes a numbered row, with an index-plus-one prefix followed by literal `.  ` (`0x8e5e30..0x8e5e70`) and unchanged String text. Blank list strings are not filtered. The list helper creates a list-backed integer-key map (`0x8e5d90`) before entry iteration; its shared map implementation is not independently re-audited in this bounded pass. Text construction is plain Flutter text in these builders; no HTML parser is invoked by this sequence.

The detail busy/error UI mirrors the list pattern. An error snapshot or null detail value shows `Gagal memuat detail layanan.`. Browser retry/caching/stale-response protections are reconstruction choices; this static evidence does not observe runtime navigation or back behavior.

## Simulation boundary

The detail page condition is **`tipeSimulasi != null && tipeSimulasi != 0`** (`0x8e5a0c..0x8e5a1c`). It then requires nonnull **returned** `bDb.layananId` and embeds `yDb` inline: the unboxed type is stored at `yDb+0xb` and the returned ID at `+0x13` (`0x8e5a44..0x8e5a5c`). This is a form container under the heading **Simulasi Biaya**, not a separate detail navigation action.

`_zDb` builds that heading and calls selector `0x8ed614`. The selector chooses form widgets `mDb`, `oDb`, `qDb`, `sDb`, `uDb`, `wDb` for types 1 through 6 respectively. Each receives the shared simulation controller; only `qDb` (type 3) additionally receives the selected returned ID in this selector. Other values return an empty form widget, although a nonzero unknown type can still retain the outer heading/result container.

This proof establishes inclusion and argument wiring. **The six forms' fields, validation, submit callbacks and result presentation remain unverified here.** Transport field names alone are insufficient to claim the simulations are complete. Full Unicode behavior, all navigator semantics and exact responsive/pixel equivalence also remain outside the audit. No geotag, physical-presence, activation or integrity bypass is part of this work.
