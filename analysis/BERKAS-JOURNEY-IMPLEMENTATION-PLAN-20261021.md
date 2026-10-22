# Perjalanan Berkas: implementation plan from the native snapshot

Read-only planning, 21 October 2026. No application, test, receipt, formatter, account, or provider was changed or executed by this planning task. This plan uses `BERKAS-JOURNEY-UI-FOLLOWUP.md` and source index SHA256 `7fdc7fa2a24cc154813b547ce7cd9e1f7167439abd0b52c08dfa2b8cba8bafbe`, plus the current browser detail renderers.

## Implementation boundary

Implement the separately navigated native RAb history as a local child view of the already loaded primary ABb detail. It needs no new operation, identifier input, endpoint, body, geolocation, map, submission, or backend adapter. Keep all operation fingerprints, enabled flags, and backend bytes unchanged.

Keep `berkasJourneyCurrent()` as the collapsed-summary selection helper. Its main-status/nameProfile fallback is a different native rule. Replace the current expanded `<details class="berkas-history">` list with an explicit entry to the child view; do not reuse the collapsed helper to select the expanded active index. Do not incidentally change the existing collapsed text/date behavior in this batch.

## Entry points and authoritative source

| Existing browser path | Primary detail source to retain | Entry integration |
| --- | --- | --- |
| Berkasku → selected record | `loadBerkasDetail()` successful `response.result` | Pass a journey owner into `berkasDetailView()` before its HTML is mounted. `flowDetail` is a list item and is not the primary ABb. |
| Koleksi → BERKAS | `loadCollectionDetail()` successful response, passed through `collectionDetailView()` | Retain the primary snapshot and collection owner/tab/group/item identities already used by the detail loader. |
| Aktivitas → BERKAS | `loadActivityDetail()` successful response through the same renderer | Retain its activity owner/sourceResponse/item identities. |
| Cari Berkas → displayed search result | `searchFileResultView(owner)` and exact `owner.response` | Preserve `searchFileState`, selected office, raw nomor/tahun, CAPTCHA state, and existing prefetched SOP/print data. |

All four use the same pure snapshot projection and renderer. Enable entry only from a recognized primary ABb and an actual journey Array. An empty Array must remain openable: native RAb has an empty state, and exact status `'0'` changes the empty-list case. A null list reaches a native caller assertion; show a local unavailable boundary rather than fabricate an empty list or crash. That null guard is an explicit browser adaptation.

The supplied native title is `Perjalanan Berkas · ` plus main `nomor.toString()`, without a newly added `/tahun`. Main `statusBerkas.toString()` supplies the status String. Null conversion is the ordinary `'null'` String, rather than a dash. Perform these conversions only after the existing typed ABb boundary; do not accept a string/alias in place of an integer main status merely to trigger the zero branch. Existing browser numeric precision limits are not newly solved by this view.

## Pure projection and row rules

Use a small standalone model module, for example `assets/berkas-journey/model.js`. Accept the number/status Strings produced at the native caller boundary and the typed journey list; return an independent snapshot of its rows, active index, source indices, display states, ordinals, and continuation flags. Copy only the four BBb fields: `taskNodeGroupId`, `tanggalFlow`, `namaGrup`, `isCurrent`. Validate nullable String/String/String/bool boundaries, preserve nulls/empty values and duplicates, and never mutate the original list or records.

Apply this order exactly:

1. Copy the input rows in source order. Do not sort by dates, reverse, filter, or deduplicate them.
2. Only when the supplied status String is exactly `'0'`, prepend `{taskNodeGroupId:'', tanggalFlow:null, namaGrup:null, isCurrent:false}`. This row has no original source index. It is not main `namaProfile` or a server-returned task.
3. Scan backward for the last row with `isCurrent === true`.
4. If none, scan backward for the last `tanggalFlow` that is nonnull and not `''`. Whitespace and an invalid date still qualify; selection does not parse or trim the date.
5. If none and rows exist, choose index zero. Otherwise keep active index -1.
6. For each working-list index, derive `past` for `< active`, `current` for `=== active`, and `future` for `> active`; retain ordinal `index+1` and `isLast`.

The title and stage text must be escaped. Row stage name is `namaGrup ?? '-'`; an empty String stays empty. `taskNodeGroupId` is retained for snapshot fidelity, but it is not visible text or a new action/route identifier.

Show future ordinals in their markers. Past/current use different marker branches, not invented universal numbered circles. Use the proven three-state structure, future dimming and no continuation after the last row. Exact native icon identity, painter strokes/colors and pixel equality remain unproven; accessible status labels and responsive CSS are browser presentation adaptations. Do not claim native painter parity.

If the working list is empty, show exactly `Belum ada aktivitas`. Empty input with status `'0'` instead produces one current placeholder row: stage `'-'`, no date, no connector. All returned rows must be reachable; prefer rendering the complete ordinary timeline rather than adding pagination or a hidden limit.

## Date and time

Hide the date line for null/empty `tanggalFlow`. Otherwise render `dateDisplay(value) + ', ' + timeDisplay(value)`. Both functions receive the same untouched String. The date helper is the existing `d910bc`/`dd MMMM yyyy`; time is newly bound `d90d5c`/`HH:mm`, with the same ordered parser. Invalid nonempty input reaches both caught formatters and displays `-, -`; whitespace is not removed by the view.

The existing browser `assets/certificate-date/formatter.js` exposes only the date output. It cannot supply a native time by slicing its formatted date. Add a separately named time wrapper built from the already isolated Dart3.12.2/intl0.20.2 reference and the same six ordered strict-then-loose input patterns. Preserve the old certificate formatter and its frozen tests/behavior. The additive wrapper must wait for initialization and expose `HH:mm`, not introduce `Date.parse()`, fixed-zone conversion, or a second guessed parser. A new compiled CSP-safe vendor artifact is preferable to editing the existing minified vendor manually.

Test that wrapper as a pinned reference implementation, not an APK execution oracle. Retain the existing documented punctuation/timezone/parser-equivalence limits. Day-only input should follow the reference parser's midnight result, not fabricate a current time. Add actual known-case outputs for padded hours/minutes, all six patterns, invalid and whitespace input, and the already documented literal-Z/offset boundaries before integration.

## Ownership, return state, and cleanup

Use a journey owner containing session epoch, detail sequence, route, primary response identity and the relevant parent/source owner identities. It also owns the copied snapshot, opener/focus reference, and parent scroll state. Register cleanup alongside `clearPrivate()`, modal close/cancel, route/tab change, parent record replacement, and search reset. A stale owner cannot open, restore, or reveal a previous account's timeline.

For current modal detail paths, retain the parent DOM while opening the child: hide and make the parent inert, append the child panel, and keep the parent nodes connected. This avoids rerendering the primary detail or starting SOP/print/SPS/bookmark reads again when returning. Already authorized pending secondary reads may finish against their original hidden slots; they must never replace the child panel. Preserve the same detail sequence while merely opening/backing out of this local child, and require owner identity before any restoration. Close/scrub both layers when the enclosing dialog closes or its owner becomes stale.

For Cari Berkas, preserve the same search result owner and cached result view while showing the child; returning restores it without running a search, changing CAPTCHA, clearing the office selection, or generating another read. Do not assign to global `flowQuery`, `flowTab`, `flowPageIndex`, `flowDetail`, or source list owners merely to navigate this child.

Provide an explicit accessible `Kembali ke detail berkas`, restore the opener/focus and parent scroll when current, and keep top-level modal close semantics separate. Exact Flutter navigation-stack/system-back behavior has not been fully audited. Browser history integration, if added, must be a guarded local entry that closes this child first and must not restore stale private DOM after route/session changes. It is not needed to invent a new hash route or expose a berkas ID in the URL.

## Minimum meaningful verification

| Group | Required evidence |
| --- | --- |
| Projection and zero placeholder | Freeze input, retain all four field values/order/duplicates; exact status `'0'` inserts one blank row without mutating source or using namaProfile. Other status Strings do not. Empty zero versus empty nonzero produce different screens. |
| Active index precedence | Multiple true rows choose the last even if a later row has a date; without true choose last nonnull/nonempty date, including whitespace/invalid; all empty dates choose first; empty stays -1. Assert expected full state sequence, not an imported helper's output. |
| Marker and text semantics | Future ordinal, distinct past/current branches, future dimming, last continuation absent, null name→dash but empty name stays empty; escaped long/hostile text and more than100 rows remain reachable. |
| Time reference | Actual isolated formatter cases for HH:mm and same-parser date/time pairing; invalid nonempty→`-, -`, null/empty hides line, padded time/day-only/pattern-order and timezone limits. No browser Date.parse or current-clock fallback. |
| Four actual entry integrations | Each entry opens from its loaded primary response, not list IDs or a second API. Null list gives the explicit browser boundary, valid empty opens. Use distinct list ID/main fields to catch wrong-source substitution. |
| Return state | Back preserves search inputs/CAPTCHA/result, list filter/page/tab, selected source row, populated SOP/print/SPS and scroll/focus. Count requests before/after open/back: zero new provider/local execute calls. |
| Concurrent lifecycle | Secondary section completion while child open updates only its retained parent slot. Logout, account replacement, route/tab change, parent refresh/new selection, enclosing close/cancel, and detached stale opener cannot restore old child/parent data. |
| Real browser layout | Synthetic actual-app desktop/mobile run: keyboard open/back/close, all rows scrollable, no horizontal overflow or hidden focus, title/markers/date text correct; zero provider requests, hardware calls or mutations. |

Run focused new model/formatter/host tests first, then the current full Node suite and unchanged current VM mapping. Some old VM journey assertions currently target the inline expanded list; if the new dedicated screen intentionally replaces them, preserve their preimages and introduce a narrowly justified successor rather than deleting/weakening tests or changing native evidence. Global catalog counts must not change.

## Evidence boundaries

The positive static entry, RAb stateless dispatch, working-list/active-index rules, title, row fields, HH:mm helper, and last-row continuation rule are sufficient for this implementation. No concrete mismatch was found in the native follow-up claims reviewed against the focused retained instructions. This planning task did not rerun its verifier or create new extraction.

Still open: exact painter/icon/theme pixels and full framework scrolling/back-stack consequences; generic arbitrary List-subtype internals outside the retained normal typed path; complete native intl/parser/version equivalence; browser numeric precision of preexisting ABb integer fields; and actual native runtime/production-account visual parity. None of these establishes another endpoint, missing map geometry, or authorization to bypass location/physical-presence requirements. The separate reported inline Berkas map remains a separate unresolved feature.
