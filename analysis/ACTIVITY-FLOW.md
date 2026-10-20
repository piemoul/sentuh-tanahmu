# Native Aktivitas: list, categories and selected-item actions

The APK has a typed Aktivitas list with local category filters. Its cards display **title, subTitle and createdAt**. Selecting a row dispatches by its activity type into existing parcel, file, queue or scanned-document flows; there is no generic activity-detail request in the examined router. A separate **Hapus** confirmation is a mutation and is not part of the read-only reconstruction supported here.

This is bounded static evidence from Sentuh Tanahku 6.1.5, package `id.go.bpn.sentuh`, ARM64 `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. The analysis reuses the local REA artifact identity, Blutter class/dispatch metadata and prior parcel/BERKAS audits. No APK runtime, production request, account read, credential, mutation or bypass was used.

## Request and lifecycle

`Syb` CID 6292 creates `_Tyb` CID 5469 through dispatch index 60023 → `0x9f7f24`. Its initializer, index 62208 → `0x729558`, resolves `Pyb`, creates a scroll controller and calls list controller `0xd1d8d8` at `0x729634`. The page builder is dispatch index 61679 → `0x87dc38`. It uses title **Aktivitas** at `0x87dc78`.

| Contract | Evidence |
| --- | --- |
| GET `activity/GetUserActivity` | Endpoint at `0xd1dc5c`, main GET helper `0x7017a4` called at `0xd1dc68` |
| No explicit caller query or body | Arguments `0xd1dc40..0xd1dc68`; no selected identifier, NIK, page or search parameter |
| HTTP 200 required | Tagged comparison at `0xd1dc80` |
| String body is JSON-decoded | `0xd1dcbc` → `0xb22dd0` |
| List is `body.data ?? body.message` | `data` at `0xd1dccc`; only null falls back at `0xd1dcf0`; `message` at `0xd1dcf8` |
| Result must be a List | List check `0xd1dd24..0xd1dde8`; parser called at `0xd1ddf0` |
| List parser | `0x729d24` maps `0x729dc8`, requires `Map<String,dynamic>`, then calls model parser `0x729e18` |

A non-null `data` value of the wrong type does **not** fall back to `message`. A direct top-level list is not the native contract. Non-list or HTTP failure returns an error flag and an empty typed list; the controller clears both the source and filtered lists on that flag (`0xd1dae0..0xd1db6c`). This is an error path, not evidence that an invalid envelope is successful.

The bounded controller replaces the complete source list and reapplies the selected category; it does not sort it. Refresh callbacks for a populated list (`0xd87114`, call `0xd87198`) and an empty list (`0xd883b0`, call `0xd88424`) both call the same controller with force reload true. A previously loaded list can skip a non-forced reload at `0xd1d940..0xd1d95c`.

## Exact model and null rules

`Qyb` CID 835, parser `0x729e18`, has eight fields. Keys are **exact camelCase**, including capital T in `subTitle`; there are no PascalCase aliases. Supplied non-null scalar values must have the indicated type: there is no numeric/boolean/object string coercion.

| Key | Offset | Wire type and null/missing behavior |
| --- | --- | --- |
| userActivityId | +7 | String; null/missing becomes empty string |
| activityType | +0xb | String; null/missing becomes empty string |
| platform | +0xf | String; null/missing becomes empty string |
| createdAt | +0x13 | Non-null input must be String; parsed to a native date value by `0x6beed4` |
| contentId | +0x17 | String?; null remains null |
| title | +0x1b | String; null/missing becomes empty string |
| subTitle | +0x1f | String; null/missing becomes empty string |
| status | +0x23 | String; null/missing becomes empty string |

For absent/null `createdAt`, `0x72a038..0x72a064` constructs a date object using runtime helper `0xcd0988`. This must not become an invented server timestamp in the browser. The complete date parser, zone rules and missing-date fallback are outside this pass; retaining the supplied date text and showing a missing value is an explicit browser difference.

## Category filters and list order

The category widget is `Vyb` CID 5950, build `0xa33088`. The eight labels are constructed in this exact order at `0xa33110..0xa33168`:

1. Semua
2. Berkas
3. Bidang
4. Antrian
5. Scan
6. Login
7. Penandaan Lokasi
8. Lainnya

Selection callback `0xa337ec` supplies the selected label to `0x87effc → 0x87f064 → 0x729678`. It reads the stored source list and emits a filtered list locally, without another HTTP request. The category snapshot uses index 0 if it has no value (`0xa332b8..0xa332c8`).

| Category | Predicate on activityType |
| --- | --- |
| Semua | Return the source list unchanged |
| Scan | Uppercase equals `SCANDOKUMEN` or `SCANDOKUMENPBT` |
| Penandaan Lokasi | Uppercase equals `GEOTAG` or `AKTIVASIBERKASGEOTAG` |
| Login | Lowercase equals `login` |
| Lainnya | Lowercase contains none of the nine strings below |
| Berkas, Bidang, Antrian | Lowercase contains the lowercase category label |

The Lainnya exclusion set at `0x729ad0` is `berkas`, `bidang`, `antrian`, `scandokumen`, `scandokumenpbt`, `geotag`, `aktivasiberkasgeotag`, `login`, `caribidang`. Each test is substring containment, not set equality. Thus an unfamiliar type containing `login` is excluded from Lainnya even though it does not match the exact Login filter. `Scan` itself is not a Scan-filter match.

No trimming is present. The `where`/list-materialization path preserves source order. Existing dispatch evidence establishes lower, upper and contains; eight bounded ASCII table mappings are reused. Complete Dart/JavaScript Unicode equivalence is not established.

The inspected screen has category chips, not a free-text search box. Its list builder uses filtered-list length, with an optional trailing loading row (`0x87e598..0x87e600`); there is no fixed record cutoff in the bounded renderer. No remote pagination fields occur in this request. This does not prove every controller/scroll side effect or server-side limit; web pagination is a presentation choice.

## Card fields, icons and empty state

`Uyb` CID 5951 builds each card at `0xa32260` (dispatch index 58704). The row obtains the actual filtered model at `0x87e874` and stores it at widget `+0xb` at `0x87e948`.

| Visible element | Binding |
| --- | --- |
| Main text | `title`, read `0xa32444` |
| Secondary text | `subTitle`, read `0xa3251c` |
| Date/time | `createdAt`, read `0xa325c8`, format helper `0xa32afc` |
| Date format | `d MMM yyyy, HH:mm` at `0xa32b24`, explicit locale `id_ID` at `0xa32b2c` |
| Empty list | **Tidak ada aktivitas** at `0x87e0ac`; refresh remains available |

`platform`, `status`, `contentId` and `userActivityId` are not displayed by this bounded card. `activityType` selects the icon; it is not an extra text line. A transient loading overlay follows controller state, not the response `status` field.

Icon helper `0xa32b60` uses exact case-sensitive string comparison (`0xbbd83c`), unlike the normalized category and tap predicates. The asset folder is `assets/images/icons/svg/`:

| Exact activityType | Icon |
| --- | --- |
| CariBidang | location.svg |
| CariBerkas | find.svg |
| Scan | file_search.svg |
| AntrianOnline | antre.svg |
| Login | account.svg |
| SCANDOKUMEN, SCANDOKUMENPBT | barcode.svg |
| Anything else | location.svg |

## Row selection and reusable reads

Callback `0x87e984` reads the selected model's activityType `+0xb`, contentId `+0x17`, and subTitle `+0x1f`, plus its filtered row index, then calls router `0xd871d0` at `0x87ea24`. The router checks the following branches **in order**. Every branch requires `contentId != null`; native does not add a blank-ID guard.

| Ordered condition on lower(activityType) | Destination and identifier |
| --- | --- |
| contains `bidang` | `mFb` through `0x87efb4`; complete contentId in widget +0xf; flags +0x13=true, +0x17=true |
| contains `berkas` | Split contentId by `:` at `0xd8732c..0xd87338`, select element 0 at `0xd87360`; invoke shared `cBb` controller `0xd878dc` at `0xd873ac` |
| contains `antrian` | `tzb` through `0x87ef44`; complete contentId; further queue workflow unaudited |
| contains `scandokumen` and lower(subTitle) contains `pbt` | `mFb` through `0x87eef8`; complete contentId; flags +0x13=true, +0x17=false |
| contains `scandokumen` | Document helper `0xd87754`; complete contentId; calls `0xd41dd0` then `0xd41720`, then builds `yGb` via `0x87ea4c`; document contract beyond this boundary is unproved |
| contains `geotag` | Shared `cBb` controller `0xd878dc` at `0xd87724`; complete contentId, **no colon split** |
| No match, or null contentId | No navigation in the bounded router |

Precedence is significant: `AktivasiBerkasGeotag` enters the berkas branch before the later geotag branch. `CariBidang` enters bidang. Category membership must not be substituted for these tap predicates.

The two `mFb` builders leave widget `+0xb` null and set `+0xf` to the exact selected ID. [The prior parcel audit](COLLECTION-DETAIL-FLOW.md) and [certificate-map audit](CERTIFICATE-MAP-FLOW.md) prove this widget's initializer resolves the ID through `0x770190 → 0x770384 → 0xd39470 → 0xd39814`, then **GET `legacy/GetParcelBoundaryById?persilid=...`** at `0xd39898`. The existing boundary adapter can support the initial read. Different flags and the full native map controls/actions are not fully reproduced by the browser sketch.

The berkas and geotag branches enter exactly the same controller already audited for collection BERKAS. It passes the selected ID as `berkasId` to **POST `/berkas/CariBerkas`**, then **POST `berkas/berkassop`** and **POST `berkas/getStatusCetak`**, each with `berkasid`. Calls are `0xd87a28`, `0xd87a70`, and `0xd87ac8`; the response enters the existing MAb screen through `0x87ec28`. This path does not fetch SPS metadata or submit a geotag. [BERKAS-DETAIL-UI.md](BERKAS-DETAIL-UI.md) defines its model and section bindings.

The queue and non-PBT document branches remain partial. Their destination names do not justify enabling guessed requests, URLs or side effects.

## Separate deletion action

Card control `0xa32804` opens callback `0xa32cc8` and dialog `0xa32d30`, displaying `Hapus {title}?` with **Batal** and **Hapus**. The confirm callback `0xde6914` reads selected `userActivityId` at `0xde6974`, then invokes `0xde69ec → 0xde6bf0`. The existing main client sends **POST `activity/deleteUserActivity`**, form field `userActivityId`, at `0xde6c94`. FormData is constructed at `0xde6c60`; complete final stringification is not claimed. The controller subsequently changes its local lists.

This is a server mutation. No deletion was performed, and this audit does not enable it or claim its acceptance/error semantics are fully tested.

## Verification and limits

Ledger: [activity-flow.json](recovered/activity-flow.json). The 23 bounded assembly windows are under `analysis/recovered/activity-flow/`. `analysis/rea/build_activity_flow.py` builds the ledger; `analysis/rea/verify_activity_flow.py` verifies the exact ELF identity, **32 source hashes, 5,471 exact instructions, eight model fields, 11 dispatch entries and eight ASCII mappings**. It reads only allowlisted model keys from the local pool and does not print secrets.

Run with `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_activity_flow.py`. This verifier is offline evidence validation, not a webapp test or a production acceptance test.

The implementable next step is a strict typed list, the eight local category filters, exact visible card fields/icons, and only the proven parcel/BERKAS read routes with selected-ID preservation. Raw supplied dates, missing-date display, blank-ID rejection and browser pagination should remain explicit differences. Queue/doc workflows, deletion, full native date/Unicode handling, bootstrap/scroll effects, native visual parity and server acceptance remain unresolved within this scope.
