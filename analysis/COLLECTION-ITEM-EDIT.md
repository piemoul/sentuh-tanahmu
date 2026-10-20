# Native collection Caption/title edit audit

The native **Edit Caption** action edits a collection row's **title**. It does not edit `subTitle`, rename a group, move membership on the server, or refresh collections after saving.

Evidence is static ARM64 ELF, the matching Blutter pool and class metadata, and a pinned dispatch table. No APK runtime, account requests, network writes, or application changes were performed for this audit.

## Identity and reproducibility

| Input | SHA-256 |
| --- | --- |
| `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so` | `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` |
| `analysis/recovered/blutter-unique/pp.txt` | `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04` |
| [Canonical flow ledger](recovered/collection-item-edit/flow.json) | `eabdaed76d862c8a5dd6a8feb1d927233e18a5755263c25614ff04fe3f86d4c8` |

Run `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_item_edit.py` from the workspace root. The [frozen verification receipt](recovered/collection-item-edit/verification.json) records **13 new proof ranges / 1,757 instructions**, **21 inherited ranges / 4,363 instructions**, **131 decisive markers**, **94 new / 249 total pool bindings**, **31 dependency hashes**, **5 dispatch entries**, **7 class metadata records**, and **8 parser-to-constructor field bindings**. The verifier independently decodes all **6,120 instructions** from the pinned ELF, checks exact source text and safe pool annotations, and asserts the behavioral landmarks below.

Inherited ledgers and proof files are unchanged. Exploratory files under this audit's directory are noncanonical and are excluded from the verifier's source counts. The canonical ledger does not depend on those exploratory files.

## Entry and eligibility

The complete `FEb` / `_GEb` card at `0x8fcd30` always constructs the edit icon callback at `0x8fd578 → 0x8fe068`, after the separately conditional assignment icon. There is no edit-specific type, group, cached-group, or busy predicate in this icon construction. A native busy overlay may intercept actual taps; generic Flutter hit testing was not observed.

The parent controls availability:

| Screen | Edit action |
| --- | --- |
| Koleksi → Bidang root | Parent filters exact `PERSIL`, then renders `FEb`; edit is available on those cards. |
| Selected Bidang group | Parent filters only nullable `row.groupId == selectedGroup.collectionGroupId`; any row type rendered there receives the same `FEb` edit action. This includes `BERKAS`, unknown, and null type if such rows are returned. |
| Koleksi → Berkas root | Separate complete `DEb` card `0x8fbe74..0x8fc680` has the delete action and no edit action. Do not add edit here by inferring applicability from the service name. |

Sources: unchanged [grouped-read ledger](recovered/collection-groups-followup/flow.json), [Berkas card ledger](recovered/collection-card-followup/flow.json), and new [entry/dialog proof](recovered/collection-item-edit/edit-entry-dialog-input.proof.asm.txt).

## Dialog, input, busy state and cancellation

`0x8fe068` loads `row.title` from `wEb +0x1b`, falls back to the empty String only for null, and assigns the card's text controller through `0x678d84`. It then opens the dialog through `0x726368`. Opening makes no request and does not trim the initial text. Every opening resets text from that row's current title.

| Element | Native value |
| --- | --- |
| Title | `Edit Caption` |
| Single input label | `Caption` |
| Hint | `Tulis sesuatu biar mudah dicari di koleksi` |
| Cancel | `Batal` |
| Save | `Simpan` |

The caller creates one `MSb` input widget, binds its controller, and sets integer slot `+0x2f = 1`. It supplies no title-specific validator, length limit, duplicate-title check, or changed-value check. Complete generic widget formatting, IME, and grapheme semantics remain outside this audit.

`Simpan` is bound whenever local busy is false, even if text is empty or unchanged. On activation, `0xda7f24` reads the text, trims it through the same `0x447974` implementation already proved for group creation, and silently returns if the trimmed length is zero. That branch leaves the dialog open without busy state, request, or validation message.

Trim removes these characters from the two ends only: `U+0009..U+000D`, `U+0020`, `U+0085`, `U+00A0`, `U+1680`, `U+2000..U+200A`, `U+2028`, `U+2029`, `U+202F`, `U+205F`, `U+3000`, and `U+FEFF`. Interior characters and case are retained. The captured trimmed String is used both for the request and subsequent local cache update.

The card-local busy flag `_GEb +0x17` starts false. `0x8fe9a4` sets it true before awaiting; `0x8fe97c` resets it after ordinary completion and in the caller's exceptional cleanup. While busy, `Batal` has a null callback. The save helper `0x7faf94` receives `MDf = !busy`, `Vqc = busy`, and `ind = Simpan`; the busy branch replaces the button with a loading widget rather than a new saving-text label. Its `mTb` widget selects `assets/anim/Loading_dark.json` or `Loading_light.json`. The input remains editable: this dialog does not bind its disabled state to busy. Edits made while a request is pending do not change the already captured request/cache value.

Enabled cancellation `0x8fe9cc` clears the text controller via `0x810d30`, then closes the dialog via `0x7257e8`. It makes no request or cache mutation. Generic backdrop/back dismissal and pointer behavior are unproved.

Sources: [entry/input](recovered/collection-item-edit/edit-entry-dialog-input.proof.asm.txt), [busy/cancel](recovered/collection-item-edit/busy-and-cancel.proof.asm.txt), [save helper](recovered/collection-item-edit/save-button-helper.proof.asm.txt), [loading widget](recovered/collection-item-edit/loading-widget-build.proof.asm.txt).

## Exact request and acceptance

The UI caller awaits controller `0xda812c`, which awaits service `0xda82e0`:

```text
PUT Collection/EditCollectionPersil
Content-Type: multipart/form-data; boundary=<generated>

id      = row.id ?? ''
caption = captured trimmed input
```

Field insertion order is **`id`, then `caption`**. `id` is the collection row's `+7` field, never `contentId` or a parcel ID. No ID trimming, UUID check, empty-ID check, type check, group check, or caption validation is repeated by the controller/service. Normal UI input prevents an empty trimmed caption; the wider direct-service boundary does not repeat that guard.

The body is `iP` FormData, through the existing constructor `0x707bd4` and field mapper. No files, caller query, caller headers, or custom request options are supplied. Main client binding is `service +7 → FRb +7`, with the same stored-account session and refresh interceptor as the earlier grouped reads and mutations. Wrapper `0x8fe7cc` explicitly selects `PUT` before common transport `0xd00690`. No privileged authentication material was recovered or exported.

Only **HTTP 200** enters the success parser. It requires an already decoded, nonnull `Map<String,dynamic>` and reuses `yEb` at `0x74ae18`:

| Field | Accepted type |
| --- | --- |
| `error` | nullable Boolean |
| `message` | nullable String |
| `data` | nullable String |

Missing/null fields remain null, empty strings remain empty, and a wrong nonnull field type causes parser failure. The helper does not perform a second JSON String decode. A valid 200 envelope returns `(false, envelope)` **even if `envelope.error` is true**. Other normally returned statuses yield `(true, null)`; shared transport's broader 200–299 predicate does not expand this helper. A caught `WO` exception with a parsable response Map yields `(true, envelope)`; absent, malformed, or otherwise failing responses yield `(true, null)`.

Sources: [caller/controller/service](recovered/collection-item-edit/submit-controller-service.proof.asm.txt), [PUT wrapper](recovered/collection-item-edit/put-wrapper.proof.asm.txt), inherited strict parser, multipart and session proofs listed by hash in the ledger.

## Local update and the group-ID clone quirk

The controller returns `Future<void>`. It does **not** set shared loading or clear shared error before the request. Only the helper tuple's `error` member selects success or failure; the body envelope's `error`, `message`, and `data` are ignored on the success path.

After the awaited request succeeds, the controller reads the **current** cached rows from subject `tEb +0xb`. It does not reuse a pre-request rows snapshot. It maps the whole list, materializes it and publishes it. Every exact matching `row.id == submittedId` is replaced; nonmatching objects are retained, and ordering and list length are preserved. There is no deduplication, sort, GET, optimistic update before acceptance, response-data insertion, group publication, or loaded-flag change.

The complete mapper `0x8fe860..0x8fe97c` constructs a fresh `wEb` object for each matching ID:

| `wEb` slot | Meaning | Result |
| --- | --- | --- |
| `+7` | `id` | copied |
| `+0xb` | `type` | copied |
| `+0xf` | `contentId` | copied |
| `+0x13` | `createdAt` | copied |
| `+0x17` | `email` | copied |
| `+0x1b` | `title` | captured trimmed caption |
| `+0x1f` | `subTitle` | copied |
| `+0x23` | `groupId` | **omitted; remains null** |

This slot interpretation is bound independently from the complete original row parser's JSON key → stack slot → constructor slot sequence. In particular, `title` is `+0x1b` and `subTitle` is `+0x1f`. Earlier informal suggestions that the Caption input edits the subtitle are incorrect.

The null `groupId` is supported by the complete new-object store sequence and the allocator: `0xd31c80` identifies `wEb` CID 608 and calls `0xe273d0`, which initializes object payload slots to null. The clone writes seven fields and never writes `+0x23`.

Consequently, an edited row may disappear immediately from a selected nonnull group in the native client's cache. A null-ID selected group may gain the edited row. Group objects and the selected group's original title/filter object remain unchanged; computed counts reflect the changed row list. **This is evidence of local client cache construction, not proof that the server removes group membership.** A later server read may restore the original membership.

The caller normalizes a null target `id` to `''`. Null row IDs do not equal that empty String, whereas all rows with an exact empty String ID match. All duplicate exact IDs are changed.

Sources: [success row mapper](recovered/collection-item-edit/success-row-mapper.proof.asm.txt), [row allocator](recovered/collection-item-edit/row-allocator.proof.asm.txt), [null initialization](recovered/collection-item-edit/allocation-null-initialization.proof.asm.txt), inherited row parser and selected-group proof.

## Failure and navigation order

On a helper failure, the controller publishes `envelope?.message ?? 'Gagal Memperbarui Caption'` to shared error subject `+0x17`, retaining a nonnull empty message. Rows stay unchanged. A caught controller exception publishes the exact String `Terjadi kesalahan` without appending the exception. Both controller branches return normally; success does not clear an older shared error.

After either normal result, the UI caller resets local busy and closes the dialog if its context is still mounted. **Failure therefore closes the dialog too.** Close is after the request and any local row publication. There is no Boolean result branch, success toast, or refresh. A separately exceptional caller path resets local busy and rethrows; close is not guaranteed on that path.

The complete edit dialog does not subscribe to the shared error. The bounded root Bidang build subscribes to loading/rows/groups; the selected group subscribes to rows/busy index. No error-subject banner, toast, or snackbar is present in these inspected callers. Error consumers elsewhere in the APK remain unproved. A browser activity record, accessible error explanation, session ownership guard, stale-result guard, duplicate-click guard, or input cap must be identified as a browser adaptation rather than claimed as native behavior.

The native mounted check guards dialog closing only. It does not prevent the controller updating its shared rows after a route change. No session ownership logic is established here.

## Remaining limits

- No native runtime, authenticated account operation, or server acceptance was observed.
- Generic Flutter modal/input behavior and exact pixels are not certified.
- Other card operations, group rename, server internals and membership side effects are outside this edit audit.
- This audit performs no geotag or location submission and does not implement a physical-visit bypass.
