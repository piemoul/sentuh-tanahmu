# Save PERSIL frontend — staged, not connected to app screens

The standalone module and synthetic tests are complete. **The module is not imported or invoked by `webapp/app.js` at this checkpoint. No map screen currently exposes this new save form.** These tests establish controller/render behavior; they are not browser or production end-to-end validation.

Frozen files:

| File | SHA-256 |
|---|---|
| `webapp/collection-save-persil.js` | `b5318271688487df7f7a629202372d855457aeca73806d008e2a9ef616d125db` |
| `webapp/tests/collection-save-persil-ui.test.mjs` | `2daf520ed77812bb9efcddbe43a0b22b1ca62f727d313d900a99064e9bab40f4` |

Native reference: `analysis/COLLECTION-SAVE-PERSIL.md` and canonical ledger SHA `dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199`.

## Module API

`createCollectionSavePersil({api, getOperations, getAccount, isCurrent, onChange, onSaved, onClose, notify, onAuthError, record})` owns one form instance. The first four callbacks are required. `api` has the existing local API signature; the module calls only `/api/execute`. It imports no transport, browser surface or DOM library.

`getAccount()` supplies `{authenticated, tokenPresent, configured, loading, profile}`; `profile.statusVerifikasi` controls visibility separately from token presence. **Do not expose sign-in NIK to satisfy this interface.** The private adapter checks cached-login NIK and injects `Nik` and constant `Subtitle`. The browser sends only `{PersilId, Title}` for the primary operation.

`open(context)` accepts `{persilId, featureCollection, collectionId, origin, onSaved?}`. The target ID must come from the actual map request, not a guessed feature ID. Null/undefined collection ID permits the caption sheet; every nonnull collection ID, including empty string, blocks this unsaved-entry path. The context may carry additional host ownership fields. `isCurrent(context)` must check session, route/detail generation, response ownership and dialog lifetime as applicable.

Controller methods: `snapshot()`, `render()`, `available()`, `open()`, `close()`, `reset()`, `setCaption(value)`, `selectGroup(rawSourceIndex)`, `openGroupCreate()`, `setGroupName(value)`, `cancelGroupCreate()`, `submitGroupCreate()`, `submit()`. Text setters retain exact input and do not rerender on each keystroke. `onChange(snapshot)` asks the host to repaint. `reset()` invalidates asynchronous continuations without closing a potentially newer host dialog. `onClose(reason, context)` uses `saved` or `dismissed`. The selected context callback, or injected `onSaved`, runs without await before host close; it does not receive or update a parent collection ID.

Pure exports: `collectionSavePersilEligible(account, context)`, `collectionSavePersilEntry(account, context, available)`, `renderCollectionSavePersil(snapshot)`, and `trimCollectionSavePersil(value)`.

Stable delegated selectors:

- Entry: `[data-action="collection-save-persil"]`.
- Form `#collection-save-persil-form`; input `#collection-save-persil-caption`, name `caption`.
- Group choice: `[data-action="collection-save-persil-group-choice"]`, `data-index` is the unfiltered group source index.
- Nested open/cancel: actions `collection-save-persil-group-open` / `collection-save-persil-group-cancel`.
- Nested form `#collection-save-persil-group-form`; input `#collection-save-persil-group-name`, name `GroupName`.

The module implements the normal caption sheet, its own group GET, optional single assignment, nested group creation, strict primary/assignment `error === false`, and nested-create tuple-style acceptance. Caption and choices remain editable while primary save is pending; assignment reads current selection after the primary await. No shared collection cache mutation, forced refresh, new-group auto-selection or parent saved-ID update is added.

Browser adaptations are explicit: sanitized unclassified exception messages, operation/session/ownership guards, ignoring stale read completions, a hidden accessible dialog heading, and invalidating nested continuations when the host form closes. Full native drag/back/IME behavior is not represented by a DOM-independent module.

## Validation

Syntax check and the following targeted test passed, **19/19**:

```powershell
tools/runtime/node.exe --check webapp/collection-save-persil.js
tools/runtime/node.exe --test webapp/tests/collection-save-persil-ui.test.mjs
```

Tests use injected synthetic API callbacks only. They cover gate/type distinctions, NIK privacy, exact operation identity and bodies, native whitespace/default title behavior, pending duplicate prevention, post-await group choice, nullable collection IDs, warning-only assignment failure, group filtering/names, nested create/busy/cancel, callback order, stale ownership, auth expiry and unclassified exception suppression. No production request, server launch, persistent fixture, browser session, deployment or Git action was performed for this module.

## Integration still required

Existing browser map holders were inspected: manual `parcel` result (`flowResultView` with `flowResults[c.key].values`), Activity PERSIL detail (`loadActivityDetail`, target `values.persilid`), certificate map (`loadCertificateMap`, captured `persilid` and response), and collection PERSIL detail (`loadCollectionDetail`, row `contentId` and nullable row `id`). These are concrete candidate host surfaces; none is connected yet. Saved collection map entries require the separate native map-delete path, which this normal-save module does not implement.

The canonical audit records all 12 direct native map allocations and their exact class/field/callback bindings. This checkpoint does **not** claim one-to-one browser coverage of those 12 origins or complete business-label mapping for obfuscated native classes. Search-at-location, preloaded-feature and both inline map-mode variants require explicit native-to-browser ownership mapping before claiming coverage.

Next work: obtain exclusive `app.js` ownership; import the module; bind the candidate map contexts and delegated controls; connect current profile/token-presence state without another identity request; preserve/restore the parent map when the sheet closes; reset on logout/navigation. Ownership must not depend solely on the original map DOM node remaining connected while its dialog is replaced by the sheet. The collection callback must retain native default-cache behavior rather than introduce a forced all-collection refresh. Then add integration tests and a local synthetic browser fixture before any live account testing.
