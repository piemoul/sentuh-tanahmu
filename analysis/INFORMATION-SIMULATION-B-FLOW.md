# Info Layanan simulation forms 4–6 and shared controls

Static evidence from supplied Sentuh Tanahku 6.1.5 ARM64 `libapp.so`, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. This audit made no production requests, read no credentials, and changed no application/backend files. It establishes the native client behavior below; server acceptance and server-side nonmutation remain unobserved.

The frozen machine-readable proof is `analysis/recovered/information-simulation-b/flow.json`. Run `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_information_simulation_b.py` to independently re-decode every retained instruction from the ELF, check pool annotations, constant objects, class dispatch and dependencies. It passes **30 source hashes, 4,977 instructions, 217 decisive markers, 343 pool references, 7 constant blocks, 15 dispatch entries and 13 dependency hashes**.

## Form bindings and defaults

The parent inline selector is covered by `information-flow/information-flow.json`; six services and response parser by `information-services/flow.json`. These dependencies are hash-pinned. Form-specific callbacks below connect the displayed controls through model fields and controller to those services.

| Type | Native widget/state | Build / submit / controller / service | Fields in displayed order |
|---|---|---|---|
| 4 | sDb6248 / tDb5428 | 8eb99c / 8ebc18 / da3cb0 / da3e2c | Nilai Per Meter (Rp), Luas Tanah (m2) |
| 5 | uDb6247 / vDb5427 | 8ebdc4 / 8ec36c / da4004 / da4180 | Wilayah / Provinsi, Luas Tanah (m2), Penggunaan, Kewenangan |
| 6 | wDb6246 / xDb5426 | 8ec900 / 8ecea8 / da44e8 / da4664 | Wilayah / Provinsi, Luas Tanah (m2), Penggunaan, Prosedur |

All three buttons say **Hitung Simulasi**. Type4 placeholders are **Masukkan nilai per meter** and **Masukkan luas tanah dalam meter persegi**. The latter is shared by other area inputs. Dropdown placeholders are **Pilih Wilayah / Provinsi**, **Pilih Penggunaan**, **Pilih Kewenangan**, **Pilih Prosedur**.

Factories 9fbf48, 9fc040 and 9fc1c4 construct their corresponding states. The type6 factory calls shared constructor9fbb68. TextEditingController77ce24 receives no initial text and selects constantpp1e7a0 with empty text; type4 has controllers at state+13/+17, types5–6 at state+13. Fresh selection fields +17/+1b/+1f remain null. Constructor option lists preserve this order and exact request values:

| Field | Exact raw values |
|---|---|
| Penggunaan, types5–6 | `pertanian`, `non-pertanian` |
| Kewenangan, type5 | `Kantor Petanahan`, `Kantor Wilayah` |
| Prosedur, type6 | `konversi`, `Pengakuan dan Penegasan Hak` |

**Petanahan** is the APK's spelling. Enum mapper8e87bc preserves raw value at CSb+f but applies helper8e7e5c to labels. That helper returns the original text when its trimmed form is empty; otherwise it uppercases the original first character and lowercases the remainder. Thus normal labels are Pertanian, Non-pertanian, Kantor petanahan, Kantor wilayah, Konversi, Pengakuan dan penegasan hak. Province labels do not use this helper.

Type5 selection callback chains are Wilayah8ec7cc→8ec850→store+17 at8ec8d0, Penggunaan8ec698→8ec71c→store+1b at8ec79c, and Kewenangan8ec564→8ec5e8→store+1f at8ec668. Type6 equivalent stores are8ed360,8ed22c,8ed0f8. They read selected CSb.value+f, cast String?, and call setState; these callbacks issue no API request and do not reset the result.

## Input and submit validation

Every retained number/area control selects Gra type2, signed=false, decimal=false, single line1, maximum length99999. The generic JSb formatter path9d0748 selects Cra.Tvg for this numeric keyboard when no explicit formatters were supplied and appends a length formatter. Its exact initializer linkage to the separately found `[0-9]` candidate is **not proven** by available metadata. Do not confuse the numeric typing policy with an arbitrary-string native field or claim complete decimal/Unicode formatter parity.

Type4 submit reads raw text and checks length at8ebc88 and8ebcac. Either empty value silently returns. Otherwise it writes NilaiPerMeter to model+7 and Luas to+b, then callsda3cb0 at8ebcec. There is no trim, parse, range check, numeric conversion or calculation in this callback.

Type5 checks only selected WilayahId, Penggunaan and Kewenangan against null at8ec3c8/3dc/3f0. It reads area text at8ec420 with no length guard, stores model+7/+b/+f/+13 and callsda4004 at8ec45c. Type6 similarly checks only WilayahId, Penggunaan and Prosedur at8ecf08/1c/30, stores the four raw values and callsda44e8 at8ecf9c. Empty area is therefore permitted by these submit callbacks; an empty selected String would also satisfy their null guards, although ordinary enumerated options are nonempty. This does not imply the server accepts those values.

The pre-submit649d98→48dfac call has no validation-result branch; this audit does not reinterpret it as form validation. TextController clear810d30 loads constantpp22640 with empty text and calls value setteraeed90; it does not establish that a programmatic clear fires onChanged.

## Province read and chooser

Dispatch proves form states1,2,3,5,6 use init75f3a4, which reads the widget's shared controller and callsd2fad0 at75f3d0. **Type4 uses inherited no-opca30e8 and does not load provinces.** The native trigger is each matching state's initialization; an application-level once-per-detail cache is a web implementation choice.

Controllerd2fad0 sets busy+1f true, awaits serviced2fc10, publishes successful List<cDb> to+1b, and clears busy. A returned true error flag preserves the preceding province list. Its exception path clears busy and rethrows.

Serviced2fc10 reads service+7 FRb, then FRb+7 main client, and performs GET **InfoLayanan/GetProvinsi** atd2fc78 without explicit body, query or caller headers. It requires HTTP200, JSON-decodes String response.data, and treats dynamic `body.error == true` as failure. Otherwise `data` must be a nonnull List and every item a Map passed into cDb75f4e4.

| Key | Native cast and model field | Missing/null behavior |
|---|---|---|
| wilayahId | String? →+7, cast75f550/store75f5c4 | Preserved null |
| namaWilayah | String? →+b, cast75f5ac/store75f5cc | Preserved null |

No numeric conversion is supplied for wrong key types. Non200 and errortrue return an error tuple with initial empty list. A caught parser/request failure returns errortrue; its relocated payload local was not independently tracked here, and the controller ignores that payload.

Mapper8e8ae8 creates CSb(value=wilayahId,label=namaWilayah??`-`,selected=false). Choosersda4358/da483c map the list without sorting, then use firstWhere(value==state.selectedWilayah), catching a missing match to null. There is no automatic first-option selection. A malformed null-ID row can match an initial null chosenID visually, but the submit null guard still prevents sending it. Selection is local; no downstream wilayah/GPS lookup follows these setters.

## Shared result and controller lifecycle

Outer8ed7ac returns loading constantpp21230 when the busy snapshot compares equal to true; otherwise it subscribes to controller+23 kDb?. Inner8ed89c returns an empty widget when kDb is null. It renders **Hasil Simulasi** followed by:

| Order | Field | Label | Visibility/value |
|---|---|---|---|
| 1 | pengukuran +7 | Biaya Pengukuran | If nonnull: `Rp ` + raw String |
| 2 | pemeriksaanTanah +f | Pemeriksaan Tanah | If nonnull: `Rp ` + raw String |
| 3 | pendaftaran +b | Pendaftaran | If nonnull: `Rp ` + raw String |
| 4 | totalBiaya +13 | Total Biaya | Always: `Rp ` + (raw String ?? `0`) |

Empty nonnull amounts remain visible as `Rp `. There is no local summation, monetary parsing, rounding or locale formatting. Row helper8ee030 uses font weight700/size16 for total and400/14 for the optional rows. The divider preceding total becomes a zero-height box for type4 only.

Controllers4–6 set busy+27 true before awaiting their service. They leave the previous result unchanged initially, while the busy view hides it. Success publishes new kDb; returned errortrue publishes null; busy then becomes false. Exceptions clear busy and rethrow. These bounded controllers have no toast/error message. Changing a form control itself leaves the previous result unchanged.

## JSON and session transport refinement

All six simulation service callers serialize their maps through6b27e0 and provide **Content-Type: application/json**. The JSON encoder delegates6b27e0→b371fc→b294c8→b2950c to the buffer/string conversion path. Raw numeric form values remain JSON strings.

LRb reads request body+57 atd0d9f0 and checks runtime type. A String body followsd0da5c→d0da74; the subsequent nonmultipart branchd0daac→d0dac0 skips both the form-content setterd0da6c and multipart setterd0dabc. These InfoLayanan routes also do not match the retained `/common/` regex. Therefore the JSON header **survives the reviewed initial LRb interceptor**. This resolves the specific earlier service-audit ambiguity about map-based form rewriting; it does not certify later retries, every Dio serialization byte or server acceptance.

The existing main-client tokenType + space + accessToken session rule remains applicable. A missing stored token forwards without that assignment; this is client optional-session behavior, not evidence of anonymous server acceptance. No caller checksum, special role, GPS or device proof is added in these bounded helpers. Read/calculation intent follows the UI and response shape; server nonmutation remains untested.
