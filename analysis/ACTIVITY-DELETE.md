# Aktivitas: native delete action

This bounded static audit proves a separate delete control on every built Aktivitas card, its confirmation, one-field multipart request, and the current-list changes after awaiting that request. **The native controller ignores the service's Boolean result: ordinary HTTP or network failure still removes matching activities from its local lists.** That local disappearance does not prove server deletion.

The APK, pool, previous activity audit, dispatch table and inherited authentication/multipart proofs are pinned. No Android runtime, account request, network call, production mutation or application edit occurred.

## Entry, card and confirmation

The existing `Syb/_Tyb` activity page uses `Pyb` (CID 743). Its filtered list supplies the exact `Qyb` (CID 835) model to the common `Uyb` (CID 5951) card at `0x87e874..0x87e96c`. A separate trailing size-22 icon creates a `Dca` control at `0xa327e8`, with callback `0xa32cc8` stored in its `+0xf` slot at `0xa32814`. The outer card's navigation callback is stored separately at `0xa3294c`.

There is no type, platform, status, nonempty-ID, content-ID, ownership or permission check around this delete control in the complete inspected row and card builders. It applies to all currently filtered cards, including the existing categories **Semua, Berkas, Bidang, Antrian, Scan, Login, Penandaan Lokasi and Lainnya**. Those category definitions and routing remain bound to the unchanged prior [activity ledger](recovered/activity-flow.json). Account/session headers come from the ordinary main client; server authorization is not established by this audit.

The `Dca` allocator proves CID 6050, extending `Aca` CID 6049. `_Cca` creates handler `0x7de2fc` when the widget's `+0xf` callback is nonnull and supplies it to the generic control at `0x7dd9a0`; handler `0x7de334` invokes that callback at `0x7de54c`. This is the dedicated tappable control, with no activity-specific long-press or overflow-menu path. Exact gesture-arena timing, keyboard activation and overlay hit testing remain unobserved.

The card busy Boolean is **navigation busy index equals this filtered row index OR deleting ID equals this row's userActivityId**. `Uyb+0x13` adds a spinner overlay over the card at `0xa329b8..0xa32ab8`; it does not replace the delete callback with null. Duplicate IDs share the deleting-ID overlay. Neither the delete callback nor controller adds an in-flight guard.

| Confirmation property | Native behavior |
| --- | --- |
| Open | `0xa32cc8 → 0xa32d30`, through generic dialog helper `0x726368` |
| Copy | `Hapus ${row.title}?`, direct title `+0x1b` interpolation |
| Title normalization | The model parser turns missing/null title into `''`; no extra `item ini` fallback, trim or blank rejection |
| Buttons | **Batal**, **Hapus**, both always bound in the complete dialog builder |
| Cancel | `0x728800 → 0x7257e8`, generic back only; no controller or request |
| Confirm | `0xde6914` reads clicked model `userActivityId+7`, calls `0xde69ec`, awaits it, checks mounted context, then generic back at `0xde69d8` |
| Busy/result UI | No dialog-local busy, disabled-confirm, success toast, response message, retry or extra result dialog |
| Ordinary close | Both service true and false reach the same normal close; an escaping controller exception does not guarantee close |

The caller supplies only builder/context, with no named options. Helper `0x726368` defaults absent obfuscated option `Aad` to true at `0x7263cc` and `tad` to null at `0x72641c`. The semantic names of those options and the complete barrier/back-dismissal behavior are intentionally not certified.

## Identifier and request

The exact typed parser is included, rather than inferring identifier behavior from generic request contracts. At `0x729e48..0x729eac`, missing/null `userActivityId` becomes empty String before the String type check. A wrong nonnull type fails. The parsed value is stored in `Qyb+7` at `0x72a24c` and the selected card supplies it directly at `0xde6974`. Empty and whitespace IDs remain unchanged. The delete flow does not use `contentId+0x17`, a display index, title or activity type, and does not look up a second cached row.

| Request property | Proven value |
| --- | --- |
| Operation candidate | `post-activity-deleteuseractivity-de6c94` |
| Method/path | **POST `activity/deleteUserActivity`**, callsite `0xde6c94` |
| Encoding | `multipart/form-data`, `iP` CID 3744 FormData |
| Exactly one field, in order | `userActivityId`: selected typed model's exact String |
| Files/query | None in this call |
| Caller headers/options | None beyond ordinary main-client defaults/interceptors |
| Client | Service `+7 → FRb+7`, stored-account main `LRb`, inherited bearer/refresh behavior |
| Extra checks | No caller ID trim/length/UUID/nonempty validation; no checksum, location, device or timestamp field |

Construction is bounded: `0xd15344` allocator → one-entry `Map<String,dynamic>` at `0xde6c3c..0xde6c54` → `0x707bd4` FormData constructor → inherited `0x707ee8` field mapper → `0x6b9270` POST wrapper. Precise random multipart boundary and complete HTTP byte serialization were not observed.

## Service result and local effects

Service `0xde6bf0` returns `Future<bool>`:

- Exactly status **200** becomes true (`0xde6cac..0xde6cb8`). Other normally returned status becomes false; all caught exceptions become false (`0xde6cbc..0xde6ccc`). Shared transport's general 2xx acceptance does not broaden this check.
- It does **not** read the response body, decode JSON, parse `yEb`, or inspect `error`, `message` or `data`. A transport transformation can still fail before the helper receives the response; the helper catches that exception as false.
- Controller `0xde69ec` awaits the service at `0xde6a88`, then immediately fetches its current source list. There is **no branch on the returned Boolean**.

The controller sequence is:

1. Capture the clicked ID and publish it to deleting-ID subject `Pyb+0x27` through `0x506078`, before the request.
2. Await the service. Fetch the **current master list after that await** from `Pyb+0xb` (`0xde6a90..0xde6aa0`). There is no pre-await list snapshot.
3. Invoke `removeWhere` selector `0x15b6d` with predicate `0x8fcae8`: exact row `+7 == captured ID`. For normal growable lists it removes **all** matching IDs, retaining survivor order, object identity and the same list instance. Republish that same master instance at `0xde6b00`.
4. Read the **current** category index from `Pyb+0x13`. If `0 <= index < categories.length`, call `0x87f064` for that label. It rereads master, applies local filter `0x729678`, and publishes to filtered subject `Pyb+0xf`. **Semua** returns the master reference; other categories materialize a filtered list. An invalid index skips filtered publication and can leave a stale filtered list.
5. Clear deleting-ID subject to null. The confirmation caller then closes if still mounted.

This sequence is identical after ordinary service true or false. There is no GET, list reload, full refresh, global error publication, success/error toast, retry or rollback. It does not touch global loading `+0x17`, row-navigation busy `+0x1f`, loaded `+0x23`, or unrelated collections/groups caches. The controller's exception cleanup clears deleting ID and rethrows; partial local changes are not rolled back.

The dispatch table binds growable CID 92 to `0x505758 → 0x4f9764`, which performs the in-place filter and length update. Fixed-length CID 90 (`0x509f74`) and unmodifiable CID 91 (`0x508e00`) throw instead. The generic loop detects concurrent length changes. Native deletion has no account/route ownership or duplicate-submit guard; browser guards are an explicit adaptation.

An implementation must keep displayed rows, category results and action indices attached to the same owned master/filtered cache after this local removal. Re-rendering a retained raw response while dispatching an updated array would violate this contract and could target a different activity.

## Narrow activity-read dependency

The existing activity read is included only to bind the typed list feeding delete. `0xd1dc00` calls main-client **GET `activity/GetUserActivity`** and accepts only status 200. It optionally JSON-decodes a String body, chooses `data ?? message`, requires a List, then parses `Qyb`. It never inspects a body `error` flag. Non-200, non-list or exception returns the failure/empty-list tuple; a valid typed list under HTTP 200 returns the success tuple.

This differs from the current generic browser adapter's all-2xx acceptance and `data.error === true` rejection. The audit makes no adapter change. It also does not expand date parsing: the prior parser evidence records nonnull `createdAt` through shared `0x6beed4` and a runtime-date fallback for null. No browser timestamp should be invented on that basis, and exact date-parser parity is outside this deletion audit.

## Frozen evidence and verification

- [Canonical ledger](recovered/activity-delete/flow.json): SHA-256 `6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80`.
- [Independent verification receipt](recovered/activity-delete/verification.json): **PASS**; 26 owned ranges / **3,906 exact ELF instructions**, 8 inherited authentication/multipart ranges / **832 instructions**, 101 markers, 161 owned pool bindings, 42 inherited bindings, 10 dependency hashes, 3 dispatch entries, 9 class metadata records and 2 allocator headers.
- Pinned ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Prior activity ledger remains SHA-256 `bac1bc6eff1484d4b32e89f6023600e96597d61c7b46e25874e56fb0314c8756`; inherited group-create and group-move ledgers are hash-bound and unmodified.
- [Builder](rea/build_activity_delete.py) refuses to overwrite differing canonical files. [Verifier](rea/verify_activity_delete.py) pins the ledger, independently re-decodes every owned/inherited instruction from ELF, validates safe pool annotations against the pinned pool, and checks class/dispatch dependencies and semantic landmarks/absences.

Offline verification command:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_activity_delete.py
```

This is static evidence verification, not an application test or production acceptance test. Server-side deletion/cascade/authorization, deletion of linked underlying files or parcels, successful account mutation, complete framework lifecycle and pixel parity remain unverified. This work does not change location/geotag submission or implement a physical-visit bypass.
