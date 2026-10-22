# Scan metadata and document-location follow-up

This is a bounded offline supplement to [SCAN-FLOW.md](SCAN-FLOW.md), [ACTIVITY-DOCUMENT-FLOW.md](ACTIVITY-DOCUMENT-FLOW.md) and [DOCUMENT-GEO-FLOW.md](DOCUMENT-GEO-FLOW.md). It preserves the old ledgers and corrects two overly broad interpretations of their instructions. REA was applied through `tools/Reverse-Engineer-Anything/skills/reverse-engineer-anything/SKILL.md`. No APK execution, account/provider request, camera access, runtime edit, deployment or credential export was performed.

Canonical ledger: [recovered/scan-location-followup/flow.json](recovered/scan-location-followup/flow.json), SHA256 `f99ec732ea7c09684a34522c9b79667f08695c236f0fb8c5cf04e97eb07ff5c9`. The [independent verifier](rea/verify_scan_location_followup.py) passes against pinned ELF `bbc7f3bd…a683` and pool `87148785…2e04`: 34 bounded sources / 3,711 ARM64 instructions, 220 pool bindings, three constant objects, 73 decisive markers, 11 dependency hashes, six dispatch entries, 11 class records and six allocator headers. The [result](recovered/scan-location-followup/verification.json) explicitly does not establish complete special-map parity.

## Exact GetDocumentType response

The complete helper `d41720..d41a40` sends main-account POST `apis/GetDocumentType` with sole String field `q`, using `application/x-www-form-urlencoded`. A normally returned status must be exactly 200 and the body nonnull. It accesses the already-decoded body directly; it does **not** decode a JSON String itself.

`error` missing/null becomes true; another nonnull value must be bool. `data.showRoute` must be an int. Missing/null `showRoute` is temporarily replaced with an empty String, which fails the int cast and selects the whole fallback. The route bool is true only for integer 1. `data.type` missing/null becomes an empty String; another nonnull value must be String. A valid `error:true` is preserved with the valid route/type and does not short-circuit those fields. No response `message` is read. Non-200, null body, dynamic access/type failures and caught transport errors return `(true,false,'')`; pool object `0x34ce0` independently binds these constants.

Main Scan's viewer builder `77ebc0..77ece8` forwards both metadata route bool and type into `yGb+1b/+2b`. Its error flag does not prevent the PDF viewer. Activity's shared caller deliberately supplies type `''`; reusing that caller unchanged would lose special Scan routing.

## Original code and location routing

Classification/document/metadata requests initially receive `barcode.code ?? ''`. The PDF viewer separately retains the original nullable code at `yGb+17`. Each location destination builder (`917624`, `917698`, `9176fc`) reads that original field and asserts nonnull. Null must therefore stop location construction; it must not be normalized to `''` a second time. Empty and whitespace Strings are retained. These builders do not trim, decode, split, validate an ID format or substitute classification `data`.

The complete callback `dac770..dac968` sets busy true, compares the viewer type, invokes navigation, then sets busy false. None of its navigation results is awaited. The old description that busy waits for navigation completion was too strong.

| Viewer type | Proved callback behavior |
|---|---|
| `PetaBidangElektronik` | Push the special PBT route at `dac85c`, then fall straight through `dac860` to the separate KKPR comparison. Because this type differs from `KKPR`, the generic document map is also pushed at `dac924`. |
| `KKPR` | Push the special KKPR route at `dac8e4`, then jump to `dac928`, skipping the generic branch. |
| Other String | Push only the generic document map at `dac924`. |

The PBT fall-through is an instruction-level finding: no jump or await separates its first push from the second test. It proves call ordering, without an original-device oracle for final Flutter route stack, frame timing or platform side effects. A browser implementation may retain both read-only branch results and expose the generic map in front, but must describe this as a stack adaptation unless actual navigation parity is tested. It must not require the first route's request to succeed before starting the generic route.

The generic destination allocates `mFb` at `917668`, stores original q at `+b`, and sets mode flags `+13=true`, `+17=false`. Initializer `770190` passes widget `+b` as named `cth`; constructor stores it at controller `+7` and invokes `d39b74`, which calls the established GET `/apis/getGeoJsonInfo`. Existing document-geo evidence supplies its double URI encoding and geometry parser. The older PERSIL map-origin description for this specific `917668` call was too broad: this value is a document q, **not** preloaded parcel geometry. The ordinary Scan parcel-classification route at `77ed14` instead stores its classification ID at `mFb+f`; these two routes must remain distinct.

## Special route initialization and requests

Class headers, allocator IDs, state creation/init/build dispatch and the complete relevant initializers bind these chains:

| Type | Native chain | Exact initial request |
|---|---|---|
| PBT | `sGb` 6213 → `_tGb` 5395 → `rGb` 581; init `776e20`, controller method `d3ceb8`, service `d3d080` | POST `apis/GetPBTElDetail`, call `d3d134`, form-urlencoded sole String `q` from widget `+b`. |
| KKPR | `cEb` 6237 → `_dEb` 5417 → `XDb` 624; init `762b0c`, controller method `d30ee8`, service `d31134` | POST `apis/GetKKPRDetail`, call `d311e8`, form-urlencoded sole String `q` from widget `+b`. |

The KKPR initializer has an alternate preloaded-object path through widget `+f` and `768260`. The scanned route writes only `+b`; the frozen null-fill allocator leaves `+f` null, so this path is not selected. Both services use the ordinary main-account client. No files, extra query, coordinates or checksum are constructed in these requests.

Both helpers require exactly HTTP200 and a nonnull already-decoded map. `error` missing/null becomes true; another nonnull value must be bool. `data` missing/null becomes an empty map, otherwise it must cast to `Map<String,dynamic>`, then the specific nested model parser runs. They return `(error,model)`, **not** `yEb`. Normally returned non-200/null and caught failures return `(true,null)`. The controllers publish only when the first tuple value is not true and the model nonnull. This is distinct from a generic web adapter's body-error check and unknown-field pass-through.

## Typed model boundary and remaining gaps

The complete audited PBT parsers establish:

- `uGb` / `777f20`: `nomor:String?`, `kantor:String?`, `daftarBidangTanah` nullable iterable mapped into `vGb` children. Null stays null; no default empty list is invented.
- `vGb` / `77862c`: `nib`, `lokasi`, **`luas`**, `noBerkas` are nullable Strings; `batas` is a nullable map parsed as `wGb`. Numeric area must not be coerced into the native String field.
- `wGb` / `7788a0`: `id:String?`, `tipeHak:String?`, `geometri` nullable map parsed as `xGb`.
- `xGb` / `778a6c`: `type:String?`, `coordinates` nullable iterable mapped by shared `sU` callback `ba0cec`. The callback's numeric leaf and nesting are not re-audited in this supplement; it does not certify arbitrary GeoJSON or flattening.

The complete top-level KKPR parser `764764` establishes `gEb` 623: `status:bool?`; `pesan`, `kkprId`, `berkasId`, `kantorId`, `encryptedId` nullable Strings; nullable nested `textualData` and `geometryData` maps. Geometry parser `764b44` has `type:String?` and nullable mapped `features` through callback `764cac → 764cfc`. Textual parser `7656c0` has nullable maps `pemohon → 767f24`, `kkpr → 766274`, and `berkas → 7658ec`. Those nested textual/feature parsers are not fully audited here. The existing KKPR **list** model and renderer are therefore not a substitute for this response.

The complete PBT build `916078..916640` uses title `Lokasi Bidang`, a map shell, directions and go-to-feature callbacks. The bounded KKPR build prefix uses `Lokasi Kegiatan`, a map shell, directions, pin-drop, go-to-feature and RDTR/RTRW controls. This does not establish complete displayed feature panels, layer details, callback effects, geometry flattening, the remaining KKPR build, or production server acceptance. Special branches should remain explicitly incomplete until their models and controls are implemented and tested against the appropriate evidence.

## Host integration notes

Existing catalog operation IDs are `post-apis-getpbteldetail-d3d134`, `post-apis-getkkprdetail-d311e8`, and `get-apis-getgeojsoninfo-d39f1c`. Use exact raw nonnull document q and the established generic `activityDocumentGeoData/View` for document location, with the adapter performing native double encoding. The existing generic PBT/KKPR adapters do not by themselves prove typed nested model parity. At audit time they also required nonempty q; the current generic document-geo scope required `q.length > 0`. Native callers permit empty/whitespace q, so this requires either a tightly scoped correction or an explicitly documented browser limitation. Do not change unrelated operation validators or infer server acceptance from the caller.

Native QR-plugin evidence remains the inherited Scan ledger: callback `onRecognizeQR` reads nullable String `code` unchanged; it also receives type/raw bytes. Exact browser camera permission/selection behavior, format coverage, device decode quality and secure-context behavior are separate browser concerns. Root owns the local decoder/camera implementation and permission testing; this audit accessed no camera and makes no camera-runtime claim. No activation, geotag or physical-location bypass follows from these read-only location requests.
