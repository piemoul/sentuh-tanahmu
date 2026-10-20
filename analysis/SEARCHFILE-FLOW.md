# Cari Berkas: supplied APK 6.1.5 evidence

This bounded static audit establishes the ordinary Cari Berkas form and read sequence. It makes no production requests, changes no application files, and does not alter authentication, CAPTCHA requirements, physical presence, geotag or integrity controls. Evidence comes from the supplied ARM64 `libapp.so`, SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

[One anonymous live office lookup](webapp/searchfile-live-office-check.json) through the deployed Docker adapter returned HTTP200 in 7,189 ms at 17:08:41–17:08:48 UTC. A single GET `/legacy/Kantah` with empty `nama` and `tipeKantor=3,2,1` produced a direct list of 533 native-typed rows, all with usable office references and no null names. No row contents or credentials were stored, and the isolated local session was closed. This proves bounded acceptance of office-list loading only; the complete successful primary → SOP → print production search remains unverified. The separate twenty synthetic browser checks still made zero production requests.

The [Cari Berkas verification summary](webapp/searchfile-verification-summary.json) binds source hashes, 118 Node tests, 574 function checks, 20 browser checks, native evidence and deployment. The [focused backend report](webapp/searchfile-backend-verification.json) contains 68 tests already included in the 118-test suite, not additional tests. [Native verifier results](webapp/searchfile-native-verification.json) collect three verifier routines covering four frozen ledgers. The goal remains incomplete, successful live search untested and geotag upload disabled.

The authoritative [root-flow ledger](recovered/searchfile-flow.json) includes the frozen [office subproof](recovered/searchfile-office/office-picker-flow.json). Run [verify_searchfile_native_flow.py](rea/verify_searchfile_native_flow.py) with `tools/runtime/blutter-python/Scripts/python.exe` to compare every retained instruction and decisive marker with the ELF and verify source/dependency hashes, pool literals and dispatch. Current result: **2 ledgers, 48 source hashes, 7,193 instruction occurrences / 6,978 unique instructions, 234 decisive markers, 91 literal references, 17 dispatch entries and 8 dependency hashes**. The standalone [office verifier](rea/verify_searchfile_office.py) also passes: **24 source hashes, 3,210 exact instructions, 121 markers, 35 literal references, 8 dispatch entries and 5 dependencies**. These counts overlap and must not be added. `build_searchfile_native_flow.py` regenerates only the bounded root-flow evidence.

Two separate, frozen supplements resolve the form encoding and shared status policy without changing those original ledgers:

- [Nullable form ledger](C:/ai/CLAWD/sentuh_tanahmu/analysis/recovered/searchfile-null-form/null-form.json), checked by [verify_searchfile_null_form.py](C:/ai/CLAWD/sentuh_tanahmu/analysis/rea/verify_searchfile_null_form.py): **11 source hashes, 1,704 exact ELF instructions, 86 decisive markers, 39 pool literal references and 3 dependency hashes**.
- [Encoding and status follow-up](C:/ai/CLAWD/sentuh_tanahmu/analysis/recovered/searchfile-null-form/transport-followup.json), checked by [verify_searchfile_transport_followup.py](C:/ai/CLAWD/sentuh_tanahmu/analysis/rea/verify_searchfile_transport_followup.py): **6 source hashes, 431 exact ELF instructions, 33 decisive markers, 6 dependency hashes and 128 ASCII mask entries**. It reuses the frozen document-geo encoder proof. These counts are separate verifier results, not a deduplicated total.

Run either verifier with the same `tools/runtime/blutter-python/Scripts/python.exe` interpreter. Both supplements record zero production requests and no application changes. Statements in older frozen ledgers that left final scalar encoding unknown are historical; the supplements establish the bounded contracts below.

## Entry and form

The official menu callback `0x8c3418` captures route callback `0xd9b21c`, which uses factory `0x8902a8` to allocate `yBb`. Its state `_zBb` initializes at `0x754ed0` and builds the form at `0x8bbfd8`. The form has **Pilih Kantor Pertanahan**, **Nomor Berkas**, **Tahun**, a generated CAPTCHA, manual CAPTCHA entry, and submit.

| Control | Proven native contract | Decisive evidence |
|---|---|---|
| Office list | `GET legacy/Kantah?nama=&tipeKantor=3,2,1`; direct response body is `List<jyb>`, not `body.data` | Office subproof: init `0xd28e34`, service `0xd10268`, GET `0xd10364` |
| Office selection | Initially null. Profile `kantorId` moves the matching option first and marks it, without selecting it. Selection stores the full `jyb`; request uses `KantorId` at `+0x13` | `0x87edbc`, `0x8bda6c`, `0x8bd9b8`; office subproof |
| Office search | Local `lower(Nama!).contains(trim(lower(query)))`; no search request | `0x9cd158`; office subproof |
| Number | Nullable String, initially null; submit checks nonnull/nonempty, passes it unchanged | `0xd9a208`; `search-validation-sequence.asm.txt` |
| Year | Text controller receives current local year immediately; model receives it after office-list await. Picker contains previous/current local year inclusive and initially selects current year | `0x754f98`, office init `0xd28f54`; picker bounds `0x8bd4d8/0x8bd4ec`, list construction `0x7552d8..0x755334`, selected `0x7553c0` |
| Numeric controls | Number and CAPTCHA use keyboard type 2, unsigned/nondecimal. Generic wrapper automatically adds `Cra.Tvg` and a 99,999-character limiter | Form `0x8bc610/0x8bc948`; `input-formatters.asm.txt`, `0x9d07b4..0x9d08ec` |
| Year input | Its generic field boolean `ISb+0x33` is false, unlike number/CAPTCHA true. An outer tap opens the year picker | `0x8bc780`, `0x8bc7c0`, `0x8bd370`; full Flutter parameter names remain unresolved |

The numeric formatter selection is proven. The unique constructor at `0x8c6300` creates an allow-`[0-9]` formatter with empty replacement, but retained metadata does not directly connect that constructor to static field `Cra.Tvg`; the ledger keeps that linkage unresolved. Submit validation does not independently parse number/year or restrict year range. Do not infer that arbitrary pasted text is native-compatible merely because the submit controller accepts Strings.

## CAPTCHA lifecycle

`OSb.initState` at `0x7ce1c0` calls generator `0x7ce1f0`. It generates **six characters**, each chosen with `nextInt(10)` from literal `0123456789`, joins them, displays the challenge and passes its String to `_zBb+0x2f` via callback `0x8bd19c`. The typed value remains separate in `wBb+0x1b`.

Submit compares typed and expected Strings exactly, with no trimming or case conversion. Null/empty input first sets `Captcha tidak boleh kosong`; a subsequent mismatch overwrites it with `Captcha salah`. Ordinary invalid input returns `not_complete` and retains challenge/input. Success and `not_found` regenerate the challenge when mounted and clear the visible input controller (`0xd99ffc/0xd9a044`, `0xd9a00c/0xd9a054`). Manual refresh `0x9d18b8` regenerates the challenge; that callback does not clear the separate typed controller. Programmatic controller clearing is not proof that the framework calls `onChanged`.

The native primary request contains **no CAPTCHA field**. It is a local UI check in this supplied client. Browser reconstruction should retain a visible challenge and manual entry; this audit does not implement automated solving or weaken that check.

## Ordered reads and destination

Controller `0xd9a170` sets busy, validates office/number/year/CAPTCHA, then performs three awaited reads in order. It does not use a user-entered Berkas ID for ordinary search.

| Step | Native call and body | Response/failure contract |
|---|---|---|
| Primary | `0xd9a3c4 → 0xd87fe0`: POST `/berkas/CariBerkas`; map always has `nomor`, `tahun`, selected `kantorId`, and `berkasId:null` | Requires HTTP200 and `body.data` Map parsed as `ABb`; ignores `body.error`. Missing/null/wrong data or parse/non200 failure throws. The ordinary form encoder retains null as a bare key: the last field is `berkasId`, without `=`. |
| SOP | `0xd9a3f8 → 0xd87e00`: POST `berkas/berkassop`, `berkasid=returned ABb.berkasId`; store `ABb+0x3f` | Returned ID must be nonnull; empty String is passed unchanged. Requires200/Map envelope. `error==true`, malformed data or transport failure throws. Optional missing data with false/null error returns a default empty `EBb`. |
| Print status | `0xd9a44c → 0xd87c14`: POST `berkas/getStatusCetak`, same returned ID; store message at `ABb+0x47` | Helper reads `error??true` as bool and `message??"-"` as String; no local numeric HTTP check. Shared default transport rejects non-2xx before the helper receives a response. Caught failure returns `(true,"-")`. Search ignores the error flag and retains the message. |

Primary/SOP failures reach outer `not_found`; the UI displays **Berkas tidak ditemukan** and resets challenge/visible CAPTCHA input. Print-helper failures still permit detail with `-`. On success, factory `0x8bd010` opens `MAb` using the **same enriched ABb**, with fields `+0xb=ABb`, `+0xf=true`, `+0x13=returned ID`, **`+0x17=false`**, `+0x1b=statusCetak??""`, `+0x3b=false`. This means **no redundant primary request by ID and no SPS read/display for Cari Berkas**. Existing `BERKAS-DETAIL-UI.md` and its frozen ledger establish the shared detail models and flag meanings.

Native success also calls activity helper `0xd74828` at `0xd9a634` with CariBerkas/Berhasil/Pencarian Berkas labels. That telemetry side effect is separate from the necessary read sequence and is not enabled by this audit.

## Form bytes and shared HTTP status

The native literal is a `Map<String,String?>` with all four keys in order: `nomor`, `tahun`, `kantorId`, `berkasId`. The optional search-entry ID defaults to null at `0xd88148` and is still stored into the map at `0xd881e8`. Shared POST `0x6b9270` forwards that map; the ordinary interceptor sets `application/x-www-form-urlencoded` at `0xd0da68`. Body processing follows `0xd0c910 → 0xd0d274 → 0x6fb39c → 0x6fb938 → 0x6bc798`.

The recursive map traversal preserves a null value. Scalar callback `0x6fb98c` returns the encoded key directly at `0x6fb9b0`; its nonnull branch adds `=` and the encoded value. The writer retains a nonempty key and joins fields with `&`. Therefore these cases differ: present null becomes `berkasId`, an empty String becomes `berkasId=`, and an absent map property produces no field. Ordinary search has a present null, so an illustrative body is `nomor=001&tahun=2026&kantorId=office&berkasId`. This is a synthetic example derived from instructions, not a captured request. The scoped browser adapter preserves all four nullable fields for this operation, including default nulls for omitted caller values, and retains empty Strings separately.

Both key and nonnull value use the native query-component encoder `0x42eb74 → 0x42ded4` with ASCII mask **1**. Only letters, digits and `-._~` pass unchanged; spaces become `+`, and percent escapes use uppercase hex. Thus `*` becomes `%2A`, `~` stays `~`, and a literal `+` becomes `%2B`. Unicode uses UTF-8; malformed isolated UTF-16 surrogates become U+FFFD, as established in the existing encoder proof. The scoped CariBerkas serializer implements these distinctions instead of assuming `URLSearchParams` has the same safe set. This proves the scalar form contract, not all nested maps, list formats, runtime interceptor changes or complete wire parity.

The default shared predicate `_PCf` at `0x6b8f60` accepts only a nonnull numeric status **200–299**. Options constructor `0x6b8778/0x6b8780` installs it, and option composition uses the base predicate when no request override is supplied. Dispatch invokes the selected predicate at `0xd05484` and throws on rejection at `0xd05668/0xd05674` before returning to an endpoint helper. Primary CariBerkas and SOP then apply their additional **HTTP200** requirement. Print status has no additional numeric requirement, so another 2xx response with a parseable body may still be consumed natively. Arbitrary runtime replacement of options/interceptors and server behavior remain unobserved.

The browser's exception to its general `body.error===true` rejection is deliberately limited to the audited primary/print session-form requests: **HTTP200 for primary CariBerkas**, and **successful HTTP200–299 for print status**. This preserves a parseable String print message even when its envelope has `error:true`, while the frontend model still applies the audited nullable type checks. Non-2xx transport failures remain rejected; SOP and unrelated operations retain their existing envelope rules. Separate backend tests cover successful-2xx print envelopes, primary status restrictions and the bounded exceptions. HTTP status and the body error flag remain separate controls.

## Implementation scope and limits

Existing office, primary, SOP and print-status adapters cover the established read path. The office adapter must allow the native empty `nama` query; a parent-qualified office picker removes manual ID entry. Preserve the primary result, attach/copy supplementary state, and route directly into the existing detail view with SPS disabled. Keep request ownership and navigation/session guards around the full sequence. A stricter backend envelope/status check or null-safe picker filtering is a browser robustness difference, not evidence of native behavior.

The [current synthetic regression evidence](webapp/searchfile-verification-summary.json) contains **574 frontend checks**: 519 across the twelve existing suites, including three obsolete Berkas secondary-auth response cases, plus 55 focused CariBerkas checks. The [current Node suite](webapp/automated-tests-latest.txt) has **118 passing tests** (658.006 ms). These local checks do not establish production acceptance or full native parity.

The [twenty browser checks](webapp/searchfile-browser-checks.json) cover the actual form and office picker with synthetic data, no CAPTCHA solving, no successful browser search and no production calls. The final print-201 envelope refinement postdates that fixture process and is covered by separate backend tests, not those browser actions. [Deployment hashes](webapp/deployment-latest.json) and the [fresh account preview](webapp/searchfile-deployment-preview.json) establish the new localhost build; production search still requires login and manual CAPTCHA entry.

These are static contracts for supplied version6.1.5, not runtime production acceptance. The numeric `Cra.Tvg` static initializer linkage and the generic year-field boolean's parameter name remain explicit evidence limits. No remote geotag, fake physical presence, activation or integrity bypass is part of this work.
