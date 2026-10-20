# Booking read prerequisites — bounded native contract

The saved APK proves three Directus GETs for the path from **Kantor Pertanahan → Lokasi Kerja → tanggal → loket availability**. It also calls the existing **main-client calendar read POST**. There is no separately proved service or time-slot GET in the reviewed path. This is a static prerequisite contract, not a completed booking implementation or evidence of server acceptance.

Target: `id.go.bpn.sentuh` 6.1.5, ARM64 Dart 3.12.2 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. The REA workflow reused the unpacked ELF, Blutter pool and frozen prior ledgers. No network, account data, credential derivation, OTP, booking, application edit, registry change, or deployment occurred.

Evidence is frozen in [flow.json](recovered/queue-booking-reads/flow.json), SHA-256 `8315a810bd17a7bfd138bbf843fa4ddcbf657cb00d228ab6cc493e466d5374be`. [Verification](recovered/queue-booking-reads/verification.json) passes **25 source hashes, 5,689 exact ELF instructions, 91 decisive markers, 252 public pool bindings, 24 dispatch entries, and 16 dependency hashes**. These counts concern the selected windows, not complete application coverage. Exploratory files in the same directory are historical working material; only the ledger-listed `.proof.asm.txt` files are canonical evidence for this audit.

## Requests and the two office IDs

| Read | Native caller/service | Exact request inputs | Client and response |
|---|---|---|---|
| Office options | Init `72dbf4 → d1f7e8 → d1f9ac`, GET at `d1fa00` | Literal `items/kantor?limit=1000&sort=nama`; no additional caller query | `FRb+0xb`; `body.data` must be a **nonempty List**, every item parsed as `jyb` |
| Location options | Office selection `887290 → d89ee4 → d8a048`, GET at `d8a0dc` | `items/lokasi`, query `filter[kantor] = selected jyb.id` | `FRb+0xb`; `body.data` must be a **nonempty List**, every item parsed as `mzb` |
| Loket availability | Continue `d89970 → d89a54 → d89c04`, GET at `d89cb4`; date change `889334` and refresh `889690` call the same controller | `api/antrian`, query `lokasi = selected mzb.id`, `tanggal = yyyy-MM-dd` | `FRb+0xb`; nullable Boolean `error` defaults true; only false reads required List `data`; **empty List is successful** |
| Calendar read prerequisite | `Kzb/_Lzb` init `72de04`, call `72df40 → d210d4 → d2127c` | POST `KantorNearby/GetCalendar`, form `kantorId = selected jyb.kantor_id`, `tahun = DateTime.year.toString()` | **`FRb+7` main client**; reuse the frozen calendar service/FDb envelope contract |

`jyb.id` and `jyb.kantor_id` are separate returned String fields. Office selection stores the former at `_Jzb+0x27`, used for the location filter, and the latter at `_Jzb+0x23`. Navigation copies `kantor_id` to `Kzb+0x13`, which init passes **directly** to the calendar controller. Unlike the nearby-office calendar path, this caller does **not** invoke decrypt helper `760034`. A future adapter must not pass this already-direct ID through the nearby ciphertext decoder. Null selection/office IDs fall back to `''` in these callbacks; that is native behavior, not evidence that the server accepts an empty ID.

All three Directus service windows load wrapper `+7 → FRb+0xb`. Their origin, bundle-only Authorization provenance, Dart/Flutter User-Agent, GET body/header construction, MIME gate, query encoding and retry behavior are inherited from [queue transport](QUEUE-TRANSPORT-FLOW.md), [String query encoding](QUEUE-READ-FOLLOWUP.md), and [interceptors](QUEUE-INTERCEPTOR-FOLLOWUP.md). The initial origin is `https://aplikasi.atrbpn.go.id/konsol/antrian/directus/`. These callers' path literals have **no trailing slash** after the endpoint. No server redirect behavior was observed in this audit. Main-account credentials must remain on the main-client calendar path.

The office and location services inspect `body.data` without consulting `body.error`. A missing, non-List, empty, or unparseable item list reaches `(true, [])`; a valid nonempty list reaches `(false, parsedList)`. The nonempty dispatch is pinned for list CIDs 90–92. Availability instead defaults null `error` to true, requires Boolean for a nonnull value, and reads data only when false. Data must then be a List; its elements must be `Map<String,dynamic>`. `error:true` and exceptions return a failure tuple with `ozb([])`. Its controller converts failure to a null payload and clears busy without publishing new availability; prior subject data can therefore remain.

## Exact native model fields

No alias or general String coercion occurs in these parsers. The duplicated obfuscated names are disambiguated by class ID and module.

| Model | Field | Native type/default | Offset |
|---|---|---|---|
| `fYn.jyb`, CID 834 | `id`, `nama`, `kantor_id` | `String?`, retained as null | `+7`, `+0xb`, `+0xf` |
| `gYn.mzb`, CID 726 | `id`, `kantor`, `nama`, `alamat` | `String?`, null becomes `''` | `+7`, `+0xb`, `+0xf`, `+0x13` |
| `hYn.ozb`, CID 724 | aggregate list | Input List maps each item to `nzb`, retains order | `+7` |
| `hYn.nzb`, CID 725 | `id`, `nama` | required String | `+7`, `+0xb` |
| `nzb` | `deskripsi`, `nomor` | `String?` | `+0xf`, `+0x13` |
| `nzb` | `jumlah_antrian_total`, `jumlah_antrian` | `int?`, null becomes 0 | `+0x17`, `+0x1f` |
| `nzb` | `jam_buka`, `jam_tutup` | null retained; otherwise required String → `DateTime.parse` → local DateTime | `+0x27`, `+0x2b` |
| `nzb` | `status` | `int?`, null becomes 0 | `+0x2f` |
| `nzb` | `estimasi` | `num?` converted to double; null becomes 0.0 | `+0x37` |
| `nzb` | `estimasi_message` | `String?` | `+0x3f` |
| `nzb` | `is_available` | `int?`, null becomes 0 | `+0x43` |

Parser windows: office `72dc50–72de04`, location `88744c–8876e4`, aggregate/loket `886018–886850`, all end-exclusive. The calendar model remains `FDb` from [office services](OFFICE-SERVICES-FLOW.md). Its calendar `kantorId` transform is caller-specific: the earlier office ledger describes the nearby caller, while this ledger proves the direct booking caller above.

The native integer fields can exceed JavaScript's safe integer range. A future raw parser must preserve their meaning instead of silently rounding. Date parser leniency, unusual timezone inputs, overflow, and all browser formatting edges have not been certified here; any narrower web guard must be documented as an adaptation.

## Navigation, local state, and display

`Izb` CID 6287 / `_Jzb` CID 5464 is the first step. Its init starts the previously audited managed-identity loader, office load, and profile-related work. It does not await the identity future at this init site. Reuse [the identity lifecycle contract](QUEUE-IDENTITY-FOLLOWUP.md), rather than creating a new identity from a display label or arbitrary NIK.

The office picker is labelled **Kantor Pertanahan**, and the location picker **Lokasi Kerja**. Options retain their full model as values. Office selection updates office text, stores both IDs, clears location text and address, and requests locations. The reviewed callback does not itself clear the prior `_Jzb+0x1f` location ID; the emptied location text participates in the Continue gate. A web implementation may clear all downstream selection state to prevent stale requests, but should label that as its lifecycle guard. The location controller clears its option subject before requesting new options.

The office option helper matches `jyb.kantor_id` against profile field `+0x3f` and invokes list search/removal/insertion helpers around `887804–887840`; the matching option also receives a Boolean marker. This supports prioritization of a profile-associated office, but the complete generic helper semantics and visual meaning of that marker are not independently closed in this audit. It is not proof of filtering other offices out.

Location selection copies `nama` into the location text, `alamat` into `_Jzb+0x2b`, and `id` into `_Jzb+0x1f`. The **Lanjut** builder requires a nonempty managed identity list and nonempty office/location text. It formats local current time as `yyyy-MM-dd` during button construction and captures that value. The click awaits availability and navigates only when its returned error flag is not true.

`Kzb` CID 6286 / `_Lzb` CID 5463 receives the same queue controller, location ID, direct `kantor_id`, selected identity and display values. The selected date initializes from local now; the document amount initializes to 1. Initialization starts the calendar read for that date's year. Date selection updates the local selected date and invokes availability with the same location ID and newly formatted date; refresh uses the currently selected date. Exact picker minimum/maximum bounds and all selection affordances remain outside the closed contract.

Holiday checking is distinct from the office calendar's description list. `7464ac → d21d50` matches year, month and day and requires **exact String `tipeLiburId` equal to `'1'` or `'2'`**. Null date or parse exceptions yield false. Dates containing `T` are parsed directly; otherwise the predicate appends `T00:00:00` before `DateTime.parse`. A holiday switches the loket region to the native closed-day message. This audit does not certify all malformed-date leniency.

Availability rows are indexed in response order (`88976c`). Display bindings include:

- **Total Antrian** = `jumlah_antrian_total`.
- **Sisa Antrian** = `jumlah_antrian` directly; the client does not calculate a subtraction here.
- **Antrian Saat Ini** = `nomor`, with `'-'` for null.
- **Status** = `Buka` only when integer `status == 1`; otherwise `Istirahat / Tutup`.
- Description and `estimasi_message` use `''` for null.

The row holds returned `jam_buka`, `jam_tutup`, `estimasi` and `is_available`; these do not establish an independent selectable time-slot endpoint. `is_available == 1` and false local busy state are necessary to attach the **Ambil Antrian** callback (`889a88–889abc`). That callback enters booking-related work and is deliberately outside this read-only contract. No booking-limit POST, creation POST or OTP flow was enabled or tested.

## Remaining boundaries and implementation handoff

The smallest supported next implementation is a read-only preview: load office options; select an actual returned office; load its locations; select an actual returned location; request date-specific aggregate availability; render returned lokets in order. Track request generations for office/location/date independently, clear dependent selection state when an owner changes, and keep main-account calendar authorization separate from Directus bundle authorization. These lifecycle and ownership controls are web adaptations, not claims that the original Flutter app has identical race protection.

The second-step init additionally calls `d1fc68` with the selected location ID. The bounded window shows websocket setup, a `Cookie` header name, and `roomMessage` registration. No cookie value, handshake, event schema, update lifecycle, cleanup or socket origin behavior was recovered here. A GET preview cannot claim realtime parity until that separate boundary is proved. No independent service/time selector GET was found in these reviewed paths; this is a bounded observation, not a global absence claim.

Server acceptance, current response shapes, complete booking navigation, authorization/eligibility decisions, picker bounds, booking-related POST semantics and complete socket behavior still require their own evidence. Static bundle provenance is not proof of server permission. The audit leaves all runtime source and existing ledgers unchanged.

Reproduction, entirely offline:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/build_queue_booking_reads.py
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_booking_reads.py
```

The builder refuses to replace differing frozen files. The verifier checks exact ELF disassembly, hash-pinned dependencies, pool loads and saved dispatch entries; it neither reruns the whole historical audits nor certifies unreviewed code.
