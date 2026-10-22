# Rating PPAT: native question UI and local selection

This additive audit closes the native 6.1.5 Rating PPAT screen's entry, initialization, visible question/answer binding, local selection, completeness check, and submit-controller handoff. It uses retained ARM64 evidence only. No application file was changed, no operation was enabled, and no provider request, account access, native execution, or submission was performed.

The existing [Aktaku proof](AKTA-FLOW.md) remains frozen. The separate [read/model proof](RATING-PPAT-READ-FOLLOWUP.md) owns GET `RatingPPAT/GetRatingQuestions`, its exact HTTP200/body contract, nullable models, and service/controller behavior. New UI ranges and the offline verifier are in [ratingppat-ui-followup](recovered/ratingppat-ui-followup/source-index.json), against the same APK's `libapp.so` SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

## Entry, state, and loading

The already proven Aktaku entry is in the nonempty certificate branch and requires `readyToRatingPPAT ?? true`. `8127a4 → 812804 → 81281c` navigates to `Kyb` CID6294, preserving `aktaId ?? ''`, `namaPPAT ?? ''`, and the existing controller at widget offsets `+b`, `+f`, and `+13`. It is not an Akta-detail request or a free-form Akta-ID input.

The dispatch table positively binds:

| Widget action | CID / selector | Table index | Target |
| --- | --- | --- | --- |
| Kyb createState | 6294 / 49635 | 60025 | `9f7ea0` |
| _Lyb initState | 5470 / 52643 | 62209 | `728f3c` |
| _Lyb build | 5470 / 52114 | 61680 | `87c830` |

The factory constructs a `Map<String,String>` and stores it at state `+13` (`9f7eb8..9f7edc`); the map constructor initializes its used/deleted counters to zero (`4354c8/4354cc`). It contains no preselected answer. The initializer reads widget `+13` and calls read controller `d1d4c8` at `728f68` without an explicit Akta-ID parameter or an await. This is an automatic question read on screen initialization.

The title concatenates the literal **`Rating PPAT `** and widget `+f` (`87c874..87c8a0`). The body subscribes to the controller's question stream `+13`. If snapshot data is null, or the read-busy subject `+1b` is true, it displays the native loading placeholder (`87ca0c..87caac`). Otherwise it builds the source list in order. The complete retained body has no separate search, sort, deduplication, retry button, or empty/error message branch. An empty nonnull list therefore reaches the ordinary empty list plus footer; it is not proof that a server error succeeded.

## Exact visible model binding

The read proof establishes all fields below as nullable Strings, with a nullable nested list. It also establishes that `kategori`, `bobot`, and `nilai` are validated as nullable Strings and discarded; they are not numeric score fields or question-type discriminators.

| Element | Native source | Visible/control use |
| --- | --- | --- |
| Group number | source index + 1, `87d190..87d21c` | Decimal String passed to group renderer |
| Group heading | `Gyb.indikator`, `+b` | `number + '. ' + (indikator ?? '')`, `87d364..87d3a4` |
| Group description | first `Hyb.pertanyaan`, `+b` | Empty String when answer list null/empty or first question null, `87d278..87d2c0` |
| Answer list | `Gyb.jawabanRatingPPAT`, `+f` | All answers mapped in source order through `87d73c`, `87d554..87d5a0` |
| Answer label | `Hyb.jawaban`, `+f` | Null falls back to empty String, `87d810..87d82c` |
| Answer control value | `Hyb.pertanyaanRatingPPATId`, `+7` | Null falls back to empty String, `87d8d4..87d8f0` |
| Selected group value | map lookup by `Gyb.pertanyaanRatingPPATId ?? ''` | Missing map entry becomes null, `87d8f8..87d954` |

The native String-choice widget is `vu<String>` CID6445, allocator `d86fc8`; metadata is retained in `1048985_qjn.dart`. The code positively wires the value, selected group value, and nullable String callback to its `+f`, `+13`, and `+17` fields (`87d970..87d9a4`), with the answer label at `+3b`. This is a radio-style single-choice binding, not a star rating, numeric input, or free-text answer. The callback metadata explicitly accepts `String?`. Full Flutter control rendering and pixel-identical layout were not dynamically tested.

The group ID is **not** the answer control value: both models use the JSON key named `pertanyaanRatingPPATId`, but they occupy different objects and distinct roles. Do not replace these values with labels, list indexes, `nilai`, or `bobot`.

## Local selection and unusual native cases

`87da30` ignores a null selected value (`87da78`) and ignores a null group ID (`87da90`). Otherwise it calls the state update helper `466d80` with closure `87dad4`. That closure reads the state map, null-asserts the original group ID, and calls `bbe678(map, groupId, selectedAnswerId)` at `87db38`. There is no trim, coercion, synthetic ID, or request in these complete callbacks.

These cases follow directly from the binding:

- Empty and whitespace group IDs remain real String keys. Only a null group ID blocks mutation.
- A null answer ID becomes the empty String control value and can be selected for a nonnull group ID.
- Duplicate group IDs share the same map key; later choices overwrite that key's value. Duplicate answer IDs are not deduplicated.
- Null/empty answer lists still preserve their group, but provide no answer controls.
- The group description uses only the first nested `pertanyaan`, while all nested `jawaban` labels remain separate choices. It does not create one question per nested answer.

Browser ownership, disposal, stale-response guards, visible errors, and guards against a native null crash can improve robustness. They must be named browser adaptations. The static source does not establish native account-switch concurrency behavior or a cache invalidation policy.

## Footer, completeness check, and handoff

The footer listens to controller `+1f`. Exactly true replaces the button with the loading placeholder; false or null builds **`Kirim Rating`** with callback `87ccec` (`87cc5c..87ccec`). It is not disabled until every answer exists. The callback passes the same state and displayed `List<Gyb>` to `d869a0` (`87cd2c`).

The asynchronous local helper reads the map's entry count as `(usedData >> 1) - deletedKeys`, compares it with the displayed group-list length, and takes the incomplete branch only for `map.length < groups.length` (`d869d0..d86a2c`). It does not iterate over group IDs or validate each pair. The incomplete dialog reads **`Jawab seluruh pertanyaan sebelum mengirim.`** and has **`Tutup`** (`87cf64..87d150`). It performs no submission. Duplicate/null group IDs can therefore prevent the count from reaching the group count, and an empty group list passes the comparison; these are native boundaries, not proposed browser validation rules.

On the other branch, the helper wraps the same map in `_md<String>` CID7545 and materializes it through `575c28` (`d86a78..d86a9c`). The dispatch table binds that wrapper's iterator to `5784dc`, which uses `startOffset=-1` and `stepSize=2` (`578574/578578`): it traverses the map's **value slots**, not its keys or key/value objects. Generic materialization `47e3b4` appends each iterator current value to the output List. No pass reorders the selection list to the source group list. The local Dart 3.12.2 SDK `compact_hash.dart` corroborates the compact map's values/entry-count interpretation; that SDK is a reference boundary, not an APK runtime oracle for every map mutation/order edge.

At **`d86ad8`**, the arguments are positively:

```text
d86bc8(
  controller = widget +13,
  aktaId = widget +b,
  selectedValues = materialized List<String>
)
```

The separate controller range `d86bc8..d86cd0` emits submit-busy true, forwards the exact ID and list to service `d86cd0`, awaits, clears busy, and returns its tuple unchanged. Its exceptional path clears busy and rethrows. That identification does not enable the existing POST. The read proof documents the POST's `aktaId` and uppercase `PertanyaanRatingPPATId` JSON keys; this UI proof now binds that second value to the materialized answer-ID List.

## Result dialog and limits

After a normal awaited controller return, `d869a0` captures the tuple, checks whether state context still exists, invokes shared navigation helper `75c000`, and opens builder `87cd44`. The builder displays the returned tuple's **String at `+f`** and **`Tutup`**. The local helper does **not** inspect the tuple's bool field before this path. The service proof independently validates the String message and its catch fallback. An escaping exception is not a proven normal result dialog.

Both dialog close controls use the retained shared callback `728800 → 7257e8`; that complete callback has no request. Exact framework navigation-stack consequences of `75c000` and `7257e8`, backdrop/system dismissal, upstream write acceptance, and final Aktaku refresh are not newly established here. Do not infer successful submission merely because a result dialog is shown.

The source range beginning `87dc38` belongs to the following **Aktivitas** widget, and factory bytes after `9f7ef4` belong to other factories. They are excluded from Rating function claims even though the immutable retained windows include those adjacent bytes.

The eligible next implementation is the authenticated, strict question read and native-bound read-only presentation from the existing Aktaku entry. This audit does not establish complete menu parity, a production Rating write, booking, physical-presence/geotag bypass, or native end-to-end success.

## Offline verification

The [source index](recovered/ratingppat-ui-followup/source-index.json) and [actual verification receipt](recovered/ratingppat-ui-followup/verification.json) pin new ranges, old entry evidence, metadata, pool, dispatch table, the original ELF, shared helper evidence, and the separate raw controller/model sources. Re-run without writes:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/ratingppat-ui-followup/verify_sources.py
```

The verifier checks retained instructions against original ELF bytes, decisive markers and pool references, complete claimed UI-function coverage, allocator CID arithmetic, and four dispatch bindings. Its result is static evidence verification only. It does not import application code, use credentials, call the network, execute a POST, or modify the application.
