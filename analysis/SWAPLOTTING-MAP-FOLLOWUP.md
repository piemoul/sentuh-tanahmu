# Swaplotting: map, position and disclaimer boundary

Static audit of official Sentuh Tanahku 6.1.5, ARM64 `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No application, backend, catalog or test code changed. No Android execution, emulator restart, network request, account value, device location, OTP or submission was used.

The frozen ledger is `analysis/recovered/swaplotting-map-followup/flow.json`, SHA-256 `07d83a8a74c6a8ea59cc6b8dc81ffe52473e64e849cd112a4ef1a9db5873fc9a`. The independent verifier is `analysis/rea/verify_swaplotting_map_followup.py`; it imports neither the builder nor explorer. It re-decodes 3,492 new and 864 inherited instructions against the pinned ELF and validates public pool records, classes, dispatch entries, annotations and 210 literal contract checks. The receipt is `analysis/recovered/swaplotting-map-followup/verification.json`.

## Positively bound coordinate source

The map controller is **bCb, CID661**, allocated by `de4684`, held at `_nCb+13`, and constructed by `9fa3e8`. It is distinct from the personal identity model lCb649. Three dispatch entries bind mCb create-state to `9fa25c`, `_nCb` init to `7573f8`, and the map build to `8c7574`.

The camera callback `8cc1e4` calls `d9d948`. It reads **rbb camera target+f** and stores the same coordinate at **bCb+b** (`d9d978..d9d98c`). Two form builders then choose bCb+b if nonnull, otherwise the target from bCb+33's stored initial camera:

| Builder | Target widget | Coordinate slot |
|---|---|---|
| `8cab6c` | rCb6261, unregistered form, allocator `d9cb4c` | widget+b at `8cabc4` |
| `8cabd4` | oCb6262, registered form, allocator `d9cc04` | widget+b at `8cac2c` |

The constructor's public fallback viewport is latitude **−0.792918**, longitude **116.482347**, zoom **4.4746**. This is a viewport default, not measured land coordinates. These builders forward one coordinate object; they do not forward accuracy, timestamp, a coordinate document, parcel geometry or ownership proof. Subsequent form model, POST serialization and OTP boundaries are owned by the separate UI/service audits. The audit does not establish that the stored camera field is immutable across every other route.

The mark routine `d9c758` creates the public point identifier **mark**, uses bCb+b or the last platform position in global2f08, and publishes a single-entry `Map<ubb,RUa>`. RUa1630 holds the point at+2f. The camera handler can replace this overlay point. This establishes a point overlay, not a selected parcel polygon.

## Device position is a separate camera input

Map creation `8cc220` stores the native map handle at bCb+2f and calls `d9cc34`. The location button `8cac3c` calls the same routine. The routine:

1. Awaits the hqb3 permission helper; `d71cd4` returns true only for the public **granted** enum. Other results return before the position request.
2. Checks **serviceEnabled**, then **requestService** if necessary, through MethodChannel **lyokone/location**. The channel helpers apply dynamic equality with Dart integer1; the caller proceeds only when the resulting boolean is exactly true.
3. Calls platform position entry `4dc220` without optional arguments. That entry constructs settings with the public **best** enum, distanceFilter0 and false flags before dispatching the platform provider. The provider/permission SDK implementation remains outside this bounded audit.
4. Stores the awaited position in global2f08. If the map handle exists, it constructs a camera from position latitude+7 / longitude+f and animates to zoom **17**. It does not directly assign bCb+b; the camera callback provides that target.

No accuracy/time/isMocked field read, known distance-helper direct call, or 10m comparison occurs in the complete retained `d9cc34..d9ce68` body. This is a bounded statement, not a claim about SDK internals, child routes, alternate callers or server rules. A requested “best” position does not prove satellite provenance, freshness or a ten-metre error bound.

The separate bCb+1b Double subject starts at0 and is changed to200 by the mark action. **It is not the camera zoom field.** Camera zoom is rbb+1b; the recenter literal17 and initial literal4.4746 are bound independently.

## Native Google hybrid and Bhumi raster

The build allocates iab6309 with the public **hybrid** enum. The first overlay collection is obtained from the point map; the second is `Set<rab>` from bCb+17. `8cc2b8` constructs BTb368 with the inherited WebMercator constants, a tile overlay identifier **tile_overlay_1**, and tile size **256**.

The pinned earlier `berkas-map-followup` proof establishes BTb's fixed Bhumi WMS raster request, regional cadastral stroke layer, viewport-to-bbox conversion and dedicated token boundary. The current audit links this exact provider to Swaplotting. Raster tiles are not raw parcel geometry, a land ownership check or physical presence evidence. It does not associate an unrelated PlotBidang response or vector map with the personal Swaplotting controller. The older native result-dimension100 versus request/overlay256 discrepancy remains explicit.

## Disclaimer is server-driven

Postframe `d29c84` checks the permission helper result. Exact **permanentlyDenied** displays this packaged explanation:

> Lokasi kamu digunakan untuk menentukan posisi dimana kamu melakukan swaplotting. Apakah kamu akan berikan izin lokasi?

The settings link is **Ketuk disini untuk ke pengaturan**. Permission SDK request/status details are not inferred from the helper's address alone.

The postframe callback then starts the disclaimer read and subscribes to its result. `d29e9c` makes main-client **GET Map/GetDisclaimer**, null body, and accepts HTTP200. A String body is JSON-decoded, then the body must be `Map<String,dynamic>`. `757528` reads four exact nullable String fields:

| Field | jCb652 slot |
|---|---|
| message | +7 |
| message2 | +b |
| message3 | +f |
| url | +13 |

The service returns `(false, model)` on the retained successful path; non200/caught failure returns `(true, null)`. The controller publishes an empty model for exact errortrue or null model. The listener displays **DISCLAIMER** only when message is nonnull and nonempty. Three displayed messages and the linked URL come from the server; their actual current content was not requested or inspected.

**Tidak Setuju** dispatches `7500a0`, which calls the existing navigation/pop helper twice. **Setuju** dispatches `728800`, which calls that helper once. The retained agree callback has no model write or request. It is not evidence of a saved consent flag, server receipt or fulfilment of a legal condition. The URL callback is bound only through URI parsing and the external launch boundary; no live URL was opened.

## Ownership, radius and remaining limits

The retained coordinate constructors/builders do not compare an owner identity with parcel metadata. This does **not** prove that ownership checks are absent or unnecessary. Menu cached-user choices, the personal editor, shared controls, child forms, OTP, service/backend authorization and the dynamic disclaimer remain distinct boundaries. Server messages may contain ownership, legal or presence requirements; offline static copy cannot replace them.

The pinned `geotag-validation-audit.json` establishes a different **CAb** marking flow: selected-point distance from current position must be at most10m. That calculation is neither GPS accuracy nor distance to a cadastral boundary. It cannot be transferred to bCb by assumption, and this audit provides no basis to remove a gate, fabricate a visit, spoof GPS, replace measured coordinates or report a submission as accepted.

City search provenance, every alternative entry, permission/provider internals, shared native widget implementation and current server compatibility remain explicit gaps. The five complete spatial windows contain45 direct BL calls; this count is not a recursive call graph or proof of global absence. The APK was not run after login. The separate emulator readiness follow-up remains blocked for original post-login parity.

Run offline verification with:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_swaplotting_map_followup.py
```

The receipt writer is immutable: rerunning must reproduce the same bytes; later evidence belongs in a successor report. Existing ledgers and receipts were not overwritten.
