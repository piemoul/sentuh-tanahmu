# Graph Report - .  (2026-10-22)

## Corpus Check
- 146 files · ~119.236 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1776 nodes · 4656 edges · 101 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: calls: 2418 · contains: 1490 · imports: 400 · method: 103 · imports_from: 100 · implements: 75 · references: 55 · rationale_for: 11 · shares_data_with: 2 · conceptually_related_to: 1 · re_exports: 1


## Input Scope
- Requested: tracked
- Resolved: tracked (source: cli)
- Included files: 146 · Candidates: 790
- Excluded: 0 untracked · 868 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `f2ea136`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `esc()` - 102 edges
2. `render()` - 83 edges
3. `icon()` - 63 edges
4. `clearPrivate()` - 52 edges
5. `api()` - 51 edges
6. `toast()` - 47 edges
7. `notice()` - 45 edges
8. `record()` - 39 edges
9. `head()` - 33 edges
10. `empty()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Session-bound document downloads` --shares_data_with--> `Origin-bound in-memory sessions`  [EXTRACTED]
  webapp/README.md → docs/ARCHITECTURE.md
- `Explicit Cloudflare public origin` --references--> `Origin-bound in-memory sessions`  [EXTRACTED]
  DOCKER.md → docs/ARCHITECTURE.md
- `Source publication checkpoint` --references--> `Geotag upload remains disabled`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `Source publication checkpoint` --references--> `Explicit validated operation catalog`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `Browser document shell` --references--> `Browser UI and routing`  [EXTRACTED]
  webapp/index.html → docs/ARCHITECTURE.md

## Communities

### Community 0 - "Queue calls and decoding"
Cohesion: 0.06
Nodes (69): dateValue(), field(), floorDivide(), invalid(), MONTH_DAYS, parseItem(), parseQueueCallsEnvelope(), parseQueueCallsJson() (+61 more)

### Community 1 - "Page rendering and forms"
Cohesion: 0.08
Nodes (81): account(), activityDocumentGeoView(), badge(), catalog(), collectionBidangView(), collectionEntries(), collectionListView(), collectionPage() (+73 more)

### Community 2 - "Route and request ownership"
Cohesion: 0.10
Nodes (73): activityDetailTarget(), activityDocumentGeoControls(), addInformationParcel(), api(), applySessionState(), backInformation(), berkasBookmarkAuth(), berkasJourneyMount() (+65 more)

### Community 3 - "Lost certificates and Yuridis"
Cohesion: 0.06
Nodes (54): authCodes, createLostCertificates(), integer(), invalid(), LOST_CERTIFICATE_COPY, lostCertificateBoundary(), lostCertificateEntries(), lostCertificateLocation() (+46 more)

### Community 4 - "Guestbook backend submission"
Cohesion: 0.06
Nodes (46): Office QR guestbook submission, cancelBody(), failure(), GuestbookClient, GuestbookClientError, guestbookLookupFromRead(), input(), invalidInput() (+38 more)

### Community 5 - "Application state and utilities"
Cohesion: 0.03
Nodes (38): activity(), activityDocumentGeoData(), backQueueDetail(), berkasRatingSource(), collectionItemDeleteOperation(), comparisonSelection, externalPages, field() (+30 more)

### Community 6 - "Sessions and deployment boundaries"
Cohesion: 0.06
Nodes (31): Explicit Cloudflare public origin, Loopback Docker service, Docker deployment guide, Read-only loopback Docker runtime, Origin-bound in-memory sessions, berkasRatingWasDispatched(), createBerkasRatingAttempt(), BerkasRatingSession (+23 more)

### Community 7 - "Berkas details and documents"
Cohesion: 0.06
Nodes (58): aktaCard(), aktaCertificate(), berkasDetailTarget(), berkasDetailView(), berkasJourney(), berkasJourneyCurrent(), berkasJourneyOwnerCurrent(), berkasOffice() (+50 more)

### Community 8 - "Queue booking backend"
Cohesion: 0.10
Nodes (35): aborted(), cancel(), check(), fail(), QueueBookingClient, responseBytes(), withSignal(), closeParts() (+27 more)

### Community 9 - "Collection groups and actions"
Cohesion: 0.07
Nodes (42): backCollectionGroup(), cancelCollectionGroupCreate(), cancelCollectionGroupDelete(), cancelCollectionGroupRemove(), cancelCollectionItemDelete(), cancelCollectionItemEdit(), collectionBerkasCard(), collectionDate() (+34 more)

### Community 10 - "Lost review composition"
Cohesion: 0.12
Nodes (33): Lost certificate and review workflows, authCodes, authCodes, createLostReview(), integer(), invalid(), lostReviewEnvelope(), lostReviewRows() (+25 more)

### Community 11 - "Queue booking browser flow"
Cohesion: 0.11
Nodes (30): authCodes, createQueueBooking(), Queue review and notification gate, clockValue(), malformed(), nullableString(), QUEUE_BOOKING_COPY, queueBookingPreflight() (+22 more)

### Community 12 - "Home media and feeds"
Cohesion: 0.11
Nodes (29): authCodes, createHomeMedia(), empty(), kinds, createHomeMediaHost(), bannerFields, failure(), HOME_MEDIA_OPERATIONS (+21 more)

### Community 13 - "Queue identity and profiles"
Cohesion: 0.12
Nodes (21): invalid(), queueManagedIdentity(), queueReadIdentityKeys(), queueReadIdentityQuery(), record(), booleans, field(), integers (+13 more)

### Community 14 - "Personal plotting backend submission"
Cohesion: 0.15
Nodes (31): Personal Swaplotting submission, attempts, buildSwaplottingPostValues(), commonFields, createSwaplottingAttempt(), fail(), markSwaplottingDispatched(), prepareSwaplottingActivityValues() (+23 more)

### Community 15 - "Activity filtering and deletion"
Cohesion: 0.08
Nodes (33): activityCard(), activityCategories(), activityDeleteControllerCurrent(), activityDeleteCurrent(), activityDeleteMaster(), activityDeleteOperation(), activityDocumentType(), activityItem() (+25 more)

### Community 16 - "Bhumi authenticated tile client"
Cohesion: 0.13
Nodes (18): BhumiMapClient, BhumiMapError, cancelBody(), cancelled(), deadline(), failure(), field(), imageBytes() (+10 more)

### Community 17 - "Parcel and scan readers"
Cohesion: 0.11
Nodes (25): Bounded parcel and scan reads, decodeParcelLookupJson(), decodeParcelRegionsJson(), invalid(), nullableInteger(), nullableNull(), nullableText(), numbers (+17 more)

### Community 18 - "Scan location geometry"
Cohesion: 0.16
Nodes (25): authCodes, createScanLocationController(), doubleText(), esc(), kkprField(), kkprNullableObject(), kkprNullableString(), mapFailure() (+17 more)

### Community 19 - "Parcel search browser flow"
Cohesion: 0.16
Nodes (22): authCodes, createParcelSearch(), malformed(), nullableString(), object(), parcelSearchBoundary(), parcelSearchCopy, parcelSearchLookup() (+14 more)

### Community 20 - "Main service API client"
Cohesion: 0.14
Nodes (17): ALLOWED_ORIGINS, ApiClient, ApiError, collectionDeletePrefixes, decodeVerificationStatus(), idSegment(), networkFailure(), networkMessage() (+9 more)

### Community 21 - "Guestbook browser workflow"
Cohesion: 0.17
Nodes (21): authCodes, createGuestbook(), GUESTBOOK_COPY, GUESTBOOK_FIELDS, GUESTBOOK_WRITE_COPY, guestbookInputMode(), guestbookMetadata(), guestbookParseQr() (+13 more)

### Community 22 - "PBT and KKPR decoders"
Cohesion: 0.23
Nodes (20): decodeScanKkprEnvelope(), decodeScanPbtEnvelope(), envelope(), field(), invalid(), kkprFeature(), kkprGeometry(), kkprGeometryData() (+12 more)

### Community 23 - "PERSIL map host integration"
Cohesion: 0.12
Nodes (24): parcelSearchAction(), parcelSearchCurrent(), parcelSearchMap(), parcelSearchPaint(), persilMapAccount(), persilMapActionView(), persilMapCancel(), persilMapCollectionChanged() (+16 more)

### Community 24 - "Swaplotting forms and choices"
Cohesion: 0.16
Nodes (21): authCodes, createSwaplotting(), failure(), nullableString(), object(), SWAPLOTTING_BASIS, SWAPLOTTING_COPY, SWAPLOTTING_FIELDS (+13 more)

### Community 25 - "Operation lookup and partners"
Cohesion: 0.15
Nodes (18): decodeMitraBytes(), decodeMitraValue(), fail(), MITRA_READS, nullableString(), prepareMitraQuery(), record(), byId (+10 more)

### Community 26 - "Plotting submission ownership"
Cohesion: 0.21
Nodes (6): changed(), opaque(), ownContact(), profile(), sameProfile(), SwaplottingSubmissionSession

### Community 27 - "Cari Berkas search workflow"
Cohesion: 0.13
Nodes (21): backSearchFile(), filterSearchFileOffices(), generateSearchFileCaptcha(), getSearchFileState(), openSearchFileOfficePicker(), refreshSearchFileCaptcha(), renderSearchFile(), renderSearchFilePicker() (+13 more)

### Community 28 - "Official raster map lifecycle"
Cohesion: 0.17
Nodes (17): active(), cameraData(), canvases, claims, controls(), createOfficialMap(), failure(), fetchConfig() (+9 more)

### Community 29 - "PPAT question rating workflow"
Cohesion: 0.19
Nodes (16): PPAT questions and rating, authCodes, createRatingPPAT(), createRatingPPATHost(), fail(), object(), RATING_PPAT_COPY, ratingPPATChoice() (+8 more)

### Community 30 - "Plot detail response models"
Cohesion: 0.26
Nodes (19): decodePlotDetailJson(), decodePlotListJson(), envelope(), fields, geometryLeaf(), integer(), invalid(), list() (+11 more)

### Community 31 - "Berkas journey browser destination"
Cohesion: 0.22
Nodes (15): createBerkasJourneyHost(), callerIntegerText(), copyRows(), createJourneySnapshot(), fail(), isJourneySnapshot(), journeySnapshotFromBerkas(), missing (+7 more)

### Community 32 - "Static artifact analysis"
Cohesion: 0.27
Nodes (13): analyze_aot(), analyze_dex(), Codec, curate_evidence(), inventory_assets(), main(), manifests(), Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e (+5 more)

### Community 33 - "Berkas rating browser flow"
Cohesion: 0.22
Nodes (14): authCodes, createBerkasRating(), createBerkasRatingHost(), BERKAS_RATING_COPY, berkasRatingEntry(), berkasRatingPrompt(), berkasRatingResult(), berkasRatingTrim() (+6 more)

### Community 34 - "GNSS import and normalization"
Cohesion: 0.25
Nodes (17): limited(), nmeaDate(), nmeaDegrees(), normalizePoint(), number(), OPTIONAL(), parseCoordinateFile(), parseCsv() (+9 more)

### Community 35 - "Catalog generation and validation"
Cohesion: 0.15
Nodes (11): Explicit validated operation catalog, Produce a secret-free registry from 170 shapes and supplemental audited flows., byId, collectionDeletePaths, fail(), getOperation(), OPERATIONS, prepareOperation() (+3 more)

### Community 36 - "Lost review multipart posting"
Cohesion: 0.26
Nodes (15): fail(), fields, lostReviewPostFilename(), lostReviewPostOutcome(), MIME_BY_EXTENSION, ownRecord(), prepareLostReviewPostFiles(), prepareLostReviewPostValues() (+7 more)

### Community 37 - "Daring form date models"
Cohesion: 0.20
Nodes (16): calendarDate(), DARING_COPY, DARING_FIELDS, DARING_WIRE_KEYS, daringDateBounds(), daringDateForInput(), daringDateFromInput(), daringEditError() (+8 more)

### Community 38 - "Berkas bookmark controls"
Cohesion: 0.21
Nodes (17): berkasBookmarkButton(), berkasBookmarkCollectionChanged(), berkasBookmarkCurrent(), berkasBookmarkEligible(), berkasBookmarkEnvelope(), berkasBookmarkForDetail(), berkasBookmarkOperation(), berkasBookmarkPaint() (+9 more)

### Community 39 - "Architecture and measurement boundaries"
Cohesion: 0.16
Nodes (16): Architecture checkpoint, Browser document shell, Browser UI and routing, BERKAS collection bookmark, Collection-specific cache effects, Wired PERSIL collection workflow, Session-bound document downloads, Geotag upload remains disabled (+8 more)

### Community 40 - "Berkas rating post protocol"
Cohesion: 0.28
Nodes (15): attempts, decodeBerkasRatingBytes(), decodeBerkasRatingValue(), dispatched, exactBerkasRatingRecord(), fail(), fields, isBerkasRatingAttempt() (+7 more)

### Community 41 - "PERSIL collection controller"
Cohesion: 0.19
Nodes (13): authCodes, choices(), collectionSavePersilEligible(), collectionSavePersilEntry(), createCollectionSavePersil(), escapeHtml(), featureFields(), groupRows() (+5 more)

### Community 42 - "Swaplotting coordinate entry"
Cohesion: 0.39
Nodes (14): camera(), declaration(), fail(), object(), parseSwaplottingCoordinateEntry(), rawNumber(), sessionPoint(), swaplottingCoordinateCandidates() (+6 more)

### Community 43 - "Plotting photos and host"
Cohesion: 0.17
Nodes (11): createSwaplottingHost(), fail(), hasLibrary(), libraries, library(), resources(), swaplottingPhotoPath(), createSwaplottingPhotoRemoval() (+3 more)

### Community 44 - "Daring verification UI"
Cohesion: 0.24
Nodes (15): dismissVerificationDialog(), showVerificationMethods(), verificationDaringBack(), verificationDaringBusy(), verificationDaringContinue(), verificationDaringInfoClose(), verificationDaringInput(), verificationDaringOperation() (+7 more)

### Community 45 - "Scan host and lifecycle"
Cohesion: 0.19
Nodes (15): resetScanHost(), scanCameraPaint(), scanDisposeLocation(), scanHost(), scanHostCurrent(), scanLocationCurrent(), scanLocationKkprPaint(), scanLocationKkprSelect() (+7 more)

### Community 46 - "Office map lifecycle"
Cohesion: 0.29
Nodes (11): active(), camera(), claims, copyCamera(), createOfficeMap(), data(), failure(), finite() (+3 more)

### Community 47 - "Yuridis response decoding"
Cohesion: 0.38
Nodes (12): decodeYuridisJson(), decodeYuridisLastReviewJson(), fail(), fields, integer(), numericTokens, object(), own() (+4 more)

### Community 48 - "Swaplotting field rendering"
Cohesion: 0.35
Nodes (12): error(), esc(), formField(), swaplottingCoordinateCandidateView(), swaplottingCoordinateProvenanceView(), swaplottingCoordinateView(), swaplottingDisclaimerView(), swaplottingFeedback() (+4 more)

### Community 49 - "Office list and map"
Cohesion: 0.26
Nodes (13): changeOfficeMonth(), disposeOfficeMap(), filterOffices(), focusOfficeMapSelection(), getOfficeState(), mountOfficeMap(), officeEntries(), openOfficeItem() (+5 more)

### Community 50 - "Private configuration and diagnostics"
Cohesion: 0.21
Nodes (8): fetchTransport(), createCalendarOfficeIdDecoder(), digest(), loadConfiguration(), workspace, baseline, client, records

### Community 51 - "PPAT question response models"
Cohesion: 0.47
Nodes (9): answer(), decodeRatingPpatBytes(), decodeRatingPpatValue(), fail(), group(), nullableString(), prepareRatingPpatRead(), record() (+1 more)

### Community 52 - "Native integrity static audit"
Cohesion: 0.36
Nodes (4): Dex, main(), Read-only DEX reference audit. No app execution, hooks, patches or requests., safe()

### Community 53 - "PPAT rating host integration"
Cohesion: 0.29
Nodes (10): aktaRows(), isAktaItem(), openAktaRating(), ratingPpatCanWrite(), ratingPpatCurrent(), ratingPpatOperation(), ratingPpatPage(), ratingPpatWrite() (+2 more)

### Community 54 - "Berkas rating host integration"
Cohesion: 0.31
Nodes (10): berkasRatingCurrent(), berkasRatingMount(), berkasRatingOperation(), berkasRatingRestore(), berkasRatingWrite(), closeBerkasRatingResult(), finishBerkasRating(), openBerkasRating() (+2 more)

### Community 55 - "Lost certificate host integration"
Cohesion: 0.24
Nodes (10): disposeLostReview(), lostActive(), lostCurrent(), lostOwner(), lostPaint(), lostReviewComposeClick(), lostReviewCurrent(), lostReviewOperation() (+2 more)

### Community 56 - "PPAT rating post protocol"
Cohesion: 0.42
Nodes (8): decodeRatingPpatPostBytes(), decodeRatingPpatPostValue(), fail(), fields, prepareRatingPpatPostValues(), ratingPpatPostFailure(), record(), serializeRatingPpatPost()

### Community 57 - "Navigation and route cleanup"
Cohesion: 0.22
Nodes (9): backPartner(), disposeYuridis(), navigate(), resetCollectionNavigation(), resetNewsNavigation(), resetPartnerNavigation(), resetPersilMaps(), resetSearchFileNavigation() (+1 more)

### Community 58 - "Queue call list rendering"
Cohesion: 0.28
Nodes (9): queueCallsRows(), queueCallTime(), queueDetailData(), queueListItem(), queueObject(), queuePrereadRows(), queueResponseBody(), queueRows() (+1 more)

### Community 59 - "Plotting host write integration"
Cohesion: 0.39
Nodes (9): swaplottingCanWrite(), swaplottingCurrent(), swaplottingOperation(), swaplottingPostOperation(), swaplottingRead(), swaplottingSourceId(), swaplottingSources(), swaplottingStale() (+1 more)

### Community 60 - "Publication validation and exclusions"
Cohesion: 0.32
Nodes (8): Explicit portable test exclusions, Full local native-evidence suite, Portable source test scope, Portable clone test result, Source-only publication boundary, Source publication checkpoint, Synthetic Buku Tamu browser evidence, Checkpoint validation record

### Community 61 - "Collection response envelopes"
Cohesion: 0.57
Nodes (7): decode(), decodeCollectionMutationEnvelope(), decodePersilCollectionGroupEnvelope(), decodeUserCollectionEnvelope(), invalid(), nullable(), record()

### Community 62 - "Swaplotting point map"
Cohesion: 0.29
Nodes (6): claimed, createSwaplottingMap(), esc(), swaplottingPointMapView(), SWAPLOTTING_INITIAL_CAMERA, swaplottingPointText()

### Community 63 - "Plotting review payload"
Cohesion: 0.54
Nodes (7): buildSwaplottingReview(), fail(), labels, scalar(), selected(), swaplottingNativeTrim(), trim()

### Community 64 - "Guestbook host integration"
Cohesion: 0.32
Nodes (8): guestbookBack(), guestbookCameraPaint(), guestbookCurrent(), guestbookOperation(), guestbookOwner(), guestbookPaint(), guestbookWrite(), guestbookWriteOperation()

### Community 65 - "Plotting camera capture"
Cohesion: 0.33
Nodes (3): createSwaplottingCamera(), SWAPLOTTING_CAPTURE_COPY, createSwaplottingPhotoCapture()

### Community 66 - "Domain coordinates and costs"
Cohesion: 0.33
Nodes (2): numericInput(), validateCoordinates()

### Community 67 - "Parcel geometry camera"
Cohesion: 0.52
Nodes (6): boundedArray(), escapeHtml(), invalid(), parcelMapView(), prepareParcelCamera(), updateParcelMap()

### Community 68 - "Activity deletion response semantics"
Cohesion: 0.53
Nodes (5): Activity local deletion behavior, decodeUserActivityEnvelope(), invalid(), nullableString(), record()

### Community 69 - "Daring verification response"
Cohesion: 0.53
Nodes (5): Daring identity completion boundaries, daringIdentityStatusFallback(), decodeDaringIdentityEnvelope(), field(), invalid()

### Community 70 - "Cross-tab session synchronization"
Cohesion: 0.40
Nodes (2): createSessionSync(), Authoritative cross-tab session sync

### Community 71 - "Profile contact animations"
Cohesion: 0.50
Nodes (3): animationData(), loadAnimationData(), managers

### Community 72 - "Archive extraction verification"
Cohesion: 0.60
Nodes (4): digest(), extract(), main(), Reproducible, path-safe extraction of all XAPK and nested APK members.

### Community 73 - "Service information simulation"
Cohesion: 0.40
Nodes (5): informationDetail(), informationProvinceRows(), informationRows(), informationSimulationResult(), nativeInformationBody()

### Community 74 - "Pinned QR library vendoring"
Cohesion: 0.50
Nodes (1): Vendor a pinned npm QR reader without installing or executing package scripts.

### Community 75 - "Swaplotting explicit submit"
Cohesion: 0.50
Nodes (3): authCodes, createSwaplottingSubmit(), SWAPLOTTING_SUBMIT_COPY

### Community 76 - "Coordinate distance comparison"
Cohesion: 0.83
Nodes (3): compareCoordinates(), degrees(), radians()

### Community 77 - "Journey time formatter provenance"
Cohesion: 0.67
Nodes (2): journeyTimeDisplay(), Journey HH:mm formatter provenance

### Community 78 - "Certificate date formatter provenance"
Cohesion: 0.67
Nodes (2): certificateDateDisplay(), Certificate date formatter provenance

### Community 79 - "Profile website destinations"
Cohesion: 0.67
Nodes (2): destinations, profileWebsiteDestination()

### Community 80 - "Route Spoofer offline inventory"
Cohesion: 0.67
Nodes (1): Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.

### Community 81 - "Contract disassembly verification"
Cohesion: 0.67
Nodes (1): Check that static contract evidence points to real disassembly locations.

### Community 82 - "Plotting result cleanup"
Cohesion: 0.67
Nodes (3): disposeSwaplottingResult(), resetSwaplottingSubmission(), swaplottingFeedbackDialog()

### Community 83 - "Home media ownership"
Cohesion: 0.67
Nodes (3): homeMediaOwner(), homeMediaPaint(), homeMediaSection()

### Community 84 - "Office calendar responses"
Cohesion: 0.67
Nodes (3): nativeOfficeEnvelope(), nearbyOfficeRows(), officeCalendarRows()

### Community 85 - "Verification status dialogs"
Cohesion: 0.67
Nodes (3): nativeVerificationDecision(), nativeVerificationStatus(), showVerificationStatusDialog()

### Community 86 - "Office feature rendering"
Cohesion: 0.67
Nodes (3): officeFeaturesView(), officeMapView(), officeSelectedView()

### Community 87 - "Source publication exporter"
Cohesion: 1.00
Nodes (1): Export an explicit source allowlist into the isolated publication clone.  Never

### Community 88 - "Archive member hash verification"
Cohesion: 1.00
Nodes (1): Verify every extracted archive member against the recorded SHA-256.

### Community 89 - "HTTP callsite instruction audit"
Cohesion: 1.00
Nodes (1): Independently verify known-wrapper BL calls using raw AArch64 encoding.

### Community 90 - "Electronic certificate document targeting"
Cohesion: 1.00
Nodes (2): electronicCertificateDocumentTarget(), isElectronicCertificate()

### Community 91 - "HT certificate filtering"
Cohesion: 1.00
Nodes (2): filterHtDetail(), htDetailRows()

### Community 92 - "PPAT result lifecycle"
Cohesion: 1.00
Nodes (2): finishRatingPpat(), resetRatingPpatResult()

### Community 93 - "Service information grouping"
Cohesion: 1.00
Nodes (2): informationGroups(), informationListView()

### Community 94 - "KKPR document controls"
Cohesion: 1.00
Nodes (2): kkprDocumentControls(), kkprDocumentTarget()

### Community 95 - "Office calendar event rendering"
Cohesion: 1.00
Nodes (2): officeCalendarEvents(), officeCalendarEventsView()

### Community 96 - "Office calendar grid"
Cohesion: 1.00
Nodes (2): officeCalendarGrid(), officeMonthName()

### Community 97 - "Parcel search host ownership"
Cohesion: 1.00
Nodes (2): parcelSearchOwner(), parcelSearchPage()

### Community 98 - "Office calendar date parsing"
Cohesion: 1.00
Nodes (2): parseOfficeCalendarDate(), queueDate()

### Community 99 - "Queue booking host prerequisites"
Cohesion: 1.00
Nodes (2): queuePrereadBookingHost(), queuePrereadBookingOperation()

### Community 100 - "Queue prerequisite lifecycle"
Cohesion: 1.00
Nodes (2): queuePrereadClose(), queuePrereadCurrent()

## Knowledge Gaps
- **142 isolated node(s):** `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.`, `Read-only DEX reference audit. No app execution, hooks, patches or requests.`, `Export an explicit source allowlist into the isolated publication clone.  Never` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Domain coordinates and costs`** (2 nodes): `numericInput()`, `validateCoordinates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cross-tab session synchronization`** (2 nodes): `createSessionSync()`, `Authoritative cross-tab session sync`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pinned QR library vendoring`** (1 nodes): `Vendor a pinned npm QR reader without installing or executing package scripts.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Journey time formatter provenance`** (2 nodes): `journeyTimeDisplay()`, `Journey HH:mm formatter provenance`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Certificate date formatter provenance`** (2 nodes): `certificateDateDisplay()`, `Certificate date formatter provenance`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile website destinations`** (2 nodes): `destinations`, `profileWebsiteDestination()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Route Spoofer offline inventory`** (1 nodes): `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contract disassembly verification`** (1 nodes): `Check that static contract evidence points to real disassembly locations.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Source publication exporter`** (1 nodes): `Export an explicit source allowlist into the isolated publication clone.  Never`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Archive member hash verification`** (1 nodes): `Verify every extracted archive member against the recorded SHA-256.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HTTP callsite instruction audit`** (1 nodes): `Independently verify known-wrapper BL calls using raw AArch64 encoding.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Electronic certificate document targeting`** (2 nodes): `electronicCertificateDocumentTarget()`, `isElectronicCertificate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HT certificate filtering`** (2 nodes): `filterHtDetail()`, `htDetailRows()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PPAT result lifecycle`** (2 nodes): `finishRatingPpat()`, `resetRatingPpatResult()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service information grouping`** (2 nodes): `informationGroups()`, `informationListView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `KKPR document controls`** (2 nodes): `kkprDocumentControls()`, `kkprDocumentTarget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Office calendar event rendering`** (2 nodes): `officeCalendarEvents()`, `officeCalendarEventsView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Office calendar grid`** (2 nodes): `officeCalendarGrid()`, `officeMonthName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Parcel search host ownership`** (2 nodes): `parcelSearchOwner()`, `parcelSearchPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Office calendar date parsing`** (2 nodes): `parseOfficeCalendarDate()`, `queueDate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Queue booking host prerequisites`** (2 nodes): `queuePrereadBookingHost()`, `queuePrereadBookingOperation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Queue prerequisite lifecycle`** (2 nodes): `queuePrereadClose()`, `queuePrereadCurrent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BERKAS collection bookmark` connect `Architecture and measurement boundaries` to `Main service API client`, `Collection response envelopes`, `Application state and utilities`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Why does `Architecture checkpoint` connect `Architecture and measurement boundaries` to `Activity deletion response semantics`, `Berkas journey browser destination`, `Berkas rating browser flow`, `Daring verification response`, `Lost review composition`, `Guestbook backend submission`, `Catalog generation and validation`, `Sessions and deployment boundaries`, `Parcel and scan readers`, `Personal plotting backend submission`, `PPAT question rating workflow`, `Publication validation and exclusions`, `Queue booking browser flow`, `Cross-tab session synchronization`, `Lost certificates and Yuridis`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `createSwaplottingHost()` connect `Plotting photos and host` to `Application state and utilities`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Queue calls and decoding` be split into smaller, more focused modules?**
  _Cohesion score 0.05708548479632817 - nodes in this community are weakly interconnected._
- **Should `Page rendering and forms` be split into smaller, more focused modules?**
  _Cohesion score 0.07962962962962963 - nodes in this community are weakly interconnected._
- **Should `Route and request ownership` be split into smaller, more focused modules?**
  _Cohesion score 0.09779299847792998 - nodes in this community are weakly interconnected._
## Extraction limits and publication review

This 22 October run detected 136 code files and ten documents. Structural extraction failed for eight PowerShell utilities because the installed `tree-sitter-powershell` parser was unavailable; 128 code files were parsed. No parser was installed and no PowerShell call graph is claimed. Assistant semantic extraction reused one cached HTML document and read nine changed/new documents. Named document entities retain document provenance and rationale attributes because the installed sanitizer removes the `concept` file type.

The final graph includes current Guestbook, Berkas Rating/Journey, PERSIL integration and session synchronization. Published tests/fixtures and generated validation JSON are excluded from this bounded architecture map. Generated Dart formatter bundles are excluded; authored wrappers and license provenance remain included. Source-only test results and full analysis-workspace results are distinct evidence categories, not graph coverage metrics.

Heuristic grounding reported 2,277 newly grounded source citations across 1,515 nodes. The final union retains 2,731 citation entries in the sidecar and 2,730 inline under the per-node cap; stored counts include prior/finalization citations. Studio has zero full descriptions and 33 provisional rationale-derived entries; the optional prose description pass was not run. Token counters in the generated summary are unmetered zero placeholders. The retrieval benchmark estimates a 16.9-fold reduction and does not measure billing.

The installed Windows manifest writer emitted absolute keys and merged older entries. The raw output is retained outside publication; manifest metadata alone was regenerated from the actual 146 detected files using relative keys and the same mtime/MD5 schema. Graph/ontology/Studio data were not directly edited. The genuine portable check remains non-passing: all 595 findings occur inside citation quote strings, repeated across five outputs. The accompanying portability review checks structured source references separately and does not replace the tool's failing result. The freshness commit above is the parent commit present while these staged sources were extracted.
