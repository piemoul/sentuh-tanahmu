# Graph Report - .  (2026-10-23)

## Corpus Check
- 152 files · ~119.633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1849 nodes · 4824 edges · 99 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output
- Edge kinds: calls: 2455 · contains: 1531 · imports: 429 · method: 111 · imports_from: 107 · references: 97 · implements: 68 · rationale_for: 11 · conceptually_related_to: 10 · shares_data_with: 4 · re_exports: 1


## Input Scope
- Requested: tracked
- Resolved: tracked (source: cli)
- Included files: 152 · Candidates: 808
- Excluded: 0 untracked · 878 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `a255dcd`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `esc()` - 102 edges
2. `render()` - 83 edges
3. `icon()` - 63 edges
4. `clearPrivate()` - 53 edges
5. `api()` - 51 edges
6. `toast()` - 47 edges
7. `notice()` - 45 edges
8. `Architecture checkpoint` - 40 edges
9. `record()` - 39 edges
10. `head()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Original APK emulator refusal boundary` --conceptually_related_to--> `Synthetic implementation test boundary`  [INFERRED]
  README.md → docs/ARCHITECTURE.md
- `Bounded static request-contract audit` --conceptually_related_to--> `Explicit validated operation catalog`  [INFERRED]
  README.md → docs/ARCHITECTURE.md
- `Explicit Cloudflare public origin` --references--> `Origin-bound in-memory sessions`  [EXTRACTED]
  DOCKER.md → docs/ARCHITECTURE.md
- `Session-bound document downloads` --shares_data_with--> `Origin-bound in-memory sessions`  [EXTRACTED]
  webapp/README.md → docs/ARCHITECTURE.md
- `Historical release evidence` --conceptually_related_to--> `Full Berkas journey destination`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md

## Communities

### Community 0 - "Page rendering and forms"
Cohesion: 0.07
Nodes (88): account(), activityDocumentGeoView(), activityListView(), badge(), catalog(), collectionBerkasCard(), collectionBidangView(), collectionDate() (+80 more)

### Community 1 - "Queue calls and decoding"
Cohesion: 0.06
Nodes (69): dateValue(), field(), floorDivide(), invalid(), MONTH_DAYS, parseItem(), parseQueueCallsEnvelope(), parseQueueCallsJson() (+61 more)

### Community 2 - "Application state and utilities"
Cohesion: 0.03
Nodes (51): activity(), activityDocumentGeoData(), backQueueDetail(), collectionItemDeleteOperation(), collectionOperation(), comparisonSelection, externalPages, field() (+43 more)

### Community 3 - "Request and route ownership"
Cohesion: 0.09
Nodes (76): activityDeleteMaster(), activityDetailTarget(), activityDocumentGeoControls(), activityDocumentType(), activityRows(), addInformationParcel(), api(), applySessionState() (+68 more)

### Community 4 - "Berkas details and documents"
Cohesion: 0.06
Nodes (67): aktaCard(), aktaCertificate(), berkasBookmarkForDetail(), berkasDetailTarget(), berkasDetailView(), berkasJourney(), berkasJourneyCurrent(), berkasJourneyMount() (+59 more)

### Community 5 - "Lost review and Yuridis"
Cohesion: 0.06
Nodes (52): Lost certificate and review workflows, authCodes, createLostReviewComposer(), createLostReviewComposeHost(), esc(), lostReviewComposeView(), authCodes, createLostReview() (+44 more)

### Community 6 - "Queue booking backend"
Cohesion: 0.09
Nodes (36): aborted(), cancel(), check(), fail(), QueueBookingClient, responseBytes(), withSignal(), closeParts() (+28 more)

### Community 7 - "Lost certificate browser workflow"
Cohesion: 0.10
Nodes (35): authCodes, createLostCertificates(), integer(), invalid(), LOST_CERTIFICATE_COPY, lostCertificateBoundary(), lostCertificateEntries(), lostCertificateLocation() (+27 more)

### Community 8 - "Berkas rating backend protocol"
Cohesion: 0.11
Nodes (27): Guarded Berkas rating workflow, attempts, berkasRatingWasDispatched(), createBerkasRatingAttempt(), decodeBerkasRatingBytes(), decodeBerkasRatingValue(), dispatched, exactBerkasRatingRecord() (+19 more)

### Community 9 - "Home media and feeds"
Cohesion: 0.11
Nodes (29): authCodes, createHomeMedia(), empty(), kinds, createHomeMediaHost(), bannerFields, failure(), HOME_MEDIA_OPERATIONS (+21 more)

### Community 10 - "Queue identity and profiles"
Cohesion: 0.12
Nodes (21): invalid(), queueManagedIdentity(), queueReadIdentityKeys(), queueReadIdentityQuery(), record(), booleans, field(), integers (+13 more)

### Community 11 - "Queue booking browser flow"
Cohesion: 0.12
Nodes (29): authCodes, createQueueBooking(), clockValue(), malformed(), nullableString(), QUEUE_BOOKING_COPY, queueBookingPreflight(), queueBookingReview() (+21 more)

### Community 12 - "Personal plotting backend submission"
Cohesion: 0.15
Nodes (31): Personal Swaplotting submission, attempts, buildSwaplottingPostValues(), commonFields, createSwaplottingAttempt(), fail(), markSwaplottingDispatched(), prepareSwaplottingActivityValues() (+23 more)

### Community 13 - "Main API and identity"
Cohesion: 0.11
Nodes (22): Daring identity completion boundaries, ALLOWED_ORIGINS, ApiClient, ApiError, collectionDeletePrefixes, decodeVerificationStatus(), idSegment(), networkFailure() (+14 more)

### Community 14 - "Bhumi authenticated tile client"
Cohesion: 0.13
Nodes (18): BhumiMapClient, BhumiMapError, cancelBody(), cancelled(), deadline(), failure(), field(), imageBytes() (+10 more)

### Community 15 - "Parcel and scan readers"
Cohesion: 0.11
Nodes (25): Bounded parcel and scan reads, decodeParcelLookupJson(), decodeParcelRegionsJson(), invalid(), nullableInteger(), nullableNull(), nullableText(), numbers (+17 more)

### Community 16 - "Collection groups and actions"
Cohesion: 0.10
Nodes (30): backCollectionGroup(), cancelCollectionGroupCreate(), cancelCollectionItemDelete(), cancelCollectionItemEdit(), collectionGroupCreateCurrent(), collectionGroupCreateOperation(), collectionGroupItem(), collectionGroupMatches() (+22 more)

### Community 17 - "Scan location geometry"
Cohesion: 0.16
Nodes (25): authCodes, createScanLocationController(), doubleText(), esc(), kkprField(), kkprNullableObject(), kkprNullableString(), mapFailure() (+17 more)

### Community 18 - "Parcel search browser flow"
Cohesion: 0.16
Nodes (22): authCodes, createParcelSearch(), malformed(), nullableString(), object(), parcelSearchBoundary(), parcelSearchCopy, parcelSearchLookup() (+14 more)

### Community 19 - "Tanya send and history"
Cohesion: 0.17
Nodes (22): attempts, berkasQuestionWasDispatched(), createBerkasQuestionAttempt(), decodeBerkasQuestionHistory(), decodeBerkasQuestionOutcome(), dispatched, exactQuestionRecord(), fail() (+14 more)

### Community 20 - "Guestbook browser workflow"
Cohesion: 0.17
Nodes (21): authCodes, createGuestbook(), GUESTBOOK_COPY, GUESTBOOK_FIELDS, GUESTBOOK_WRITE_COPY, guestbookInputMode(), guestbookMetadata(), guestbookParseQr() (+13 more)

### Community 21 - "Guestbook backend submission"
Cohesion: 0.17
Nodes (19): Office QR guestbook submission, attempts, cancelBody(), createGuestbookPostAttempt(), dispatched, fail(), GUESTBOOK_POST_FIELDS, GUESTBOOK_VALUE_KEYS (+11 more)

### Community 22 - "PBT and KKPR decoders"
Cohesion: 0.23
Nodes (20): decodeScanKkprEnvelope(), decodeScanPbtEnvelope(), envelope(), field(), invalid(), kkprFeature(), kkprGeometry(), kkprGeometryData() (+12 more)

### Community 23 - "Swaplotting forms and choices"
Cohesion: 0.16
Nodes (21): authCodes, createSwaplotting(), failure(), nullableString(), object(), SWAPLOTTING_BASIS, SWAPLOTTING_COPY, SWAPLOTTING_FIELDS (+13 more)

### Community 24 - "Activity filtering and deletion"
Cohesion: 0.10
Nodes (23): activityCard(), activityCategories(), activityDeleteControllerCurrent(), activityDeleteCurrent(), activityDeleteOperation(), activityItem(), activityMatches(), cancelActivityDelete() (+15 more)

### Community 25 - "PERSIL map host integration"
Cohesion: 0.12
Nodes (23): parcelSearchAction(), parcelSearchCurrent(), parcelSearchMap(), parcelSearchPaint(), persilMapAccount(), persilMapActionView(), persilMapCancel(), persilMapCollectionChanged() (+15 more)

### Community 26 - "HTTP origin and map configuration"
Cohesion: 0.13
Nodes (10): Same-origin Bhumi credential boundary, browserMapConfiguration(), browserRequestOrigin(), publicOrigin(), createApiHandler(), object(), parseInput(), Same-origin private API (+2 more)

### Community 27 - "Operation lookup and partners"
Cohesion: 0.15
Nodes (18): decodeMitraBytes(), decodeMitraValue(), fail(), MITRA_READS, nullableString(), prepareMitraQuery(), record(), byId (+10 more)

### Community 28 - "Office list and calendar"
Cohesion: 0.16
Nodes (22): changeOfficeMonth(), disposeOfficeMap(), filterOffices(), focusOfficeMapSelection(), getOfficeState(), loadNearbyOffices(), loadOfficeCalendar(), mountOfficeMap() (+14 more)

### Community 29 - "GNSS and coordinate comparison"
Cohesion: 0.19
Nodes (20): compareCoordinates(), degrees(), radians(), limited(), nmeaDate(), nmeaDegrees(), normalizePoint(), number() (+12 more)

### Community 30 - "Plotting submission ownership"
Cohesion: 0.21
Nodes (6): changed(), opaque(), ownContact(), profile(), sameProfile(), SwaplottingSubmissionSession

### Community 31 - "Cari Berkas search workflow"
Cohesion: 0.13
Nodes (21): backSearchFile(), filterSearchFileOffices(), generateSearchFileCaptcha(), getSearchFileState(), openSearchFileOfficePicker(), refreshSearchFileCaptcha(), renderSearchFile(), renderSearchFilePicker() (+13 more)

### Community 32 - "Tanya architecture and boundaries"
Cohesion: 0.17
Nodes (20): Architecture checkpoint, Tanya browser lifecycle adaptations, Collection-wide Tanya context revocation, Tanya session-owned source context, Tanya accepted-send history refresh, Tanya native two-field send, Tanya Berkas conversation workflow, Browser document shell (+12 more)

### Community 33 - "Berkas journey browser destination"
Cohesion: 0.20
Nodes (16): createBerkasJourneyHost(), callerIntegerText(), copyRows(), createJourneySnapshot(), fail(), isJourneySnapshot(), journeySnapshotFromBerkas(), missing (+8 more)

### Community 34 - "Official raster map lifecycle"
Cohesion: 0.17
Nodes (17): active(), cameraData(), canvases, claims, controls(), createOfficialMap(), failure(), fetchConfig() (+9 more)

### Community 35 - "PPAT question rating workflow"
Cohesion: 0.18
Nodes (16): PPAT questions and rating, authCodes, createRatingPPAT(), createRatingPPATHost(), fail(), object(), RATING_PPAT_COPY, ratingPPATChoice() (+8 more)

### Community 36 - "Plot detail response models"
Cohesion: 0.26
Nodes (19): decodePlotDetailJson(), decodePlotListJson(), envelope(), fields, geometryLeaf(), integer(), invalid(), list() (+11 more)

### Community 37 - "Static artifact analysis"
Cohesion: 0.27
Nodes (13): analyze_aot(), analyze_dex(), Codec, curate_evidence(), inventory_assets(), main(), manifests(), Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e (+5 more)

### Community 38 - "Tanya browser conversation"
Cohesion: 0.16
Nodes (14): authCodes, createBerkasQuestion(), Tanya detail DOM restoration, Tanya seven-String history and raw dates, createBerkasQuestionHost(), BERKAS_QUESTION_COPY, fields, hasQuestionText() (+6 more)

### Community 39 - "Berkas rating browser flow"
Cohesion: 0.21
Nodes (13): authCodes, createBerkasRating(), createBerkasRatingHost(), BERKAS_RATING_COPY, berkasRatingEntry(), berkasRatingPrompt(), berkasRatingResult(), berkasRatingTrim() (+5 more)

### Community 40 - "Lost review multipart posting"
Cohesion: 0.26
Nodes (15): fail(), fields, lostReviewPostFilename(), lostReviewPostOutcome(), MIME_BY_EXTENSION, ownRecord(), prepareLostReviewPostFiles(), prepareLostReviewPostValues() (+7 more)

### Community 41 - "Daring form date models"
Cohesion: 0.20
Nodes (16): calendarDate(), DARING_COPY, DARING_FIELDS, DARING_WIRE_KEYS, daringDateBounds(), daringDateForInput(), daringDateFromInput(), daringEditError() (+8 more)

### Community 42 - "Guestbook lookup client"
Cohesion: 0.23
Nodes (12): cancelBody(), failure(), GuestbookClient, GuestbookClientError, guestbookLookupFromRead(), input(), invalidInput(), invalidResponse() (+4 more)

### Community 43 - "Berkas bookmark controls"
Cohesion: 0.23
Nodes (16): berkasBookmarkAuth(), berkasBookmarkButton(), berkasBookmarkCollectionChanged(), berkasBookmarkCurrent(), berkasBookmarkEligible(), berkasBookmarkEnvelope(), berkasBookmarkOperation(), berkasBookmarkPaint() (+8 more)

### Community 44 - "PERSIL collection controller"
Cohesion: 0.19
Nodes (13): authCodes, choices(), collectionSavePersilEligible(), collectionSavePersilEntry(), createCollectionSavePersil(), escapeHtml(), featureFields(), groupRows() (+5 more)

### Community 45 - "Publication validation and catalog"
Cohesion: 0.25
Nodes (15): Original artifact extraction integrity, Partial Tanya synthetic browser evidence, Local Docker delivery evidence, Explicit portable test exclusions, Full local native-evidence suite, Original APK emulator refusal boundary, Explicit validated operation catalog, Portable source test scope (+7 more)

### Community 46 - "Swaplotting coordinate entry"
Cohesion: 0.39
Nodes (14): camera(), declaration(), fail(), object(), parseSwaplottingCoordinateEntry(), rawNumber(), sessionPoint(), swaplottingCoordinateCandidates() (+6 more)

### Community 47 - "Plotting photos and host"
Cohesion: 0.17
Nodes (11): createSwaplottingHost(), fail(), hasLibrary(), libraries, library(), resources(), swaplottingPhotoPath(), createSwaplottingPhotoRemoval() (+3 more)

### Community 48 - "Daring verification UI"
Cohesion: 0.24
Nodes (15): dismissVerificationDialog(), showVerificationMethods(), verificationDaringBack(), verificationDaringBusy(), verificationDaringContinue(), verificationDaringInfoClose(), verificationDaringInput(), verificationDaringOperation() (+7 more)

### Community 49 - "Scan host and lifecycle"
Cohesion: 0.19
Nodes (15): resetScanHost(), scanCameraPaint(), scanDisposeLocation(), scanHost(), scanHostCurrent(), scanLocationCurrent(), scanLocationKkprPaint(), scanLocationKkprSelect() (+7 more)

### Community 50 - "Office map lifecycle"
Cohesion: 0.29
Nodes (11): active(), camera(), claims, copyCamera(), createOfficeMap(), data(), failure(), finite() (+3 more)

### Community 51 - "Memory sessions and CSRF"
Cohesion: 0.27
Nodes (6): clearAuthentication(), cookieFor(), csrfMatches(), random(), readSessionId(), SessionStore

### Community 52 - "Yuridis response decoding"
Cohesion: 0.38
Nodes (12): decodeYuridisJson(), decodeYuridisLastReviewJson(), fail(), fields, integer(), numericTokens, object(), own() (+4 more)

### Community 53 - "Swaplotting field rendering"
Cohesion: 0.35
Nodes (12): error(), esc(), formField(), swaplottingCoordinateCandidateView(), swaplottingCoordinateProvenanceView(), swaplottingCoordinateView(), swaplottingDisclaimerView(), swaplottingFeedback() (+4 more)

### Community 54 - "Private configuration and diagnostics"
Cohesion: 0.21
Nodes (8): fetchTransport(), createCalendarOfficeIdDecoder(), digest(), loadConfiguration(), workspace, baseline, client, records

### Community 55 - "Guestbook submission ownership"
Cohesion: 0.27
Nodes (4): GuestbookSubmissionSession, invalid(), notSent(), opaque()

### Community 56 - "Catalog runtime validation"
Cohesion: 0.24
Nodes (9): byId, collectionDeletePaths, fail(), getOperation(), OPERATIONS, prepareOperation(), SERVICES, sessionValue() (+1 more)

### Community 57 - "PPAT rating host integration"
Cohesion: 0.23
Nodes (12): aktaRows(), finishRatingPpat(), isAktaItem(), openAktaRating(), ratingPpatCanWrite(), ratingPpatCurrent(), ratingPpatOperation(), ratingPpatPage() (+4 more)

### Community 58 - "Lost certificate host integration"
Cohesion: 0.21
Nodes (12): disposeLostReview(), lostActive(), lostCurrent(), lostOperation(), lostOwner(), lostPage(), lostPaint(), lostReviewComposeClick() (+4 more)

### Community 59 - "PPAT question response models"
Cohesion: 0.47
Nodes (9): answer(), decodeRatingPpatBytes(), decodeRatingPpatValue(), fail(), group(), nullableString(), prepareRatingPpatRead(), record() (+1 more)

### Community 60 - "Native integrity static audit"
Cohesion: 0.36
Nodes (4): Dex, main(), Read-only DEX reference audit. No app execution, hooks, patches or requests., safe()

### Community 61 - "Navigation and route cleanup"
Cohesion: 0.20
Nodes (10): backPartner(), disposeYuridis(), navigate(), resetBerkasQuestion(), resetCollectionNavigation(), resetNewsNavigation(), resetPartnerNavigation(), resetPersilMaps() (+2 more)

### Community 62 - "Deployment and session boundaries"
Cohesion: 0.22
Nodes (9): Explicit Cloudflare public origin, Loopback Docker service, Docker deployment guide, Read-only loopback Docker runtime, Session-bound document downloads, Origin-bound in-memory sessions, Read-only private artifact mounts, Hash-pinned private runtime configuration (+1 more)

### Community 63 - "Tanya source context ownership"
Cohesion: 0.31
Nodes (2): BerkasQuestionSession, notSent()

### Community 64 - "PPAT rating post protocol"
Cohesion: 0.42
Nodes (8): decodeRatingPpatPostBytes(), decodeRatingPpatPostValue(), fail(), fields, prepareRatingPpatPostValues(), ratingPpatPostFailure(), record(), serializeRatingPpatPost()

### Community 65 - "Queue call list rendering"
Cohesion: 0.28
Nodes (9): queueCallsRows(), queueCallTime(), queueDetailData(), queueListItem(), queueObject(), queuePrereadRows(), queueResponseBody(), queueRows() (+1 more)

### Community 66 - "Plotting host write integration"
Cohesion: 0.39
Nodes (9): swaplottingCanWrite(), swaplottingCurrent(), swaplottingOperation(), swaplottingPostOperation(), swaplottingRead(), swaplottingSourceId(), swaplottingSources(), swaplottingStale() (+1 more)

### Community 67 - "Collection response envelopes"
Cohesion: 0.57
Nodes (7): decode(), decodeCollectionMutationEnvelope(), decodePersilCollectionGroupEnvelope(), decodeUserCollectionEnvelope(), invalid(), nullable(), record()

### Community 68 - "Swaplotting point map"
Cohesion: 0.29
Nodes (6): claimed, createSwaplottingMap(), esc(), swaplottingPointMapView(), SWAPLOTTING_INITIAL_CAMERA, swaplottingPointText()

### Community 69 - "Plotting review payload"
Cohesion: 0.54
Nodes (7): buildSwaplottingReview(), fail(), labels, scalar(), selected(), swaplottingNativeTrim(), trim()

### Community 70 - "Guestbook host integration"
Cohesion: 0.32
Nodes (8): guestbookBack(), guestbookCameraPaint(), guestbookCurrent(), guestbookOperation(), guestbookOwner(), guestbookPaint(), guestbookWrite(), guestbookWriteOperation()

### Community 71 - "KKPR details and documents"
Cohesion: 0.29
Nodes (8): isKkprItem(), kkprDetailView(), kkprDocumentControls(), kkprDocumentTarget(), kkprFacts(), kkprMapView(), kkprStringFields(), showKkprDetail()

### Community 72 - "Guestbook response envelopes"
Cohesion: 0.76
Nodes (6): decodeGuestbookEnvelope(), decodeGuestbookJson(), invalid(), nullable(), own(), record()

### Community 73 - "Plotting camera capture"
Cohesion: 0.33
Nodes (3): createSwaplottingCamera(), SWAPLOTTING_CAPTURE_COPY, createSwaplottingPhotoCapture()

### Community 74 - "Domain coordinates and costs"
Cohesion: 0.33
Nodes (2): numericInput(), validateCoordinates()

### Community 75 - "Parcel geometry camera"
Cohesion: 0.52
Nodes (6): boundedArray(), escapeHtml(), invalid(), parcelMapView(), prepareParcelCamera(), updateParcelMap()

### Community 76 - "Activity deletion response semantics"
Cohesion: 0.53
Nodes (5): Activity local deletion behavior, decodeUserActivityEnvelope(), invalid(), nullableString(), record()

### Community 77 - "Verified HTTPS transport"
Cohesion: 0.67
Nodes (5): createHttpsTransport(), createQueueHttpsTransport(), scopedHttpsTransport(), serialize(), transportError()

### Community 78 - "Cross-tab session synchronization"
Cohesion: 0.40
Nodes (2): createSessionSync(), Authoritative cross-tab session sync

### Community 79 - "Profile contact animations"
Cohesion: 0.50
Nodes (3): animationData(), loadAnimationData(), managers

### Community 80 - "Archive extraction verification"
Cohesion: 0.60
Nodes (4): digest(), extract(), main(), Reproducible, path-safe extraction of all XAPK and nested APK members.

### Community 81 - "Collection mutation dialog ownership"
Cohesion: 0.40
Nodes (5): cancelCollectionGroupDelete(), cancelCollectionGroupRemove(), collectionGroupDeleteCurrent(), collectionGroupRemoveCurrent(), collectionMutationViewCurrent()

### Community 82 - "Service information simulation"
Cohesion: 0.40
Nodes (5): informationDetail(), informationProvinceRows(), informationRows(), informationSimulationResult(), nativeInformationBody()

### Community 83 - "Operation catalog generation"
Cohesion: 0.50
Nodes (1): Produce a secret-free registry from 170 shapes and supplemental audited flows.

### Community 84 - "Pinned QR library vendoring"
Cohesion: 0.50
Nodes (1): Vendor a pinned npm QR reader without installing or executing package scripts.

### Community 85 - "Swaplotting explicit submit"
Cohesion: 0.50
Nodes (3): authCodes, createSwaplottingSubmit(), SWAPLOTTING_SUBMIT_COPY

### Community 86 - "Journey time formatter provenance"
Cohesion: 0.67
Nodes (2): journeyTimeDisplay(), Journey HH:mm formatter provenance

### Community 87 - "Certificate date formatter provenance"
Cohesion: 0.67
Nodes (2): certificateDateDisplay(), Certificate date formatter provenance

### Community 88 - "Profile website destinations"
Cohesion: 0.67
Nodes (2): destinations, profileWebsiteDestination()

### Community 89 - "Route Spoofer offline inventory"
Cohesion: 0.67
Nodes (1): Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.

### Community 90 - "Contract disassembly verification"
Cohesion: 0.67
Nodes (1): Check that static contract evidence points to real disassembly locations.

### Community 91 - "Certificate location controls"
Cohesion: 0.67
Nodes (3): certificateLocation(), certificateMapControls(), electronicCertificateLocation()

### Community 92 - "Plotting result cleanup"
Cohesion: 0.67
Nodes (3): disposeSwaplottingResult(), resetSwaplottingSubmission(), swaplottingFeedbackDialog()

### Community 93 - "Electronic certificate document targeting"
Cohesion: 0.67
Nodes (3): electronicCertificateDocumentControls(), electronicCertificateDocumentTarget(), isElectronicCertificate()

### Community 94 - "Home media ownership"
Cohesion: 0.67
Nodes (3): homeMediaOwner(), homeMediaPaint(), homeMediaSection()

### Community 95 - "Verification status dialogs"
Cohesion: 0.67
Nodes (3): nativeVerificationDecision(), nativeVerificationStatus(), showVerificationStatusDialog()

### Community 96 - "Source publication exporter"
Cohesion: 1.00
Nodes (1): Export an explicit source allowlist into the isolated publication clone.  Never

### Community 97 - "Archive member hash verification"
Cohesion: 1.00
Nodes (1): Verify every extracted archive member against the recorded SHA-256.

### Community 98 - "HTTP callsite instruction audit"
Cohesion: 1.00
Nodes (1): Independently verify known-wrapper BL calls using raw AArch64 encoding.

## Knowledge Gaps
- **144 isolated node(s):** `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.`, `Read-only DEX reference audit. No app execution, hooks, patches or requests.`, `Export an explicit source allowlist into the isolated publication clone.  Never` (+139 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Tanya source context ownership`** (2 nodes): `BerkasQuestionSession`, `notSent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domain coordinates and costs`** (2 nodes): `numericInput()`, `validateCoordinates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cross-tab session synchronization`** (2 nodes): `createSessionSync()`, `Authoritative cross-tab session sync`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Operation catalog generation`** (1 nodes): `Produce a secret-free registry from 170 shapes and supplemental audited flows.`
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

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BERKAS collection bookmark` connect `Tanya architecture and boundaries` to `Main API and identity`, `Application state and utilities`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **Why does `Architecture checkpoint` connect `Tanya architecture and boundaries` to `Activity deletion response semantics`, `Berkas journey browser destination`, `Tanya browser conversation`, `Berkas rating backend protocol`, `HTTP origin and map configuration`, `Main API and identity`, `Lost review and Yuridis`, `Guestbook backend submission`, `Publication validation and catalog`, `Deployment and session boundaries`, `Parcel and scan readers`, `Personal plotting backend submission`, `PPAT question rating workflow`, `Queue booking backend`, `Cross-tab session synchronization`, `Lost certificate browser workflow`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `createSwaplottingHost()` connect `Plotting photos and host` to `Application state and utilities`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `Static, offline inventory of the supplied Sentuh Tanahku APK splits.  Does not e`, `Read Flutter StandardMessageCodec used by AssetManifest.bin.`, `Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution.` to the rest of the system?**
  _144 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Page rendering and forms` be split into smaller, more focused modules?**
  _Cohesion score 0.07210031347962383 - nodes in this community are weakly interconnected._
- **Should `Queue calls and decoding` be split into smaller, more focused modules?**
  _Cohesion score 0.05708548479632817 - nodes in this community are weakly interconnected._
- **Should `Application state and utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.029049897470950103 - nodes in this community are weakly interconnected._
## Extraction limits and publication review

The 23 October Tanya refresh performed full bounded TypeScript Graphify extraction over 152 tracked/staged files (142 code files and ten documents; approximately 119,633 words). AST extraction produced 1,786 nodes and 4,930 raw edges. Eight PowerShell utilities could not be parsed because tree-sitter-powershell is unavailable, leaving 134 parsed code files. No parser/package was installed and no PowerShell call graph is claimed. The required semantic Agent read four changed documents; six unchanged documents were supplied from semantic cache. Named document entities use document provenance and rationale attributes because the installed sanitizer removes the concept file type.

The resulting 1,849-node / 4,824-edge graph includes all six Tanya modules, source/session-owned context, ordered two-field send, same-ID history refresh and the disclosed limitation that a later Collection read revokes earlier Collection chat contexts across tabs. Test results, synthetic browser observations, historical native evidence and production acceptance remain distinct. The two INFERRED edges have mean confidence 0.75; percentage headings are rounded by the report generator.

Two description Agents authored 47 answer batches, validated against all 1,849 unique node IDs, then Graphify describe ingested them. The final graph and Studio entity index contain 1,849 nonempty full descriptions. CLI coverage is 1,787/1,787 describable nodes; 62 additional document entities lack stored citation/evidence attributes but have descriptions from source, neighborhood and rationale context. Description presence does not establish citation coverage. English was explicitly selected for descriptions and community labels. Browser smoke confirmed that served studio/index.html displays the tested Tanya send description, source and four relations without console warnings/errors. The legacy scene-only offline studio.html does not embed or display the full descriptions; use served index.html for that view. No runtime/renderer was patched.

Heuristic grounding reported 2,327 newly grounded citations across 1,558 nodes. The final union retains 2,787 citation entries in the sidecar and 2,786 inline under the per-node cap. The final benchmark estimates 16.9 times fewer retrieval tokens, approximately 159,510 naive tokens versus 9,431 average query tokens; this does not measure billing. Token counters remain unmetered zero placeholders rather than proof of zero assistant usage.

The Windows manifest writer emitted absolute keys and retained older entries. Raw output remains outside publication; only manifest metadata was regenerated from the actual 152 detected files using relative keys and the same mtime/MD5 schema. Graph/ontology/Studio data were produced by Graphify commands without direct data edits. The accompanying portability report retains the genuine exit status and findings; the review checks structured references separately and never claims a failing command passed. Current source freshness is established by manifest hashes; the Git hash above is the pre-commit parent HEAD. The prior unchanged-corpus freshness receipt remains historical; FRESHNESS-TANYA-2026-10-23.json records this full refresh.
