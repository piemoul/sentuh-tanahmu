# Booking selection and response follow-up

This closes office default/preference bindings needed for the three read-only booking prerequisites. The original [booking-read ledger](recovered/queue-booking-reads/flow.json) remains frozen. Models and shared picker internals already proved there or in [CariBerkas office evidence](recovered/searchfile-office/office-picker-flow.json) are reused, not relabelled as newly audited code. Date findings are in the independent [date follow-up](QUEUE-BOOKING-DATE-FOLLOWUP.md).

The new [ledger](recovered/queue-booking-selection-followup/flow.json), SHA-256 `d02f2494bf36811fc454f018d18a1b422324fa5ef948922cc7e0018bbab4e270`, and [verification](recovered/queue-booking-selection-followup/verification.json) bind **4 new source files / 1,036 ELF instructions / 21 markers / 23 pool bindings / 16 dispatch entries**, plus **31 dependency hashes and 48 dependency markers**. Dependency counts are not additional newly checked ELF instructions. Target ELF SHA remains `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No network, credential derivation, runtime edits, booking or OTP occurred.

## Initial office selection and profile precedence

`_Jzb` constructor `9f826c` initializes location ID `+0x1f`, canonical office ID `+0x23`, and queue office ID `+0x27` to empty String. Both text controllers use their empty default. The office builder passes a null selected value while office text is empty (`8870d0 → 887170`). **A matching profile office does not automatically select it or load locations.**

The profile reader `d1f750` awaits the first existing `ayb?` value from `wCb+0x13`, then stores it at `_Jzb+0x37`. The field compared is exact account-summary `kantorId`, nullable String at `ayb+0x3f` (`755d64–755db8`). It is not a signin field and this method issues no new profile request. Office loading and profile reading start independently. The profile reader stores its result without invoking `setState`, so the exact moment the preference becomes visible remains dependent on later rebuild timing.

The options helper `88776c` copies the office list. If both profile and profile.kantorId are nonnull, it finds the **first exact** `jyb.kantor_id` match, removes that one element, and inserts it at index zero (`887804–887840`). Other rows, including later duplicate matches, remain in relative order. The list-search/removal/insertion helpers are already proved by the frozen CariBerkas office evidence.

Each option independently sets `CSb+0x13` from `jyb.kantor_id == profile?.kantorId`. Shared row `9cd22c` uses this Boolean to render an icon (`9cd408–9cd420`); it is not the selected option. Because both operands are nullable, a null ID can receive the icon when the compared profile ID is null, even though the reorder branch skips a null profile ID. Do not infer authorization or a chosen office from that visual flag.

Option labels are raw nullable `jyb.nama`; values retain the complete original object. Selection restoration uses raw `jyb.id` against `_Jzb+0x27`, only when office text is nonempty. The `MSb` open/callback chain (`a493bc–a496a4`) passes options into the shared `DSb/ESb` picker and returns an explicitly chosen row through the page callback. No automatic invocation of the selection callback occurs in these build/open windows.

Shared picker search is local: empty trimmed query retains the full options; otherwise lowercase label must contain the trimmed lowercase query. Native nonempty search asserts the nullable label nonnull. Null-safe browser labels and full Unicode casing/whitespace equivalence remain explicit adaptations/boundaries.

Selecting an office sets both ID variants, clears location text/address, and requests that office's locations. The old location ID is not itself cleared by the reviewed callback, though the empty text blocks Continue. A browser should clear the downstream ID and invalidate older responses as an explicit ownership guard. Queue office `id` supplies `filter[kantor]`; canonical `kantor_id` supplies the main-client calendar form directly, without nearby-office ID decryption.

## Response distinctions to preserve

| Read | Native envelope behavior | Failure/default behavior |
|---|---|---|
| Offices and locations | Inspect `data`; do not inspect `error` or `message`. Require nonempty List and parse every Map item. | Empty/missing/wrong data or one malformed item fails the whole service with an empty typed list. Office String fields retain null; location String fields default null to `''`. |
| Availability | Missing/null `error` defaults true; other values require Boolean. True skips data. False requires List; `[]` is valid success. Message is ignored. | One malformed row fails the whole service. Controller clears busy and returns failure/null without replacing prior availability subject. |
| Calendar read | Reuses `office-services`: Map body, nullable Boolean error, nullable String message and nullable integer metadata. Parse data before checking error. | Null data becomes empty list. Error false returns parsed list; true returns empty list; null asserts. Malformed data can fail even with error true. Controller failure returns empty list without replacing prior calendar subject. |

Availability `id`/`nama` require String. `deskripsi`, `nomor`, and `estimasi_message` allow null. Queue totals/status/is_available require nullable integers, defaulting null to zero; `estimasi` accepts nullable num, converts to double and defaults to 0.0. Nonnull `jam_buka`/`jam_tutup` require String, pass through native DateTime parsing and local conversion; an invalid value fails the entire service rather than being dropped. No aliases, arbitrary String coercion, partial-row filtering or automatic numeric rounding is proved. See the original ledger for exact offsets and parser windows.

HTTP success/MIME/redirect rules belong to the shared transport, not a new HTTP-200-only check in these services. These static contracts do not establish current server acceptance. A read-only browser can now use explicit office/location choices and date-specific availability while retaining documented number/date/null guards; booking POSTs, socket updates and complete runtime parity remain outside this scope.

Offline reproduction:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/build_queue_booking_selection.py
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_booking_selection.py
```
