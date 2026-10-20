# Hak Tanggungan: list-to-detail flow, APK 6.1.5

This bounded static audit proves that tapping a Hak Tanggungan list row opens the native **Daftar Sertipikat** screen and requests `legacy/GetSertipikatHTDetail?haktanggunganId=<selected row ID>`. The response is a direct list of certificate models, not a `data` envelope and not a full HT summary object.

Target: `id.go.bpn.sentuh` 6.1.5, ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Evidence is local ARM64 disassembly, existing Blutter class metadata and the existing address-only dispatch table. REA archive/ELF identity and limitations remain in [rea/README.md](rea/README.md). No target UI was executed, no production request was made, and no credentials or embedded identity values were exported.

## Proven route

| Stage | Static evidence | Result |
| --- | --- | --- |
| List read | Builder `0xd44110`; wire call `0xd441a4` | GET `legacy/GetSertipikatHT`, query `nikr`; direct response list mapped by `0x784ba0` to `vIb` |
| Select row | Builder closure `0x9568c0`, row builder `0x956938` | Index into displayed state list at `0x956914`; retain selected `vIb` in callback context at `0x95696c` |
| Attach tap | `0x956d44` / `0x956d54` | Row attaches closure `0x956e10` |
| Read selected ID | `0x956e5c..0x956e88` | Load `vIb+7`; if null use `""`; store in new `cJb+0xb` |
| Navigate | Widget allocator `0xdbcefc`; navigation call `0x956e94` → `0x6ba6fc` | Destination class `cJb`, CID 6183 |
| Create state | Dispatch index 59914, selector 49635 | `cJb.createState` → `0xa017f8` → constructor `0xa01840`; state allocator `0xde57e4` is CID 5365, `dJb` |
| Initialize | Dispatch index 62104, selector 52643 | `dJb.initState` → `0x7852ec` |
| Fetch selected detail | `0x7853a4..0x7853c8` | Read state controller `+0x13`; read widget `+0xb`; pass ID into controller `0xd444d0` |
| Read service | `0xd44500..0xd4450c` | Controller `+0x5f` service; invoke `0xd44648` with selected ID |
| Request | `0xd446a4..0xd446dc` | GET `legacy/GetSertipikatHTDetail`, query key exactly `haktanggunganId`, no caller body |
| Parse | `0xd446f4..0xd447a4` | Response `+0xb` asserted `List`, each item parsed by closure `0x785410` / parser `0x785470`, materialized `List<wIb>` |
| Publish | `0xd44538..0xd44570` | Successful result data `+0x13` published into controller detail-list observable `+0x1b` |
| Render | Outer build `0x956eb0`, combine `0x956fec` | Title `Daftar Sertipikat`; subscribes to error `+0x3b`, loading `+0x43`, detail-list `+0x1b`; builder `0x9570b0` |

The selected identifier is **not** `NomorHT`, `TahunHT`, `Nikr`, a displayed index, or a certificate `NomorHak`. Native null-ID fallback is an observed behavior; it does not establish that an empty ID is accepted by the server. The existing web nonempty-ID check can remain a deliberate defensive difference.

## List model and card

`vIb` CID 818, parser `0x784c00..0x78501c`, accepts five nullable strings. Each PascalCase property is read first; only a null result causes the lowerCamel fallback. An empty string therefore takes precedence over the fallback.

| Offset | Preferred key | Null fallback |
| --- | --- | --- |
| `+7` | `HaktanggunganId` | `haktanggunganId` |
| `+0xb` | `NomorHT` | `nomorHT` |
| `+0xf` | `TahunHT` | `tahunHT` |
| `+0x13` | `Nilai` | `nilai` |
| `+0x17` | `Nikr` | `nikr` |

The list card `0x956938..0x956d9c` displays `(NomorHT ?? "-") + "/" + (TahunHT ?? "-")`, followed by formatted `Nilai ?? "0"`. It does not bind a `Nama` or `Nomor` property. Helper `0x956d9c` passes symbol `Rp`, locale `id_ID`, and explicit zero under obfuscated parameter `zvi` to formatter `0x89df68`, parses the string at `0x956dec`, and formats at `0x956df8`. Exact formatter whitespace and the semantic name of `zvi` were not traced here.

## Detail model, display and action boundary

The independently verified [HT-DETAIL-UI.md](HT-DETAIL-UI.md) and its ledger own full parser/UI/search evidence. Detail `wIb` CID 817 has nullable-string fields `HaktanggunganId`, `Nama`, `NomorHak`, `Nibel`, `JenisHak`, each with the corresponding lowerCamel null fallback. The route itself supplies only the selected HT ID; list-card amount and year are not passed into this screen.

The bounded action inventory is:

- Search text is a local filter over the already fetched detail list: lowercase query without trimming; `contains` on `Nama`, `JenisHak` or `NomorHak`. `Nibel` is not searched. The initial lifecycle registers listener `0x78588c` after initiating the detail read.
- Standard page navigation/back belongs to the shared page chrome. No HT-specific back submission is present in the traced entry/build functions; the generic navigation stack implementation is outside this audit.
- Rows display name, `NomorHak ?? Nibel ?? "-"`, and type, with badge A when `NomorHak` is non-null and E otherwise. The UI audit finds no row tap callback, secondary detail navigation, download, upload, refresh, geotag or mutation action in `0x9575a8..0x957c1c`.
- The screen's success/empty branch retains search; native empty content is an unlabelled empty widget. Error text is `error!`; the loading branch uses the native `mTb` loading widget. These are display branches, not new server requests.

This is a bounded native-screen action inventory, not proof that every action anywhere in the application is read-only.

## Client and error handling

Constructor `0xa01840` resolves existing `FRb`, stores it in `XIb+7`, then creates `qIb` at `0x709368` and stores it in state `+0x13`. `qIb` stores `XIb` at `+0x5f` (`0x709954`). The detail builder follows `XIb+7 → FRb+7`, then calls the existing GET helper `0x7017a4`. This is the same main client boundary established in [CERTIFICATE-DETAIL-FLOW.md](CERTIFICATE-DETAIL-FLOW.md); this audit does not decode or change authentication material.

The request wrapper maps successful data into tuple `yVb(false, "Success!", List<wIb>)`. Known service-error and generic-error branches return an error tuple; generic text is `Terjadi Kesalahan!`. The controller checks tuple `+0xb`, updates the detail list on success, or sets its error observable `+0x3b` true and message observable `+0x3f` on failure. Both completed branches set loading `+0x43` false. A static parse does not prove the current server accepts any particular account or ID.

## Verification and remaining limits

Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_ht_detail_flow.py`. The validator binds the ELF hash, immutable bounded excerpt hashes, exact selected instructions, class IDs and two lifecycle dispatch entries. [recovered/ht-detail-flow.json](recovered/ht-detail-flow.json) contains the machine-readable flow and evidence ledger. UI and search semantics have a separate validator described in the UI report.

Answered: selected source field, row callback binding, destination widget/state, lifecycle fetch, query shape, direct-list response consumption, primary renderer entry, and the bounded screen action inventory. Remaining unknowns: live nonempty account data, current production acceptance, native runtime appearance/scroll behavior, complete common-navigation semantics, exact currency formatter defaults, and broader cross-feature behavior. No claim of runtime end-to-end parity follows from this audit.
