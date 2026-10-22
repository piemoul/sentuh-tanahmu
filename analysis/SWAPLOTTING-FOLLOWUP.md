# Swaplotting 6.1.5 — bounded UI/controller audit

The actual native menu leads through a user gate to a map and two land forms. It is not established as the generic `PlotBidang/DaftarPlot/GetDetail` list/detail route currently associated with the web route. No app/backend/catalog change or target execution was made by this audit.

- Frozen UI ledger: `analysis/recovered/swaplotting-followup/flow.json`, SHA-256 `6463b44d3efaf596fe07bcaa508f5cf6843c569e255669ddc5b5783d820c40fd`.
- Independent verifier: `analysis/rea/verify_swaplotting_followup.py`; PASS: 43 bounded windows, 11,020 unique ARM64 instructions, 395 pool bindings, 13 class records, 6 dispatch entries, 9 allocation headers and 152 positive instruction/literal checks.
- Public labels/options: `analysis/recovered/swaplotting-followup/public-copy.json`, SHA-256 `e738c6c3c79c0ffbe2be8a0b075ea4590250bbf9b6352ff44f4c8c5cb346c377`.
- Pinned ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

## Entry and form data

GYn callback `890094` → wrapper `6bd5d0` → `d8c5a0` reads the cached signed-in user. A nonnull value directly opens constant `mCb`; a null value opens the Swaplotting chooser. Its selected callback `890158` opens the same constant map widget and does not forward the selected object in this bounded callback. Chooser population and authority to act for another user remain unclosed.

Registered `oCb6262/_pCb5441` dispatches to factory `9fa740`, build `8cc3ac` and init `758d10`. Unregistered `rCb6261/_sCb5440` dispatches to factory `9fadc4`, build `8d35f0` and init `759e0c`. Factories create controllers `cCb660` and `fCb657`; both hold the actual shared write repository allocated by `cff824`. This allocator is CID747, not the similarly named declared repository class. The separate service ledger verifies its construction and HTTP behavior.

| Form | Land fields displayed | Contact/data sources | Local aggregate validation |
|---|---|---|---|
| Tanah Bersertipikat | Kantor; Desa/Kelurahan; Jenis Hak; Nomor Hak; Foto Dokumen; Uraian Singkat | `eCb658`; name/phone/email use the separate personal-user panel | Raw nonempty name, phone, email, right number and description; nonnull office/region/right options; nonempty photo list |
| Belum Bersertipikat | Letak Tanah; Kantor; Desa/Kelurahan; Alamat Tanah; Alas Hak and number/description; Bukti Pajak and number/description; Foto Dokumen; Uraian Singkat | `hCb655`; name/phone/email use the separate personal-user panel | Raw nonempty contact/address/all number+description fields; nonnull office/region/basis/tax options; nonempty photo list |

Registered right values are exact String codes `1`, `2`, `3`, `4`, `5`, `8` for Hak Milik, Hak Guna Usaha, Hak Guna Bangunan, Hak Pakai, Hak Pengelolaan and Wakaf, respectively. Unregistered Alas Hak and Bukti Pajak values are the literal displayed option Strings, not generated ordinal identifiers. Full ordered lists are frozen in `public-copy.json`.

Office loaders `d2baa8/d2bb84` call legacy/Kantah `d10268` and consume tuple.second without checking tuple.first. Office selection stores the selected option, clears region choice/options and calls legacy/Wilayah `d75224` through `d9fa68/da0d4c`. Office projection uses jyb+13 as ID and +17 as display name. Region projection uses **Cyb.WilayahId+13**, not Cyb.Kode+7; Nama+b is display text. Null/omitted copy arguments generally retain existing fields. Input callbacks preserve raw String values. The configured shared number formatter is not closed; no digits-only, length cap or IME behavior should be invented.

## Geometry, presence and declarations

Registered init copies widget+b LatLng through `7597c4` into eCb+b. Unregistered init passes widget+b through `759e9c(oJi)` into hCb+7. These form models receive a **point/LatLng**, not a parcel polygon or WMS/GeoJSON geometry. Map/GPS source and disclaimer proof belongs to the separate map audit.

Complete aggregates `8d2ca8..8d3158` and `8d8e4c..8d918c` do not check LatLng, GPS, distance, radius, accuracy, ownership, presence or an affirmative checkbox. The complete main land-form builds contain no explicit ownership/pernyataan checkbox callback. This is a bounded finding: shared controls, identity helpers, server-driven map disclaimer text and server rules are not thereby excluded. `Surat Pernyataan Penguasaan` is an Alas Hak option; selecting it is not verified ownership or consent. No remote-presence authorization, radius removal or fabricated declaration is established.

The photo add action shows `Maksimal 5 foto` when the current list has at least five items and there is no existing-item edit/index argument. Editing follows a different branch. Both forms launch the same camera screen with the certificate framing copy. Camera permissions/results, actual file data, capture authenticity, EXIF and device provenance remain unclosed.

## Separate read and write effects

Reference reads happen during form init/office selection. `Kirim` is a separate mutation: `d9f068` or `da0338` sets busy, validates the whole model and returns **null** after clearing busy when invalid, without reaching the write service. Valid forms call `d9f1c4` or `da0424`; a normally returned service true remains success and false remains failure. The separate service audit establishes payload/status/auth; these booleans have different meaning from Buku Tamu's error flag.

Outer callbacks `d9ebe0/d9ffd8` stop on null, show `Swaplotting Gagal` for false, or await local `Swaplotting Success` feedback for true. Success subsequently calls telemetry `d74828` with an office/region summary, adding right/number for registered land, and pops navigation. No telemetry or submission was executed. Local feedback does not certify land ownership, officer acceptance or official verification. Additional duplicate-submit guards, disposal, route ownership and thrown-error/finally recovery are not established.

Related frozen service ledger: `analysis/recovered/swaplotting-service-followup/flow.json`, SHA-256 `f5be07485685102e41ee39e0718f4d241dee0224fd70b3b6e447a37e0bdd65f9`. It independently inherits only the two canonical constructor proof files, avoiding a ledger dependency cycle.

## Managed-user OTP boundary

Adding a managed user is a distinct action. The native dialog allocates seven text controllers; its callback validates a Flutter FormKey and builds lCb649. Controller `d9df70` checks current users, stores the proposed model and calls **`d9e110`**, a separate identity-related POST boundary. This ledger does not certify that POST's complete request/auth/response contract or all seven shared-editor fields.

Only a successful result opens generic OTP with `otp_session_plotting_`, `OTP Plotting`, and the WhatsApp instruction. Opening generic OTP is message-capable, not an inert preview. Comparison `758fe0` compares an integer against the controller's local subject and returns OTP Benar/OTP Salah. This comparison is **not server-validated assurance**. Successful callbacks invoke the unclosed helper `d2ad8c` and then `d9e63c`, which serializes and persists local `user_plotting` through `cfefa0` and refreshes the controller. Local stored-user persistence is not itself server enrollment.

This observed OTP branch belongs to adding a managed user. The complete main plot-submit controller windows do not call it. Do not implement its local comparison as a verification bypass, auto-send OTP or infer absence of other server verification.

## Verification and remaining limits

Run offline with:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_swaplotting_followup.py
```

The verifier independently decodes every frozen instruction from the ELF and recomputes each annotated pool offset/value, verifies hashes/classes/dispatch/headers, then asserts the menu, fields/options, reference IDs, raw validation, add-photo gate, write gate/result and managed-user boundaries. It does not execute the target initializer or issue network requests.

No credentials or account values were read/exported. No runtime identity request, OTP message, camera/GPS action, telemetry or plot submission occurred. Shared editor/formatter/camera/lifecycle, chooser authorization, identity POST, OTP send/provider contract, dynamic legal text and final server acceptance remain gaps. This is not a complete end-to-end parity or physical-presence/ownership certification.
