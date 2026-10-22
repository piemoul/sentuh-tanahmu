# Swaplotting services: typed reads and upload boundaries

This is an offline, bounded REA audit of the supplied Sentuh Tanahku6.1.5 binary. It validates the two already-enabled PlotBidang read contracts and separately freezes the two personal `/apis/Swaplotting*` upload builders. It changes no application, backend, catalog, tests or old evidence and performs no account, credential, network, Android, coordinate, visit or submission action.

The frozen ledger is `analysis/recovered/swaplotting-service-followup/flow.json`, SHA256 **f5be07485685102e41ee39e0718f4d241dee0224fd70b3b6e447a37e0bdd65f9**. Its independent verifier re-decodes the pinned ELF and checks pool loads, classes, allocator headers, exact keys, branches, casts and direct-call references. Instruction agreement does not establish current server acceptance.

## Separate repository families and common transport

The read repository is **XQb CID750**, allocated at `d707fc`. Its factory stores the DI-resolved **FRb** at repository`+7`. Both read services load that member and then FRb's main Dio`+7`.

The two form constructors, inherited from the sibling UI proof, allocate **QRb CID747** at `cff824` and store the same DI FRb in its`+7` member. The header `0x2eb11c` proves the allocated class. It is **not qCb CID775**, despite that adjacent class name. Both upload services again load repository`+7 → FRb+7`, rather than the Directus client at`+b`.

All four calls use the shared **POST** wrapper `6b9270`; none supplies query parameters or caller-specific headers/options. The inherited FRb constructor binds the initial main origin to `https://sentuh.atrbpn.go.id/` and installs LRb. LRb uses the stored account's `tokenType + space + accessToken` for Authorization, including its existing expiry/refresh flow. These paths do not enter the `common/` application-token branch. When the stored token is absent, native LRb can forward without assigning that header; the server's authorization decision remains unknown. No credential initializer or value is read or exported.

The main menu/form/GPS/ownership association belongs to the sibling UI/map ledgers. The existing web route's placement of PlotBidang reads under “Swaplotting” is not proof that the main personal native route invokes those reads. The separate `PlotBidang/InstansiBersertipikat` and `InstansiBelumBersertipikat` mutations remain inventoried in the original170-contract corpus and are not conflated with these two `/apis/` uploads.

## Existing read contracts

| Endpoint | Native entry/call | Request |
| --- | --- | --- |
| `PlotBidang/GetDetail` | `dd9768 /dd980c` | FormData with exactly `id`, copied unchanged from the second service argument; no local trim or concrete scalar-type guard |
| `PlotBidang/DaftarPlot` | `ddbafc /ddbb60` | No explicit data/options argument; preserve absent body rather than inventing JSON, form fields or NIK |

The FormData scalar mapper converts a null leaf to an empty String. LRb selects multipart content type for GetDetail, and form content type for DaftarPlot's null body. Exact browser text-ID bounds are adapter choices, not server requiredness recovered from this builder.

Both read services first obtain transformed `body.error` and require a **nonnull bool**. Only **`error == false` and HTTP200** proceed to `data`. The status test follows this error-field type check. Neither service reads `message` or performs a second JSON String decode.

GetDetail requires `data` to be a Map and parses UQb. DaftarPlot requires a List and materializes every required Map into WQb; an empty list is allowed, while a bad row is not skipped. Success returns native `(false, model/list)`; error true, normally returned non200 or the retained catch branch returns `(true, null)`. That first bool means **error**.

**WQb CID417**, parser `9c4990`, has six required fields:

| Key | Native slot | Type |
| --- | --- | --- |
| `plotId` | `+7` | String |
| `nup` | `+b` | String |
| `wilayah` | `+f` | String |
| `statusVerifikasi` | `+13` | int, stored unboxed |
| `statusTerdaftar` | `+1b` | int, stored unboxed |
| `tanggal` | `+23` | String |

Missing/null or wrong nonnull values fail those required casts. `tanggal` remains a raw String; no DateTime parser appears here. Unknown keys are ignored.

**UQb CID419**, parser `9b8c80`, retains27 nullable fields. `jenisInstansi` and `statusVerifikasi` are `int?`; `luas` and `luasDelineasi` are `num?`. The other23 are `String?`: `nup`, `wilayahId`, `wilayah`, `kantorId`, `kantor`, `alamat`, `jenisHakId`, `jenisHak`, `nomorHak`, `keterangan`, `nib`, `nibel`, `penguasaan`, `pemilikan`, `pemanfaatan`, `penggunaan`, `permasalahan`, `reviu`, `rutr`, and the four `batasUtara/Timur/Selatan/Barat` fields. Missing/null stays null, without numeric/string coercion or default zero. The ledger binds each exact key to its slot.

There is an important geometry limit. A nonnull `delineasi` is validated as a Map. Parser `9ba204` requires `type:String` and `coordinates:List`, then traverses three list levels and converts leaves through dynamic selector`ab4d` and helper`447170` to double. It allocates **zero-field VQb CID418**. UQb calls this parser at `9b98a0`, then immediately overwrites the return at `9b98a4..`; no UQb field stores that geometry. Thus malformed delineasi can fail the detail parse even though **the typed UQb result supplies no usable polygon or coordinates**. Area values and textual boundary descriptions are not geometry. CRS, coordinate order and valid ring construction are not inferred.

## Two personal upload builders

The registered service `d9f1c4..d9f910` calls `/apis/SwaplottingTerdaftar` at `d9f850`. It constructs these16 ordered keys:

`id, kluster, namapemilik, kontaktelp, kontakemail, tipehakid, tipehak, kantorid, namakantor, wilayahid, namawilayah, nomorhak, reviu, lat, lon, file`.

The unregistered service `da0424..da0cb8` calls `/apis/SwaplottingBelumTerdaftar` at `da0be8`. It constructs these20 ordered keys:

`id, kluster, namapemilik, kontaktelp, kontakemail, alamat, alashak, nomoralashak, keteranganalashak, buktipajak, nomorbuktipajak, keteranganbuktipajak, kantorid, namakantor, wilayahid, namawilayah, reviu, lat, lon, file`.

Both use literal **`id = 'id'`** and **`kluster = 'K4'`**. The `id` value is not taken from a returned plot ID. Selected office/region/right/proof codes come from nested option`+f`; selected names use option`+b`. The ledger records every exact eCb658/hCb655 source slot and null assertion.

Native trim helper `447974` is applied only to the fields marked in the ledger: owner/contact/review Strings, the registered certificate number, and selected unregistered address/description fields. Unregistered proof-number values are copied raw. The inherited trim proof includes **U+0085**, so JavaScript `trim()` alone is not an exact replacement. No global trim, number coercion or identifier substitution is justified.

For coordinates, registered eCb uses its LatLng at`+b`; unregistered hCb uses LatLng at`+7`. Each reads its underlying double`+7` for `lat` and double`+f` for `lon`, then calls `a944a0`. This audit leaves the exact double-to-text precision/format unclosed; it does not guess seven decimals, attach device coordinates to a map point or create a polygon.

The required nonnull photo-path lists are eCb`+33` and hCb`+4b`. Each actual path is passed to file factory`8d1ddc` with a generated filename from`8d1f84` and literal hyphen-to-empty replacement. The resulting values are collected into the `file` list; the source loop allows zero elements. Full shared recursive part naming, final MIME/extension, size limits, image content and freshness requirements remain unclosed. No generated, altered or example photo is provided by this audit.

Both maps pass to shared FormData`707bd4`. After the await, **the response body is never inspected**: HTTP200 returns **true**, other normally returned statuses return **false**, and the catch branch returns **false**. Here true means the helper's **success** result, opposite to the read tuple's error bool. It is not independent confirmation of ownership, land registration, verification or a physical visit; a false result is not authorization to retry a mutation.

## Boundaries and reproducible checks

The service builders do not newly prove the upstream map/GPS selection, physical-presence/radius/freshness checks, owner-list authorization or separate AddUser/OTP plotting workflow. Those are sibling UI/map evidence and server boundaries. Absence of an explicit field here does not prove absence of a server check or a current checksum requirement. No mutation, telemetry, visit, QR, OTP or identity step is enabled.

Run the independent verifier:

```text
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_swaplotting_service_followup.py
```

PASS binds **16 new windows /2,945 instructions**, **15 inherited windows /1,431 instructions**, **4,376 unique instructions**, **229 new pool bindings**, **146 decisive markers**, **9 class metadata records**, **281 literal semantic checks**, **4 complete direct-BL reference hits**, and **13 dependency hashes**. The original170-contract corpus remains pinned to `c731e68e…`. No server-current compatibility or complete menu/end-to-end parity is claimed.

Verifier SHA256: **deb606b630784537425fe97408ed61d4605b1f8de1b427f0609de7e972b6dcc7**. Builder SHA256: **eb31bd85b83d91bd98743d44d2768252598ba4c5d47f23d4afc418a66d7c1b3a**. Verification receipt SHA256: **147752dda0c7b9235d873cf61355d3a3d495b48b333ecbc846137133cae78a2e**.
