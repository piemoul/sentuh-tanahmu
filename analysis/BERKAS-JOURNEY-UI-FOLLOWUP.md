# Perjalanan Berkas: positive native RAb renderer follow-up

This additive, bounded static audit follows the already proven journey-history destination into its actual renderer. It closes the input snapshot, display order, status selection, row text/date bindings, and empty-state behavior. No application/runtime file was changed and no request, account access, browser/native execution, or submission was performed. It is not an inline-map audit.

The supplied artifact is Sentuh Tanahku `id.go.bpn.sentuh` 6.1.5 ARM64, `libapp.so` SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. The earlier [BERKAS detail audit](BERKAS-DETAIL-UI.md) and [nested caller audit](BERKAS-NESTED-MAP-FOLLOWUP.md) remain unchanged. New evidence is [source-index.json](recovered/berkas-journey-ui-followup/source-index.json), with an [actual offline verification receipt](recovered/berkas-journey-ui-followup/verification.json).

## Exact entry and lifecycle

The existing detail binding `89bdd4 → 8a8a24 → 8a8a9c` opens `RAb`. It uses the selected primary ABb snapshot, not another identifier or endpoint:

| Destination field | Bound source |
| --- | --- |
| `RAb+b` | Main `ABb.nomor` converted to String, `8a8b10..8a8b40 → 8a8bb8` |
| `RAb+f` | Main `ABb.perjalananBerkas` list, null-asserted, each BBb copied, materialized, `8a8b54..8a8bac → 8a8bc0` |
| `RAb+13` | Main `ABb.statusBerkas` converted to String, `8a8acc..8a8afc → 8a8bc8` |

The BBb-copy callback `8a8be4` preserves `taskNodeGroupId`, `tanggalFlow`, `namaGrup`, and `isCurrent` at offsets `+7/+b/+f/+13`. It does not infer coordinates, a parcel ID, a document request, or a second history API. The adjacent `575254 → 5f746c` materialization preserves traversal order; the retained selected copy branch walks indices from zero upward.

`RAb` is CID5944, declared `extends sK`, with its existing const widget constructor; the row widget `_SAb` is CID5943. This destination uses the stateless widget build binding, not the State create/init selectors used by other screens:

| Function | CID / build selector | Dispatch index | Target |
| --- | --- | --- | --- |
| RAb build | 5944 / 48657 | 58697 | `a37504` |
| _SAb build | 5943 / 48657 | 58696 | `a37b3c` |

Allocator `d91278` independently binds RAb CID5944; `de7bdc` binds _SAb CID5943. No State initializer, automatic history fetch, or refresh request is introduced by this binding. Generic List constructor/subtype internals are not exhaustively audited; the normal typed BBb input and the selected materialization path are the bounded scope.

## Working list, order, and active index

RAb build obtains its typed working list via `4b80e0` at `a37540`. It performs no date sort, reverse, filter, deduplication, or server request. Duplicates and records with nullable fields remain separate rows in source order.

The exact String **`'0'`** status has an additional rule: `a37550..a375a0` constructs a blank BBb and inserts it at index zero. This placeholder has `taskNodeGroupId=''`, `isCurrent=false`, and null date/name fields. It is not a synthetic server task or the main `namaProfile`; the expanded renderer does not bind `namaProfile` here. Therefore source indices shift by one in this status case. Statuses other than exact `'0'` do not insert the placeholder.

The native active-index algorithm over that working list is:

1. Scan backward and use the **last** row whose `isCurrent` is exactly true (`a375a8..a37600`).
2. If none exists, scan backward for the **last nonnull, nonempty** `tanggalFlow` (`a37608..a37648`). Whitespace is nonempty; there is no trim or date-parse success test in this selection step.
3. If still absent and the working list is nonempty, use index zero (`a37654..a37668`). An empty list keeps index -1.

This differs from the collapsed detail summary, which has its own main-status/name-profile fallback. Do not reuse `berkasJourneyCurrent()` as the expanded-history active-index algorithm.

`a3777c → a37834` builds one row per working-list index and supplies:

- the exact BBb at that index;
- an ordinal `index + 1`;
- one of three native enum objects according to `index < active`, `index == active`, or `index > active`;
- `isLast = index == length - 1`.

The ordinal is an input to the marker renderer; it is not proof that every status renders a number. The future-state marker uses the ordinal as text, while the other state branches construct different markers. Connector helper `a386f0` omits its continuation for the last row. Styling also dims future-state text. Exact theme colors, painter strokes, icon identity, framework scrolling, and pixel equality were not dynamically established.

## Empty and row content

An empty working list calls `a37930`, which displays **`Belum ada aktivitas`** at `a37a50`. In particular, an empty original list with status `'0'` becomes one placeholder row and does not reach this empty-state branch.

The title is **`Perjalanan Berkas · ` + RAb+b** (`a37698..a376b4`). This supplied title component is the number String from the caller; the expanded title has no newly bound year suffix. Nullable number/status values are converted by the caller's ordinary object-to-String path. A browser dash fallback is an explicit robustness adaptation rather than the exact null conversion.

Each _SAb row displays:

| Display | Native binding |
| --- | --- |
| Main stage name | `BBb.namaGrup` (`+f`), null → `'-'`, `a37da0..a37dc8`. Empty String remains empty. |
| Optional date/time line | Only when `BBb.tanggalFlow` (`+b`) is nonnull and not the empty String, `a38004..a38034`. |
| Date portion | `a3848c → d910bc`, the previously audited `dd MMMM yyyy` helper. |
| Separator | Literal `', '` at `a38078`. |
| Time portion | `a38410 → d90d5c`; the latter creates the exact output pattern **`HH:mm`** at `d90d88`. |

The complete nonempty date line is `dateDisplay(tanggalFlow) + ', ' + timeDisplay(tanggalFlow)`. A null/empty date hides that line; it is not replaced by the stage name or raw JSON date. A nonempty invalid date still reaches both formatters, whose caught failures yield dashes. The time helper uses the same `d90ddc` ordered parser as the date helper, and catches failure to return `'-'` (`d90dc4`).

The shared [date proof](CERTIFICATE-DATE-FLOW.md) establishes six ordered input formats, the ordinary Indonesian locale initialization, local calendar construction, and the important timezone/punctuation limits. `HH:mm` is positively bound here, but this audit does not create a new `Date.parse()` rule or assert complete input equivalence. The shipped Dart formatter can be extended with this time pattern in a separately tested implementation; no formatter/runtime code was changed here.

`taskNodeGroupId` is retained in the snapshot but is not a visible text or navigation identifier in this renderer. The enum status is determined by the computed index, not directly by each row's `isCurrent` alone. No row-level download, edit, map, or request action is introduced by the retained build/callback binding.

## Eligible next implementation and verification limits

The current browser `berkasJourney()` uses an HTML expansion inside detail. A faithful next read-only improvement can open a separate child view from the current ABb snapshot, preserve its parent ownership and back state, and apply the expanded algorithm above. It needs no endpoint, extra ID input, GPS call, or original-server mutation. Browser session/disposal guards and pagination, if used, must remain explicit adaptations; all source rows must remain reachable.

This proof does not finish the overall 1:1 app goal, a native runtime test, exact marker/painter pixels, a booking workflow, the separately unresolved reported inline BERKAS map, or geotag/physical-presence behavior. The exploratory `769a5c` window came from applying an inapplicable State selector to a stateless class and is explicitly excluded; the actual RAb binding is the independently checked selector48657 above. Bytes before `a37504` are neighboring login UI and are also excluded from RAb function claims.

Offline reproduction, with no writes:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/berkas-journey-ui-followup/verify_sources.py
```

The actual verifier passed 43 source pins, 13 retained windows, 2,748 instruction occurrences / 2,647 unique instructions against the same ELF, 34 decisive markers, and two exact dispatch bindings. Retained-window counts include immutable adjacent exploratory bytes; the machine-readable function intervals distinguish the positive RAb/row claims. Existing BERKAS/date ledgers and source files remain unchanged.
