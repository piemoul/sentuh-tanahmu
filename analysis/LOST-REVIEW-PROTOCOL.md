# Sertipikat Hilang: review protocol, native 6.1.5

This is a bounded **static** audit of the retained arm64 APK artifact, not an APK execution or a production response capture. No account values, credentials, review content, production requests or mutations were used. The prior lost-certificate ledger is unchanged. [Source hashes and instruction verification](recovered/lost-review-protocol/source-index.json) bind the evidence to `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

## Entry and read request

The lost-certificate detail constructs `JTb` at `91b318`, stores the original lost row's `berkasId` as `contentId` at `+0xf`, and the `ITb.pengumumanSertipikatHilang` enum at `+0xb`. Optional flag `yJj` defaults to false (`91b374`) and is stored at `+0x13`. The initial review subject contains an empty `List<zyb>`; constructor `91b444` starts loader `dacbec` without awaiting it.

With the default false flag, `dacc70..dacca4` calls service `dacd1c`. It asserts that `contentId` is nonnull at `dacc94/dacc98`; it does not trim or reject empty/whitespace Strings. Getter `91bae0` and enum helper `6bece4` derive the exact enum suffix `pengumumanSertipikatHilang`, rather than its display label or numeric index.

Service `dacd1c` passes a `Map<String,String>` directly as POST data to main-client helper `6b9270` at **`dace58`**, with path **`review/all`**. Its literal insertion order and values are:

| Field | Value | Binding |
|---|---|---|
| `reviewType` | `pengumumanSertipikatHilang` | key `dacd84`, value `dacd90` |
| `contentId` | Original nonnull `berkasId`, unchanged | key `dacd98`, value `dacda4` |
| `pageNumber` | String `"1"` | integer 1 `dacdb4`, `toString` `dacdbc` |
| `pageSize` | String `"10"` | integer 10 `dacdf8`, `toString` `dace00` |

There is no caller query, multipart construction, JSON encoding, header override or status predicate override in this builder. The captured function has no pagination arguments. No native request for page 2 or a different page size is established by this entry.

## Inherited transport

`SRb+7 → FRb+7` selects the main client. Main construction `6bb31c → 6b7fe0` and interceptor installation `6bb550..6bb588` reuse the existing transport evidence. The ordinary `LRb` interceptor identifies this map as neither `iP` FormData nor String and sets **`application/x-www-form-urlencoded`** at `d0da68/d0da6c`. The shared encoder preserves map order, encodes UTF-8 components, emits spaces as `+`, escapes `*` as `%2A`, preserves `~`, and uses uppercase percent hex. These are inherited from the separately pinned searchfile form proof, not newly observed network bytes.

The common-route regex `.*\/common\/([a-zA-Z]+)$` does not match `review/all`; the ordinary stored-session path therefore applies (`d0dc30`). It reads the existing account token model and constructs `Authorization` from `tokenType + " " + accessToken` at `d0df78..d0dfe0`, with the existing expiry/refresh behavior. An absent token model forwards the request without assigning that header. This is static client behavior, not proof of anonymous server permission; a browser account-session gate is an explicit application policy. No bundled application credential is used for this route.

The shared default status predicate `6b8f60` accepts nonnull **200–299**. Dispatch validates it before returning to the endpoint helper. Unlike several other app helpers, `dacd1c` has **no extra HTTP200 comparison**.

The shared client factory installs a `wP` transformer at `+0x13` (`6b8150..6b8160`) and the ordinary options default to JSON response type. Response transformation `d056d8` reads the first content-type value, then `d064f4` parses a MIME type and accepts `application/json`, `text/json`, or a subtype ending in `+json`. Missing or invalid MIME returns false. Parsed type/subtype are normalized via String selector `-0xffc` before storage (`6c1c98..6c1cf4`, the existing lowercase selector). The token parser supports `type/subtype` and parameter scanning; its complete whitespace, quoted-parameter and malformed-input grammar is not certified here.

JSON MIME plus JSON response type selects `d05864`, which invokes the byte-to-Object codec; the other path buffers bytes and invokes the UTF-8 text decoder `b22ce8`. Empty small JSON bodies return null. The service itself reads `response.data` and **requires `Map<String,dynamic>` directly** at `dace7c..dacea0`. It does not decode a String a second time. A JSON-encoded String or plain-text object text is therefore not a substitute for the required transformed Map. The codec initializer, malformed UTF-8/JSON behavior, and large/stream isolate paths remain outside this proof; do not claim complete parser parity from these branches alone.

## Typed response

Envelope parser **`yyb` CID795, `91b460..91b858`** reads these exact case-sensitive keys. Missing/null values remain null; there are no String/zero/bool defaults. Wrong nonnull scalar types fail the cast.

| Key | Stored slot | Type | Key / store |
|---|---|---|---|
| `totalRecords` | `+7` | `int?` | `91b4b4 / 91b504` |
| `resultsCount` | `+0xb` | `int?` | `91b538 / 91b588` |
| `pageSize` | `+0xf` | `int?` | `91b5bc / 91b60c` |
| `pageNumber` | `+0x13` | `int?` | `91b640 / 91b690` |
| `error` | `+0x17` | `bool?` | `91b6c0 / 91b710` |
| `message` | `+0x1b` | `String?` | `91b724 / 91b778` |
| `data` | `+0x1f` | `List<zyb>?` | `91b7a4 / 91b7d8` |

For nonnull `data`, the parser creates a list and dynamically traverses the input with closure `91b85c`. Every item must be a Map and is parsed by `77fe9c`; items retain source order and duplicates. The ordinary JSON array is the supported wire shape. No root-list, `message` list, nested alternate envelope, sorting or deduplication fallback is present. Arbitrary non-JSON Dart object/iterable behavior is not certified by this dynamic `forEach` call.

Review parser **`zyb` CID794, `77fe9c..7801b8`** has exactly five fields:

| Key | Stored slot | Type | Key / store |
|---|---|---|---|
| `reviewId` | `+7` | `String?` | `77fef0 / 77ff44` |
| `rating` | `+0xb` | `int?` | `77ff74 / 77ffc4` |
| `comment` | `+0xf` | `String?` | `77fff8 / 78004c` |
| `createdAt` | `+0x13` | `String?` | `78007c / 7800d0` |
| `reviewPhotos` | `+0x17` | `List<Ayb>?` | `780100 / 780134` |

There is no author/name/avatar field, rating clamp or date parser in this model. Empty Strings and nulls are distinct. For nonnull `reviewPhotos`, closure `7801bc` requires each item Map, creates an `Ayb` through `7802c0`, and appends in source order. A missing/null photo list remains null; an empty list remains empty.

Photo parser **`Ayb`, `7802c0..780480`** reads only these nullable Strings:

| Key | Stored slot | Key / store |
|---|---|---|
| `mediaId` | `+7` | `7802f8 / 78034c` |
| `mediaUrl` | `+0xb` | `78037c / 7803d0` |
| `createdAt` | `+0xf` | `7803fc / 780450` |

No URL rewrite, URI normalization or date conversion occurs in these model parsers. UI display and image-loading behavior are independently audited in [LOST-REVIEW-UI.md](LOST-REVIEW-UI.md). In particular, the model retaining `createdAt` does not establish that the native card displays it.

The `int?` casts do not coerce numeric Strings or double values. The existing [Dart 3.12.2 JSON number reference](webapp/lost-certificate-json-number-reference.json) is a separate SDK reference, not execution of this APK: selected integral lexemes within signed 64-bit remain exact ints; `.0`/exponent lexemes decode as doubles; values beyond signed 64-bit decode as doubles. Browser transport of an exact integer outside JavaScript's safe range as a decimal String is an explicit adaptation, not an accepted native input alias.

## Service and loader semantics

After parsing the envelope, `dacec4..daced0` **asserts `yyb.data` nonnull**, then returns `(error:false, rows)` at `daced4..dacee4`. Envelope `error`, `message` and count/page fields are not consulted to decide that tuple. Thus a typed nonnull list with envelope `error:true` still follows this native success branch. Keeping the typed envelope in a browser response is useful preservation of server data; native JTb receives only rows, not its counts.

The service catches the shared `sa` transport exception family (`dacf44..dacfa0`) and returns `(true, [])`. Other exceptions, including ordinary body/model cast/null failures, rethrow at `dacfe0`. Do not silently reinterpret every malformed body as a successful empty feed. Loader `dacbec` publishes rows to its subject only when the tuple error flag is not true (`daccc0..dacd00`). A caught transport failure leaves its existing list unchanged, initially empty. It does not publish a response message, total or pagination state in this chain.

## Identified alternate reads and write boundary

The non-default true `yJj` branch calls `dad12c` for `review/last_user_review`; it is not the default lost-detail list read and is not enabled by this audit.

A bounded existing callback `deabc4` calls writer **`dead38`** with contentId, reviewType, comment, integer rating, and local photo paths. The writer builds `Map<String,dynamic>` in order **`contentId`, `reviewType`, `comment`, `rating`** (`deada4..deae00`). For nonempty photos, it adds `reviewPhoto1`, `reviewPhoto2`, etc.; each item is a String filepath, passed to basename helper `77a9b8` and awaited multipart-file helper `d3ded8`. It wraps the map as `iP` FormData at `deaffc..deb00c` and sends **POST `review/post` at `deb030`** through the same main helper. The shared interceptor selects multipart Content-Type.

Writer success is only returned HTTP200 (`deb0c8..deb0e4`): return false means success; other returned status means true/error. It does not read response body fields. Caught `sa` returns true; other exceptions rethrow (`deb1a0..deb1b4`). The submit callback treats true as failure and only schedules a reread/closes its sheet for false. File conversion, filename/MIME resolution, media limits and complete compose validation are not closed by this protocol audit. **No write, last-user-review, upload, review-photo fetch, mutation or retry of a mutation is implemented or authorized by this finding.**

## Implementation limits

- Implement the narrow lost-certificate read with fixed native reviewType/page fields and original berkasId; do not expose arbitrary review types, pagination or unrelated content IDs.
- Preserve typed null/empty/count/error values. Require a nonnull data array for endpoint success, with typed nested rows/photos and no String unwrap fallback.
- Keep transport failure, malformed response, empty successful feed and session expiry distinguishable in browser behavior; native exceptions are not evidence of a helpful native error message.
- Session gating, stale-request ownership, escaping, safe image policy and JSON-size/redirect limits in a browser must be named as adaptations where they differ from the bounded APK chain.
- Production status, accepted permissions, actual reviews and server side effects remain unobserved. GPS, visit requirements, integrity controls and all submission bypasses remain out of scope.
