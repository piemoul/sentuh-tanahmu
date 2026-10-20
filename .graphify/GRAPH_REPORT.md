# Graph Report - .  (2026-10-20)

## Corpus Check
- 105 files · ~118.706 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1200 nodes · 2857 edges · 58 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: calls: 1385 · contains: 1011 · imports: 202 · imports_from: 123 · method: 62 · references: 37 · implements: 19 · rationale_for: 10 · conceptually_related_to: 8


## Input Scope
- Requested: tracked
- Resolved: tracked (source: cli)
- Included files: 105 · Candidates: 306
- Excluded: 1 untracked · 291 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.
## God Nodes (most connected - your core abstractions)
1. `esc()` - 85 edges
2. `render()` - 64 edges
3. `icon()` - 56 edges
4. `api()` - 41 edges
5. `toast()` - 40 edges
6. `clearPrivate()` - 40 edges
7. `notice()` - 39 edges
8. `record()` - 36 edges
9. `empty()` - 32 edges
10. `showFlowDetail()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `Browser document shell` --references--> `Responsive browser UI`  [EXTRACTED]
  webapp/index.html → docs/ARCHITECTURE.md
- `Browser workflow guide` --references--> `Hash-pinned artifact configuration`  [EXTRACTED]
  webapp/README.md → docs/ARCHITECTURE.md
- `Browser workflow guide` --references--> `Disabled geotag submission`  [EXTRACTED]
  webapp/README.md → docs/ARCHITECTURE.md
- `Browser workflow guide` --references--> `Local coordinate preparation`  [EXTRACTED]
  webapp/README.md → docs/ARCHITECTURE.md
- `Compose runtime` --references--> `Hash-pinned artifact configuration`  [EXTRACTED]
  compose.yaml → docs/ARCHITECTURE.md

## Communities

### Community 0 - "Browser request ownership"
Cohesion: 0.05
Nodes (121): activityDeleteControllerCurrent(), activityDeleteCurrent(), activityDetailTarget(), activityDocumentGeoControls(), addInformationParcel(), api(), backCollectionGroup(), backInformation() (+113 more)

### Community 1 - "Browser navigation shell"
Cohesion: 0.03
Nodes (64): Browser document shell, Responsive browser UI, activity(), activityDocumentGeoData(), activityDocumentGeoView(), backQueueDetail(), backSearchFile(), cancelCollectionGroupCreate() (+56 more)

### Community 2 - "Account and detail views"
Cohesion: 0.14
Nodes (47): account(), berkasReadSection(), berkasSection(), catalog(), collectionListView(), collectionPage(), connectionPage(), coordinatePage() (+39 more)

### Community 3 - "Official map renderer"
Cohesion: 0.07
Nodes (24): active(), cameraData(), canvases, claims, controlOfficialMap(), controls(), createOfficialMap(), failure() (+16 more)

### Community 4 - "Queue identity validation"
Cohesion: 0.08
Nodes (23): invalid(), queueManagedIdentity(), queueReadIdentityKeys(), queueReadIdentityQuery(), record(), booleans, field(), integers (+15 more)

### Community 5 - "Bhumi tile transport"
Cohesion: 0.08
Nodes (20): BhumiMapClient, BhumiMapError, cancelBody(), cancelled(), deadline(), failure(), field(), imageBytes() (+12 more)

### Community 6 - "Operation registry validation"
Cohesion: 0.07
Nodes (26): byId, collectionDeletePaths, fail(), getOperation(), getPublicCatalog(), operationData, OPERATIONS, prepareOperation() (+18 more)

### Community 7 - "HTTPS and queue transport"
Cohesion: 0.10
Nodes (22): createHttpsTransport(), createQueueHttpsTransport(), scopedHttpsTransport(), serialize(), transportError(), aborted(), cancelBody(), checkSignal() (+14 more)

### Community 8 - "Architecture trust boundaries"
Cohesion: 0.08
Nodes (34): Activity local deletion, Architecture checkpoint, Hash-pinned artifact configuration, Wired BERKAS bookmark, Bhumi WMS overlay, Browser workflow guide, Distinct collection cache effects, Compose runtime (+26 more)

### Community 9 - "Activity card routing"
Cohesion: 0.08
Nodes (37): activityCard(), activityCategories(), activityDeleteMaster(), activityDeleteOperation(), activityDocumentType(), activityItem(), activityMatches(), activityRows() (+29 more)

### Community 10 - "Queue response models"
Cohesion: 0.14
Nodes (27): bookingCode(), doubleString(), envelope(), field(), fileCount(), int64(), invalid(), list() (+19 more)

### Community 11 - "Shared browser rendering"
Cohesion: 0.13
Nodes (33): activityListView(), aktaRows(), badge(), berkasBookmarkForDetail(), berkasDetailView(), berkasOffice(), berkasParties(), berkasStatus() (+25 more)

### Community 12 - "Artifact and calendar configuration"
Cohesion: 0.09
Nodes (18): createCalendarOfficeIdDecoder(), digest(), loadConfiguration(), workspace, calendarRows(), createOfficeFixtureServer(), dateText(), decodeOfficeId (+10 more)

### Community 13 - "Main service API client"
Cohesion: 0.11
Nodes (20): ALLOWED_ORIGINS, ApiClient, ApiError, collectionDeletePrefixes, fetchTransport(), idSegment(), networkFailure(), networkMessage() (+12 more)

### Community 14 - "Session cookies and CSRF"
Cohesion: 0.10
Nodes (11): clearAuthentication(), cookieFor(), csrfMatches(), random(), readSessionId(), SessionStore, PNG, allowedEndpoints (+3 more)

### Community 15 - "Collection response decoders"
Cohesion: 0.11
Nodes (18): decode(), decodeCollectionMutationEnvelope(), decodePersilCollectionGroupEnvelope(), decodeUserCollectionEnvelope(), invalid(), nullable(), record(), actions (+10 more)

### Community 16 - "GNSS coordinate tools"
Cohesion: 0.15
Nodes (21): measured, compareCoordinates(), degrees(), radians(), limited(), nmeaDate(), nmeaDegrees(), normalizePoint() (+13 more)

### Community 17 - "HTTP gateway origins"
Cohesion: 0.14
Nodes (13): browserMapConfiguration(), browserRequestOrigin(), publicOrigin(), createApiHandler(), object(), parseInput(), configuration, config (+5 more)

### Community 18 - "Staged PERSIL controller"
Cohesion: 0.12
Nodes (15): ids, authCodes, choices(), collectionSavePersilEligible(), collectionSavePersilEntry(), createCollectionSavePersil(), escapeHtml(), featureFields() (+7 more)

### Community 19 - "Activity response validation"
Cohesion: 0.12
Nodes (16): decodeUserActivityEnvelope(), invalid(), nullableString(), record(), bookmarkStatus, configuration, emptyRow, read (+8 more)

### Community 20 - "Map entry integration"
Cohesion: 0.12
Nodes (13): data, geometry, hole, lines, names, outer, ring, boundedArray() (+5 more)

### Community 21 - "Artifact analysis scripts"
Cohesion: 0.27
Nodes (13): analyze_aot(), analyze_dex(), Codec, curate_evidence(), inventory_assets(), main(), manifests(), Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e (+5 more)

### Community 22 - "Queue call time models"
Cohesion: 0.24
Nodes (14): dateValue(), field(), floorDivide(), invalid(), MONTH_DAYS, parseItem(), parseQueueCallsEnvelope(), parseQueueCallsJson() (+6 more)

### Community 23 - "Group action browser fixtures"
Cohesion: 0.12
Nodes (13): defaultReceipt, endpoints, fixtureUser, initialGroups, initialRows, modes, calls, configuration (+5 more)

### Community 24 - "Shared browser fixtures"
Cohesion: 0.12
Nodes (14): activityPdf, certificatePdf, configuration, informationRows, informationSimulationCalls, kkprPdf, mitraOffices, port (+6 more)

### Community 25 - "Collection group fixtures"
Cohesion: 0.15
Nodes (14): basePng, calls, chunk(), configuration, crc32(), groups, overlayPng, persist() (+6 more)

### Community 26 - "Map pin fixtures"
Cohesion: 0.17
Nodes (15): allowed, basePng, crc32(), fixturePng(), geometry, overlayPng, persist(), pngChunk() (+7 more)

### Community 27 - "OSM Bhumi fixtures"
Cohesion: 0.17
Nodes (15): allowed, basePng, crc32(), fixturePng(), geometry, overlayPng, persist(), pngChunk() (+7 more)

### Community 28 - "Official map fixtures"
Cohesion: 0.18
Nodes (14): allowed, crc32(), fixturePng(), geometry, persist(), png, pngChunk(), receipt (+6 more)

### Community 29 - "News browser fixtures"
Cohesion: 0.22
Nodes (11): announcements, article(), baseRow(), createNewsFixtureServer(), main(), news, reportPath, sourceFiles (+3 more)

### Community 30 - "News response validation"
Cohesion: 0.18
Nodes (7): decodeNewsEnvelope(), blank, cases, config, fields, row, token

### Community 31 - "Collection item API tests"
Cohesion: 0.18
Nodes (7): actions, configuration, context, edit, request(), session(), token

### Community 32 - "Backend integration tests"
Cohesion: 0.18
Nodes (4): fixtureConfig, spsValues, token, user

### Community 33 - "Bookmark activity fixtures"
Cohesion: 0.18
Nodes (9): allowed, boundary, initialGroups, initialRows, modes, receipt, root, token (+1 more)

### Community 34 - "Office read tests"
Cohesion: 0.24
Nodes (8): calendar(), calendarValues, config, coordinates, nearby(), prepared(), request(), token

### Community 35 - "Certificate and BERKAS views"
Cohesion: 0.22
Nodes (11): aktaCard(), aktaCertificate(), berkasJourney(), berkasJourneyCurrent(), certificateLocation(), certificateMapControls(), certificateOwner(), certificateSurvey() (+3 more)

### Community 36 - "Office filters and calendar"
Cohesion: 0.27
Nodes (11): changeOfficeMonth(), filterOffices(), getOfficeState(), officeEntries(), officeFiltersView(), officeListView(), openOfficeItem(), renderOffice() (+3 more)

### Community 37 - "Native integrity audit"
Cohesion: 0.36
Nodes (4): Dex, main(), Read-only DEX reference audit. No app execution, hooks, patches or requests., safe()

### Community 38 - "Item action browser fixtures"
Cohesion: 0.20
Nodes (7): datasets, defaultReceipt, endpoints, fixtureUser, initialGroups, initialRows, modes

### Community 39 - "BERKAS bookmark tests"
Cohesion: 0.20
Nodes (4): functions, lines, names, source

### Community 40 - "Office search picker"
Cohesion: 0.29
Nodes (10): filterSearchFileOffices(), getSearchFileState(), openSearchFileOfficePicker(), renderSearchFilePicker(), searchFileOfficeEntries(), searchFilePickerView(), searchFileYears(), selectSearchFileOffice() (+2 more)

### Community 41 - "Collection browser fixtures"
Cohesion: 0.25
Nodes (7): calls, configuration, persist(), receipt, rows, server, stop()

### Community 42 - "Domain geometry utilities"
Cohesion: 0.43
Nodes (6): escapeHTML(), estimateCost(), numericInput(), parseGeoJSON(), toGeoJSON(), validateCoordinates()

### Community 43 - "Mortgage detail rendering"
Cohesion: 0.29
Nodes (8): filterHtDetail(), htDetailRows(), htDetailTarget(), htDetailView(), htField(), htListTitle(), isHtDetail(), loadHtDetail()

### Community 44 - "KKPR detail rendering"
Cohesion: 0.29
Nodes (8): isKkprItem(), kkprDetailView(), kkprDocumentControls(), kkprDocumentTarget(), kkprFacts(), kkprMapView(), kkprStringFields(), showKkprDetail()

### Community 45 - "Queue browser models"
Cohesion: 0.32
Nodes (8): queueCallsRows(), queueCallTime(), queueDetailData(), queueListItem(), queueObject(), queueResponseBody(), queueRows(), queueStrings()

### Community 46 - "Group creation API tests"
Cohesion: 0.33
Nodes (4): config, request(), session(), token

### Community 47 - "Dashboard feed navigation"
Cohesion: 0.43
Nodes (7): dashboard(), getNewsState(), menuTiles(), newsCardsView(), newsDefinition(), newsFeedPage(), newsFeedSection()

### Community 48 - "XAPK extraction script"
Cohesion: 0.60
Nodes (4): digest(), extract(), main(), Reproducible, path-safe extraction of all XAPK and nested APK members.

### Community 49 - "Portable test runner"
Cohesion: 0.40
Nodes (3): child, evidenceChecks, files

### Community 50 - "Searchfile response models"
Cohesion: 0.50
Nodes (5): searchFileBerkasModel(), searchFilePrimary(), searchFileSop(), searchFileSopModel(), searchFileTyped()

### Community 51 - "Operation catalog generation"
Cohesion: 0.50
Nodes (1): Produce a secret-free registry from 170 shapes and supplemental audited flows.

### Community 52 - "Collection card rendering"
Cohesion: 0.67
Nodes (4): collectionBerkasCard(), collectionDate(), collectionDetailTarget(), collectionPersilCard()

### Community 53 - "Spoofer artifact analysis"
Cohesion: 0.67
Nodes (1): Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.

### Community 54 - "Audit reference verification"
Cohesion: 0.67
Nodes (1): Check that static contract evidence points to real disassembly locations.

### Community 55 - "Repository checkpoint packaging"
Cohesion: 1.00
Nodes (1): Export an explicit source allowlist into the isolated publication clone.  Never

### Community 56 - "Extraction hash verification"
Cohesion: 1.00
Nodes (1): Verify every extracted archive member against the recorded SHA-256.

### Community 57 - "HTTP callsite verification"
Cohesion: 1.00
Nodes (1): Independently verify known-wrapper BL calls using raw AArch64 encoding.

## Knowledge Gaps
- **236 isolated node(s):** `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.`, `Read-only DEX reference audit. No app execution, hooks, patches or requests.`, `Export an explicit source allowlist into the isolated publication clone.  Never` (+231 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Operation catalog generation`** (1 nodes): `Produce a secret-free registry from 170 shapes and supplemental audited flows.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spoofer artifact analysis`** (1 nodes): `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audit reference verification`** (1 nodes): `Check that static contract evidence points to real disassembly locations.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Repository checkpoint packaging`** (1 nodes): `Export an explicit source allowlist into the isolated publication clone.  Never`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extraction hash verification`** (1 nodes): `Verify every extracted archive member against the recorded SHA-256.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HTTP callsite verification`** (1 nodes): `Independently verify known-wrapper BL calls using raw AArch64 encoding.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Wired BERKAS bookmark` connect `Architecture trust boundaries` to `Main service API client`, `Browser navigation shell`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Why does `Architecture checkpoint` connect `Architecture trust boundaries` to `Browser navigation shell`, `Official map renderer`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `Bhumi WMS overlay` connect `Architecture trust boundaries` to `Official map renderer`, `Bhumi tile transport`, `HTTP gateway origins`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Browser request ownership` be split into smaller, more focused modules?**
  _Cohesion score 0.050826446280991734 - nodes in this community are weakly interconnected._
- **Should `Browser navigation shell` be split into smaller, more focused modules?**
  _Cohesion score 0.03245699448231094 - nodes in this community are weakly interconnected._
- **Should `Account and detail views` be split into smaller, more focused modules?**
  _Cohesion score 0.1396854764107308 - nodes in this community are weakly interconnected._