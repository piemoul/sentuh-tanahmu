# Queue booking dates — bounded native follow-up

The booking picker supplies a lower bound of **local now at picker opening minus exactly 24 hours**, and supplies **no upper bound**. Its date gate compares instants, including time of day; it does not normalize that lower bound to midnight. The request date pattern is `yyyy-MM-dd` on Continue, confirmed date selection, and refresh, but each reads a different source of date state.

This is a static follow-up to [QUEUE-BOOKING-READS.md](QUEUE-BOOKING-READS.md). It leaves that ledger unchanged. Target: `id.go.bpn.sentuh` 6.1.5 ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. The REA workflow reused existing local ELF, pool, dispatch and saved evidence. No network, credentials, booking POST, OTP, socket protocol, application change, or native runtime execution was involved.

The frozen [ledger](recovered/queue-booking-date-followup/flow.json) SHA-256 is `6ddad19ee83564af87a297178d014e5f39b8832ef630eec8db5d9a1e95284c15`. [Verification](recovered/queue-booking-date-followup/verification.json) passes **24 sources, 3,599 exact ELF instructions, 81 decisive markers, 63 pool bindings, 17 dispatch entries, seven dependency hashes**, and the two public duration records. Only ledger-listed `.proof.asm.txt` files are canonical; `.explore.asm.txt` files are working material.

## Actual picker arguments and gates

`d8a3b0 → d8a500 → 889228` binds the booking caller to `RSb` CID 6130 / `_SSb` CID 5313:

| Value | Caller input | Picker field |
|---|---|---|
| Initial selection | `_Lzb+0x1f` selected DateTime | `RSb+0xb` |
| Lower bound | Fresh local now minus Duration `86,400,000,000` microseconds; named `tpj` | `RSb+0x17` |
| Upper bound | Named `spj` omitted, default null | `RSb+0x1b` |
| Calendar data | Existing calendar subject; named `rpj` | `RSb+0xf` |
| Permit holiday selection | Boolean false | `RSb+0x23` |
| Selection callback | Closure `889334` | `RSb+0x13` |

`8892d0` subtracts Duration microseconds from DateTime microseconds and preserves its local/UTC flag. At `7cf394`, a date is allowed unless it is strictly before the nonnull lower bound or strictly after the nonnull upper bound. Equality is allowed. Dispatch to `b90b98` and `b94318` closes the strict microsecond `<` / `>` semantics; the shared getters are pinned. `7cef20` initially clamps an out-of-range selection to the corresponding bound.

The grid constructors at `9d2c80`, `9d2e24` and `9d2fa0` supply local flag false and zero hour, minute, second, millisecond and microsecond. Therefore the ordinary-day effect is selectable dates from today onward. **`min=today` is an approximation, not exact proof of equivalent behavior**: precisely midnight, timezone transitions, and a picker left open across midnight can differ from the captured `now − 24h` lower bound.

Cell builder `9d30f8` attaches an on-tap callback only when the cell belongs to the displayed month, passes the range gate, and has no matching calendar holiday while the permit-holiday flag is false. Matching compares year, month and day via `7cf5ec`; the holiday types are exact Strings `'1'` and `'2'` (`9d3818`). There is no fixed Saturday/Sunday rule in this cell gate. Holiday information comes from supplied calendar entries, not from the weekday alone.

The month gate `9d3de0` compares first-of-month values for the candidate and each nonnull bound. The booking caller's upper bound is null. This closes the supplied date predicate, not all behavior of the separate year/month selector or platform DateTime extremes.

## Initial holiday selection and confirmation

After clamping the supplied initial selection, `_SSb.init` (`7ced00`) subscribes to the calendar subject's first value when holiday selection is disallowed. If that list marks the selected date as type `'1'` or `'2'`, the callback runs `7cf1dc`:

1. Starting from the initial selection, add exactly one 24-hour Duration per iteration.
2. Accept the first candidate that is not a matching holiday and passes the bound gate.
3. If the candidate is strictly later than initial selection plus **365 exact 24-hour days**, return the original initial selection clamped to the bounds.

The public pool records are `0x14b28 = 86,400,000,000` microseconds and `0x43940 = 31,536,000,000,000` microseconds. This search can return a valid candidate at exactly day 365. Its 365-day cap is **not a maximum selectable date**.

Automatic advancement and cell taps update the picker's `_Roj` (`_SSb+0x13`) only. The “Pilih” closure `9d1f28` calls the supplied callback with `_Roj`, then closes the picker with that value. That callback updates the parent date and requests availability. The confirmation window does not repeat the cell range/holiday gate, and the bounded search can fall back to the original clamped date. Do not claim the confirmation path independently guarantees a nonholiday date.

The picker predicates use direct DateTime parsing for calendar strings containing `T`, otherwise an explicit `yyyy-MM-dd` parser. Their general malformed-input and locale behavior was not expanded in this follow-up. A calendar failure, stale calendar year, or parser failure must not be described as a proved complete holiday calendar.

## Request date provenance and midnight alignment

| Event | Exact source of `tanggal` |
|---|---|
| First Continue | Builder `885e20` constructs DateFormat `yyyy-MM-dd`, samples local now, formats at `885eb0`, and captures the String at context `+0xf`. Click `d89970` reuses that captured String at `d899e4`. |
| Confirmed picker selection | Callback `889334` passes its selected DateTime to parent state at `8894ac`, formats that callback argument at `8893e0`, then invokes availability at `889428`. |
| Refresh | Loads current parent `_Lzb+0x1f` at `889728`, formats at `889734`, and invokes availability at `889744`. |

The second page's state constructor independently samples local now (`9f84f4 → 9f8510`); it does not copy the first page's captured request String. A midnight rollover or a stale first-page builder can therefore leave the first fetched availability and second-page displayed date temporarily different. A web implementation can deliberately keep request and selected date synchronized, but must describe that as a lifecycle adaptation instead of claiming identical native capture timing.

The pattern is date-only. No UTC conversion is implied; constructing it with `toISOString().slice(0,10)` can shift the selected local day. Exhaustive Intl locale, digit, parser, DST and extreme-year parity remains outside the certified contract. This audit also does not prove automatic cross-year calendar refetch or current server acceptance of dates.

Offline reproduction:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/build_queue_booking_date_followup.py
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_booking_date_followup.py
```

The builder refuses to replace differing frozen artifacts. The verifier checks source hashes against ELF disassembly, marker lines, pool-load addresses, duration records, saved dispatch and dependency hashes. It does not certify unreviewed controls or runtime execution.
