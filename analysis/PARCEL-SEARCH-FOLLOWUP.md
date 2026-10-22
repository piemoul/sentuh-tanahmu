# Cari Bidang: bounded native form, reads and map entry

This is an offline REA follow-up for Sentuh Tanahku 6.1.5. It adds evidence for the official user-facing lookup before the existing PersilId/boundary map flow. It changes no application, adapter, catalog, tests or old reports. No network request, account value, credential, location, geotag or Android execution was used.

The frozen ledger is `analysis/recovered/parcel-search-followup/flow.json`, SHA-256 **c110b2f22ecb811f063156ccc47e5708f31286d1ad0e4bab8492a6309077d2d7**. The independent verifier is `analysis/rea/verify_parcel_search_followup.py`; it re-decodes the pinned ELF and checks pool loads, classes, dispatch, public constant records and literal semantic instructions. It does not import the builder or explorer.

## Closed entry and form

The official Cari Bidang menu callback `8c3484` supplies callback `8c34f0` to the shared context wrapper. That callback navigates with builder `890398`, whose already-frozen body allocates shared map `mFb6225` with `+13/+17=true` and no initial PersilId. The already-frozen common map parent allocates search panel `Hz6224` at `908918`, carrying the same `lFb` controller at `Hz+b`. Its `createState` dispatch leads to `9fdbac`; `_pFb5659.initState` leads to `6a7488`, resolves `hFb598` and creates a two-tab controller.

The form uses these exact labels:

| Tab | Fields |
| --- | --- |
| Sertipikat Analog | Jenis Hak; Kantor Pertanahan; Desa/Kelurahan; Nomor Hak Sertipikat |
| Sertipikat Elektronik | NIBEL |

The action label is **Cari bidang tanah**. Fresh `hFb` construction initializes tab index `0` (Analog), empty office/region lists and no selected right, office, region, number or NIBEL. The existing shared null-fill allocator is inherited and verified. Controller dependency lifetime can reuse state; a fresh per-navigation reset is not claimed.

The ordered rights map is a public constant, not a derived ordinal:

| Label | `jenishak` |
| --- | ---: |
| Hak Milik | 1 |
| Hak Guna Usaha | 2 |
| Hak Guna Bangunan | 3 |
| Hak Pakai | 4 |
| Hak Pengelolaan | 5 |
| Hak Wakaf | 8 |

The optional setter `6a7c08` preserves each existing value for null/omitted arguments. Tab changes do not explicitly clear the other fields. Office changes set the selected main-office object, then clear selected region and region options before a region read. Right changes disable the local region field for exact Hak Guna Usaha or Hak Pengelolaan; the retained callback does not clear the office/region.

## Validation and edit boundary

The search action calls aggregate validator `6a80c4` through `811194` before lookup. Analog requires right, office and number to be nonnull. For ordinary rights it also requires a selected region with a nonempty option code. For Hak Guna Usaha/Hak Pengelolaan, a null region is replaced by a `Byb836` option with empty code and name; an already selected region remains. Aggregate validation does not trim, test number length, require digits or reject an empty-but-nonnull number String.

Electronic aggregate validation requires stored NIBEL to be nonnull with `String.length >=14`. Only tab indices `0/1` are exposed by the form. The controller uses stored NIBEL for index `1`; unsupported nonzero indices fall back to an empty String.

Edit formatter configuration is positive evidence but complete formatter semantics are not closed. Number/NIBEL `Dra2697` instances receive integer arguments `5/17`. The NIBEL list is ordered `rFb2696`, `Dra2697`, `Cra2698`; the latter receives pattern `[\ ]`, a false flag and an empty replacement. No truncation, digit-only, UTF16/grapheme or IME behavior is inferred from those names/configurations. NIBEL on-change calls an unresolved switchable target with input, a literal dot and an empty String, interpolates the result and sets `wej`. This audit does **not** label that unresolved call `replaceAll` or implement a guessed normalization algorithm.

## Closed request and response contract

The retained callers interpolate literal query strings and call the existing main-client GET wrapper `7017a4`, with a null body and no custom caller headers. No explicit URI encoder, trim, case conversion or ID substitution appears in these services. Shared transport escaping and current server acceptance are separate boundaries.

| Read | Ordered query and value source | Native response |
| --- | --- | --- |
| `legacy/Kantah` | `nama=`; `tipeKantor=3,2,1` through reused main-office service/default | Existing pinned main `jyb` direct-list model; its `KantorId` is at `+13` |
| `legacy/Wilayah` | `kantorid=selected main jyb.KantorId`; `nama=` | Direct `response.data` List, every row a required Map into `Cyb792`; no explicit HTTP status comparison in this service |
| `legacy/GetPersilId` | `jenishak=rights-map integer`; `nomorhak=stored number`; `kantorid=main KantorId`; `wilayahid=selected Byb.Kode` | HTTP 200 then direct `response.data` Map into `tyb800` |
| `legacy/GetPersilIdByNibel` | `nibel=stored NIBEL`; `kodehat=` | Same HTTP 200/direct `tyb800` map behavior |

**The region projection is important:** `Cyb792` reads four nullable Strings: `Kode(+7)`, `Nama(+b)`, `TipeWilayah(+f)`, `WilayahId(+13)`. The complete projection `812114` reads **Cyb.WilayahId(+13) → Byb836.Kode(+7)** and **Cyb.Nama(+b) → Byb836.Nama(+b)**. It does not use raw Cyb.Kode. Therefore the selected option's code supplied as query `wilayahid` originates from the reference row's **WilayahId**. This is positively bound by the projection loads/stores, not an alias heuristic.

Lookup success returns tuple `(false, typed parcel)`; non-200 or the retained handled `sa` exception branch returns `(true, null)`. Other exception types can rethrow. The controller interprets tuple-first **exact true** as error. There is no `body.data`, `body.error` or `body.message` inspection in the lookup service. The region service likewise materializes all rows rather than silently skipping malformed items.

The lookup parser `810d68` is `tyb CID800`, with exact PascalCase keys:

| Key | Slot | Compiled check |
| --- | --- | --- |
| Alamat | +7 | `Type: Null?` / `e31134` |
| BatasPersil | +b | `int?` |
| BatasPersilLegal | +f | `int?` |
| Luas | +13 | `int?` |
| NamaWilayah | +17 | `Type: Null?` / `e31134` |
| NomorIndukBidang | +1b | `Type: Null?` / `e31134` |
| PersilId | +1f | `String?` |
| TipeWilayah | +23 | `Type: Null?` / `e31134` |

Specialized `Type: Null?` checks are recorded literally; their shared stub is not resolved here and the unused fields are not generalized to nullable Strings. No lower-case aliases or nested envelope are read. No geometry/coordinate/polygon parser is present in this model; numeric BatasPersil/BatasPersilLegal/Luas are not geometry.

## Results and map handoff

Lookup error/null result displays **Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi.** Invalid aggregate input displays **Harap lengkapi form lokasi bidang tanah**. A missing ID produces **Bidang tanah nggak ketemu, nih!** with a tab-specific suggestion to try the other sertipikat tab; exact suggestions are retained in the ledger and verified against pool loads.

Before accepting an ID, the controller checks null parcel/null PersilId, then calls unresolved helper `447974` and compares its result with the empty String. That helper is not silently equated with browser `trim`. Rejected IDs result in a new empty parcel model and the not-found dialog.

On a valid result, the explicit search callback reads the original returned `tyb.PersilId(+1f)` and passes it as named `pzj` to the same parent `lFb.d39470`. The separately pinned collection-detail proof already closes `d39470→d39814→d39898`: `GET legacy/GetParcelBoundaryById?persilid=<returned ID>`, null body, typed `syb` FeatureCollection/feature geometry. A returned ID permits that boundary read; it does not itself prove nonempty/valid geometry, access or successful rendering.

The native search context wrapper and successful-controller telemetry call `d74828` are recorded as boundaries. This audit does not enable a telemetry write or treat one as a prerequisite for the read-only browser search.

## Remaining limits and verification

No new window was added to resolve full formatter bodies, the NIBEL switchable transform, ID helper `447974` or the profile switchable getter used while ordering/marking office options. The retained office-options body proves local list copy, first-match move and option-mark construction; the exact profile getter target remains unresolved. Prior Cari Berkas profile preference is not substituted as proof for this specific caller.

Run:

```text
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_parcel_search_followup.py
```

PASS covers **34 new windows / 5,361 instructions**, **3 inherited windows / 1,296 instructions**, **6,657 unique instructions**, **247 new + 35 inherited pool bindings**, **11 selected public pool records**, **135 decisive markers**, **9 class bindings**, **2 dispatch bindings**, **188 literal semantic checks**, **7 complete direct-BL hits**, and **9 dependency hashes**. Other direct callers of the shared region service are recorded without expansion. The verifier does not import the builder/explorer, use live data or assert server-current compatibility.

Pinned verifier SHA-256: `9f537e2a79d35b26713c269bce6aef2975ece349a0b848b428a7c03f851b2735`. Pinned builder SHA-256: `d38942e38fe49b80194b01c3e4f9748a40c3109f3679097e085899de9104b5d0`. The receipt is `analysis/recovered/parcel-search-followup/verification.json`.
