# Beri Ulasan: native 6.1.5 POST and media protocol

This additive static audit closes the review writer's request, source-file wrapper, MIME selection, multipart framing and response transformation. It uses the same arm64 `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. No APK execution, initializer execution, account/credential read, production request, file upload or runtime/catalog edit was performed by this audit. Previous read/UI ledgers and release receipts remain unchanged. [Source index and verification](recovered/lost-review-post-protocol/source-index.json) retain the bounded evidence.

## Request and source types

The previously bound JTb callback `deabc4` calls writer `dead38` at `deac84`. The lost-detail caller binds `contentId` to its original `berkasId` and `reviewType` to enum suffix **`pengumumanSertipikatHilang`**. It does not send the displayed document number, persilId or reviewId instead. The callback asserts contentId nonnull. The comment comes from the compose String, rating is an integer, and the photo selection supplies an ordered list of local String paths. Detailed UI validation and picker behavior are independently bound in [LOST-REVIEW-COMPOSE-UI.md](LOST-REVIEW-COMPOSE-UI.md).

Writer `dead38` always constructs these four `Map<String,dynamic>` keys, in order:

| Key | Value | Key / store |
|---|---|---|
| `contentId` | Original caller String, unchanged | `deada4 / deadb0` |
| `reviewType` | Enum suffix String, unchanged | `deadb8 / deadc4` |
| `comment` | Comment String, unchanged | `deadcc / deadd8` |
| `rating` | Boxed native integer | `deade0 / deae00` |

There is no service trim, text default, rating clamp, ID substitution, image transform or omitted-empty-field branch. The ordinary compose path supplies nonnull Strings and an int; shared FormData's ability to stringify a raw null does not make null a valid compose value.

If the photo list is nonempty, the writer iterates it in source order. Counter `deae64` starts at 1; `deaedc/deaf0c` form **`reviewPhoto1`, `reviewPhoto2`, ...**. Each item must be a nonnull String (`deaf24..deaf4c`). It converts each file sequentially and awaits that conversion before inserting it at `deafd0`. There is no independent count, size, extension, magic-byte or image-content limit in this complete writer. An empty list emits no file parts. There is no `reviewPhoto{n}`, repeated `reviewPhoto`, bracket suffix, JSON photo array or nullable placeholder part on this wire.

After all files are constructed, `deaffc..deb00c` wraps the map with **`iP` FormData CID3744**, then makes **POST `review/post` at `deb030`** through main helper `6b9270`. No query, caller options or additional caller headers are supplied.

## Basename, source bytes and part metadata

At `deaf70..deaf88`, the source path is passed through **Context `TJc` basename `77a9b8`**, and the original path plus returned basename are passed to **`d3ded8`**. This is not the UUID renaming used by a different application feature.

Descriptor-only metadata binds `TJc` pool `11c80`, static offset `988`, initializer `632da0`; it creates a Context from `Enb.LKe` (`632dcc`). That style initializer (`632e28 → 632e54`) chooses URL/Windows/POSIX style from the base URI and platform file-path behavior. The normal Android filesystem branch uses POSIX style `Enb.qHf → 633040 → 633080`, whose name is `posix` and separator is `/`; the other two styles are explicitly retained as conditional branches, not observed runtime values. Do not apply the Windows host's basename function to Android paths.

Basename itself parses the path via `632ac0 → 6321b8`, strips trailing empty components using `77a9ec → 656dfc`, then returns the last component through `5df560`; root/empty component lists fall back to the parsed root or empty String. The ordinary Android path basename retains spaces, Unicode, quotes and backslashes within a component. It is not URI-decoded, globally trimmed, shortened to 180 characters or sanitized by this service. Android gallery cache-copy naming happens earlier in the independently audited picker and must not be confused with this HTTP basename operation. Complete cross-platform URI/base-directory behavior was not executed; browser File.name is a declared replacement for the Android path source.

`d3ded8..d3dfdc` creates a File from the **original path**, awaits length (`b58338`), captures the File into a stream factory (`77ab34`), and constructs `lP` CID3742 through `77a508` at `d3dfcc`. The length callback `b583fc` checks the result as an int after the filesystem error check; no hardcoded size limit occurs here. The factory supplies the explicit basename as filename, **contentType=null and custom headers=null**. Filename fallback `77a958` exists only if the factory's filename argument is null; the review caller already supplies the basename.

The retained `77ab34 → 77ab78 → 77abd0` stream wrappers read that File's bytes. Chunk wrapper `6fc808` passes a recognized byte array through or converts List<int> to a byte array. They do not decode, crop, compress, re-encode, sniff MIME, rewrite EXIF or generate a checksum. Source-file lifetime, OS errors and bytes returned by a particular Android provider are not runtime observations in this audit. A filesystem/type failure before the HTTP call is not automatically the writer's caught transport-failure bool.

`lP` stores byte length at `+7`, filename `+0xf`, custom headers `+0x13`, contentType `+0x17`, stream factory `+0x1b` and finalized flag `+0x1f`. A finalized file/form is single-use; SDK reuse checks do not authorize an automatic write retry.

## MIME: complete initial resolver table

Because the factory passes no explicit contentType, `77a508 → 77a630 → 77a6dc → 77a73c` derives it from the supplied **basename**, not the full source path, browser Blob.type or file contents. `77a630` trims a **lookup copy only**; the stored wire filename remains unchanged. `77a7fc` takes the substring after the final dot and lowercases it; no dot or a trailing dot uses the whole lookup filename as key. Lookup checks the resolver's custom map first, then pool `15ce8`'s immutable table. Metadata-bound initial resolver construction `77a898 → 77a8d8` starts that custom map empty.

The [full retained MIME table](recovered/lost-review-post-protocol/mime-table.json) contains **996 unique String pairs, zero duplicate keys**, extracted from that one public constant table. It is not an image-extension allowlist. Examples: jpg/jpeg/jpe → image/jpeg; png → image/png; webp → image/webp; gif → image/gif; heic/heif/avif retain their corresponding image type. Known non-image extensions retain their table value too. Missing lookup results select **`application/octet-stream`** (`77a5d0..77a5f0`). Do not invent a JPEG default merely because the UI opens an image picker.

An existing global mutable custom MIME map could affect later application state; this audit proves the shipped initial map and the review caller's absence of a custom override, not absence of every possible mutation elsewhere. A deterministic browser adapter using the pinned table reproduces that initial configuration.

The resulting MIME object's CID1600 `toString` selector `ab4d` resolves to `a806d0`. It emits `type + '/' + subtype`, followed by parameters if present. These table-derived MIME values have no caller parameters, so the part type is the derived media type alone.

## Scalar conversion and multipart bytes

FormData constructor `707bd4 → 707cac` traverses the source map. Mapper `707ee8` separates `lP` values into the file list and scalars into the ordinary field list. A scalar null becomes **empty String**, otherwise it calls `toString`; String dispatch is identity. Thus all four supplied fields remain present; rating becomes decimal integer text. Strings are not JSON-quoted or URL-encoded. There is no native service rating range beyond the UI constraints.

Finalizer **`6fc248`** emits all ordinary fields first, preserving their order, then invokes `d0d4fc` for file parts in photo order. For boundary `B`, scalar part `K=V` is:

```text
--B\r\n
content-disposition: form-data; name="K"\r\n
\r\n
V\r\n
```

The actual separators are CRLF bytes; the notation above shows escapes. Text is passed through the shared UTF-8 encoder. Scalars carry no per-part content-type in this builder. File header `6fbdd4` adds `; filename="F"`, a CRLF and `content-type: DERIVED_MIME`, then CRLF CRLF; the file stream follows and `d0d4fc` appends CRLF. No per-part Authorization, checksum or content-transfer-encoding is inserted by these builders. Name and filename escaping `6fc1ac` replaces each CRLF, lone CR or LF with literal **`%0D%0A`**, then `"` with **`%22`**. It does not URL-encode all characters or use a filename* field.

Success completion callback **`6fc654`** emits exactly **`--B--\r\n`**. Empty photo lists still retain all four text fields and that terminator. The CRLF byte-array initializer is metadata-bound to `6fc854` and writes integer bytes 13,10.

The stored native boundary is constructed at `707c78..707d88`: literal **`--dio-boundary`**, `-`, and `707df4`'s decimal random value in `[0, 2^32)`, left-padded to 10 characters with `0`. The delimiter adds two more hyphens. No random value or app initializer was executed by this audit. Exact RNG state/entropy and OS scheduling are not certified.

Main body processing **`d0c910`** recognizes `iP`, sets **`multipart/form-data; boundary=B`** (`d0c9b8..d0ca18`), obtains the stream from `6fc248`, computes exact encoded length with `6fba6c` and sets **content-length** at `d0caa0..d0caac`. The length includes UTF-8 field/header bytes, declared file lengths, all boundaries and CRLF. HTTP engine/TLS framing, malformed UTF-16 encoder corner cases and a specific randomized wire sample remain SDK/OS boundaries. A browser's native FormData boundary/header spelling is an adaptation unless a dedicated encoder reproduces this framing.

## Main account session and status

The service reads `SRb+7 → FRb+7` and uses the existing main client. `LRb` selects multipart Content-Type for `iP`. Its common-route regex does not match `review/post`; ordinary stored-account tokenType + space + accessToken Authorization applies, with its existing pre-request expiry/refresh behavior. Missing stored model forwards without that assignment natively; a browser account gate is a deliberate restriction. No application credential, new device/GPS/integrity field or extra business parameter is established here. Existing native transport mappings remain pinned; no credential values were recovered.

Once the shared transport returns a response, `deb0c8..deb0e4` compares **HTTP200 only**. It returns **false on success**, true for another returned status. The business helper does not read response body, error/message/data, review ID or receipt. Shared default validation rejects non-2xx before this status branch. Its catch returns true only for shared `sa`/WO transport exceptions; other exceptions rethrow (`deb1a0..deb1b4`). Callback false-success triggers the already audited first-page reread and modal close; true-failure does not. There is no automatic retry in this writer/callback chain.

## Response transformation before HTTP200 success

Ignoring business body fields does **not** mean skipping the shared response transform. Dispatcher `d05500` awaits `d056d8` before returning a response or applying the retained status decision. Catch `d0567c` normalizes an exception with **`6b93a8`**, which preserves an existing WO or allocates WO CID3758 (`d0112c → 6b9428`), then rethrows. WO implements `sa`. A JSON/UTF-8 transform error therefore reaches the writer as true/failure, even if the remote HTTP status was200.

The previously pinned MIME predicate accepts application/json, text/json and subtype suffix +json. Missing/invalid/non-JSON MIME uses the text path. The JSON response path is closed further here:

- Descriptor pool `d2c8`, static offset `9c4`, binds `wP._MLf` initializer **`6c040c`**. It allocates converter `_hg` CID7168 and stores false at `+0xf`.
- CID7168 selector `b68` resolves to **`b2b098`**. It passes that flag through `b2b104 → b2b178` into the native `_Utf8Decoder` at `+7`, parses the full input (`448398`), calls parser close (`4f0c78`) then returns the parser result (`4f0a10`). No Map/envelope/boolean-error shape check occurs in this converter or writer.
- The same-version local Dart3.12.2 `convert_patch.dart` corroborates the fused JSON/UTF-8 converter structure, **allowMalformed=false**, and optional initial UTF-8 BOM handling. This is source corroboration, not APK execution or a claim that every parser instruction/number/Unicode edge was independently re-audited.
- **Empty JSON bytes** have a native transport shortcut returning null (`d059d4..d059e0`, isolate helper `d05b30..d05b3c`). Nonempty whitespace must pass JSON syntax and fails. A nonempty valid JSON object, array, String, number, boolean or null can reach HTTP200 success; envelope `error:true` is not inspected. Malformed JSON or malformed UTF-8 that raises in this decoder cannot become success.
- Non-JSON MIME buffers bytes and calls **`b22ce8` with named `jac=true`**. That selects constant `gg` at pool `44c0` with true malformed-replacement flag, then `b2aa78`; it does not JSON-parse the resulting text. Consequently malformed JSON-looking text under text/plain is not a native business-response error. A browser must not apply a generic JSON-object sniffing rule here.
- The ordinary small-buffer, stream, and >=51200-byte isolate dispatch all use the same stored converter or its `_OLf` wrapper. Different scheduling and parser/decoder implementation details are not browser runtime observations.

A bounded response byte limit, strict UTF-8 JSON gate, optional BOM handling, no write retries, session-expiry handling, file count/size/filename guard and clear browser error display must be identified separately where they restrict native behavior. In particular, an early cancel that treats **every** HTTP200 as success despite malformed JSON would violate the bound transform path. Error body contents must not fabricate a successful review receipt.

## Scope of this closure

This proof supplies the complete bounded writer shape and the relevant shared media/wire/status contracts for a separately tested adapter. It does not establish server acceptance, stored review identity, permissions or remote media content. UI picker/naming and validation belong to the compose UI proof. Full SDK parser/HTTP/TLS/randomness/OS equivalence remains an explicit limit; no missing business fields or file metadata were guessed to fill it. This audit itself enables or submits nothing.
