# Tanya Berkas: native entry, conversation and submission

The selected-file identity, native visibility gate, conversation history, compose validation, request fields, response decision and refresh sequence are positively bound for Sentuh Tanahku **6.1.5**. This supplies a business contract for a separately tested browser implementation. It does **not** establish current server acceptance or complete SDK byte equivalence.

This was a bounded, offline REA audit of the retained ARM64 ELF. No APK, browser, provider, account request, question, Docker operation, runtime file or historical proof was changed or executed. A question to a land office must be submitted by an explicit user action, never by this audit or an automatic test against production.

## Frozen evidence

- ELF SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool SHA-256: `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- [Contract ledger](recovered/berkas-question-followup-20261022/flow.json), SHA-256 `ab802ec9225b175692ebe89c3fb2336a2e9f351ef6673fe6069c72725fbdaa18`.
- [Independent verification](recovered/berkas-question-followup-20261022/verification.json): **19 windows, 4,271 unique native instructions, 273 selected inherited instructions, 127 decisive markers, 163 pool bindings, 18 dependency hashes, four class records and three dispatch entries pass**.
- [Immediate-reference index](recovered/berkas-question-followup-20261022/immediate-reference-index.json) separately reproduces seven immediate `BL` references for four exact workflow targets. It does not enumerate indirect calls, inlining or every possible route.
- [Builder](rea/build_berkas_question_20261022.py) and [independent checker](rea/verify_berkas_question_20261022.py). Only the ledger's `.proof.asm.txt` sources and pinned dependencies are canonical; earlier `.asm.txt` files in the new folder are exploration.

## Entry belongs to the selected detail

The native **Tanya Berkas** action is visible only when **MAb+f is true and MAb+3b is false** (`89a05c..89a080`). It is not controlled by `readyToRating`. The semantic name of +3b is not independently recovered here; do not rename that flag to an assumed offline, permission or status meaning.

The already retained collection builder `87ec28` and search-result builder `8bd010` explicitly set +f=true/+3b=false. The Berkasku builder `8b0280` explicitly sets +f=false, so that variant does not expose this action. Do not add Tanya to every Berkasku detail merely because Rating is available there.

The action `8a9b80` navigates through builder `8a9bfc`. It captures **original MAb+13**, then stores that String into **aBb+b** (`8a9c3c`, `8a9d40`). Number and year are formatted separately with `/` and stored at **aBb+f** (`8a9d48`) for the screen title. The request ID is not the visible number/year, office ID, parcel ID or a user-entered replacement.

Class metadata gives aBb CID6275. Its create-state dispatch is `4096 + 6275 + 49635 = 60006 → 9f9338`, which allocates `_bBb` CID5452. The state build is `4096 + 5452 + 52114 = 61662 → 8b7178`; its lifecycle is `4096 + 5452 + 52643 = 62191 → 752c3c`. These links close the custom-widget boundary from the earlier [nested audit](BERKAS-NESTED-MAP-FOLLOWUP.md).

## Conversation history and presentation

State construction `9f9380` owns a text controller at +13, scroll controller at +17 and question controller at +1b. Controller construction `9f946c` resolves `DI<FRb>`, wraps it in the existing repository and initializes an empty `List<LAb>` plus separate read-busy and send-busy subjects, both false.

Lifecycle `752c3c` starts **GET `TanyaJawab/GetTanyaJawabBerkas?berkasid=<original aBb+b>`** through `d27fdc → d281e8`. The ID is directly interpolated into the path before shared URI processing; no caller query-map or encoding helper is inserted in this service. The main client is reached through repository+7 → FRb+7.

The transformed response's `data` must be a List. Each element must be a `Map<String,dynamic>` and is parsed through `752ce8 → 752d38` into this exact model:

| Key | LAb offset | Native type |
|---|---:|---|
| `berkasId` | +7 | String |
| `nik` | +b | String |
| `content` | +f | String |
| `isTanya` | +13 | String |
| `tanggal` | +17 | String |
| `waktu` | +1b | String |
| `namaKantor` | +1f | String |

All seven are required Strings: this factory supplies no missing/null/number/boolean default. In particular, **`isTanya` is a String**, and the bubble builder compares it with exact **`"1"`** (`8b7fe4..8b8018`). A generic truthiness conversion or boolean parser would change that behavior.

The screen shows **Ketik pesan...** as compose hint and **Kamu belum memulai percakapan** for missing/empty history. It uses the server list, compares adjacent `tanggal` Strings for date separators, displays `content` and `waktu`, and displays the reply's `namaKantor`. No `nik` identity lookup or visible NIK field is bound by this builder. A read-busy branch shows a progress control before history content.

The complete read service does not add its own HTTP200 or application-error-envelope decision before reading `data`; shared transport/status processing still applies. Controller `d27fdc` publishes an empty list for an error tuple, missing list or caught failure, then resets read-busy. Therefore an empty native conversation is **not evidence of a successful server response**. A browser may distinguish a read failure from a genuinely empty conversation, but that error display is an explicit adaptation.

There is no polling request in the selected complete screen, lifecycle and submit paths. Input callback `8b7bb8` schedules a **300,000 microsecond** delay and calls only the scroll scheduler (`8b7c34 → 7531b8`). The latter queues a post-frame callback; when a scroll client exists, it animates to the maximum scroll extent over 300,000 microseconds. This is a scroll delay, not a repeated history fetch. This bounded result does not claim that no other APK route can refresh the conversation.

## Compose and submission

The send control observes the dedicated send-busy subject (`8b7920 → 62d618`), showing progress while busy and the clickable send child otherwise. Its callback `8b7acc` performs one validation: **a trimmed copy of the editor text must be nonempty** (`8b7b14..8b7b1c`). It then reads the original editor value again and passes that **untrimmed String**, including surrounding whitespace, to `d992e8` (`8b7b5c..8b7b6c`). There is no native maximum text length or attachment, CAPTCHA, GPS, checksum or document field in this complete writer.

The repository service `d99448` creates this ordered **`Map<String,String>`**:

| Order | Field | Value |
|---:|---|---|
| 1 | `berkasid` | Original aBb+b String |
| 2 | `content` | Original editor text String |

It passes the map directly as `data` to **POST `TanyaJawab/SubmitPertanyaan`**, shared wrapper `6b9270`, at `d994f4`. It does not wrap it as FormData or JSON, add caller headers/options/query or replace the ID with the display number.

The main interceptor selects **`application/x-www-form-urlencoded`** for this non-String, non-FormData body. The retained Map transformer takes the non-JSON Map branch. Scalar values are String identity followed by `42eb74`, which invokes the percent encoder with **mask 1**, codec descriptor at pool+c50 and **space-to-plus=true**. The generalized map walker separates entries with `&`, uses `=` and has a separately observed key encoder closure at pool+cbe8, named `alc`.

The closure's final native entry pointer and the exact safe-character table were not independently resolved in this pass. The two fixed ASCII keys do not require escaping. The native scalar helper parameters are positive proof, but this audit does not certify every Unicode/malformed-string byte against a browser URL form encoder. No literal LF-to-CRLF normalization is present in this service/callback; any such browser serializer behavior would require separate comparison.

Both paths use the ordinary main account session. Controller construction explicitly resolves FRb, and both services load FRb+7. The pinned main constructor installs LRb; neither Tanya path matches its special common-route regex. The ordinary path forms Authorization from stored token type, one space and access token, with its existing pre-request token refresh. No bundled application credential was exported or reused by this audit.

## Result, refresh and back behavior

After shared response transformation succeeds, the complete submit service accepts **only HTTP200** (`d99514`, tagged native200 is `0x190`). It then requires a transformed **`Map<String,dynamic>`** and reads `error`:

- Missing/null `error` becomes **true**.
- A present value must be **bool**.
- Only exact **false** returns the service's success bool **true**.
- Non200, a non-Map root, `error:true`, missing/null `error`, a type error or a caught service exception returns **false**.

The service does not consume `message`, a question ID or a receipt. A JSON-looking text response must not be treated as that typed Map merely by sniffing its content. A caught transport error can occur after a question was accepted; native false alone does not prove that no server-side write occurred or that replay is safe.

Controller `d992e8` sets send-busy true, awaits the service bool, and on **true only** starts and **awaits** a same-ID history refresh (`d99380`, await `d9938c`). It resets send-busy and returns the original service bool. Catch paths reset busy and return false or rethrow through the exceptional path.

The UI callback behaves differently from a result dialog: it starts that asynchronous controller **without awaiting it**, then immediately clears the editor through the empty text-value constant (`8b7b88 → 810d30`, pool+22640) and schedules scrolling. It does not inspect the future's bool or show a success/failure dialog in this complete callback. Clearing the compose box is not a server-acceptance receipt. Browser delivery warnings, draft retention and session-bound context tokens should be described as deliberate browser adaptations rather than attributed to this native callback.

The back callback `8b7894` obtains the Navigator from the current context and pops. It does not send a question. Precise framework keyboard/IME/disposal behavior, all navigation variants and inherited theme colors are outside this bounded business proof.

## Verification and remaining limits

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_question_20261022.py
```

Business contract readiness does not mean implementation, production acceptance, all-function parity or a completed original-APK comparison. The exact SDK key-codec entry/safe table and complete byte equivalence remain explicit gaps. No server idempotency, retry safety, question ownership acceptance, GPS visit waiver or integrity bypass is established. This proof changes no webapp operation or catalog entry.
