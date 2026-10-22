# Personal Swaplotting multipart — original6.1.5 bounded follow-up

Static ELF/pool proof only. No upload, network, camera, GPS, identity/OTP, account value, presence assertion, runtime/catalog change or server success was performed. This follows the [service proof](SWAPLOTTING-SERVICE-FOLLOWUP.md); the capture flow is inherited and was not re-audited.

The frozen [ledger](recovered/swaplotting-multipart-followup/flow.json) is `31e4d9bbbdfdd7d77226d9cde0dfe5f6220311c5233f41382b0d03ae373c833e`. The independent [verifier](rea/verify_swaplotting_multipart_followup.py) re-decodes15 new windows/2,687 instructions and10 inherited windows/1,556 instructions, with no overlap:4,243 unique instructions,80 annotated pool bindings,22 public pool records, two allowlisted initializer metadata bindings and201 semantic checks. The996-entry MIME table is pinned by hash/length rather than exported. The [receipt](recovered/swaplotting-multipart-followup/verification.json) reports PASS;973 old proof/tool/history/document files remain unchanged. All79 current runtime hashes were separately checked unchanged at authoring against `post-capture-followup-baseline.json`; this is not an assertion that a historical native verifier should prevent future authorized runtime development.

The artifact remains `libapp.so` SHA `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. Existing Blutter objects were reused in isolated metadata helpers, with all20 shared objects unchanged. Only the `_Zqk` and `_EWg` Field descriptors and initializer addresses were exported; no initializer was executed and no static field value was accessed. The initial contract draft is retained separately; its overstatement that the header-copy helper was closed was corrected before the final ledger was frozen.

## Closed attachment facts

- Both service methods build `file: List<lP>`. FormData constructor `707bd4` calls recursive helper `6bc798`. List elements that are neither Map nor List get an empty suffix (`6bce6c→6bceb0`), then mapper `707ee8` recognizes CID3742. Each attachment therefore has repeated exact name **`file`**, in order. There is no `file[]`, `file[0]` or numbered key. An empty list emits no file part.
- Factory `8d1ddc` receives the real local file path and generated filename. It calls `8d1ea0` for native filesystem byte length, stores the filename, and provides a captured File stream. It explicitly passes contentType and custom headers as null. It supplies no MIME from the source path or magic bytes.
- Generator `8d1f84` returns formatter `8d23e4`, which reads16 bytes and joins16 alphabet entries with four hyphens. Metadata binds static `ZVb._Zqk` to initializer `8d28cc`:256 values built as radix16, padded to two characters with `0`. The service removes all literal hyphens before file construction. A successful generated attachment filename is **32 lowercase hex characters with no extension**. The camera's separate `.jpg` copy path is not this upload filename. UUID version, entropy, uniqueness and current clock/sequence state remain unproven; no UUID was generated.
- Constructor `77a508` infers content type from the supplied generated filename when explicit contentType is null. Lookup `77a6dc` first consults the resolver's custom String map, then the frozen996-entry map. A name with no dot is used whole as lookup key. The constant table has maximum key length11 and no32-character hex key. Metadata binds initial resolver construction to `77a898`, which creates an empty custom map. **With that untouched initial resolver, these filenames select the default application/octet-stream object.** Later custom-map mutation/current runtime state and the contentType object's complete String implementation are not newly closed. Do not silently replace this with `image/jpeg` or a browser Blob's MIME and claim native parity.
- Header builder `6fbdd4` constructs lowercase `content-disposition: form-data; name="…"`, appends `; filename="…"` for a nonnull filename, then CRLF and `content-type: ` plus contentType interpolation. It ends with CRLF CRLF. Name/filename escaping replaces CRLF/CR/LF with `%0D%0A`, and double quote with `%22`. It also loops retained custom headers. Helper `6b8abc` internals are not part of this frozen proof; only the personal caller's null argument is established. The complete header builder itself adds no checksum/auth/content-transfer-encoding field.
- File-loop callback `d0d4fc` emits boundary line, file header and byte stream in file-list order. It checks and sets the lP finalized flag before consuming its stream. `6fc808` passes supported byte containers through or converts List<int> to Uint8List; this is not an image codec. No explicit image decode/re-encode/compression/crop/watermark operation appears in these complete factory/open-stream/chunk wrappers. This does not certify Android camera output, OS/file bytes, EXIF, freshness or provenance.

## DTO boundary and next implementation eligibility

The existing service proof already closes ordered Map keys; this follow-up reuses them unchanged:

| Form | Exact order |
| --- | --- |
| Registered16 | id, kluster, namapemilik, kontaktelp, kontakemail, tipehakid, tipehak, kantorid, namakantor, wilayahid, namawilayah, nomorhak, reviu, lat, lon, file |
| Unregistered20 | id, kluster, namapemilik, kontaktelp, kontakemail, alamat, alashak, nomoralashak, keteranganalashak, buktipajak, nomorbuktipajak, keteranganbuktipajak, kantorid, namakantor, wilayahid, namawilayah, reviu, lat, lon, file |

Constants are literal `id="id"` and `kluster="K4"`. Registered trims only name, phone, email, nomorhak and reviu. Unregistered trims only name, phone, email, alamat, keteranganalashak, keteranganbuktipajak and reviu. Native trim includes U+0085. `nomoralashak` and `nomorbuktipajak` remain raw; option IDs/names are copied from their exact native slots. The shared scalar mapper converts null leaves to empty String; earlier model/option nonnull assertions still apply. There are15/19 scalar parts, plus one repeated `file` part per path. The service does not add another max5 check; the capture-form gate is separate.

A **pure local DTO/part descriptor builder without HTTP/auth/session effects is eligible** to implement these ordered fields, selective trim, scalar null rule, repeated file naming and declared byte handles. The input contract must expose the following unresolved boundaries instead of guessing them:

1. Coordinates are original LatLng binary64 values passed to native Double→String. [The separate formatter proof](recovered/swaplotting-coordinate-format-followup/flow.json) does not establish exact shipped-engine text parity. Accept explicit preformatted coordinate text or document a browser formatting adaptation; do not claim fixed7 or JavaScript String is exact.
2. Browser Blob/objectURL ownership and conversion to actual byte handles are browser adaptations of native File paths. Compact hex filename shape is proven; replacing the full clock/sequence generator with another UUID source is an adaptation.
3. Later MIME-resolver mutations, contentType rendering, full ordinary-field/body finalization, final closing boundary, top-level HTTP Content-Type/length/transfer encoding, text encoder internals, file-read errors and TLS bytes remain outside this bounded proof.

The native upload result is already closed by the prior service ledger: **HTTP200→true; other normally returned status→false; catch→false; response body ignored.** This was inherited, not duplicated into a speculative response decoder. A local builder cannot claim server success, legal ownership, measured accuracy, GPS presence, image authenticity or permission to retry a mutation.

Run only the static verifier with the existing interpreter:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_swaplotting_multipart_followup.py
```
