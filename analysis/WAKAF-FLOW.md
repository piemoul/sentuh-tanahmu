# Wakaf list, filtering and certificate-detail routing

The native Wakaf tab uses the same `GIb` certificate-list model and `YIb` row widget as the ordinary land-certificate list. Its selected `SertifikatId` therefore legitimately uses the existing analog/electronic detail routes. **Selection is disabled when `StatusEl == 1` and `StatusProses == 0`.** The web implementation should preserve that shared condition rather than treating every electronic row as selectable.

This is bounded static evidence from Sentuh Tanahku 6.1.5, ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. It reuses the local REA artifact identity, Blutter metadata and existing address-only dispatch table. No native UI execution, production requests, credential reads or bypasses were performed. This audit changed no frontend/backend code.

## Tab, request and response

Parent selection callback `0x95396c` chooses `gJb` at `0x953a44` and stores title **Wakaf** at `0x953a6c..0x953a70`. `gJb` CID 6181 creates `hJb` CID 5363 through dispatch index 59912 → `0xa01b58`; its initializer dispatch index 62102 → `0x7867e4` resolves the existing `qIb` controller, invokes `0xd450c8` at `0x78685c`, and registers text listener `0x786900` at `0x786874..0x786884`.

`qIb` controller `0xd450c8` reads the existing local user record and calls service builder `0xd452c0` at `0xd45168`. The account field at `+0xf` supplies `nik`, with native string `"0"` fallback when absent. This provenance does not authorize selecting another account's identifier.

| Contract | Evidence |
| --- | --- |
| GET `Legacy/GetSertipikatWakaf` | Endpoint load `0xd45344`, existing GET helper call `0xd45354` → `0x7017a4` |
| Query `nik`, no caller body | Key/value `0xd4531c..0xd45328`, query options `Ikc` at `0xd45350` |
| Direct JSON list of maps, no `data` envelope | Response `+0xb` load `0xd4536c`, List check `0xd453a0..0xd453ac` |
| Map each item to `GIb` CID 815 | Closure `0x7868a0` at `0xd453b4`; allocator `0xd450bc`; parser `0x785d5c` at `0x7868e4` |
| Publish `List<GIb>` | List materialization `0xd4541c`; controller observable `+0x1f`, set at `0xd451ec` |

The builder follows service `XIb+7 → FRb+7`, the existing main client, rather than the separate SPS viewer. The existing authenticated client transport boundary remains described in [CERTIFICATE-DETAIL-FLOW.md](CERTIFICATE-DETAIL-FLOW.md). No new endpoint or authentication strategy is inferred here.

## Exact model and null behavior

Parser `0x785d5c..0x7867ac` stores thirteen nullable fields. For the first eight, PascalCase wins unless its value is null; an empty string or zero does not fall back. The final five deliberately read the **same PascalCase key a second time** on null, so there is no lowerCamel alias. No default value is substituted. Wrong non-null types fail native type checks rather than being coerced or replaced with the alias.

| Preferred key | Null fallback key actually read | Type | Offset | Store |
| --- | --- | --- | --- | --- |
| `BerakhirHak` | `berakhirHak` | String? | `+7` | `0x785e28` |
| `JenisHak` | `jenisHak` | String? | `+0xb` | `0x785ef0` |
| `Nama` | `nama` | String? | `+0xf` | `0x785fb8` |
| `Nomor` | `nomor` | String? | `+0x13` | `0x786080` |
| `SertifikatId` | `sertifikatId` | String? | `+0x17` | `0x786148` |
| `ValidSampai` | `validSampai` | String? | `+0x1b` | `0x786210` |
| `ValidSejak` | `validSejak` | String? | `+0x1f` | `0x7862d8` |
| `StatusEl` | `statusEl` | int? | `+0x23` | `0x78639c` |
| `StatusProses` | `StatusProses` again | int? | `+0x27` | `0x786460` |
| `Dibagikan` | `Dibagikan` again | bool? | `+0x2b` | `0x786524` |
| `DibagikanSampai` | `DibagikanSampai` again | String? | `+0x2f` | `0x7865ec` |
| `ProsesInfo` | `ProsesInfo` again | String? | `+0x33` | `0x7866b4` |
| `StatusHT` | `StatusHT` again | String? | `+0x37` | `0x786774` |

For example, absent/null `StatusProses` remains null and does **not** satisfy the numeric-zero selection guard. A server value `statusProses: 0` alone is ignored by this native parser. The same model is used outside Wakaf, so this distinction also matters for ordinary certificate rows.

## Visible list and local search

`hJb` outer build `0x95910c` renders the text input **Cari nomor atau nama** (`0x959184`) and typed list body `0x9593b4`. The selected displayed row at index is read in `0x959c7c`; `0x959cd0` allocates shared `YIb` CID 6185, `0x959cd8` stores the `GIb` in widget `+0xb`, and `0x959ce0` stores false in widget `+0xf`.

`YIb.createState` dispatch index 59916 → `0xa016b0` allocates `ZIb` CID 5367. Shared row renderer `0x954c94` shows, in order:

1. `Nama ?? ""` (`0x954e24`).
2. `Nomor ?? ""` (`0x954f50`).
3. `JenisHak ?? ""` (`0x955070`).
4. Optional `StatusHT` when it differs from both `"-"` and `""` (`0x9551e4..0x955254`). Null falls through to a blank string display branch.
5. When `Dibagikan` is true, **Dibagikan sampai ** followed by the formatted `DibagikanSampai` (`0x955414..0x9554b0`).
6. `ProsesInfo` when non-null (`0x955638..0x955648`).

A side badge is **A** for null/zero `StatusEl`, otherwise **E** (`0x954cec..0x954d20`). No additional type badge is inferred from `JenisHak`. Shared date helper `0x955b24` returns an empty input unchanged, otherwise parses and formats with pattern `d MMMM yyyy`, locale `id_ID`. The null share-date branch constructs a runtime date through `0xcd0988`; its precise current-time/zone semantics were not resolved here. A web missing-date placeholder is a deliberate difference, not server-provided data.

Search listener `0x786900` → setState closure `0x78699c` lowercases the input through string dispatch selector `-4092`, without trimming. Predicate `0x786ac8` evaluates `lower(Nomor).contains(lower(query)) OR lower(Nama).contains(lower(query))`, in that order. It does not search `JenisHak`, ID, share flags or status text. Predicate addresses are `0x786af4`, `0x786b1c`, `0x786b4c`, `0x786b64`, `0x786b88`, `0x786bb0`. Native null assertions are present for `Nomor` and, when its check is reached, `Nama`; treating missing strings as empty in the browser is defensive behavior rather than exact exception parity.

String dispatch uses the same four entries and allowlisted ASCII lower-case mappings verified in [HT-DETAIL-UI.md](HT-DETAIL-UI.md). Full Unicode equivalence to JavaScript remains unverified. List order is preserved by the local filter; no sort is attached in the bounded filter.

The empty-list presentation uses the certificate empty image plus **Belum ada sertipikat**, **Anda belum melakukan pengurusan sertipikat**, and **Coba Lagi** (`0x9596c0`, `0x9597a0`, `0x959884`, `0x959a18`). Loading subscribes to controller `+0x43`. Complete widget color, spacing and animation parity were not tested.

## Row action, guard and legitimate detail reuse

The row creates its navigation-enabled flag at `0x954d24..0x954d48`. ARM64 compares tagged `StatusEl` against `2` (Dart integer **1**), then checks whether tagged `StatusProses` is zero. The flag is false only for `(StatusEl == 1 && StatusProses == 0)`. Tap closure `0x955bcc` checks this captured flag at `0x955c14` and returns without navigation when false. This is a shared `YIb` rule, applying equally to the ordinary and Wakaf list.

For an enabled row, `0x955a3c..0x955a4c` installs the tap callback, which invokes a shared action wrapper `0x6bd5d0` with continuation `0xdbcde0`. That continuation passes route builder `0x955cd4` to navigation helper `0x6ba6fc`. The generic action wrapper's logging/telemetry behavior is outside this audit; the presence of this wrapper is not permission to invent tracking calls in the webapp.

The existing route builder reads the selected `GIb.SertifikatId` at `+0x17`, never `Nomor`, and asserts non-null before constructing either destination:

| Native branch | Destination | Existing request mapping |
| --- | --- | --- |
| `StatusEl == null` or `StatusEl == 0` | `OIb` / `PIb`; ID stored widget `+0xb` at `0x955d80` or `0x955df4` | GET `legacy/GetInfoSertifikat?sertifikatId=<selected ID>` |
| Nonzero integer `StatusEl` after the click guard | `QIb` / `_RIb`; ID stored widget `+0xb` at `0x955f68` | GET `Brankas/DetailSertipikatNew?id=<selected ID>` |

Both branches preserve the native share flags/date context; the electronic branch additionally derives its existing `JenisHak`/`StatusHT` context. Lifecycle and endpoint proof is reused from [CERTIFICATE-DETAIL-FLOW.md](CERTIFICATE-DETAIL-FLOW.md), with electronic context documented in [ELECTRONIC-CERTIFICATE-UI.md](ELECTRONIC-CERTIFICATE-UI.md). No Wakaf-specific detail endpoint is needed or proven.

## Other native actions and refresh discrepancy

- **Search:** local filtering only, as above.
- **Coba Lagi:** callback `0x959c1c` calls Wakaf controller `0xd450c8` at `0x959c58`, reusing `Legacy/GetSertipikatWakaf`.
- **Pull to refresh:** the callback wired at `0x9595bc` is `0xdbcfa4`. It calls `0xd44a08(true)` at `0xdbd008`, whose service builder is `0xd44d10` and endpoint is **`Legacy/SertifikatTanahNew`**, with `nik` and `tipeuser` (`0xd44dc0`). That shared operation writes the ordinary-list controller observable `+0xf`; the Wakaf body subscribes to `+0x1f`. This static mismatch is not silently relabelled as a Wakaf read. Reloading the Wakaf endpoint in the webapp is a deliberate correction; runtime behavior of this native mismatch is unobserved.
- **Row selection:** guarded shared certificate detail route, as above.

No additional upload, location, submission, deletion or custom row-menu callback is present in the bounded tab/row builders. Actions inside the destination detail screens are governed by their separate audits, not declared covered by this list audit.

## Validation and limits

Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_wakaf_flow.py`. The validator binds the artifact hash, bounded source hashes and exact instructions, thirteen field key/type/store bindings, selected lifecycle/string dispatch entries, and the shared navigation predicate. The machine-readable ledger is [recovered/wakaf-flow.json](recovered/wakaf-flow.json).

Answered: exact response shape/model, key casing and nullable types, tab/list titles, row bindings, search predicate, selected-ID route, tap guard, and bounded action inventory. Unknown: current server acceptance or account entitlements, nonempty live Wakaf data, full Unicode/date behavior, generic telemetry-wrapper effects, native refresh runtime outcome, and pixel-level/device behavior. Static evidence does not establish end-to-end production parity.
